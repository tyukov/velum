// Приём заявки с формы и отправка в Telegram (функция Vercel).
// Токен и чат задаются переменными окружения TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
import type { APIRoute } from "astro";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TURNSTILE_SECRET_KEY } from "astro:env/server";
import { formatPhone, isCompletePhone } from "../../lib/phone";
import { business } from "../../lib/business";
import { verifyTurnstile } from "../../lib/turnstile";

export const prerender = false;

const FALLBACK = `Не удалось отправить заявку, позвоните нам: ${business.phoneDisplay}`;

const field = (form: FormData, name: string, max = 1000) =>
  String(form.get(name) ?? "")
    .trim()
    .slice(0, max)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Отправлено скриптом (fetch) — отвечаем JSON; без JS — обычный редирект
function reply(
  request: Request,
  redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response,
  error?: string,
  status = 200,
) {
  if (request.headers.get("accept")?.includes("application/json")) {
    return Response.json(error ? { ok: false, error } : { ok: true }, { status });
  }
  if (!error) return redirect("/thanks", 303);
  return new Response(error, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export const POST: APIRoute = async ({ request, redirect, clientAddress }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, redirect, "Некорректный запрос", 400);
  }

  // Ловушка для ботов: скрытое поле должно остаться пустым
  if (form.get("website")) return reply(request, redirect);

  if (TURNSTILE_SECRET_KEY) {
    const token = String(form.get("cf-turnstile-response") ?? "");
    if (!(await verifyTurnstile(TURNSTILE_SECRET_KEY, token, clientAddress))) {
      return reply(request, redirect, "Подтвердите, что вы не робот, и отправьте ещё раз", 400);
    }
  }

  const name = field(form, "user_name", 100);
  const phone = formatPhone(field(form, "user_phone", 30));
  const message = field(form, "user_message");
  const page = field(form, "page", 300);

  if (!name) return reply(request, redirect, "Укажите имя", 400);
  if (!isCompletePhone(phone)) {
    return reply(request, redirect, "Укажите телефон полностью: +7 (XXX) XXX-XX-XX", 400);
  }

  const text = [
    "<b>Новая заявка с сайта</b>",
    `<b>Имя:</b> ${name}`,
    `<b>Телефон:</b> ${phone}`,
    message && `<b>Сообщение:</b> ${message}`,
    page && `<b>Страница:</b> ${page}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error(err);
    return reply(request, redirect, FALLBACK, 502);
  }

  return reply(request, redirect);
};
