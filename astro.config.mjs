// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

// Версия сборки: при переходе без перезагрузки на страницу из нового деплоя сайт
// перезагружается полностью, иначе старый и новый скрипты работали бы одновременно
const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  site: "https://velum.kz",
  vite: { define: { "import.meta.env.BUILD_ID": JSON.stringify(BUILD_ID) } },
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
      // Не в карте сайта: служебные страницы, визитка для Instagram и варианты товаров (canonical на модель)
      filter: (page) =>
        !page.includes("/thanks") &&
        !page.endsWith("/taplink") &&
        !/\/catalog\/[^/]+\/[^/]+\/[^/]+$/.test(page),
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
          // Атрибуты style (цвет плашек, показ окон) не исполняют код
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
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
