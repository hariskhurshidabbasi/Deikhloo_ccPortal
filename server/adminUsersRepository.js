import { database } from './database.js';
import { hashPassword } from './auth.js';
import { readRoles, writeRoles, serializeAccountChange } from './roleStore.js';

const fail = (message, status = 400) => Object.assign(new Error(message), { status });
export function validateAdminUser(body, editing = false) {
  const username = body?.username;
  if (typeof username !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{2,49}$/.test(username) || ['constructor', 'prototype', '__proto__'].includes(username)) throw fail('Username must be 3–50 letters, numbers, dots, underscores or hyphens.');
  if (!['admin', 'reports'].includes(body.role)) throw fail('Choose Admin or Reports role.');
  if (!editing || body.password !== '') {
    if (typeof body.password !== 'string' || body.password.length < 10 || body.password.length > 1024) throw fail('Password must be 10–1,024 characters.');
  }
  return { username, role: body.role, password: body.password };
}
export async function listAdminUsers() {
  const [users] = await database.execute('SELECT username, created_at AS createdAt FROM cc_portal_admins ORDER BY created_at, username');
  const roles = readRoles();
  return users.map(user => ({ ...user, role: Object.hasOwn(roles, user.username) ? roles[user.username] : null, protected: user.username === 'admin' }));
}
export async function changeAdminUser(action, body, actor) {
  if (!['create', 'update', 'delete'].includes(action)) throw fail('Invalid account action.');
  const input = action === 'delete' ? { username: body?.username } : validateAdminUser(body, action === 'update');
  if (typeof input.username !== 'string' || input.username.length > 50) throw fail('Invalid username.');
  const passwordData = action !== 'delete' && input.password ? await hashPassword(input.password) : null;
  return serializeAccountChange(async () => {
    const previous = readRoles();
    if (!actor || !Object.hasOwn(previous, actor.username) || previous[actor.username] !== 'admin') throw fail('Admin access required.', 403);
    if (input.username === 'admin' && (action === 'delete' || input.role !== 'admin')) throw fail('The primary admin account must keep Admin access.');
    if (input.username === actor.username && (action === 'delete' || input.role !== 'admin')) throw fail('You cannot delete your own account or remove your own Admin role.');
    const connection = await database.getConnection();
    let rolesWritten = false;
    try {
      await connection.beginTransaction();
      const [actors] = await connection.execute('SELECT username FROM cc_portal_admins WHERE username = ? FOR UPDATE', [actor.username]);
      if (!actors.length) throw fail('Admin account no longer exists.', 403);
      const [existing] = await connection.execute('SELECT username FROM cc_portal_admins WHERE username = ? FOR UPDATE', [input.username]);
      if (action === 'create' && existing.length) throw fail('This username already exists.', 409);
      if (action !== 'create' && !existing.length) throw fail('User not found.', 404);
      const roles = { ...previous };
      if (action === 'create') {
        await connection.execute('INSERT INTO cc_portal_admins (username, password_hash, password_salt, password_scheme) VALUES (?, ?, ?, ?)', [input.username, passwordData.hash, passwordData.salt, passwordData.scheme]);
        roles[input.username] = input.role;
      } else if (action === 'update') {
        if (passwordData) await connection.execute('UPDATE cc_portal_admins SET password_hash = ?, password_salt = ?, password_scheme = ?, failed_attempts = 0, blocked_until = 0 WHERE username = ?', [passwordData.hash, passwordData.salt, passwordData.scheme, input.username]);
        roles[input.username] = input.role;
      } else {
        await connection.execute('DELETE FROM cc_portal_admins WHERE username = ?', [input.username]);
        delete roles[input.username];
      }
      if (action !== 'create') await connection.execute('DELETE FROM cc_portal_sessions WHERE username = ?', [input.username]);
      await writeRoles(roles); rolesWritten = true;
      await connection.commit();
      return { username: input.username, action, signInAgain: input.username === actor.username };
    } catch (error) {
      await connection.rollback();
      if (rolesWritten) await writeRoles(previous);
      throw error;
    } finally { connection.release(); }
  });
}
