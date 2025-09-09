// Mount a themed app loader overlay and remove any inline preloader
(function(){
  try {
    var existing = document.getElementById('app-loader');
    var pre = document.getElementById('preloader');
    if (pre && pre.parentNode) pre.parentNode.removeChild(pre);

    if (!existing) {
      var el = document.createElement('div');
      el.id = 'app-loader';
      el.className = (window.APP_CONFIG && window.APP_CONFIG.LOADER_THEME === 'space') ? 'theme-space' : '';
      el.innerHTML = [
        '<div class="loader-box">',
        '  <img class="loader-img blend-screen" alt="Loading" />',
        '  <div class="loader-text"></div>',
        '</div>'
      ].join('');
      document.body.appendChild(el);
      existing = el;
    }

    var cfg = window.APP_CONFIG || {};
    var img = existing.querySelector('.loader-img');
    var txt = existing.querySelector('.loader-text');
    if (cfg.LOADER_IMAGE && img) img.src = cfg.LOADER_IMAGE;
    if (txt) txt.textContent = cfg.LOADER_TEXT || 'LOADING';
    if (cfg.LOADER_BG) document.documentElement.style.setProperty('--loader-bg', cfg.LOADER_BG);

    function hide(){
      if (!existing) return;
      existing.classList.add('is-hiding');
      setTimeout(function(){ if(existing && existing.parentNode) existing.parentNode.removeChild(existing); }, 300);
    }
    // Expose a way to hide from app code
    window.addEventListener('app-loader:done', hide, { once: true });
    window.appLoaderDone = window.appLoaderDone || hide;
    // Fallback: hide when window is fully loaded
    window.addEventListener('load', function(){ setTimeout(hide, 150); }, { once: true });
  } catch (e) {
    // Silent; loader is best-effort
    console && console.warn && console.warn('loader init failed', e);
  }
})();

