// ── GBL Cash Flow Consolidation Auth ────────────────────────────────────────
// Self-contained. Edit USER_ACCESS below to manage access.
// Same pattern as gbl-cashflow-forecast-repo/auth.js — Google Identity
// Services sign-in, client-side allowlist. No live backend here, so this is
// a UX/access gate (like the CFO PIN it replaces), not a hard security
// boundary — the baked-in report data ships with the page either way.

// Step 1: Immediately hide all body content to prevent flash before auth
(function () {
  var s = document.createElement('style');
  s.id = 'gbl-hide';
  s.textContent = 'body>*{display:none!important}';
  document.head.appendChild(s);
})();

// Step 2: All DOM work after page is parsed
document.addEventListener('DOMContentLoaded', function () {

  // ── Config ────────────────────────────────────────────────────────────────
  var GOOGLE_CLIENT_ID = '710935152155-scs2i7u5sgf466akjnqpts2ngrp6mmte.apps.googleusercontent.com';
  var SESSION_KEY = 'gbl_cff_auth';
  var SESSION_MS = 30 * 60 * 1000; // 30 minutes

  // role: 'view' or 'edit'. brands: array of allowed brand names, or null for all brands.
  // 'edit' can Consolidate/Bake In/open Settings; 'view' can only browse the dashboard.
  var USER_ACCESS = {
    'amal.bobby@goatbrandlabs.com':   { role: 'edit', brands: null },
    'sangeetha.v@goatbrandlabs.com':  { role: 'edit', brands: null },
    'analytics@goatbrandlabs.com':    { role: 'view', brands: null },
  };

  // ── Inject overlay CSS ────────────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = `
#gbl-auth-overlay{
  position:fixed;inset:0;z-index:9999;
  background:#0a0d18;
  background-image:radial-gradient(ellipse 120% 60% at 50% 110%, rgba(60,80,200,.22) 0%, transparent 60%);
  align-items:center;justify-content:center;
  font-family:-apple-system,'SF Pro Display','SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif;
  -webkit-font-smoothing:antialiased;
}
.gbl-auth-wrap{
  display:flex;flex-direction:column;align-items:center;
}
.gbl-auth-card{
  position:relative;
  width:460px;
  background:rgba(18,22,40,.82);
  backdrop-filter:blur(32px) saturate(160%);
  -webkit-backdrop-filter:blur(32px) saturate(160%);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:28px;
  padding:52px 48px 44px;
  text-align:center;
  box-shadow:0 1px 0 rgba(255,255,255,.06) inset,
             0 48px 120px rgba(0,0,0,.7);
}
.gbl-auth-card::after{
  content:'';
  position:absolute;
  bottom:-36px;left:10%;right:10%;
  height:60px;
  background:rgba(80,110,255,.45);
  filter:blur(42px);
  border-radius:50%;
  pointer-events:none;
  z-index:-1;
}
.gbl-auth-logo-img{
  width:150px;height:auto;
  margin:0 auto 36px;display:block;
  filter:brightness(0) invert(1);
  opacity:.95;
}
.gbl-auth-title{
  font-size:30px;font-weight:700;
  color:#fff;letter-spacing:-.5px;
  margin:0 0 12px;line-height:1.15;
}
.gbl-auth-sub{
  font-size:15px;color:rgba(255,255,255,.42);
  margin-bottom:36px;line-height:1.6;font-weight:400;
}
.gbl-auth-btn{display:flex;justify-content:center;margin-bottom:28px}
.gbl-auth-badge{
  display:flex;align-items:center;justify-content:center;gap:7px;
  font-size:13px;color:rgba(255,255,255,.28);
}
.gbl-auth-err{
  font-size:13px;color:#ff6b4a;min-height:16px;
  margin-top:16px;line-height:1.4;
}

#gbl-reauth-overlay{
  position:fixed;inset:0;z-index:10000;
  background:rgba(10,13,24,.72);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  display:none;align-items:center;justify-content:center;
  font-family:-apple-system,'SF Pro Display','SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif;
}
.gbl-reauth-card{
  background:#12162a;border:0.5px solid rgba(255,255,255,.1);border-radius:20px;
  padding:36px 40px;text-align:center;max-width:380px;
  box-shadow:0 24px 80px rgba(0,0,0,.6);
}
.gbl-reauth-title{ font-size:18px;font-weight:700;color:#fff;margin-bottom:8px; }
.gbl-reauth-sub{ font-size:13px;color:rgba(255,255,255,.55);margin-bottom:24px;line-height:1.5; }
.gbl-reauth-err{ font-size:12px;color:#ff6b4a;margin-top:14px;min-height:14px; }

#gbl-user-chip{display:none;align-items:center;gap:10px}
#gbl-user-chip .gbl-uwho{display:flex;align-items:center;gap:8px;min-width:0}
#gbl-user-chip img{width:26px;height:26px;border-radius:50%;border:1.5px solid rgba(0,0,0,.1);flex-shrink:0}
#gbl-user-chip .gbl-uinfo{min-width:0}
#gbl-user-chip .gbl-uname{font-size:12px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px}
#gbl-user-chip .gbl-urole{font-size:10px;color:#5b7fdb;margin-top:1px}
#gbl-user-chip .gbl-signout{font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid var(--rule,#ccc);background:transparent;color:#777;cursor:pointer;transition:all .15s}
#gbl-user-chip .gbl-signout:hover{background:rgba(255,107,74,.1);color:#ff6b4a;border-color:#ff6b4a}
`;
  document.head.appendChild(styleEl);

  // ── Inject overlay HTML ───────────────────────────────────────────────────
  var overlay = document.createElement('div');
  overlay.id = 'gbl-auth-overlay';
  overlay.innerHTML =
    '<div class="gbl-auth-wrap">' +
    '<div class="gbl-auth-card">' +
    '<img class="gbl-auth-logo-img" src="goat-logo.png" alt="G.O.A.T Brand Labs">' +
    '<div class="gbl-auth-title">Cash Flow Consolidation</div>' +
    '<div class="gbl-auth-sub">Use your organisation Google account<br>to access the dashboard.</div>' +
    '<div class="gbl-auth-btn" id="gbl-signin-btn"></div>' +
    '<div class="gbl-auth-err" id="gbl-auth-err"></div>' +
    '<div class="gbl-auth-badge">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.9 10.14 9 11.33C17.1 22.14 21 17.25 21 12V7L12 2z" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<span>Authorized Goat employees only</span>' +
    '</div>' +
    '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  // ── Inject re-auth overlay ──────────────────────────────────────────────
  var reauthOverlay = document.createElement('div');
  reauthOverlay.id = 'gbl-reauth-overlay';
  reauthOverlay.innerHTML =
    '<div class="gbl-reauth-card">' +
    '<div class="gbl-reauth-title">Session expired</div>' +
    '<div class="gbl-reauth-sub">Sign in again to keep going — your work in this page is safe and won’t be lost.</div>' +
    '<div class="gbl-auth-btn" id="gbl-reauth-signin-btn"></div>' +
    '<div class="gbl-reauth-err" id="gbl-reauth-err"></div>' +
    '</div>';
  document.body.appendChild(reauthOverlay);

  // ── User chip ──────────────────────────────────────────────────────────────
  var chip = document.createElement('div');
  chip.id = 'gbl-user-chip';
  chip.innerHTML =
    '<div class="gbl-uwho">' +
    '<img id="gbl-user-avatar" src="" alt="">' +
    '<div class="gbl-uinfo">' +
    '<div class="gbl-uname" id="gbl-user-name"></div>' +
    '<div class="gbl-urole" id="gbl-user-role"></div>' +
    '</div>' +
    '</div>' +
    '<button class="gbl-signout" onclick="gblSignOut()">Sign out</button>';

  // ── Show / hide helpers ───────────────────────────────────────────────────
  function showOverlay() {
    overlay.style.setProperty('display', 'flex', 'important');
  }

  function showDashboard(user, access) {
    overlay.style.setProperty('display', 'none', 'important');
    var hide = document.getElementById('gbl-hide');
    if (hide) hide.remove();

    var slot = document.getElementById('gbl-user-slot');
    if (slot) {
      if (!document.getElementById('gbl-user-chip')) slot.appendChild(chip);
      var chipEl = document.getElementById('gbl-user-chip');
      if (chipEl) chipEl.style.display = 'flex';
      if (user.picture) { var av = document.getElementById('gbl-user-avatar'); if (av) av.src = user.picture; }
      var nameEl = document.getElementById('gbl-user-name');
      if (nameEl) nameEl.textContent = user.name;
      var roleEl = document.getElementById('gbl-user-role');
      if (roleEl) roleEl.textContent = access.role === 'view' ? 'View only' : 'Edit access';
    }

    window.gblCurrentUser = user;
    window.gblCurrentAccess = access;
    if (typeof window.gblApplyAccess === 'function') window.gblApplyAccess(access);
  }

  // ── Session helpers ───────────────────────────────────────────────────────
  function saveSession(e, n, p, idToken) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ email: e, name: n, picture: p, idToken: idToken, ts: Date.now() })); } catch (x) { }
  }
  function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (x) { } }

  function checkSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY); if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || !d.ts || (Date.now() - d.ts) > SESSION_MS) { clearSession(); return false; }
      var access = USER_ACCESS[d.email];
      if (!access) { clearSession(); return false; }
      window.gblIdToken = d.idToken;
      showDashboard({ email: d.email, name: d.name, picture: d.picture || '' }, access);
      return true;
    } catch (x) { clearSession(); return false; }
  }

  // ── JWT parser ────────────────────────────────────────────────────────────
  function parseJwt(token) {
    try {
      var b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var pad = b64.length % 4 ? b64 + '===='.slice(b64.length % 4) : b64;
      return JSON.parse(atob(pad));
    } catch (e) { return null; }
  }

  // ── Google credential callback ────────────────────────────────────────────
  window.gblHandleCredential = function (response) {
    var payload = parseJwt(response.credential);
    if (!payload) {
      var errEl = window._gblReauthPending ? document.getElementById('gbl-reauth-err') : document.getElementById('gbl-auth-err');
      if (errEl) errEl.textContent = 'Sign-in failed. Try again.';
      return;
    }
    var email = (payload.email || '').toLowerCase();
    var access = USER_ACCESS[email];
    if (!access) {
      var deniedEl = window._gblReauthPending ? document.getElementById('gbl-reauth-err') : document.getElementById('gbl-auth-err');
      if (deniedEl) deniedEl.textContent = 'Access denied for ' + email + '. Contact your administrator.';
      return;
    }
    var user = { email: email, name: payload.name || email, picture: payload.picture || '' };
    window.gblIdToken = response.credential;
    saveSession(email, user.name, user.picture, response.credential);

    if (window._gblReauthPending) {
      reauthOverlay.style.setProperty('display', 'none', 'important');
      var resolve = window._gblReauthPending;
      window._gblReauthPending = null;
      resolve();
      return;
    }

    showDashboard(user, access);
  };

  window.gblGetIdToken = function () { return window.gblIdToken || ''; };

  window.gblReauth = function () {
    if (window._gblReauthPromise) return window._gblReauthPromise;
    window._gblReauthPromise = new Promise(function (resolve) {
      window._gblReauthPending = resolve;
      var errEl = document.getElementById('gbl-reauth-err');
      if (errEl) errEl.textContent = '';
      reauthOverlay.style.setProperty('display', 'flex', 'important');
      function render() {
        google.accounts.id.renderButton(
          document.getElementById('gbl-reauth-signin-btn'),
          { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 300 }
        );
      }
      if (typeof google !== 'undefined' && google.accounts) render();
      else window.onGoogleLibraryLoad = render;
    }).then(function () {
      window._gblReauthPromise = null;
    });
    return window._gblReauthPromise;
  };

  window.gblSignOut = function () {
    clearSession();
    window.gblIdToken = null;
    window.gblCurrentUser = null;
    window.gblCurrentAccess = null;
    var hide = document.getElementById('gbl-hide');
    if (!hide) {
      hide = document.createElement('style');
      hide.id = 'gbl-hide';
      hide.textContent = 'body>*{display:none!important}';
      document.head.appendChild(hide);
    }
    showOverlay();
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.renderButton(
        document.getElementById('gbl-signin-btn'),
        { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 364 }
      );
    }
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  function initGoogleAuth() {
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: window.gblHandleCredential });
    google.accounts.id.renderButton(
      document.getElementById('gbl-signin-btn'),
      { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 364 }
    );
    showOverlay();
  }

  if (!checkSession()) {
    if (typeof google !== 'undefined' && google.accounts) {
      initGoogleAuth();
    } else {
      window.onGoogleLibraryLoad = initGoogleAuth;
    }
  }

}); // end DOMContentLoaded
