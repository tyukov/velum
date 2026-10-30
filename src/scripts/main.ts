// Модальные окна, маска телефона, FAQ и отправка заявок без перезагрузки.
// Сайт переходит между страницами без перезагрузки (ClientRouter): модуль выполняется один раз,
// а всё, что привязано к элементам страницы, подключается заново на событии astro:page-load.
import type { TransitionBeforePreparationEvent } from "astro:transitions/client";
import { formatPhone } from "../lib/phone";

// ---------- Cloudflare Turnstile (если на сайте задан ключ) ----------
// Скрипт Cloudflare загружается только при первом открытии формы, чтобы не замедлять страницу.
type Turnstile = {
  render: (el: HTMLElement, opts: { sitekey: string; language?: string }) => string;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let turnstileScript: Promise<Turnstile> | null = null;
function loadTurnstile(): Promise<Turnstile> {
  turnstileScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject());
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return turnstileScript;
}

function renderTurnstile(form: HTMLElement) {
  const box = form.querySelector<HTMLElement>(".turnstile[data-sitekey]");
  if (!box || box.dataset.widgetId) return;
  box.dataset.widgetId = "pending";
  loadTurnstile()
    .then((ts) => {
      box.dataset.widgetId = ts.render(box, { sitekey: box.dataset.sitekey!, language: "ru" });
    })
    .catch(() => delete box.dataset.widgetId);
}

function resetTurnstile(form: HTMLElement) {
  const id = form.querySelector<HTMLElement>(".turnstile")?.dataset.widgetId;
  if (id && id !== "pending") window.turnstile?.reset(id);
}

// ---------- Модальные окна ----------
// Разметка совместима со стилями: .blocker > .modal + a.close-modal
let current: { modal: HTMLElement; blocker: HTMLElement } | null = null;
let lastFocus: HTMLElement | null = null;

function openModal(modal: HTMLElement | null) {
  if (!modal) return;
  if (current) closeModal();
  lastFocus = document.activeElement as HTMLElement | null;

  const blocker = document.createElement("div");
  blocker.className = "jquery-modal blocker current";
  blocker.addEventListener("click", (e) => {
    if (e.target === blocker) closeModal();
  });

  if (!modal.querySelector(".close-modal")) {
    const close = document.createElement("a");
    close.href = "#close-modal";
    close.className = "close-modal";
    close.setAttribute("aria-label", "Закрыть");
    close.textContent = "Закрыть";
    close.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
    modal.appendChild(close);
  }

  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  blocker.appendChild(modal);
  document.body.appendChild(blocker);
  document.body.style.overflow = "hidden";
  modal.style.display = "inline-block";
  current = { modal, blocker };
  renderTurnstile(modal);

  modal.querySelector<HTMLElement>("input:not([type=hidden]):not(.honeypot), button")?.focus();
}

function closeModal() {
  if (!current) return;
  const { modal, blocker } = current;
  modal.style.display = "none";
  document.body.appendChild(modal);
  blocker.remove();
  document.body.style.overflow = "";
  current = null;
  lastFocus?.focus();
}

document.addEventListener("click", (e) => {
  const trigger = (e.target as Element).closest<HTMLAnchorElement>('a[rel~="modal:open"]');
  if (!trigger) return;
  e.preventDefault();
  openModal(document.querySelector<HTMLElement>(trigger.getAttribute("href") || "#ex2"));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// При переходе на другую страницу открытое окно закрываем, иначе тело страницы останется заблокированным
document.addEventListener("astro:before-swap", () => {
  current?.blocker.remove();
  current = null;
  document.body.style.overflow = "";
});

// ---------- Выбор характеристик товара без прыжка наверх ----------
// Покрытие, толщина, цвет и исполнение — ссылки на страницы вариантов. Обычно после перехода
// страница прокручивается наверх; при выборе в карточке товара оставляем прокрутку на месте.
let keepScrollY: number | null = null;

document.addEventListener("astro:before-preparation", (e: TransitionBeforePreparationEvent) => {
  keepScrollY = e.sourceElement?.closest(".picker") ? window.scrollY : null;
});

const restoreScroll = () => {
  if (keepScrollY !== null && window.scrollY !== keepScrollY)
    window.scrollTo({ top: keepScrollY, behavior: "instant" });
};
document.addEventListener("astro:after-swap", restoreScroll);
// Ещё раз после загрузки страницы: если стили подгрузились позже, высота страницы могла измениться
document.addEventListener("astro:page-load", () => {
  restoreScroll();
  keepScrollY = null;
});

// ---------- Маска телефона: +7 (999) 999-99-99 ----------
function initPhoneMasks() {
  document.querySelectorAll<HTMLInputElement>('input[type="tel"]').forEach((input) => {
    input.inputMode = "tel";
    input.autocomplete = "tel";
    input.pattern = "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}";
    input.title = "Номер в формате +7 (701) 000-00-00";
    input.addEventListener("focus", () => {
      if (!input.value) input.value = "+7 (";
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    });
    input.addEventListener("input", () => {
      input.value = formatPhone(input.value);
    });
    input.addEventListener("blur", () => {
      if (input.value.replace(/\D/g, "").length <= 1) input.value = "";
    });
  });
}

// ---------- FAQ ----------
function initFaq() {
  document.querySelectorAll<HTMLElement>(".faq-list__question").forEach((question) => {
    question.addEventListener("click", () => {
      const active = document.querySelector<HTMLElement>(".faq-list__question.active");
      if (active && active !== question) {
        active.classList.remove("active");
        (active.nextElementSibling as HTMLElement).style.maxHeight = "0";
      }
      question.classList.toggle("active");
      const answer = question.nextElementSibling as HTMLElement;
      answer.style.maxHeight = question.classList.contains("active")
        ? answer.scrollHeight + "px"
        : "0";
    });
  });
}

// ---------- Отправка заявок ----------
function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[action="/api/send"]').forEach((form) => {
    const page = document.createElement("input");
    page.type = "hidden";
    page.name = "page";
    page.value = location.pathname + location.search;
    form.appendChild(page);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = form.querySelector<HTMLButtonElement>('[type="submit"]');
      let status = form.querySelector<HTMLElement>(".form-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "form-status modal__box-text";
        status.setAttribute("role", "status");
        form.appendChild(status);
      }
      status.textContent = "Отправляем…";
      if (button) button.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error);
        form.reset();
        status.textContent = "Спасибо! Заявка отправлена, менеджер скоро перезвонит.";
      } catch (err) {
        status.textContent =
          (err instanceof Error && err.message) ||
          "Не удалось отправить заявку. Позвоните нам: 8 701 013 13 59";
      } finally {
        resetTurnstile(form);
        if (button) button.disabled = false;
      }
    });
  });
}

