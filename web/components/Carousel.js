export function createCarousel(items = []) {
  const root = document.createElement("div");
  root.className = "relative";

  const track = document.createElement("div");
  track.className = "flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2";
  track.setAttribute("role", "list");

  items.forEach((node) => {
    const wrap = document.createElement("div");
    wrap.className = "snap-start shrink-0 w-64";
    wrap.appendChild(node);
    track.appendChild(wrap);
  });

  const btnClass = "absolute top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10";
  const prev = document.createElement("button");
  prev.className = `${btnClass} left-0`; prev.innerText = "‹"; prev.ariaLabel = "Sebelumnya";
  const next = document.createElement("button");
  next.className = `${btnClass} right-0`; next.innerText = "›"; next.ariaLabel = "Berikutnya";

  function scrollBy(dir) {
    const cardWidth = 260; // approx width + gap
    track.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
  }
  prev.addEventListener("click", () => scrollBy(-1));
  next.addEventListener("click", () => scrollBy(1));

  root.appendChild(prev);
  root.appendChild(track);
  root.appendChild(next);
  return { root, track };
}

