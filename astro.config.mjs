// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// medium-zoom вставляет на страницу свой <style>; разрешаем в CSP ровно его по хэшу.
// Хэш считается из установленной версии, поэтому обновление библиотеки его не сломает.
/** @returns {`sha256-${string}`} */
function mediumZoomStyleHash() {
  const file = createRequire(import.meta.url).resolve("medium-zoom/dist/medium-zoom.esm.js");
  const match = readFileSync(file, "utf8").match(/"(\.medium-zoom-overlay\{[^"]*)"/);
  if (!match) throw new Error("medium-zoom: не найден встроенный CSS для хэша CSP");
  const css = JSON.parse(`"${match[1]}"`);
  return `sha256-${createHash("sha256").update(css).digest("base64")}`;
}

export default defineConfig({
  site: "https://velum.kz",
  trailingSlash: "never",
  build: {
    // CSS отдельными файлами: при переходах без перезагрузки CSP первой страницы
    // разрешает их через 'self', а повторные переходы берут стили из кэша
    inlineStylesheets: "never",
  },
  adapter: vercel(),
  // Переходы без перезагрузки: страницы подгружаются заранее при наведении/касании ссылки
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  // Панель разработчика мешает браузерным тестам (добавляет свои элементы на страницу)
  devToolbar: { enabled: process.env.E2E !== "1" },
  integrations: [
    sitemap({
      // Только канонические страницы: варианты товаров ссылаются canonical на страницу модели
      filter: (page) => !page.includes("/thanks") && !/\/catalog\/[^/]+\/[^/]+\/[^/]+$/.test(page),
    }),
  ],
  env: {
    schema: {
      TELEGRAM_BOT_TOKEN: envField.string({ context: "server", access: "secret" }),
      TELEGRAM_CHAT_ID: envField.string({ context: "server", access: "secret" }),
      // Cloudflare Turnstile: защита форм от спама включается, когда заданы оба ключа
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      // Коды подтверждения прав в Яндекс Вебмастере, Google Search Console и Bing Webmaster
      PUBLIC_YANDEX_VERIFICATION: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_GOOGLE_VERIFICATION: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_BING_VERIFICATION: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
  // Content Security Policy: Astro добавляет хэши своих скриптов и стилей в <meta>
  security: {
    csp: {
      scriptDirective: {
        resources: ["'self'", "https://challenges.cloudflare.com"],
      },
      styleDirective: {
        resources: [
          "'self'",
          // medium-zoom переносит атрибут style на увеличенное фото; атрибуты style не исполняют код
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
        hashes: [mediumZoomStyleHash()],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src https://challenges.cloudflare.com",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
    },
  },
  image: {
    responsiveStyles: true,
  },
});
