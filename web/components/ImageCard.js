export function ImageCard(project, onClick) {
  const { id, title, image, width, height } = project;
  const card = document.createElement("article");
  card.className = "mb-6 break-inside-avoid rounded-xl bg-slate-900 border border-white/10 overflow-hidden hover:border-white/20 transition-colors cursor-pointer";
  card.tabIndex = 0;
  card.addEventListener("click", () => onClick?.(project));
  card.addEventListener("keypress", (e) => { if (e.key === "Enter") onClick?.(project); });

  const ratioStyle = (width && height) ? `style=\"aspect-ratio:${width}/${height}\"` : 'style="aspect-ratio:4/3"';
  card.innerHTML = `
    <div class="relative w-full bg-white/5" ${ratioStyle}>
      ${image ? `<img data-role="thumb" src="${image}" alt="${title}" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />` : ""}
    </div>
  `;

  const imgEl = card.querySelector('img[data-role="thumb"]');
  if (imgEl) {
    imgEl.addEventListener('error', () => {
      if (!imgEl.dataset.fallback) {
        imgEl.dataset.fallback = '1';
        imgEl.src = `/api/file/image/${id}`;
      }
    });
  }
  return card;
}

