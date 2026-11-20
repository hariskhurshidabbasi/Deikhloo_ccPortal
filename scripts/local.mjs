import { createServer } from 'node:http';
import { createInterface } from 'node:readline/promises';
import { Readable, Writable } from 'node:stream';
import app from '../worker/index.js';
import { createAuthentication, checkAuthenticationTables, hasAdmin, provisionAdmin } from '../server/auth.js';
import { handleApi } from '../server/api.js';
import { canAccess, roleHome } from '../server/access.js';
import { initializeRoleStore } from '../server/roleStore.js';
import { createServer as createViteServer } from 'vite';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT || 3000);
const origin = 'http://127.0.0.1:' + port;
await checkAuthenticationTables();
await initializeRoleStore();
const needsAdmin = !(await hasAdmin());
if (needsAdmin && !process.env.ADMIN_PASSWORD && process.stdin.isTTY) {
  const muted = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const terminal = createInterface({ input: process.stdin, output: muted, terminal: true });
  process.stderr.write('Create admin password (first setup only, hidden): ');
  try {
    process.env.ADMIN_PASSWORD = await terminal.question('');
  } finally {
    terminal.close();
    process.stderr.write('\n');
  }
}
if (needsAdmin) await provisionAdmin(process.env.ADMIN_PASSWORD);

const auth = createAuthentication();
delete process.env.ADMIN_PASSWORD;

const vite = await createViteServer({ server: { middlewareMode: true,
  fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/private/**'] },
}, appType: 'custom' });

const server = createServer(async (incoming, outgoing) => {
  if (incoming.url.startsWith('/src/') || incoming.url.startsWith('/@') || incoming.url.startsWith('/node_modules/')) {
    return vite.middlewares(incoming, outgoing, () => outgoing.writeHead(404).end());
  }
  try {
    const options = { method: incoming.method, headers: incoming.headers };
    if (!['GET', 'HEAD'].includes(incoming.method)) {
      options.body = Readable.toWeb(incoming);
      options.duplex = 'half';
    }
    const request = new Request(origin + incoming.url, options);
    const isApi = incoming.url.startsWith('/api/');
    const pagePaths = ['/', '/dashboard', '/deactivations', '/activation-history', '/blacklist', '/monthly-revenue', '/admin-users', '/reports', '/reports/plan-revenue', '/reports/campaign-reports'];
    const path = new URL(request.url).pathname;
    const token = (request.headers.get('Cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith('deikhlo_session='))?.slice('deikhlo_session='.length);
    const session = await auth.session(token);
    const isPage = incoming.method === 'GET' && pagePaths.includes(new URL(request.url).pathname);
    if (session && incoming.method === 'GET' && (path === '/' && session.role === 'reports' || ['/login', '/reports/login', '/reports'].includes(path))) {
      outgoing.writeHead(303, { Location: path === '/reports' ? '/reports/plan-revenue' : roleHome(session.role), 'Cache-Control': 'no-store' });
      return outgoing.end();
    }
    if (session && (isApi || isPage) && !canAccess(session.role, path, incoming.method)) {
      outgoing.writeHead(403, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return outgoing.end(JSON.stringify({ error: 'Your role cannot access this area.' }));
    }
    if (session && path === '/api/session' && incoming.method === 'GET') {
      outgoing.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return outgoing.end(JSON.stringify(session));
    }
    const authRequest = isApi || isPage ? new Request(origin, { headers: incoming.headers }) : request;
    const response = await app.fetch(authRequest, { auth });
    const html = await response.text();
    const authenticated = Boolean(session);
    if (isApi) {
      if (!authenticated) {
        outgoing.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return outgoing.end(JSON.stringify({ error: 'Sign in required.' }));
      }
      if (incoming.method !== 'GET' && request.headers.get('Origin') !== origin) {
        outgoing.writeHead(403);
        return outgoing.end('Forbidden');
      }
      const result = await handleApi(request, session);
      outgoing.writeHead(result.status, Object.fromEntries(result.headers));
      return outgoing.end(await result.text());
    }
    if (authenticated && isPage) {
      const page = await vite.transformIndexHtml('/', await readFile(new URL('../index.html', import.meta.url), 'utf8'));
      outgoing.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin' });
      return outgoing.end(page);
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(html);
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500).end('Portal request failed.');
  }
});

server.on('error', async error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing portal with Ctrl+C, then run npm start again.`);
  } else {
    console.error('Unable to start the portal:', error.message);
  }
  await vite.close();
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => console.log('Deikhlo CC Portal: ' + origin));







