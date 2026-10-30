import { defineConfig, devices } from "@playwright/test";

const PORT = 4400;
export const TELEGRAM_MOCK_LOG = "test-results/telegram.log";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // --ignore-lock: всегда в обычном режиме (Astro уходит в фон, если его запускает ИИ-агент)
    command: `astro dev --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ASTRO_TELEMETRY_DISABLED: "1",
      E2E: "1",
      TELEGRAM_BOT_TOKEN: "test-token",
      TELEGRAM_CHAT_ID: "-100",
      TELEGRAM_MOCK_LOG,
      NODE_OPTIONS: "--import ./tests/e2e/telegram-mock.mjs",
    },
  },
});
