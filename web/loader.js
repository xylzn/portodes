// Loader overlay creator and controller
(function () {
  var LOADER_ID = 'app-loader';

  function setLoaderBg() {
    try {
      var bg = (window.APP_CONFIG && window.APP_CONFIG.LOADER_BG) || null;
      if (bg) document.documentElement.style.setProperty('--loader-bg', bg);
    } catch (e) {}
  }

  function applyLoaderTheme(overlay) {
    try {
      var theme = window.APP_CONFIG && window.APP_CONFIG.LOADER_THEME;
      if (theme === 'space') {
        overlay.classList.add('theme-space');
      } else {
        overlay.classList.remove('theme-space');
      }
    } catch (e) {}
  }

  function ensureConfigLoaded() {
    // If APP_CONFIG already present, skip
    if (window.APP_CONFIG) return Promise.resolve();
    // Try to load config.js (same folder) if not present
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

  function createLoader() {
    if (document.getElementById(LOADER_ID)) return; // already exists
    var overlay = document.createElement('div');
    overlay.id = LOADER_ID;
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = '<div class="loader-box">\n' +
      '  <div class="loader-visual"></div>\n' +
      '</div>';
    document.body.appendChild(overlay);
    applyLoaderTheme(overlay);

    // If config provides image/text, apply them
    try {
      var imgPath = window.APP_CONFIG && window.APP_CONFIG.LOADER_IMAGE;
      var label = (window.APP_CONFIG && window.APP_CONFIG.LOADER_TEXT) || '';
      var visual = overlay.querySelector('.loader-visual');
      if (imgPath) {
        var img = document.createElement('img');
        img.src = imgPath;
        img.alt = label || 'Loading';
        img.className = 'loader-img';
        visual.appendChild(img);
      } else {
        // Fallback simple CSS spinner
        visual.innerHTML = '<span class="loader-spinner" aria-hidden="true"></span>';
      }
    } catch (e) {}
  }

  function hideLoader() {
    var overlay = document.getElementById(LOADER_ID);
    if (!overlay) return;
    overlay.classList.add('is-hiding');
    var done = false;
    function removeNow() {
      if (done) return; done = true;
      try { overlay.remove(); } catch (e) { overlay.style.display = 'none'; }
      try {
        window.APP_LOADER_DONE = true;
        var evt;
        if (typeof window.CustomEvent === 'function') {
          evt = new CustomEvent('app-loader:done');
        } else {
          evt = document.createEvent('Event');
          evt.initEvent('app-loader:done', true, true);
        }
        window.dispatchEvent(evt);
      } catch (e) { /* no-op */ }
    }
    overlay.addEventListener('transitionend', removeNow, { once: true });
    setTimeout(removeNow, 1000); // hard timeout
  }

  function start() {
    ensureConfigLoaded().then(function () {
      setLoaderBg();
      createLoader();
    }).then(function () {
      // When all resources loaded, fade out
      if (document.readyState === 'complete') {
        setTimeout(hideLoader, 150);
      } else {
        window.addEventListener('load', function () { setTimeout(hideLoader, 150); });
      }
      // Safety net: never block more than 12s
      setTimeout(hideLoader, 12000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Expose manual controls if needed
  window.AppLoader = {
    show: function () {
      ensureConfigLoaded().then(function () { setLoaderBg(); createLoader(); });
    },
    hide: hideLoader,
    onDone: function (cb) {
      if (window.APP_LOADER_DONE) { try { cb(); } catch(e){} return; }
      window.addEventListener('app-loader:done', function () { try { cb(); } catch(e){} }, { once: true });
    },
    ready: new Promise(function (resolve) {
      if (window.APP_LOADER_DONE) { resolve(); return; }
      window.addEventListener('app-loader:done', function () { resolve(); }, { once: true });
    })
  };
})();
