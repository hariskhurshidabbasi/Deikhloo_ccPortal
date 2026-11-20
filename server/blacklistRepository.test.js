import test from 'node:test';
import assert from 'node:assert/strict';
import { setBlacklistStatus } from './blacklistRepository.js';
import { getSubscriber } from './subscriberRepository.js';

const phone = '923001234567';
function mockPool(failUpdate = false, newUser = false) {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    execute: async (sql, values) => {
      calls.push({ sql, values });
      if (failUpdate && sql.startsWith('UPDATE')) throw new Error('Update failed');
      if (sql.startsWith('SELECT')) return [newUser ? [] : [{ id: 1 }]];
      return [{ affectedRows: 0 }];
    },
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
  };
  return { calls, getConnection: async () => connection };
}

test('blacklisting synchronizes the list and disables matching users and plans', async () => {
  const pool = mockPool();
  assert.deepEqual(await setBlacklistStatus({ phone, blacklisted: true }, pool), { phone, blacklisted: true });
  assert.match(pool.calls[1].sql, /INSERT INTO users_blacklist/);
  assert.deepEqual(pool.calls[1].values, ['3001234567']);
  assert.match(pool.calls[3].sql, /is_blacklist = \?, status = 0, plan_id = 0/);
  assert.deepEqual(pool.calls[3].values, [1, phone, '3001234567']);
  assert.deepEqual(pool.calls.slice(-2), ['commit', 'release']);
});

test('unblacklisting clears the flag without restoring a plan or reactivating', async () => {
  const pool = mockPool();
  await setBlacklistStatus({ phone, blacklisted: false }, pool);
  assert.match(pool.calls[1].sql, /DELETE FROM users_blacklist/);
  assert.equal(pool.calls[2].sql, 'UPDATE users SET is_blacklist = ? WHERE phone IN (?, ?)');
  assert.deepEqual(pool.calls[2].values, [0, phone, '3001234567']);
});

test('a failed user update rolls back the blacklist write', async () => {
  const pool = mockPool(true);
  await assert.rejects(setBlacklistStatus({ phone, blacklisted: true }, pool), /Update failed/);
  assert.deepEqual(pool.calls.slice(-2), ['rollback', 'release']);
  assert.ok(!pool.calls.includes('commit'));
});

test('a blacklist-only number is searchable without inventing subscriber details', async () => {
  let reads = 0;
  const user = await getSubscriber(phone, async (sql, values) => {
    reads++;
    if (reads === 1) return [];
    assert.match(sql, /FROM users_blacklist/);
    assert.deepEqual(values, ['3001234567']);
    return [{ msisdn: '3001234567' }];
  });
  assert.equal(user.phone, phone);
  assert.equal(user.blacklisted, true);
  assert.equal(user.registered, false);
  assert.equal(user.status, 'No subscription');
  assert.equal(user.plan, null);
  assert.equal(user.createdAt, null);
});

test('a number remains searchable after its blacklist entry is removed', async () => {
  const user = await getSubscriber(phone, async () => []);
  assert.equal(user.phone, phone);
  assert.equal(user.blacklisted, false);
  assert.equal(user.registered, false);
  assert.equal(user.status, 'No subscription');
  assert.equal(user.plan, null);
  assert.equal(user.createdAt, null);
});

test('existing subscriber blacklist status uses only is_blacklist', async () => {
  for (const flag of [0, 1, '0', '1', null]) {
    const user = await getSubscriber(phone, async () => [{
      phone, status: 1, is_blacklist: flag, listed: 1,
    }]);
    assert.equal(user.blacklisted, Number(flag) === 1);
  }
});


test('blacklisting a new number creates a permanent inactive user', async () => {
  const pool = mockPool(false, true);
  await setBlacklistStatus({ phone, blacklisted: true }, pool);
  const insert = pool.calls.find(call => call.sql?.includes('INSERT INTO users\n'));
  assert.ok(insert);
  assert.equal(insert.values[0], phone);
  assert.match(insert.sql, /VALUES \(\?, 0, 0, 1, 0/);
  assert.match(insert.values[1], /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(pool.calls.slice(-2), ['commit', 'release']);
});
