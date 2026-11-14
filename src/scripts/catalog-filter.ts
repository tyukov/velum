// Фильтры и сортировка моделей в разделе каталога (всё на странице, без перезагрузки)
function initFilter() {
  const root = document.querySelector<HTMLElement>("[data-filter]");
  if (!root) return;
  const grid = root.querySelector<HTMLElement>(".model-grid")!;
  const cards = [...grid.querySelectorAll<HTMLElement>(".model-card")];
  const count = root.querySelector<HTMLElement>("[data-count]")!;
  const empty = root.querySelector<HTMLElement>(".cat-empty")!;

  const checked = (name: string) =>
    [...root.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map(
      (i) => i.value,
    );

  const apply = () => {
    const stock = checked("stock");
    const type = checked("type");
    const color = checked("color");
    let shown = 0;
    for (const card of cards) {
      const d = card.dataset;
      const ok =
        (!stock.length || stock.includes(d.stock!)) &&
        (!type.length || type.includes(d.type!)) &&
        (!color.length || color.some((c) => d.colors!.split(" ").includes(c)));
      card.hidden = !ok;
      if (ok) shown++;
    }
    count.textContent = String(shown);
    empty.hidden = shown > 0;
  };

  const sort = (by: string) => {
    root
      .querySelectorAll<HTMLButtonElement>("[data-sort]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sort === by)));
    const key = (c: HTMLElement) => Number(by === "price" ? c.dataset.price : c.dataset.order);
    cards.sort((a, b) => key(a) - key(b) || Number(a.dataset.order) - Number(b.dataset.order));
    grid.append(...cards);
  };

  root.addEventListener("change", apply);
  root
    .querySelectorAll<HTMLButtonElement>("[data-sort]")
    .forEach((b) => b.addEventListener("click", () => sort(b.dataset.sort!)));
  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    root.querySelectorAll<HTMLInputElement>("input:checked").forEach((i) => (i.checked = false));
    apply();
  });
}

document.addEventListener("astro:page-load", initFilter);
