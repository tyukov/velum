// Модальные окна, маска телефона, FAQ и отправка заявок без перезагрузки.
// Сайт переходит между страницами без перезагрузки (ClientRouter): модуль выполняется один раз,
// а всё, что привязано к элементам страницы, подключается заново на событии astro:page-load.
import type {
  TransitionBeforePreparationEvent,
  TransitionBeforeSwapEvent,
} from "astro:transitions/client";
import { formatPhone } from "../lib/phone";
import { initCalc } from "./calc";

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

// ---------- Новая версия сайта ----------
// Если сайт обновили, пока вкладка открыта, страница из нового деплоя принесёт новый скрипт,
// а старый останется работать: обработчики подключились бы дважды и заявка ушла бы два раза.
// Поэтому на страницу другой сборки переходим с полной перезагрузкой.
document.addEventListener("astro:before-swap", (e: TransitionBeforeSwapEvent) => {
  const build = e.newDocument.querySelector<HTMLMetaElement>('meta[name="velum-build"]')?.content;
  if (build && build !== import.meta.env.BUILD_ID) {
    e.swap = () => location.assign(e.to.href);
  }
});

// ---------- Выбор характеристик товара без прыжка наверх ----------
// Покрытие, толщина, цвет и исполнение — ссылки на страницы вариантов. Обычно после перехода
// страница прокручивается наверх; при выборе в карточке товара и в калькуляторе оставляем прокрутку.
let keepScrollY: number | null = null;

document.addEventListener("astro:before-preparation", (e: TransitionBeforePreparationEvent) => {
  keepScrollY = e.sourceElement?.closest(".picker, .calc") ? window.scrollY : null;
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
    // Подключаем один раз: иначе одна заявка ушла бы несколько раз
    if (form.dataset.bound) return;
    form.dataset.bound = "";

    const page = document.createElement("input");
    page.type = "hidden";
    page.name = "page";
    page.value = location.pathname + location.search;
    form.appendChild(page);

    const button = form.querySelector<HTMLButtonElement>('[type="submit"]');
    let sending = false;
    // После успешной отправки кнопка неактивна, пока данные не изменят: двойное нажатие не создаст дубль
    form.addEventListener("input", () => {
      if (!sending && button) button.disabled = false;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;
      sending = true;
      let status = form.querySelector<HTMLElement>(".form-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "form-status modal__box-text";
        status.setAttribute("role", "status");
        form.appendChild(status);
      }
      status.textContent = "Отправляем…";
      if (button) button.disabled = true;

      let sent = false;
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error);
        sent = true;
        form.reset();
        status.textContent = "Спасибо! Заявка отправлена, менеджер скоро перезвонит.";
      } catch (err) {
        status.textContent =
          (err instanceof Error && err.message) ||
          "Не удалось отправить заявку. Позвоните нам: 8 701 013 13 59";
      } finally {
        resetTurnstile(form);
        sending = false;
        if (button) button.disabled = sent;
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

// Первая загрузка и каждый переход между страницами
document.addEventListener("astro:page-load", () => {
  initCalc();
  initPhoneMasks();
  initFaq();
  initForms();
  void initZoom();
});
