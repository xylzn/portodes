export function ProjectCard(project, onClick) {
  const { title, description, image, tags, width, height } = project;
  const container = document.createElement("article");
  container.className = "group rounded-xl bg-slate-900 border border-white/10 overflow-hidden hover:border-white/20 transition-colors cursor-pointer";
  container.tabIndex = 0;
  container.addEventListener("click", () => onClick?.(project));
  container.addEventListener("keypress", (e) => { if (e.key === "Enter") onClick?.(project); });

  const ratioStyle = (width && height) ? `style=\"aspect-ratio:${width}/${height}\"` : 'style="aspect-ratio:4/3"';
  const mediaHtml = image
    ? `<div class=\"relative w-full bg-white/5\" ${ratioStyle}>
         <img data-role=\"thumb\" src=\"${image}\" alt=\"${title}\" class=\"absolute inset-0 w-full h-full object-contain\" loading=\"lazy\" />
       </div>`
    : `<div class=\"w-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 ring-1 ring-white/10\" ${ratioStyle}></div>`;

  container.innerHTML = `
    ${mediaHtml}
    <div class="p-4">
      <h3 class="font-semibold text-lg leading-snug">${title}</h3>
      <p class="mt-1 text-sm text-slate-400 line-clamp-2">${description || ""}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        ${(Array.isArray(tags) ? tags : []).slice(0, 4).map(t => `<span class=\"px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10\">${t}</span>`).join("")}
      </div>
    </div>
  `;

  // Fallback: jika thumbnail gagal, coba stream image asli
  const imgEl = container.querySelector('img[data-role="thumb"]');
  if (imgEl) {
    imgEl.addEventListener('error', () => {
      if (!imgEl.dataset.fallback) {
        imgEl.dataset.fallback = '1';
        imgEl.src = `/api/file/image/${project.id}`;
      }
    });
  }
  return container;
}

