// Vercel Function: POST /api/send
// Принимает заявку с формы и отправляет её в Telegram.
// Переменные окружения (Vercel → Project → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const PHONE_FALLBACK = "Не удалось отправить заявку, позвоните нам: 8 701 013 13 59";

const escapeHtml = (s) =>
  String(s ?? "").trim().slice(0, 1000)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Форма отправлена скриптом (fetch) — отвечаем JSON; без JS — обычный редирект
function reply(request, ok, error, status = 200) {
  if ((request.headers.get("accept") || "").includes("application/json")) {
    return Response.json(ok ? { ok } : { ok, error }, { status });
  }
  if (ok) return Response.redirect(new URL("/thanks", request.url), 303);
  return new Response(error, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(request, false, "Некорректный запрос", 400);
  }

  // Ловушка для ботов: скрытое поле должно остаться пустым
  if (form.get("website")) return reply(request, true);

  const name = escapeHtml(form.get("user_name"));
  const phone = escapeHtml(form.get("user_phone"));
  const message = escapeHtml(form.get("user_message"));
  const page = escapeHtml(form.get("page"));

  if (!name) return reply(request, false, "Укажите имя", 400);
  if (phone.replace(/\D/g, "").length !== 11) return reply(request, false, "Укажите телефон полностью: +7 (XXX) XXX-XX-XX", 400);

  const text = [
    "<b>Новая заявка с сайта</b>",
    `<b>Имя:</b> ${name}`,
    `<b>Телефон:</b> ${phone}`,
    message && `<b>Сообщение:</b> ${message}`,
    page && `<b>Страница:</b> ${page}`,
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
    });
    if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error(err);
    return reply(request, false, PHONE_FALLBACK, 502);
  }

  return reply(request, true);
}
