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
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/thanks"),
    }),
  ],
  env: {
    schema: {
      TELEGRAM_BOT_TOKEN: envField.string({ context: "server", access: "secret" }),
      TELEGRAM_CHAT_ID: envField.string({ context: "server", access: "secret" }),
    },
  },
  image: {
    responsiveStyles: true,
  },
});
