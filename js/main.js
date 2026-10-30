// Velum: модальные окна, маска телефона, FAQ и отправка заявок без перезагрузки.
// Без зависимостей, заменяет jQuery и jquery-modal.
(function () {
  "use strict";

  // ---------- Модальные окна ----------
  // Разметка совместима со стилями jquery-modal: .blocker > .modal + a.close-modal
  let current = null;
  let lastFocus = null;

  function openModal(modal) {
    if (!modal) return;
    if (current) closeModal();
    lastFocus = document.activeElement;

    const blocker = document.createElement("div");
    blocker.className = "jquery-modal blocker current";
    blocker.addEventListener("click", (e) => { if (e.target === blocker) closeModal(); });

    if (!modal.querySelector(".close-modal")) {
      const close = document.createElement("a");
      close.href = "#close-modal";
      close.className = "close-modal";
      close.setAttribute("aria-label", "Закрыть");
      close.textContent = "Закрыть";
      close.addEventListener("click", (e) => { e.preventDefault(); closeModal(); });
      modal.appendChild(close);
    }

    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    blocker.appendChild(modal);
    document.body.appendChild(blocker);
    document.body.style.overflow = "hidden";
    modal.style.display = "inline-block";
    current = { modal, blocker };

    const first = modal.querySelector("input:not([type=hidden]):not([name=website]), button");
    if (first) first.focus();
  }

  function closeModal() {
    if (!current) return;
    const { modal, blocker } = current;
    modal.style.display = "none";
    document.body.appendChild(modal);
    blocker.remove();
    document.body.style.overflow = "";
    current = null;
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest('a[rel~="modal:open"]');
    if (!trigger) return;
    e.preventDefault();
    openModal(document.querySelector(trigger.getAttribute("href") || "#ex2"));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ---------- Маска телефона: +7 (999) 999-99-99 ----------
  function formatPhone(value) {
    // Цифры после кода страны; коды операторов в Казахстане не начинаются с 8,
    // поэтому ведущая 8 (как в «8 701…») — это префикс, а не часть номера
    const hasPrefix = value.includes("+7");
    let d = value.replace("+7", "").replace(/\D/g, "");
    if (!hasPrefix && d.length === 11 && /^[78]/.test(d)) d = d.slice(1);
    if (d.startsWith("8")) d = d.slice(1);
    d = d.slice(0, 10);
    let out = "+7";
    if (d.length) out += " (" + d.slice(0, 3);
    if (d.length >= 3) out += ")";
    if (d.length > 3) out += " " + d.slice(3, 6);
    if (d.length > 6) out += "-" + d.slice(6, 8);
    if (d.length > 8) out += "-" + d.slice(8, 10);
    return out;
  }

  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.setAttribute("inputmode", "tel");
    input.setAttribute("autocomplete", "tel");
    input.setAttribute("pattern", "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}");
    input.setAttribute("title", "Номер в формате +7 (701) 000-00-00");
    input.addEventListener("focus", () => {
      if (!input.value) input.value = "+7 (";
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    });
    input.addEventListener("input", () => { input.value = formatPhone(input.value); });
    input.addEventListener("blur", () => { if (input.value.replace(/\D/g, "").length <= 1) input.value = ""; });
  });

  // ---------- FAQ ----------
  document.querySelectorAll(".faq-list__question").forEach((question) => {
    question.addEventListener("click", () => {
      const active = document.querySelector(".faq-list__question.active");
      if (active && active !== question) {
        active.classList.remove("active");
        active.nextElementSibling.style.maxHeight = 0;
      }
      question.classList.toggle("active");
      const answer = question.nextElementSibling;
      answer.style.maxHeight = question.classList.contains("active") ? answer.scrollHeight + "px" : 0;
    });
  });

  // ---------- Отправка заявок ----------
  document.querySelectorAll('form[action="/api/send"]').forEach((form) => {
    const page = document.createElement("input");
    page.type = "hidden";
    page.name = "page";
    page.value = location.pathname + location.search;
    form.appendChild(page);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = form.querySelector('[type="submit"]');
      const status = form.querySelector(".form-status") || form.appendChild(Object.assign(document.createElement("p"), {
        className: "form-status modal__box-text",
      }));
      status.setAttribute("role", "status");
      status.textContent = "Отправляем…";
      if (button) button.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error);
        form.reset();
        status.textContent = "Спасибо! Заявка отправлена, менеджер скоро перезвонит.";
      } catch (err) {
        status.textContent = (err && err.message) || "Не удалось отправить заявку. Позвоните нам: 8 701 013 13 59";
      } finally {
        if (button) button.disabled = false;
      }
    });
  });

  // ---------- Увеличение фото в галерее ----------
  if (window.mediumZoom) window.mediumZoom(".zoom", { margin: 50 });
})();
