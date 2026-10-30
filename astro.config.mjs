// @ts-check
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://velum.kz",
  trailingSlash: "never",
  build: {
    // CSS небольшой — встраиваем в HTML, чтобы не блокировать первую отрисовку
    inlineStylesheets: "always",
  },
  adapter: vercel(),
  // Панель разработчика мешает браузерным тестам (добавляет свои элементы на страницу)
  devToolbar: { enabled: process.env.E2E !== "1" },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/thanks"),
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
      TURNSTILE_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
  image: {
    responsiveStyles: true,
  },
});
