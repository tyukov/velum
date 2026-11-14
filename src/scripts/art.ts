// Рисунки товаров на холстах <canvas data-art>: на главной, в каталоге и на странице товара.
// Перерисовываем при изменении размера (ResizeObserver) и после каждого перехода по сайту.
import { paintArt } from "../lib/product-art";

let resize: ResizeObserver | undefined;

export function paint(canvas: HTMLCanvasElement) {
  if (!canvas.clientWidth || !canvas.clientHeight) return;
  const d = canvas.dataset;
  paintArt(canvas, { kind: d.kind, model: d.model, color: d.color, wash: d.wash !== "false" });
}

function initArt() {
  resize?.disconnect();
  const canvases = document.querySelectorAll<HTMLCanvasElement>("canvas[data-art]");
  if (!canvases.length) return;
  resize = new ResizeObserver((entries) =>
    entries.forEach((e) => paint(e.target as HTMLCanvasElement)),
  );
  canvases.forEach((c) => resize!.observe(c));
}

document.addEventListener("astro:page-load", initArt);
document.addEventListener("astro:before-swap", () => resize?.disconnect());
