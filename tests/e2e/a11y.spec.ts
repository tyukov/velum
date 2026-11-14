import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Автоматическая проверка доступности (axe-core) по правилам WCAG 2.2 A/AA:
// контраст, подписи полей, alt у картинок, порядок заголовков, названия ссылок и кнопок.
const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);

const describeViolations = (
  violations: { id: string; help: string; nodes: { target: unknown }[] }[],
) =>
  violations.map(
    (v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => JSON.stringify(n.target)).join(", ")}`,
  );

for (const path of [
  "/",
  "/catalog",
  "/catalog/metallocherepitsa",
  "/catalog/metallocherepitsa/lamonterra-x",
  "/catalog/metallocherepitsa/monterrosa-s/vikingmp-0-45-ral-7021",
  "/privacy",
  "/instructions",
  "/thanks",
  "/taplink",
]) {
  test(`доступность: ${path}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await scan(page).analyze();
    expect(describeViolations(violations)).toEqual([]);
  });
}

test("доступность: окно заявки и калькулятор с результатом", async ({ page }) => {
  await page.goto("/catalog/metallocherepitsa/lamonterra-x");
  await page.getByText("По размерам дома").click();
  await page.getByLabel("Длина дома").fill("10");
  await page.getByLabel("Ширина дома").fill("8");
  await expect(page.locator(".calc__result")).toBeVisible();
  let { violations } = await scan(page).include(".calc").analyze();
  expect(describeViolations(violations)).toEqual([]);

  await page.getByRole("link", { name: "Получить точный расчёт" }).click();
  await expect(page.locator(".blocker .modal")).toBeVisible();
  ({ violations } = await scan(page).include(".blocker").analyze());
  expect(describeViolations(violations)).toEqual([]);
});
