import { api, normalizeProject } from "./api.js";
import { ProjectCard } from "./components/Card.js";
import { ImageCard } from "./components/ImageCard.js";
import { createCarousel } from "./components/Carousel.js";
import { GalleryItem } from "./components/GalleryItem.js";
import { initDragIcons } from "./drag-icons.js";

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function setYear() { const y = $("#year"); if (y) y.textContent = new Date().getFullYear(); }

function initNav() {
  // Smooth scroll for anchor links
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function initHero() {
  const cfg = window.APP_CONFIG?.HERO || {};
  const nameEl = $("#hero-name");
  const roleEl = $("#hero-role");
  const photoEl = $("#hero-photo");
  if (nameEl && cfg.NAME) nameEl.textContent = cfg.NAME;
  if (roleEl && cfg.ROLE) roleEl.textContent = cfg.ROLE;
  if (photoEl) {
    const initialSrc = cfg.PHOTO || "assets/profile (2).png";
    const altSrc = "assets/profile (1).png";
    photoEl.dataset.initSrc = initialSrc;
    photoEl.dataset.altSrc = altSrc;
    photoEl.src = initialSrc;
    photoEl.addEventListener("error", () => {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='#06b6d4'/><stop offset='1' stop-color='#312e81'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`;
      photoEl.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }, { once: true });

    const fadeSwap = (nextSrc) => {
      if (!photoEl || photoEl.dataset.swapped === '1') return;
      photoEl.dataset.swapped = '1';
      const onFadeOut = () => {
        photoEl.removeEventListener('transitionend', onFadeOut);
        photoEl.src = nextSrc;
        // force reflow then fade in
        void photoEl.offsetWidth;
        photoEl.style.opacity = '1';
      };
      // begin fade out
      photoEl.addEventListener('transitionend', onFadeOut);
      photoEl.style.opacity = '0';
      detach();
    };
    const onFirstScroll = () => {
      if (window.scrollY > 8) fadeSwap(altSrc);
    };
    const onFirstDragIcon = () => fadeSwap(altSrc);
    const detach = () => {
      window.removeEventListener('scroll', onFirstScroll);
      document.removeEventListener('click', onFirstClick);
      window.removeEventListener('icons-drag', onFirstDragIcon);
    };
    window.addEventListener('scroll', onFirstScroll, { passive: true });
    window.addEventListener('icons-drag', onFirstDragIcon, { once: true });
  }
}

async function loadLatest() {
  const grid = $("#projects-grid");
  const empty = $("#projects-empty");
  if (!grid) return;
  grid.innerHTML = "";
  try {
    const list = (await api.getLatest(24)).map(normalizeProject).filter(Boolean);
    if (!list.length) { if (empty) empty.classList.remove("hidden"); return; }
    if (empty) empty.classList.add("hidden");
    const frag = document.createDocumentFragment();
    list.forEach((p) => frag.appendChild(ImageCard(p, openModal)));
    grid.appendChild(frag);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="col-span-full text-center text-slate-400">Gagal memuat projects. <code class="text-slate-300">${String(err.message || err)}</code></div>`;
  }
}

async function loadCategories() {
  const wrap = $("#categories-wrap");
  if (!wrap) return;
  wrap.innerHTML = "";
  let categories = [];
  try {
    categories = await api.getCategories();
  } catch (e) {
    console.error(e);
    wrap.innerHTML = `<div class="text-slate-400">Gagal memuat kategori: ${String(e.message || e)}</div>`;
    return;
  }
  if (!Array.isArray(categories) || !categories.length) {
    wrap.innerHTML = `<div class="text-slate-400">Belum ada kategori.</div>`;
    return;
  }

  for (const cat of categories) {
    const section = document.createElement("section");
    section.className = "space-y-3";
    const initials = (cat.name || "?").split(/\s+/).map(s => s[0]).join("").slice(0,2).toUpperCase();
    const header = document.createElement("div");
    header.className = "flex items-center gap-3";
    header.innerHTML = `
      <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 flex items-center justify-center font-bold text-cyan-200 ring-1 ring-white/10">${initials}</div>
      <h3 class="text-xl font-semibold">${cat.name}</h3>
    `;
    section.appendChild(header);

    const loading = document.createElement("div");
    loading.className = "text-slate-400";
    loading.textContent = "Memuat...";
    section.appendChild(loading);
    wrap.appendChild(section);

    try {
      const gallery = (await api.getGallery(cat.id)).map(normalizeProject).filter(Boolean);
      const items = gallery.slice(0, 12).map((g) => GalleryItem(g, openModal));
      const { root } = createCarousel(items);
      section.removeChild(loading);
      section.appendChild(root);
    } catch (e) {
      console.error(e);
      loading.textContent = `Gagal memuat galeri: ${String(e.message || e)}`;
    }
  }
}

function openModal(project) {
  const modal = $("#project-modal"); if (!modal) return;
  $("#modal-title").textContent = project.title;
  $("#modal-desc").textContent = project.description || "";
  const img = $("#modal-image");
  if (project.image) { img.src = project.image; img.classList.remove("hidden"); } else { img.classList.add("hidden"); }
  const tagWrap = $("#modal-tags");
  tagWrap.innerHTML = (Array.isArray(project.tags) ? project.tags : []).map(t => `<span class="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10">${t}</span>`).join("");
  const links = $("#modal-links");
  links.innerHTML = "";
  if (project.link) links.innerHTML += `<a class="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30" href="${project.link}" target="_blank">Live</a>`;
  if (project.repo) links.innerHTML += `<a class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10" href="${project.repo}" target="_blank">Repo</a>`;
  modal.classList.remove("hidden");
}

function wireModal() {
  const modal = $("#project-modal"); if (!modal) return;
  $all("[data-close]", modal).forEach((el) => el.addEventListener("click", () => modal.classList.add("hidden")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.add("hidden"); });
}

function wireContactForm() {
  const form = $("#contact-form"); const status = $("#contact-status");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); if (status) status.textContent = "Mengirim...";
    const payload = Object.fromEntries(new FormData(form).entries());
    try { await api.sendContact(payload); if (status) status.textContent = "Terkirim! Terima kasih."; form.reset(); }
    catch (err) { console.error(err); if (status) status.textContent = `Gagal mengirim: ${String(err.message || err)}`; }
  });
}

