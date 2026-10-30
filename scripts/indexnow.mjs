#!/usr/bin/env node
// Сообщает Яндексу, Bing и другим поисковикам с IndexNow, что страницы сайта обновились.
// Запускается в GitHub Actions после успешного деплоя на продакшен (.github/workflows/indexnow.yml).
// Ключ лежит в public/<ключ>.txt — по нему поисковик проверяет, что запрос пришёл от владельца сайта.
import { readdirSync } from "node:fs";

const SITE = "https://velum.kz";
const ENDPOINTS = ["https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"];

const keyFile = readdirSync("public").find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("Нет файла ключа IndexNow в public/");
const key = keyFile.replace(".txt", "");

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
