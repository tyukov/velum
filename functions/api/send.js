// Cloudflare Pages Function: POST /api/send
// Принимает заявку с формы и отправляет её в Telegram.
// Токен и чат задаются в настройках проекта (Settings → Variables and Secrets):
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const escapeHtml = (s) =>
  String(s ?? "").trim().slice(0, 1000)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function onRequestPost({ request, env }) {
  const form = await request.formData();

  // Ловушка для ботов: скрытое поле должно остаться пустым
  if (form.get("website")) return Response.redirect(new URL("/thanks.html", request.url), 303);

  const name = escapeHtml(form.get("user_name"));
  const phone = escapeHtml(form.get("user_phone"));
  const message = escapeHtml(form.get("user_message"));

  if (!name || !phone) return new Response("Заполните имя и телефон", { status: 400 });

  const text = [
    "<b>Новая заявка с сайта</b>",
    `<b>Имя:</b> ${name}`,
    `<b>Телефон:</b> ${phone}`,
    message && `<b>Сообщение:</b> ${message}`,
  ].filter(Boolean).join("\n");

  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });

  if (!res.ok) return new Response("Не удалось отправить заявку, позвоните нам: 8 701 013 13 59", { status: 502 });

  return Response.redirect(new URL("/thanks.html", request.url), 303);
}