function syncIconsLayer() {
  const layer = $("#icons-layer"); const icons = $("#hero-icons"); const hero = $("#hero"); const header = document.querySelector("header");
  if (!layer || !hero) return;
  const h = Math.round(hero.getBoundingClientRect().height);
  layer.style.height = `${h}px`; layer.style.marginBottom = `-${h}px`;
  const headerH = header ? header.getBoundingClientRect().height : 64;
  if (icons) icons.style.top = `${headerH + 8}px`;
  const home = $("#home"); if (home) home.style.setProperty('--hero-h', `${h}px`);
}

function mountDragIconsOnce() {
  const el = $("#hero-icons");
  if (!el) return;
  if (el.dataset && el.dataset.draggableInit === '1') return;
  const logos = window.APP_CONFIG?.SKILLS_LOGOS || [];
  try { initDragIcons(el, logos); } catch (e) { console.error(e); }
}

function boot() {
  setYear(); initNav(); initHero();
  wireModal(); wireContactForm();
  loadLatest(); loadCategories();
  syncIconsLayer();
  // Hamburger wiring (HTML-driven)
  (function wireHamburger(){
    const burger = document.getElementById('burger');
    const menu = document.getElementById('nav-menu');
    if (!burger || !menu) return;
    const sync = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        menu.classList.remove('hidden');
        burger.classList.remove('burger-active');
      } else {
        menu.classList.add('hidden');
        burger.classList.remove('burger-active');
      }
    };
    burger.addEventListener('click', () => {
      burger.classList.toggle('burger-active');
      menu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (window.innerWidth >= 1024) return;
      if (!menu.contains(e.target) && !burger.contains(e.target)) {
        menu.classList.add('hidden');
        burger.classList.remove('burger-active');
      }
    });
    window.addEventListener('resize', sync);
    sync();
  })();
  window.addEventListener("resize", () => requestAnimationFrame(syncIconsLayer));
  const hp = $("#hero-photo"); if (hp) hp.addEventListener("load", () => setTimeout(syncIconsLayer, 0));
  setTimeout(syncIconsLayer, 300);
  mountDragIconsOnce();
}

window.addEventListener("DOMContentLoaded", boot);
