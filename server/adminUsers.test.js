import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminUser } from './adminUsersRepository.js';
import { handleApi } from './api.js';
import app from '../worker/index.js';

test('role assignment accepts only supported roles and safe usernames', () => {
  assert.deepEqual(validateAdminUser({ username: 'analyst.1', role: 'reports', password: 'test-password-123' }), { username: 'analyst.1', role: 'reports', password: 'test-password-123' });
  for (const body of [
    { username: '__proto__', role: 'admin', password: 'test-password-123' },
    { username: 'analyst', role: 'owner', password: 'test-password-123' },
    { username: 'analyst', role: 'reports', password: 'short' },
  ]) assert.throws(() => validateAdminUser(body), { status: 400 });
  assert.equal(validateAdminUser({ username: 'analyst', role: 'reports', password: '' }, true).password, '');
});

test('user management API denies reports and anonymous callers before touching data', async () => {
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    for (const session of [undefined, { username: 'reports', role: 'reports' }]) {
      const response = await handleApi(new Request('https://portal.test/api/admin-users', { method }), session);
      assert.equal(response.status, 403);
    }
  }
});

test('one login accepts arbitrary assigned accounts and redirects by returned role', async () => {
  for (const role of ['admin', 'reports']) {
    const response = await app.fetch(new Request('https://portal.test/login', {
      method: 'POST', headers: { Origin: 'https://portal.test' },
      body: new URLSearchParams({ username: 'new-account', password: 'test-password-123' }),
    }), { auth: { login: async username => { assert.equal(username, 'new-account'); return { status: 200, role, token: 'test-token', maxAge: 28800 }; } } });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), role === 'admin' ? '/' : '/reports/plan-revenue');
  }
  const oldLogin = await app.fetch(new Request('https://portal.test/reports/login'), {});
  assert.equal(oldLogin.headers.get('location'), '/login');
  const loginPage = await app.fetch(new Request('https://portal.test/login'), {});
  const markup = await loginPage.text();
  assert(markup.includes('action="/login"'));
  assert(!markup.includes('Reports login'));
});
