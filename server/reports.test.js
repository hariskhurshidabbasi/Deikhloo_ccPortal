import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccess, roleForUsername } from './access.js';
import { getPlanRevenue } from './planRevenueRepository.js';

test('reports role cannot read subscriber data or perform administrative actions', () => {
  for (const method of ['GET', 'POST', 'DELETE']) {
    for (const path of ['/api/subscribers/923400961665', '/api/blacklist', '/api/deactivations', '/dashboard']) {
      assert.equal(canAccess('reports', path, method), false);
    }
  }
  assert.equal(canAccess('reports', '/api/reports/plan-revenue'), true);
  assert.equal(canAccess('reports', '/api/reports/plan-revenue', 'POST'), false);
  assert.equal(canAccess('admin', '/api/deactivations', 'POST'), true);
  assert.equal(roleForUsername('__proto__'), null);
});

test('admin can access customer care and every report while unknown roles are denied', () => {
  for (const path of ['/dashboard', '/deactivations', '/activation-history', '/blacklist', '/monthly-revenue', '/reports', '/reports/plan-revenue', '/reports/campaign-reports', '/api/reports/plan-revenue', '/api/reports/campaigns', '/api/reports/campaign-report']) {
    assert.equal(canAccess('admin', path), true, path);
    assert.equal(canAccess('unknown', path), false, path);
  }
  assert.equal(canAccess('reports', '/api/reports/campaign-report'), true);
  assert.equal(canAccess('reports', '/monthly-revenue'), false);
});

test('revenue combines daily rates, weekly counts and excludes unknown rates', async () => {
  let calls = 0;
  const report = await getPlanRevenue('2026-11-01', '2026-11-02', async (sql, values) => {
    if (++calls === 1) return [{ firstDate: '2026-11-01', lastDate: '2026-11-02' }];
    assert.deepEqual(values, ['2026-11-01', '2026-11-02']);
    return [
      { date: '2026-11-02', serviceId: 99171, count: 10 },
      { date: '2026-11-02', serviceId: 99144, count: 20 },
      { date: '2026-11-01', serviceId: 89130, count: 3 },
      { date: '2026-11-01', serviceId: 99999, count: 2 },
    ];
  });
  assert.equal(report.totals.totalCount, 35);
  assert.equal(report.totals.totalRevenue, 161);
  assert.equal(report.totals.dailyCount, 30);
  assert.equal(report.totals.weeklyCount, 3);
  assert.equal(report.totals.unmappedCount, 2);
  assert.equal(report.rows[0].totalRevenue, 140);
});

test('invalid and reversed date ranges are rejected', async () => {
  const read = async () => [{ firstDate: null, lastDate: null }];
  for (const [start, end] of [['2026-02-30', '2026-03-01'], ['2026-11-20', '2026-11-01'], ['2024-01-01', '2026-11-01']]) {
    await assert.rejects(() => getPlanRevenue(start, end, read), { status: 400 });
  }
});
