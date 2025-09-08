export function GalleryItem(item, onClick) {
  const { title, image, link, width, height } = item;
  const a = document.createElement("a");
  a.className = "block rounded-xl bg-slate-900 border border-white/10 overflow-hidden hover:border-white/20";
  a.href = link || "#";
  a.target = link ? "_blank" : "_self";
  if (!link) {
    a.addEventListener("click", (e) => { e.preventDefault(); onClick?.(item); });
  }

  const ratioStyle = (width && height) ? `style=\"aspect-ratio:${width}/${height}\"` : 'style="aspect-ratio:4/3"';
  a.innerHTML = `
    <div class="relative w-full bg-white/5" ${ratioStyle}>
      ${image ? `<img data-role="thumb" src="${image}" alt="${title}" class="absolute inset-0 w-full h-full object-contain" loading="lazy" />` : ""}
    </div>
    <div class="p-3">
      <div class="text-sm font-medium line-clamp-1">${title}</div>
    </div>
  `;

  const imgEl = a.querySelector('img[data-role="thumb"]');
  if (imgEl) {
    imgEl.addEventListener('error', () => {
      if (!imgEl.dataset.fallback) {
        imgEl.dataset.fallback = '1';
        imgEl.src = `/api/file/image/${item.id}`;
      }
    });
  }
  return a;
}

