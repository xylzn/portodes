// Smooth hero photo swapping + post-transition balloon messages
(function () {
  function $(id){ return document.getElementById(id); }

  function preload(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(); return; }
      var img = new Image();
      img.onload = function () { resolve(src); };
      img.onerror = function () { resolve(src); };
      img.src = src;
    });
  }

  function showMessages(messages, opts) {
    opts = opts || {}; var wrap = $('hero-photo-wrap');
    if (!wrap || !messages || !messages.length) return;
    var delay = opts.delay != null ? opts.delay : 150; // before first bubble
    var gap = opts.gap != null ? opts.gap : 500;       // time between bubbles

    var i = 0;
    function next() {
      if (i >= messages.length) return;
      var bubble = document.createElement('div');
      bubble.className = 'hero-msg';
      bubble.textContent = messages[i++];
      wrap.appendChild(bubble);
      // Waktu tampil mengikuti durasi animasi CSS
      var dur = 1600;
      try {
        var cs = window.getComputedStyle(bubble);
        if (cs && cs.animationDuration) {
          var m = cs.animationDuration.match(/([\d.]+)s/);
          if (m) dur = parseFloat(m[1]) * 1000;
        }
      } catch (e) {}
      setTimeout(function () { try { bubble.remove(); } catch(e){} next(); }, dur + gap);
    }
    setTimeout(next, delay);
  }

  function showBubble(text, opts) {
    opts = opts || {}; var wrap = $('hero-photo-wrap');
    if (!wrap || !text) return;
    var anchor = opts.anchor || 'tr';
    var delay = opts.delay != null ? opts.delay : 150;
    setTimeout(function(){
      var bubble = document.createElement('div');
      bubble.className = 'hero-msg' + (anchor === 'tl' ? ' hero-msg--tl' : '');
      bubble.textContent = text;
      wrap.appendChild(bubble);
      // auto remove after CSS duration
      var dur = 3200;
      try { var cs = window.getComputedStyle(bubble); if (cs && cs.animationDuration) { var m = cs.animationDuration.match(/([\d.]+)s/); if (m) dur = parseFloat(m[1]) * 1000; } } catch(e){}
      setTimeout(function(){ try { bubble.remove(); } catch(e){} }, dur + 50);
    }, delay);
  }

  function swapTo(newSrc, opts) {
    opts = opts || {};
    var wrap = $('hero-photo-wrap');
    var img = $('hero-photo');
    if (!wrap || !img || !newSrc) return Promise.resolve();
    var messages = opts.messages || null;
    var showAt = opts.showAt || 'end'; // 'start' | 'end'

    return preload(newSrc).then(function () {
      var clone = img.cloneNode(false);
      clone.removeAttribute('id');
      clone.className = (img.className || '') + ' hero-reveal-clone';
      clone.src = newSrc;
      wrap.appendChild(clone);

      // Start mask reveal on the next frame (base image stays visible, no opacity/scale change)
      requestAnimationFrame(function(){
        try { img.style.transform = 'none'; clone.style.transform = 'none'; } catch(e){}
        if (messages && messages.length && showAt === 'start') { showMessages(messages); }
        // Also show a left-top bubble 'hoii!' as requested
        showBubble('hoii!', { anchor: 'tl', delay: 120 });
        clone.classList.add('revealed');
      });

      return new Promise(function (resolve) {
        var done = false;
        function finish(){
          if (done) return; done = true;
          try { img.src = newSrc; } catch(e){}
          try { clone.remove(); } catch(e){}
          if (messages && messages.length && showAt !== 'start') showMessages(messages);
          resolve();
        }
        clone.addEventListener('transitionend', finish, { once: true });
        setTimeout(finish, 900); // safety
      });
    });
  }

  function attachInteractionSwap(next, greet) {
    var img = $('hero-photo');
    if (!img) return;
    var armed = false;
    function deriveNext() {
      if (next) return next;
      var current = img.getAttribute('src') || '';
      var alt1 = current.replace(/\(\s*2\s*\)/, '(1)');
      var alt2 = current.replace(/2(\.[a-zA-Z0-9]+)$/,'1$1');
      return alt1 !== current ? alt1 : (alt2 !== current ? alt2 : null);
    }
    function go() {
      if (armed) return; armed = true;
      var target = deriveNext();
      var msgs = greet && greet.length ? greet : ['haii'];
      if (target) {
        swapTo(target, { messages: msgs, showAt: 'start' });
      } else {
        // Jika tidak ada target, tetap tampilkan bubble agar ada respon
        showMessages(msgs);
      }
      // Lepas semua listener setelah sekali jalan
      detach();
    }
    function detach() {
      try {
        window.removeEventListener('wheel', go);
        window.removeEventListener('scroll', go);
        window.removeEventListener('pointerdown', go);
        window.removeEventListener('touchstart', go);
        var icons = document.getElementById('hero-icons') || document.getElementById('icons-layer');
        if (icons) {
          icons.removeEventListener('pointerdown', go);
          icons.removeEventListener('touchstart', go);
        }
      } catch (e) {}
    }
    // Pasang listener (sekali jalan)
    var icons = document.getElementById('hero-icons') || document.getElementById('icons-layer');
    if (icons) {
      icons.addEventListener('pointerdown', go, { once: true });
      icons.addEventListener('touchstart', go, { once: true, passive: true });
    }
    window.addEventListener('wheel', go, { once: true, passive: true });
    window.addEventListener('scroll', go, { once: true, passive: true });
    window.addEventListener('pointerdown', go, { once: true });
    window.addEventListener('touchstart', go, { once: true, passive: true });
  }

  function initFromConfig() {
    var cfg = (window.APP_CONFIG && window.APP_CONFIG.HERO) || {};
    var initial = cfg.PHOTO || cfg.photo || '';
    var greet = cfg.MESSAGES || cfg.GREETINGS || null;
    var next = cfg.NEXT_PHOTO || cfg.SECONDARY || null;
    var img = $('hero-photo');
    if (!img) return;
    // Jika sudah punya src, cukup pasang trigger interaksi dan selesai
    if (img.getAttribute('src')) { attachInteractionSwap(next, greet); return; }
    // Set a tiny fade-in on first load
    preload(initial).then(function(){
      img.style.opacity = '0';
      img.src = initial;
      requestAnimationFrame(function(){
        setTimeout(function(){ img.style.opacity = '1'; attachInteractionSwap(next, greet); }, 30);
      });
    });
  }

  function start() {
    function afterLoader(){ initFromConfig(); }
    if (window.AppLoader && window.AppLoader.ready && typeof window.AppLoader.ready.then === 'function') {
      window.AppLoader.ready.then(afterLoader);
    } else if (window.APP_LOADER_DONE) {
      afterLoader();
    } else {
      window.addEventListener('app-loader:done', afterLoader, { once: true });
      window.addEventListener('load', afterLoader, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Expose API
  window.HeroPhoto = {
    swapTo: swapTo,
    showMessages: showMessages,
    showBubble: showBubble
  };
})();
