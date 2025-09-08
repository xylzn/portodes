// Inject Follow Me UI: desktop button with dropdown, mobile centered icons
(function(){
  function h(tag, attrs, children){
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k){
      if (k === 'class') el.className = attrs[k];
      else if (k === 'id') el.id = attrs[k];
      else if (k === 'style') el.setAttribute('style', attrs[k]);
      else el.setAttribute(k, attrs[k]);
    });
    (children||[]).forEach(function(c){ el.appendChild(typeof c==='string'?document.createTextNode(c):c); });
    return el;
  }

  function getSocials(){
    var cfg = (window.APP_CONFIG && window.APP_CONFIG.SOCIALS) || [];
    if (cfg.length) return cfg;
    // Fallback minimal
    return [
      { name: 'Instagram', url: '#', icon: 'assets/logos/Instagram.png' },
      { name: 'TikTok', url: '#', icon: 'assets/logos/TikTok.png' },
      { name: 'Pinterest', url: '#', icon: 'assets/logos/pinterest.png' }
    ];
  }

  function extractHandle(url){
    try {
      if (!url) return '';
      var u = url.toString();
      var at = u.split('@');
      if (at.length > 1) return '@' + at[1].replace(/\/$/, '');
      var parts = u.split('/').filter(Boolean);
      var last = parts[parts.length - 1] || '';
      if (last) return (last.startsWith('@')? last : '@'+last);
    } catch(e) {}
    return '';
  }

  function buildDesktopArea(socials){
    var area = h('div', { id: 'follow-area' }, []);
    var btn = h('button', { id: 'follow-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, [document.createTextNode('Follow Me')]);
    var menu = h('div', { id: 'follow-menu', role: 'menu' }, []);
    socials.forEach(function(s){
      var item = h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', class: 'follow-item', title: s.name, role: 'menuitem' }, []);
      var iconWrap = h('span', { class: 'follow-icon' }, []);
      if (s.icon) iconWrap.appendChild(h('img', { src: s.icon, alt: s.name }));
      else iconWrap.appendChild(h('span', null, [s.name[0] || '?']));
      var handle = s.handle || extractHandle(s.url) || s.name || '';
      var label = h('span', { class: 'handle' }, [handle]);
      item.appendChild(iconWrap); item.appendChild(label);
      menu.appendChild(item);
    });
    area.appendChild(btn); area.appendChild(menu);
    // Click toggle (for devices without hover)
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = area.classList.toggle('open');
      btn.setAttribute('aria-expanded', open?'true':'false');
      document.addEventListener('click', function onDoc(){ area.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.removeEventListener('click', onDoc); }, { once: true });
    });
    area.addEventListener('mouseenter', function(){ btn.setAttribute('aria-expanded','true'); });
    area.addEventListener('mouseleave', function(){ btn.setAttribute('aria-expanded','false'); });
    return area;
  }

  function buildMobileCenter(socials){
    var wrap = h('div', { id: 'socials-mobile' }, []);
    socials.forEach(function(s){
      var a = h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', class: 'follow-icon', title: s.name }, []);
      if (s.icon) {
        a.appendChild(h('img', { src: s.icon, alt: s.name }));
      } else {
        a.appendChild(h('span', null, [s.name[0] || '?']));
      }
      wrap.appendChild(a);
    });
    return wrap;
  }

  function findHeaderHost(){
    // Prefer a container that includes the brand text or is a header bar
    var header = document.querySelector('header');
    var brand = null;
    var candidates = Array.prototype.slice.call(document.querySelectorAll('#brand,.brand,[data-brand], header a, header h1, header h2, header .logo, a, h1, h2'));
    for (var i=0;i<candidates.length;i++){
      var el = candidates[i];
      try {
        var t = (el.textContent||'').trim().toLowerCase();
        if (t && (t === 'baboii' || t === 'baboii.' || t.indexOf('baboii') !== -1)) { brand = el; break; }
      } catch(e){}
    }
    var host = null;
    if (brand) {
      host = brand.closest('header') || brand.parentElement;
    }
    if (!host) host = header || document.querySelector('#topbar') || document.querySelector('.topbar');
    return host;
  }

  function start(){
    var host = findHeaderHost();
    var socials = getSocials();
    var desktop = buildDesktopArea(socials);
    var mobile = buildMobileCenter(socials);
    // Remove any existing instances to avoid duplicates on HMR
    var oldDesk = document.getElementById('follow-area'); if (oldDesk && oldDesk.parentNode) oldDesk.parentNode.removeChild(oldDesk);
    var oldMob = document.getElementById('socials-mobile'); if (oldMob && oldMob.parentNode) oldMob.parentNode.removeChild(oldMob);
    if (host) {
      host.classList.add('header-follow-host');
      host.appendChild(desktop);
      host.appendChild(mobile);
      // Match right margin to brand's left padding/offset
      try {
        function computePad(){
          var pad = 12; // fallback px
          var cs = window.getComputedStyle(host);
          var pl = parseFloat(cs && cs.paddingLeft ? cs.paddingLeft : '0') || 0;
          pad = pl || pad;
          // try find brand element with "Baboii"
          var brandEl = null;
          var nodes = host.querySelectorAll('*');
          for (var i=0;i<nodes.length;i++){
            var t = (nodes[i].textContent||'').trim().toLowerCase();
            if (!t) continue;
            if (t === 'baboii' || t === 'baboii.' || t.indexOf('baboii') !== -1){ brandEl = nodes[i]; break; }
          }
          if (brandEl){
            var hb = host.getBoundingClientRect();
            var bb = brandEl.getBoundingClientRect();
            var off = Math.max(0, Math.round(bb.left - hb.left));
            if (off) pad = off;
          }
          host.style.setProperty('--header-xpad', pad + 'px');
        }
        computePad();
        window.addEventListener('resize', computePad);
      } catch(e){}
    } else {
      // Fallback: fixed overlay at top
      var overlay = h('div', { id: 'follow-overlay', style: 'position:fixed;inset:0 0 auto 0;height:56px;pointer-events:none;z-index:50;' }, []);
      var inner = h('div', { style: 'position:relative;max-width:1280px;margin:0 auto;height:100%;pointer-events:none;' }, []);
      desktop.style.pointerEvents = 'auto'; mobile.style.pointerEvents = 'auto';
      inner.appendChild(desktop); inner.appendChild(mobile); overlay.appendChild(inner); document.body.appendChild(overlay);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
