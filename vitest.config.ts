import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Браузерные тесты в tests/e2e запускает Playwright
    include: ["tests/*.test.ts"],
  },
});
