#!/usr/bin/env node
// Сообщает Яндексу, Bing и другим поисковикам с IndexNow, что страницы сайта обновились.
// Запускается в GitHub Actions после обновления main (.github/workflows/indexnow.yml).
// Ключ лежит в public/<ключ>.txt — по нему поисковик проверяет, что запрос пришёл от владельца сайта.
import { readdirSync } from "node:fs";

const SITE = "https://velum.kz";
const ENDPOINTS = ["https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"];

const keyFile = readdirSync("public").find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("Нет файла ключа IndexNow в public/");
const key = keyFile.replace(".txt", "");

// Поисковик проверяет ключ по адресу keyLocation, поэтому ждём, пока сайт его отдаёт (до 10 минут)
async function waitFor(url) {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(url).catch(() => null);
    if (res?.ok) return res;
    await new Promise((r) => setTimeout(r, 30_000));
  }
  return null;
}

// Домен ещё не подключён к Vercel или сайт недоступен: поисковики не смогут проверить ключ.
// Не роняем workflow на каждом обновлении — оставляем предупреждение в GitHub Actions.
if (!(await waitFor(`${SITE}/${keyFile}`))) {
  console.log(
    `::warning::${SITE}/${keyFile} не отвечает — IndexNow пропущен. Подключён ли домен к Vercel?`,
  );
  process.exit(0);
}
const sitemap = await (await fetch(`${SITE}/sitemap-0.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) throw new Error("В sitemap нет адресов");

let failed = false;
for (const endpoint of ENDPOINTS) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key,
      keyLocation: `${SITE}/${keyFile}`,
      urlList,
    }),
  });
  // 200 и 202 — запрос принят
  console.log(`${endpoint}: ${res.status}, адресов ${urlList.length}`);
  if (!res.ok) failed = true;
}
process.exit(failed ? 1 : 0);
