export function loginMarkup(message) {
  return `<main class="login-shell">
    <section class="brand-panel"><a class="brand" href="/"><img class="brand-logo" src="/src/assets/header-logo.png" alt="Deikhlo"><small>CC PORTAL</small></a>
      <div class="brand-copy"><p class="eyebrow">DEIKHLO OPERATIONS</p><h1>Your workspace.<br>Everything in view.</h1><p>Manage subscribers, service activations and customer history from one place.</p><div class="brand-line"></div></div>
      <p class="brand-footer">Deikhlo · Customer Care Portal</p>
    </section>
    <section class="form-panel"><div class="form-content"><div class="login-logo"><img src="/src/assets/header-logo.png" alt="Deikhlo"></div><p class="eyebrow">DEIKHLO PORTAL</p><h2>Welcome back</h2><p class="subtitle">One secure login. Access assigned by your administrator.</p>
      <form method="post" action="/login">
        <label for="username">Username</label><input id="username" name="username" autocomplete="username" placeholder="Enter your username" maxlength="100" required autofocus>
        <label for="password">Password</label><div class="password-field"><input id="password" type="password" name="password" autocomplete="current-password" placeholder="Enter your password" maxlength="1024" required>
          <button class="password-toggle" id="password-toggle" type="button" aria-label="Show password" aria-controls="password" aria-pressed="false" title="Show password"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="M3 3l18 18"/></svg></button></div>
        <label class="remember-me" for="remember"><input id="remember" type="checkbox" name="remember" value="on"> Remember me for 30 days</label>
        <p class="error" role="alert">${message}</p><button type="submit">Sign in <span aria-hidden="true">→</span></button>
      </form><p class="access-note">Your role determines the tools you can access.</p>
    </div></section>
  </main>`;
}

export const loginStyles = `
.password-field{position:relative}.password-field input{padding-right:54px}.password-toggle{position:absolute;right:5px;top:50%;transform:translateY(-50%);width:42px;height:40px;padding:9px;justify-content:center;background:transparent;color:#6b626a}.password-toggle:hover{background:#fff0f2;color:#c81b33;filter:none}.password-toggle .eye-slash{display:none}.password-toggle[aria-pressed="true"] .eye-slash{display:block}
.remember-me{display:flex;align-items:center;gap:10px;cursor:pointer}.remember-me input{width:18px;height:18px;margin:0;padding:0;accent-color:#c81b33;flex-shrink:0}
*{box-sizing:border-box}body{margin:0;font:16px Arial,Helvetica,sans-serif;background:#101014;color:#23232b;min-height:100vh;display:grid;place-items:center;padding:36px}.login-shell{width:min(1080px,100%);min-height:650px;display:grid;grid-template-columns:1.05fr 1fr;background:#fff;border:1px solid #ffffff20;border-radius:20px;overflow:hidden;box-shadow:0 30px 100px #0005}.brand-panel{display:flex;flex-direction:column;padding:40px;color:white;background:radial-gradient(ellipse at 100% 100%,#d41d35 0,transparent 65%),linear-gradient(140deg,#15151a,#3f111b)}.brand{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:700;color:white;text-decoration:none}.brand-logo{width:150px;height:auto;object-fit:contain}.brand>span{display:grid;place-items:center;background:#e32b43;width:38px;height:42px;border-radius:9px}.brand small{font-size:10px;letter-spacing:.1em;font-weight:500}.brand-copy{margin:auto 0}.eyebrow{font-size:10px;letter-spacing:.18em;font-weight:700;color:#d62940}.brand-copy .eyebrow{color:#ffb1bb}.brand-copy h1{font-size:44px;line-height:1.13;letter-spacing:-1.5px;margin:20px 0}.brand-copy>p:last-of-type{font-size:15px;line-height:1.8;color:#e0cbd0;max-width:340px}.brand-line{width:54px;height:3px;background:#ff5167;margin-top:28px}.brand-footer{font-size:11px;color:#e3bcc4;margin:0}.form-panel{display:grid;place-items:center;padding:54px 46px}.form-content{width:100%;max-width:350px}.login-logo{display:inline-flex;align-items:center;background:#17171c;border-radius:10px;padding:14px 18px;margin-bottom:24px}.login-logo img{display:block;width:135px;height:auto}.lock-icon{display:grid;place-items:center;width:48px;height:48px;background:#fff0f2;border:1px solid #f4ccd3;border-radius:12px;color:#c81b33;font-size:30px;margin-bottom:28px}h2{font-size:32px;letter-spacing:-.8px;margin:12px 0}.subtitle{color:#7b7781;font-size:16px;margin:0 0 30px}label{display:block;font-size:15px;font-weight:600;margin:20px 0 9px}input{font:inherit;width:100%;padding:14px;border:1px solid #dcdbe1;border-radius:7px;background:#fafafb;color:#25232b}input:focus{outline:2px solid #e62d46;outline-offset:2px}input::placeholder{color:#9d99a3;font-size:15px}button{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;border-radius:7px;background:linear-gradient(100deg,#9c1428,#e22a42);color:white;padding:15px 18px;font:600 16px Arial;cursor:pointer}button:hover{filter:brightness(1.1)}button:focus-visible{outline:3px solid #ee8090;outline-offset:3px}.error{color:#b51c32;font-size:15px;line-height:1.5;min-height:20px;margin:14px 0}.access-note{text-align:center;color:#93909a;font-size:11px;margin:24px 0 0}@media(max-width:700px){body{padding:18px}.login-shell{grid-template-columns:1fr;min-height:auto}.brand-panel{padding:24px}.brand-copy,.brand-footer{display:none}.form-panel{padding:32px 26px}.login-logo{display:inline-flex;align-items:center;background:#17171c;border-radius:10px;padding:14px 18px;margin-bottom:24px}.login-logo img{display:block;width:135px;height:auto}.lock-icon{margin-bottom:20px}h2{font-size:28px}}
`;

export const loginScript = `
const password = document.getElementById('password');
const toggle = document.getElementById('password-toggle');
toggle?.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.setAttribute('aria-pressed', String(visible));
  toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  toggle.title = visible ? 'Hide password' : 'Show password';
});
`;



