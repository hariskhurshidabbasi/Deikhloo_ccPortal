import { readFileSync } from 'node:fs';
import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const directory = new URL('./private/', import.meta.url);
const file = new URL('account-roles.json', directory);
let queue = Promise.resolve();
export async function initializeRoleStore() {
  await mkdir(directory, { recursive: true });
  try { await writeFile(file, JSON.stringify({ admin: 'admin', reports: 'reports' }, null, 2), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  readRoles();
}
export function readRoles() {
  const roles = JSON.parse(readFileSync(file, 'utf8'));
  if (!roles || Array.isArray(roles) || typeof roles !== 'object' || Object.values(roles).some(role => !['admin', 'reports'].includes(role))) throw new Error('Invalid account roles file. Restore its backup.');
  return roles;
}
export function storedRole(username) {
  if (typeof username !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{2,49}$/.test(username) || ['constructor', 'prototype'].includes(username)) return null;
  const roles = readRoles();
  return Object.hasOwn(roles, username) ? roles[username] : null;
}
export async function writeRoles(roles) {
  const temporary = new URL('roles-' + randomUUID() + '.tmp', directory);
  try {
    await writeFile(temporary, JSON.stringify(roles, null, 2), { mode: 0o600 });
    await rename(temporary, file);
  } finally { await rm(temporary, { force: true }); }
}
export function serializeAccountChange(action) {
  const current = queue.then(action);
  queue = current.catch(() => {});
  return current;
}
