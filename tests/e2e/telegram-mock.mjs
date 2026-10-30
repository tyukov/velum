// Подменяет запросы к Telegram API в dev-сервере для e2e-тестов.
// Подключается через NODE_OPTIONS="--import ./tests/e2e/telegram-mock.mjs".
import fs from "node:fs";

const log = process.env.TELEGRAM_MOCK_LOG;
const realFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  if (String(input).startsWith("https://api.telegram.org/")) {
    if (log) fs.appendFileSync(log, init.body + "\n");
    return new Response('{"ok":true}', { status: 200 });
  }
  return realFetch(input, init);
};
