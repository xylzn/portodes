// Typing animation for #hero-name and #hero-role
(function () {
  function typeInto(el, text, opts) {
    if (!el) return Promise.resolve();
    opts = opts || {};
    var speed = opts.speed || 60; // ms per char
    var delay = opts.delay || 0;
    var keepCaret = !!opts.keepCaret;
    var original = text != null ? text : (el.textContent || '').trim();
    // If already typed once and content matches, just ensure content is there and bail
    if (el.dataset && el.dataset.typed === 'true' && el.textContent === original) {
      el.textContent = original;
      if (!keepCaret) el.classList.remove('typing-caret');
      return Promise.resolve();
    }
    el.setAttribute('aria-live', 'polite');
    el.textContent = '';
    el.classList.add('typing-caret');
    return new Promise(function (resolve) {
      setTimeout(function () {
        var i = 0;
        var id = setInterval(function () {
          el.textContent = original.slice(0, i);
          i++;
          if (i > original.length) {
            clearInterval(id);
            // Ensure the final text stays rendered
            el.textContent = original;
            if (el.dataset) el.dataset.typed = 'true';
            if (!keepCaret) el.classList.remove('typing-caret');
            resolve();
          }
        }, speed);
      }, delay);
    });
  }

  function whenFontsReady() {
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      return document.fonts.ready.catch(function () {});
    }
    return Promise.resolve();
  }

  function whenLoaderDone() {
    return new Promise(function (resolve) {
      if (window.APP_LOADER_DONE) { resolve(); return; }
      if (window.AppLoader && window.AppLoader.ready && typeof window.AppLoader.ready.then === 'function') {
        window.AppLoader.ready.then(resolve);
        return;
      }
      // Wait for custom event or, at worst, window load
      window.addEventListener('app-loader:done', function () { resolve(); }, { once: true });
      window.addEventListener('load', function () { setTimeout(resolve, 150); }, { once: true });
    });
  }

  function ensureConfig() {
    function hasConfig() {
      return !!(
        (window.CONFIG && window.CONFIG.hero) ||
        (window.config && window.config.hero) ||
        window.HERO ||
        window.hero ||
        window.APP_CONFIG ||
        window.AppConfig
      );
    }
    if (hasConfig()) return Promise.resolve();
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = './config.js';
      s.async = true;
      var done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      s.onload = finish;
      s.onerror = finish;
      document.head.appendChild(s);
      setTimeout(finish, 2000);
    });
  }

  function start() {
    var nameEl = document.getElementById('hero-name');
    var roleEl = document.getElementById('hero-role');
    if (!nameEl && !roleEl) return;

    function pickNameRole() {
      var out = { name: '', role: '' };
      var sources = [];
      try {
        if (window.APP_CONFIG) {
          if (window.APP_CONFIG.HERO) sources.push(window.APP_CONFIG.HERO);
          if (window.APP_CONFIG.hero) sources.push(window.APP_CONFIG.hero);
        }
      } catch (e) {}
      try {
        if (window.CONFIG) {
          if (window.CONFIG.HERO) sources.push(window.CONFIG.HERO);
          if (window.CONFIG.hero) sources.push(window.CONFIG.hero);
        }
      } catch (e) {}
      try {
        if (window.config) {
          if (window.config.HERO) sources.push(window.config.HERO);
          if (window.config.hero) sources.push(window.config.hero);
        }
      } catch (e) {}
      try {
        if (window.AppConfig) {
          if (window.AppConfig.HERO) sources.push(window.AppConfig.HERO);
          if (window.AppConfig.hero) sources.push(window.AppConfig.hero);
        }
      } catch (e) {}
      try {
        if (window.HERO) sources.push(window.HERO);
        if (window.hero) sources.push(window.hero);
      } catch (e) {}

      for (var i = 0; i < sources.length; i++) {
        var s = sources[i] || {};
        if (!out.name) out.name = s.NAME || s.name || '';
        if (!out.role) out.role = s.ROLE || s.role || '';
        if (out.name && out.role) break;
      }

      return out;
    }

    var nameText = (nameEl ? (nameEl.textContent || '').trim() : '');
    var roleText = (roleEl ? (roleEl.textContent || '').trim() : '');

    var nameDelay = 900; // longer pause before typing name
    var roleDelay = 600; // extra pause before typing role

    Promise.resolve()
      .then(ensureConfig)
      .then(whenLoaderDone)
      .then(function () {
        var cfg = pickNameRole();
        if (cfg.name) nameText = cfg.name;
        if (cfg.role) roleText = cfg.role;
      })
      .then(whenFontsReady)
      .then(function () {
        return typeInto(nameEl, nameText, { speed: 70, delay: nameDelay });
      })
      .then(function () {
        return typeInto(roleEl, roleText, { speed: 55, delay: roleDelay });
      })
      .then(function () { if (roleEl) { roleEl.classList.add('role-sweep'); } })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
