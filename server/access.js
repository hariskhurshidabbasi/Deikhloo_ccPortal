import { storedRole } from './roleStore.js';
export const roleForUsername = storedRole;
export const roleHome = role => role === 'reports' ? '/reports/plan-revenue' : '/';
export function canAccess(role, path, method = 'GET') {
  if (path === '/api/session') return method === 'GET' && ['admin', 'reports'].includes(role);
  if (path.startsWith('/api/reports/')) return ['admin', 'reports'].includes(role) && method === 'GET';
  if (path === '/reports' || path.startsWith('/reports/')) return ['admin', 'reports'].includes(role) && method === 'GET';
  return role === 'admin';
}
