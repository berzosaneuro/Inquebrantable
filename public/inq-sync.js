/* Inquebrantable — puente entre la app (localStorage) y el backend (Supabase).
   Se carga ANTES de legacy-app.js. Si hay sesión:
   - hidrata localStorage con el estado guardado en el servidor
   - reenvía al servidor cada escritura de una clave inq-* (write-through) */
(function () {
  var BOOT = { user: null, state: {} };
  try {
    var el = document.getElementById('__inq_boot');
    if (el && el.textContent) BOOT = JSON.parse(el.textContent);
  } catch (e) { /* noop */ }
  window.__INQ_BOOT = BOOT;
  var LOCAL_ONLY = {
    'inq-session': 1,
    'inq-accounts': 1,
    'inq-premium-trial': 1,
    'inq-contact-msgs': 1,
  };
  var rawSet = localStorage.setItem.bind(localStorage);
  var rawRemove = localStorage.removeItem.bind(localStorage);

  // ── Hidratación desde el servidor ──
  if (BOOT.user) {
    try {
      rawSet('inq-session', JSON.stringify({
        email: BOOT.user.email,
        nick: BOOT.user.nick,
        id: BOOT.user.id,
        loggedIn: true,
      }));
      var st = BOOT.state || {};
      for (var k in st) {
        if (!Object.prototype.hasOwnProperty.call(st, k)) continue;
        var v = st[k];
        rawSet(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    } catch (e) { /* noop */ }
  }

  // ── Write-through de cada setItem(inq-*) ──
  var timers = {};
  function push(key, value) {
    if (!BOOT.user) return;
    if (key.indexOf('inq-') !== 0 || LOCAL_ONLY[key]) return;
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function () {
      var parsed;
      try { parsed = JSON.parse(value); } catch (e) { parsed = value; }
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key, value: parsed }),
        keepalive: true,
      }).catch(function () { /* offline: se reintentará en la próxima escritura */ });
    }, 600);
  }

  localStorage.setItem = function (key, value) {
    rawSet(key, value);
    try { push(key, String(value)); } catch (e) { /* noop */ }
  };
  localStorage.removeItem = function (key) {
    rawRemove(key);
  };

  // ── Helpers de auth para los formularios de legacy-app.js ──
  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  }

  window.__inqAuth = {
    boot: BOOT,
    isLoggedIn: function () { return !!BOOT.user; },
    signup: function (nick, email, password) {
      return post('/api/auth/signup', { nick: nick, email: email, password: password });
    },
    login: function (email, password) {
      return post('/api/auth/login', { email: email, password: password });
    },
    logout: function () { return post('/api/auth/logout', null); },
    contact: function (name, email, message) {
      return post('/api/contact', { name: name, email: email, message: message });
    },
    setLocalSession: function (user) {
      rawSet('inq-session', JSON.stringify({
        email: user.email, nick: user.nick, id: user.id, loggedIn: true,
      }));
    },
    clearLocalSession: function () { rawRemove('inq-session'); },
  };
})();
