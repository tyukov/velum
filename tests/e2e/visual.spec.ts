import { expect, test } from "@playwright/test";

// Скриншотные тесты: страница сравнивается с эталоном попиксельно, чтобы случайная правка
// не сломала вёрстку (как было с точками на главной). Эталоны снимает CI в своей среде —
// workflow «Эталоны скриншотов» (.github/workflows/screenshots.yml). Локально браузер другой
// версии и рендер отличается, поэтому здесь тесты запускаются только в CI или с VISUAL=1.
test.skip(!process.env.CI && !process.env.VISUAL, "скриншоты сравниваются только в среде CI");

const pages = [
  { name: "главная", path: "/" },
  { name: "металлочерепица", path: "/catalog/metallocherepitsa" },
  { name: "карточка-товара", path: "/catalog/metallocherepitsa/lamonterra-x" },
];

for (const { name, path } of pages) {
  test(`вид страницы: ${name}`, async ({ page }) => {
    // Без анимаций: дом на главной не листает части сам
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    // Картинки с loading="lazy" подгружаем заранее, иначе на скриншоте пустые места
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll("img")) img.loading = "eager";
      await Promise.all(
        [...document.images].map((img) =>
          img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true })),
        ),
      );
    });
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, maxDiffPixelRatio: 0.01 });
  });
}