// ---------- Увеличение фото в галерее (библиотека грузится, только если есть галерея) ----------
let zoom: import("medium-zoom").Zoom | null = null;
async function initZoom() {
  zoom?.detach();
  if (!document.querySelector(".zoom")) return;
  if (!zoom) {
    const { default: mediumZoom } = await import("medium-zoom");
    zoom = mediumZoom({ margin: 50 });
  }
  zoom.attach(".zoom");
}

// ---------- Калькулятор стоимости в карточке товара ----------
// Площадь крыши × цена за м² с запасом на раскрой и нахлёсты. Площадь запоминаем на время визита,
// чтобы при смене покрытия или цвета не вводить её заново. Заявка уходит менеджеру с площадью и суммой.
const ROOF_RESERVE = 0.1;
const SMALL_ORDER_M2 = 50;
const AREA_KEY = "velum:roof-area";

const tenge = (n: number) => `${new Intl.NumberFormat("ru-RU").format(n).replace(/\s/g, " ")} ₸`;

const storage = {
  get: () => {
    try {
      return sessionStorage.getItem(AREA_KEY) ?? "";
    } catch {
      return "";
    }
  },
  set: (v: string) => {
    try {
      sessionStorage.setItem(AREA_KEY, v);
    } catch {
      // Приватный режим: просто не запоминаем
    }
  },
};

function initCalc() {
  const calc = document.querySelector<HTMLElement>(".calc");
  const input = calc?.querySelector<HTMLInputElement>(".calc__input");
  if (!calc || !input) return;
  const price = Number(calc.dataset.price);
  const result = calc.querySelector<HTMLElement>(".calc__result")!;
  const note = calc.querySelector<HTMLElement>(".calc__note")!;
  const productField = document.querySelector<HTMLInputElement>('#ex1 input[name="product"]');
  const baseProduct = productField?.value ?? "";
  const orderText = document.querySelector<HTMLElement>(".product-view__order .btn__text");

  const update = () => {
    const area = Number(input.value.replace(",", "."));
    const valid = area >= 1 && area <= 10000;
    result.hidden = !valid;
    note.hidden = true;
    if (productField) productField.value = baseProduct;
    if (orderText) orderText.textContent = "Узнать стоимость";
    storage.set(valid ? input.value : "");
    if (!valid) return;

    // Округляем до сотых перед ceil: 100 × 1,1 в JS даёт 110,00000000000001
    const sheets = Math.ceil(Math.round(area * (1 + ROOF_RESERVE) * 100) / 100);
    const sum = sheets * price;
    result.querySelector(".calc__sum")!.textContent = tenge(sum);
    result.querySelector(".calc__detail")!.textContent =
      `${sheets} м² металлочерепицы с запасом ${ROOF_RESERVE * 100}% на раскрой и нахлёсты, ` +
      `по ${tenge(price)} за м². Без доборных элементов и доставки.`;
    note.hidden = !("smallMarkup" in calc.dataset) || sheets >= SMALL_ORDER_M2;
    if (productField)
      productField.value = `${baseProduct}; крыша ${area} м², ${sheets} м² листа, примерно ${tenge(sum)}`;
    if (orderText) orderText.textContent = "Получить точный расчёт";
  };

  input.value = storage.get();
  input.addEventListener("input", update);
  update();
}

// Первая загрузка и каждый переход между страницами
document.addEventListener("astro:page-load", () => {
  initCalc();
  initPhoneMasks();
  initFaq();
  initForms();
  void initZoom();
});
