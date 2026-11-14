// Главная: показ частей дома по очереди, рисунки товаров на холстах и мини-калькулятор крыши.
// Сайт переходит между страницами без перезагрузки, поэтому всё подключаем на astro:page-load.
import { paintArt } from "../lib/product-art";

const TOUR_MS = 2600;
let tour: ReturnType<typeof setInterval> | undefined;
let resize: ResizeObserver | undefined;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function paint(canvas: HTMLCanvasElement) {
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

function initHero() {
  clearInterval(tour);
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;
  const buttons = [...hero.querySelectorAll<HTMLButtonElement>(".hero__part")];
  const ids = buttons.map((b) => b.dataset.part!);
  const house = hero.querySelector<SVGGElement>(".la");

  const show = (id: string) => {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.part === id)));
    house?.setAttribute("data-active", id);
    hero.querySelectorAll<HTMLElement>("[data-card]").forEach((card) => {
      card.hidden = card.dataset.card !== id;
      if (!card.hidden) card.querySelectorAll<HTMLCanvasElement>("canvas[data-art]").forEach(paint);
    });
  };
  const choose = (id: string) => {
    clearInterval(tour);
    show(id);
  };

  buttons.forEach((b) => b.addEventListener("click", () => choose(b.dataset.part!)));
  house?.addEventListener("click", (e) => {
    const part = (e.target as Element).closest<SVGElement>("[data-part]")?.dataset.part;
    if (part && ids.includes(part)) choose(part);
  });

  if (!reducedMotion()) {
    let i = 0;
    tour = setInterval(() => {
      // не листаем, пока вкладка скрыта или первый экран прокручен
      if (document.hidden || hero.getBoundingClientRect().bottom < 0) return;
      i = (i + 1) % ids.length;
      show(ids[i]!);
    }, TOUR_MS);
    hero.addEventListener("pointerdown", () => clearInterval(tour), { once: true });
    hero.addEventListener("focusin", () => clearInterval(tour), { once: true });
  }
}

const money = (n: number) => `≈ ${new Intl.NumberFormat("ru-RU").format(n).replace(/\s/g, " ")} ₸`;

function initCalc() {
  const box = document.querySelector<HTMLElement>("[data-hcalc]");
  if (!box) return;
  const area = box.querySelector<HTMLInputElement>("[data-area]")!;
  const sheet = box.querySelector<HTMLElement>("[data-sheet]")!;
  const total = box.querySelector<HTMLElement>("[data-total]")!;

  const update = () => {
    const a = Math.min(5000, Math.max(0, Number(area.value) || 0));
    const price =
      Number(box.querySelector<HTMLInputElement>('input[name="hcalc-model"]:checked')?.value) || 0;
    const s = Math.ceil(a * 1.1);
    sheet.textContent = String(s);
    total.textContent = money(s * price);
  };
  box.addEventListener("input", update);
  box.addEventListener("change", update);
  box.querySelectorAll<HTMLButtonElement>("[data-step]").forEach((b) =>
    b.addEventListener("click", () => {
      area.value = String(
        Math.min(5000, Math.max(1, (Number(area.value) || 0) + Number(b.dataset.step))),
      );
      update();
    }),
  );
  update();
}

document.addEventListener("astro:page-load", () => {
  initArt();
  initHero();
  initCalc();
});
document.addEventListener("astro:before-swap", () => {
  clearInterval(tour);
  resize?.disconnect();
});
