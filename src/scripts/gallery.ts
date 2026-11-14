// Просмотр фото «Наших работ»: <dialog> поверх страницы, листание стрелками, клавишами и свайпом.
function initGallery() {
  const root = document.querySelector<HTMLElement>("[data-gallery]");
  const dialog = document.querySelector<HTMLDialogElement>("dialog.lightbox");
  if (!root || !dialog) return;
  const items = [...root.querySelectorAll<HTMLButtonElement>(".works__open")];
  const img = dialog.querySelector<HTMLImageElement>(".lightbox__img")!;
  const count = dialog.querySelector<HTMLElement>(".lightbox__count")!;
  let index = 0;

  const show = (i: number) => {
    index = (i + items.length) % items.length;
    const item = items[index]!;
    img.src = item.dataset.full!;
    img.alt = item.dataset.alt ?? "";
    count.textContent = `${index + 1} / ${items.length}`;
    // Следующее фото подгружаем заранее, чтобы листание было без задержки
    const next = items[(index + 1) % items.length]!.dataset.full;
    if (next) new Image().src = next;
  };

  items.forEach((item, i) =>
    item.addEventListener("click", () => {
      show(i);
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }),
  );
  dialog.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    items[index]?.focus();
  });
  dialog.querySelector(".lightbox__close")!.addEventListener("click", () => dialog.close());
  dialog.querySelector(".lightbox__prev")!.addEventListener("click", () => show(index - 1));
  dialog.querySelector(".lightbox__next")!.addEventListener("click", () => show(index + 1));
  // Нажатие на тёмный фон (не на фото и не на кнопки) закрывает просмотр
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  let startX = 0;
  let startY = 0;
  dialog.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0]!.clientX;
      startY = e.touches[0]!.clientY;
    },
    { passive: true },
  );
  dialog.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0]!.clientX - startX;
    const dy = e.changedTouches[0]!.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    // Свайп вниз закрывает, как в галерее телефона
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) dialog.close();
  });
}

// Стрелки у ленты: прокрутка на одну карточку, на краях стрелка неактивна
function initStrip() {
  const strip = document.querySelector<HTMLElement>("[data-gallery]");
  const arrows = document.querySelectorAll<HTMLButtonElement>(".works__arrow");
  if (!strip || !arrows.length) return;
  const update = () => {
    const max = strip.scrollWidth - strip.clientWidth - 2;
    arrows.forEach((b) => {
      b.disabled = b.dataset.scroll === "-1" ? strip.scrollLeft <= 2 : strip.scrollLeft >= max;
    });
  };
  arrows.forEach((b) =>
    b.addEventListener("click", () => {
      const card = strip.querySelector<HTMLElement>(".works__item");
      const step = (card?.offsetWidth ?? strip.clientWidth) + 20;
      strip.scrollBy({ left: Number(b.dataset.scroll) * step, behavior: "smooth" });
    }),
  );
  strip.addEventListener("scroll", update, { passive: true });
  update();
}

document.addEventListener("astro:page-load", () => {
  initGallery();
  initStrip();
});
// Перед переходом на другую страницу закрываем просмотр, чтобы не осталась блокировка прокрутки
document.addEventListener("astro:before-swap", () => {
  document.querySelector<HTMLDialogElement>("dialog.lightbox[open]")?.close();
  document.documentElement.style.overflow = "";
});
