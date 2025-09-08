// Draggable icons overlay with entrance animation behind profile, ring out, then parallax
// Idempotent: calling multiple times won't duplicate

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }

export function initDragIcons(container, logos = []) {
  if (!container) return;
  if (container.dataset && container.dataset.draggableInit === '1') return;
  container.dataset.draggableInit = '1';

  const parent = container; // absolute overlay spanning hero
  parent.style.pointerEvents = 'none';
  parent.style.zIndex = '0'; // keep behind profile

  const isDesktop = () => window.innerWidth >= 1024;
  const iconSize = () => (isDesktop() ? 112 : 88); // bigger icons

  const items = Array.isArray(logos) && logos.length ? logos.slice(0, 10) : [];
  const wrappers = [];

  function getProfileCenter(){
    const pr = parent.getBoundingClientRect();
    const ph = document.getElementById('hero-photo-wrap');
    if (!ph) return { cx: pr.width/2, cy: pr.height/2, r: Math.min(pr.width, pr.height)/4 };
    const r = ph.getBoundingClientRect();
    const cx = (r.left - pr.left) + r.width/2;
    const cy = (r.top - pr.top) + r.height/2;
    const radius = Math.min(r.width, r.height)/2 + 24; // ring just outside photo
    return { cx, cy, r: radius };
  }

  let pc = getProfileCenter();

  function makeIcon(info, idx) {
    const size = iconSize();
    const wrap = document.createElement('div');
    wrap.className = 'absolute';
    wrap.style.willChange = 'transform,left,top';
    wrap.style.pointerEvents = 'none';
    wrap.style.zIndex = '0';

    const el = document.createElement('div');
    el.className = 'drag-icon-glow';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.display = 'inline-block';
    el.style.cursor = 'grab';
    el.style.userSelect = 'none';
    el.style.transition = 'transform .15s ease, filter .15s ease';
    el.style.pointerEvents = 'auto';

    const img = document.createElement('img');
    img.alt = info?.name || 'Logo';
    img.draggable = false;
    img.src = info?.src || '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    el.appendChild(img);

    // Entrance from center behind the profile
    const angle = (idx / Math.max(1, items.length)) * Math.PI * 2;
    const pr = parent.getBoundingClientRect();
    const startL = pc.cx - size/2;
    const startT = pc.cy - size/2;
    let endL = pc.cx + pc.r * Math.cos(angle) - size/2;
    let endT = pc.cy + pc.r * Math.sin(angle) - size/2;
    endL = clamp(endL, 8, pr.width - size - 8);
    endT = clamp(endT, 8, pr.height - size - 8);
    wrap.style.left = `${startL}px`; wrap.style.top = `${startT}px`;

    // Hover
    el.addEventListener('pointerenter', () => { el.style.transform = 'scale(1.12)'; });
    el.addEventListener('pointerleave', () => { el.style.transform = 'scale(1)'; });

    // Drag anchored (no jump), freeze parallax while dragging
    let dragging = false, offX = 0, offY = 0;
    const onDown = (e) => {
      try { window.dispatchEvent(new CustomEvent('icons-drag')); } catch(_) {}
      dragging = true; obj.dragging = true; el.style.cursor='grabbing';
      obj.tX = obj.cX = 0; obj.tY = obj.cY = 0; wrap.style.transform = 'translate3d(0,0,0)';
      const rct = wrap.getBoundingClientRect();
      const sx = e.touches ? e.touches[0].clientX : e.clientX;
      const sy = e.touches ? e.touches[0].clientY : e.clientY;
      offX = sx - rct.left; offY = sy - rct.top;
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    };
    const onMove = (e) => {
      if (!dragging) return; if (e.cancelable) e.preventDefault();
      const pr = parent.getBoundingClientRect();
      const cxp = e.touches ? e.touches[0].clientX : e.clientX;
      const cyp = e.touches ? e.touches[0].clientY : e.clientY;
      const newL = clamp(cxp - pr.left - offX, 8, pr.width - size - 8);
      const newT = clamp(cyp - pr.top - offY, 8, pr.height - size - 8);
      wrap.style.left = `${newL}px`; wrap.style.top = `${newT}px`;
    };
    const onUp = () => {
      if (!dragging) return; dragging = false; obj.dragging = false; el.style.cursor='grab';
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('touchstart', onDown, { passive: true });

    parent.appendChild(wrap); wrap.appendChild(el);

    const obj = { wrap, el, dragging: false, ampX: (Math.random()*2-1)*20, ampY: (Math.random()*2-1)*24, tX:0, tY:0, cX:0, cY:0, startL, startT, endL, endT, animDone: false };
    wrappers.push(obj);
  }

  items.forEach(makeIcon);

  function updateParallax(){
    const rct = parent.getBoundingClientRect();
    const delta = (rct.top + rct.height/2) - (window.innerHeight/2);
    const factor = -delta * 0.04;
    wrappers.forEach(obj => { obj.tX = obj.ampX * factor; obj.tY = obj.ampY * factor; });
  }

  const START_DELAY = 2000; // ms delay before icons emerge
  const ENTRANCE_MS = 900;
  const startAt = performance.now();
  let raisedZ = false;

  function tick(now){
    const elapsed = now - startAt;
    // After delay, raise z-index so icons are interactable (no longer behind photo)
    if (!raisedZ && elapsed >= START_DELAY) { parent.style.zIndex = '20'; raisedZ = true; }

    wrappers.forEach(obj => {
      // entrance animation from center to ring after delay
      if (!obj.animDone) {
        if (elapsed < START_DELAY) {
          // keep at center, behind photo
          obj.wrap.style.left = `${obj.startL}px`;
          obj.wrap.style.top  = `${obj.startT}px`;
        } else {
          const t = Math.min(1, (elapsed - START_DELAY) / ENTRANCE_MS);
          const k = easeOutCubic(t);
          const left = obj.startL + (obj.endL - obj.startL) * k;
          const top  = obj.startT + (obj.endT - obj.startT) * k;
          obj.wrap.style.left = `${left}px`;
          obj.wrap.style.top  = `${top}px`;
          if (t >= 1) obj.animDone = true;
        }
      }
      // parallax drift unless dragging
      if (!obj.dragging) {
        obj.cX += (obj.tX - obj.cX) * 0.08;
        obj.cY += (obj.tY - obj.cY) * 0.08;
        obj.wrap.style.transform = `translate3d(${obj.cX.toFixed(2)}px, ${obj.cY.toFixed(2)}px, 0)`;
      }
    });
    requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  window.addEventListener('resize', () => {
    const size = `${iconSize()}px`;
    wrappers.forEach(obj => { obj.el.style.width = size; obj.el.style.height = size; });
    // recompute profile center & radius for future entrance (no reset current pos)
    pc = getProfileCenter();
    updateParallax();
  });
  updateParallax(); requestAnimationFrame(tick);
}
