import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { TELEGRAM_MOCK_LOG } from "../../playwright.config";

test.describe("главная", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("SEO-теги и разметка компании", async ({ page }) => {
    await expect(page).toHaveTitle(/Velum/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://velum.kz/",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://velum.kz/og.jpg",
    );
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
    );
    expect(ld["@type"]).toBe("HomeAndConstructionBusiness");
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("в шапке один логотип", async ({ page }) => {
    await expect(page.locator(".header__logo svg")).toHaveCount(1);
  });

  test("заявка: маска телефона, отправка, закрытие окна", async ({ page }) => {
    fs.rmSync(TELEGRAM_MOCK_LOG, { force: true });
    await page.locator('.promo-message a[href="#ex1"]').click();
    const modal = page.locator(".blocker .modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("link", { name: "политикой конфиденциальности" })).toHaveAttribute(
      "href",
      "/privacy",
    );

    await modal.getByLabel("Ваше имя").fill("Тест");
    const phone = modal.getByLabel("Ваш телефон");
    await phone.pressSequentially("87011234567");
    await expect(phone).toHaveValue("+7 (701) 123-45-67");
    await modal.getByLabel("Ваш вопрос:").fill("Нужна черепица <b>");
    await modal.getByRole("button", { name: "Отправить заявку" }).click();

    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    const sent = JSON.parse(fs.readFileSync(TELEGRAM_MOCK_LOG, "utf8").trim().split("\n").pop()!);
    expect(sent.text).toContain("+7 (701) 123-45-67");
    expect(sent.text).toContain("Нужна черепица &lt;b&gt;");
    expect(sent.text).toContain("<b>Страница:</b> /");

    await page.keyboard.press("Escape");
    await expect(page.locator(".blocker")).toHaveCount(0);
  });

  test("крестик окна не закрыт шапкой на маленьком экране", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.locator('.promo-message a[href="#ex1"]').click();
    await page.locator(".blocker").evaluate((el) => (el.scrollTop = 0));
    const close = page.locator(".close-modal");
    await close.click();
    await expect(page.locator(".blocker")).toHaveCount(0);
  });

  test("неполный телефон не отправляется", async ({ page }) => {
    // На телефоне кнопка «Перезвоните мне» на баннере, на компьютере — «Заказать звонок» в шапке
    const hero = page.locator('.promo-message a[href="#ex2"]');
    await ((await hero.isVisible()) ? hero : page.locator(".header-list__btn")).click();
    const modal = page.locator(".blocker .modal");
    await modal.getByLabel("Ваше имя").fill("Тест");
    await modal.getByLabel("Ваш телефон").pressSequentially("701");
    await modal.getByRole("button", { name: "Заказать звонок" }).click();
    // Браузер не даёт отправить форму, пока номер не совпадает с шаблоном
    expect(
      await modal.getByLabel("Ваш телефон").evaluate((el: HTMLInputElement) => el.validity.valid),
    ).toBe(false);
    await expect(modal.locator(".form-status")).toHaveCount(0);
  });

  test("FAQ раскрывается", async ({ page }) => {
    const question = page.locator(".faq-list__question").first();
    await question.click();
    await expect(question).toHaveClass(/active/);
  });

  test("фото в галерее увеличивается", async ({ page }) => {
    const photo = page.locator(".zoom").first();
    await photo.scrollIntoViewIfNeeded();
    await photo.click();
    await expect(page.locator("body")).toHaveClass(/medium-zoom--opened/);
  });

  test("в подвале есть ссылка на политику", async ({ page }) => {
    await expect(
      page.locator("footer").getByRole("link", { name: "Политика конфиденциальности" }),
    ).toHaveAttribute("href", "/privacy");
  });
});

test("Taplink: форма открывается", async ({ page }) => {
  await page.goto("/taplink");
  await page.locator('a[href="#ex1"]').click();
  await expect(page.locator(".blocker .modal")).toBeVisible();
});

test("политика конфиденциальности", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Политика конфиденциальности");
  await expect(page.getByText("№ 94-V")).toBeVisible();
});

test("несуществующая страница — 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страница не найдена");
});

test("API без JavaScript перенаправляет на /thanks", async ({ request }) => {
  const res = await request.post("/api/send", {
    form: { user_name: "Тест", user_phone: "+7 (701) 123-45-67" },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(303);
  expect(res.headers()["location"]).toMatch(/\/thanks$/);
});

test("API отсекает ботов и неполный номер", async ({ request }) => {
  const headers = { Accept: "application/json" };
  const bot = await request.post("/api/send", {
    headers,
    form: { website: "spam", user_name: "x", user_phone: "1" },
  });
  expect(await bot.json()).toEqual({ ok: true });

  const short = await request.post("/api/send", {
    headers,
    form: { user_name: "Тест", user_phone: "+7 (701" },
  });
  expect(short.status()).toBe(400);
});

test("нет ошибок в консоли", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const path of ["/", "/taplink", "/privacy"]) await page.goto(path);
  expect(errors).toEqual([]);
});
