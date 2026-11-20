import { loginMarkup, loginStyles, loginScript } from './login.js';
import { roleHome } from '../server/access.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/login-ui.js') {
      return new Response(loginScript, { headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      } });
    }
    const cookieName = 'deikhlo_session=';
    const cookie = (request.headers.get('Cookie') ?? '').split(';')
      .map(part => part.trim()).find(part => part.startsWith(cookieName))?.slice(cookieName.length);
    const attributes = '; Path=/; HttpOnly; SameSite=Strict' + (url.protocol === 'https:' ? '; Secure' : '');
    const markup = message => loginMarkup(message);
    const redirect = (value, location = '/') => new Response(null, {
      status: 303,
      headers: { Location: location, 'Cache-Control': 'no-store', 'Set-Cookie': cookieName + value + attributes },
    });

    if (url.pathname === '/reports/login') return new Response(null, { status: 303, headers: { Location: '/login', 'Cache-Control': 'no-store' } });

    if (request.method === 'POST') {
      if (request.headers.get('Origin') !== url.origin) return new Response('Forbidden', { status: 403 });
      if (url.pathname === '/logout') {
        await env.auth?.logout(cookie);
        return redirect('; Max-Age=0', '/login');
      }
      if (url.pathname !== '/login') return new Response('Not found', { status: 404 });
      if (!env.auth) return page(markup('Access has not been configured.'), 503);
      const reader = request.body?.getReader();
      let body = '';
      let bytes = 0;
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 8192) {
            await reader.cancel();
            return new Response('Request too large', { status: 413 });
          }
          body += decoder.decode(value, { stream: true });
        }
      }
      body += decoder.decode();
      const form = new URLSearchParams(body);
      const rememberMe = form.get('remember') === 'on';
      const result = await env.auth.login(form.get('username'), form.get('password'), rememberMe);
      if (result.status === 429) return page(markup('Too many sign-in attempts. Please wait 15 minutes and try again.'), 429);
      if (result.status !== 200) return page(markup('Check your username and password.'), 401);
      return redirect(result.token + (rememberMe ? '; Max-Age=' + result.maxAge : ''), roleHome(result.role));
    }
    if (request.method !== 'GET' || !['/', '/login', '/reports/login'].includes(url.pathname)) return new Response('Not found', { status: 404 });
    const authorized = await env.auth?.authorized(cookie);
    return page(authorized ? '<main data-authenticated-dashboard>Deikhlo Dashboard</main>' : markup(''));
  },
};

function page(body, status = 200) {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" type="image/png" href="/src/assets/logo-icon-only.png"><title>Sign in · Deikhlo CC Portal</title><style>' + loginStyles + '</style><script src="/login-ui.js" defer></script></head><body>' + body + '</body></html>', {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}



