import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { TELEGRAM_MOCK_LOG } from "../../playwright.config";

// Тесты на телефоне и компьютере идут параллельно и пишут в один журнал заглушки Telegram,
// поэтому у каждой заявки уникальное имя, а сообщение ищется по нему
const uniqueName = () => `Тест ${Math.random().toString(36).slice(2, 8)}`;
const sentMessage = async (name: string): Promise<{ text: string }> => {
  let found: { text: string } | undefined;
  await expect
    .poll(() => {
      const lines = fs.existsSync(TELEGRAM_MOCK_LOG)
        ? fs.readFileSync(TELEGRAM_MOCK_LOG, "utf8").trim().split("\n")
        : [];
      found = lines.map((l) => JSON.parse(l)).find((m) => m.text.includes(name));
      return Boolean(found);
    })
    .toBe(true);
  return found!;
};

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
    const types = ld["@graph"].map((item: { "@type": string }) => item["@type"]);
    expect(types).toEqual(["WebSite", "HomeAndConstructionBusiness"]);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("robots.txt и ключ IndexNow доступны поисковикам", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Clean-param: utm_source");
    expect(robots).toContain("Sitemap: https://velum.kz/sitemap-index.xml");
    const key = fs.readdirSync("public").find((f) => /^[a-f0-9]{32}\.txt$/.test(f))!;
    expect(await (await request.get(`/${key}`)).text()).toBe(key.replace(".txt", ""));
  });

  test("в шапке один логотип", async ({ page }) => {
    await expect(page.locator(".header__logo svg")).toHaveCount(1);
  });

  test("заявка: маска телефона, отправка, закрытие окна", async ({ page }) => {
    await page.locator('.promo-message a[href="#ex1"]').click();
    const modal = page.locator(".blocker .modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("link", { name: "политикой конфиденциальности" })).toHaveAttribute(
      "href",
      "/privacy",
    );

    const name = uniqueName();
    await modal.getByLabel("Ваше имя").fill(name);
    const phone = modal.getByLabel("Ваш телефон");
    await phone.pressSequentially("87011234567");
    await expect(phone).toHaveValue("+7 (701) 123-45-67");
    await modal.getByLabel("Ваш вопрос:").fill("Нужна черепица <b>");
    await modal.getByRole("button", { name: "Отправить заявку" }).click();

    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    const sent = await sentMessage(name);
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

  test("фото в галерее увеличивается", async ({ page, isMobile }) => {
    const photo = page.locator(".zoom").first();
    await photo.scrollIntoViewIfNeeded();
    await photo.click();
    await expect(page.locator("body")).toHaveClass(/medium-zoom--opened/);
    // На телефоне шапка закреплена: затемнение с фото должно быть поверх неё
    if (!isMobile) return;
    const header = page.locator(".header");
    const box = await header.boundingBox();
    const topEl = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.className ?? "",
      [box!.x + 5, box!.y + 5],
    );
    expect(topEl).toContain("medium-zoom");
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

test("переходы между страницами без перезагрузки", async ({ page }) => {
  await page.goto("/privacy");
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
  await page.locator("a.logo").first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("h1")).toContainText("Металлочерепица");
  // Тот же документ: страница не перезагружалась
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);

  // Скрипты страницы работают после перехода
  await page.locator('.promo-message a[href="#ex1"]').click();
  const phone = page.locator(".blocker").getByLabel("Ваш телефон");
  await phone.pressSequentially("7011234567");
  await expect(phone).toHaveValue("+7 (701) 123-45-67");
});

test("все переходы по сайту без перезагрузки", async ({ page }) => {
  const sameDocument = () =>
    page.evaluate(() => (window as unknown as { marker?: number }).marker === 1);
  const steps: [string, () => Promise<void>, RegExp][] = [
    [
      "подвал → каталог",
      () => page.locator("footer").getByRole("link", { name: "Каталог" }).click(),
      /\/catalog$/,
    ],
    [
      "каталог → раздел",
      () => page.locator("main a[href='/catalog/metallocherepitsa']").first().click(),
      /\/metallocherepitsa$/,
    ],
    [
      "раздел → модель",
      () =>
        page
          .getByRole("link", { name: /Монтекристо/ })
          .first()
          .click(),
      /\/montecristo$/,
    ],
    [
      "другие модели",
      () => page.locator(".other-models").getByRole("link", { name: "Каскад" }).click(),
      /\/kaskad$/,
    ],
    [
      "таблица покрытий → вариант",
      () => page.locator(".coatings-table__swatch").first().click(),
      /\/kaskad\/.+/,
    ],
    [
      "хлебные крошки",
      () => page.locator(".breadcrumbs").getByRole("link", { name: "Металлочерепица" }).click(),
      /\/metallocherepitsa$/,
    ],
    [
      "подвал → политика",
      () =>
        page
          .locator("footer")
          .getByRole("link", { name: /Политика/ })
          .click(),
      /\/privacy$/,
    ],
    ["логотип → главная", () => page.locator("a.logo").first().click(), /\/$/],
  ];
  await page.goto("/");
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
  for (const [name, go, url] of steps) {
    await go();
    await expect(page, name).toHaveURL(url);
    expect(await sameDocument(), `${name}: страница перезагрузилась`).toBe(true);
  }
});

test.describe("каталог металлочерепицы", () => {
  test("с главной в раздел и на страницу модели", async ({ page }) => {
    await page.goto("/");
    await page.locator(".promo-header__title-link").click();
    await expect(page).toHaveURL(/\/catalog\/metallocherepitsa$/);
    await expect(page.locator(".model-card")).toHaveCount(7);
    await page
      .getByRole("link", { name: /Трамонтана/ })
      .first()
      .click();
    await expect(page.locator("h1")).toContainText("Трамонтана");
    // По умолчанию открывается NormanMP, RAL 8017
    await expect(page.locator(".product-view__subtitle")).toContainText("NormanMP");
    await expect(page.locator(".product-view__subtitle")).toContainText("RAL 8017");
  });

  test("выбор покрытия и цвета переводит на страницу варианта", async ({ page }) => {
    await page.goto("/catalog/metallocherepitsa/lamonterra-x");
    await page.locator(".picker__chip", { hasText: "Полиэстер" }).click();
    await expect(page).toHaveURL(/\/lamonterra-x\/polyester-0-45-ral-8017$/);
    await page.locator(".picker__chip", { hasText: "0,4 мм" }).click();
    await expect(page).toHaveURL(/polyester-0-4-ral-8017$/);
    await page
      .getByRole("group", { name: "Цвет" })
      .getByRole("link", { name: "RAL 3005 Красное вино" })
      .click();
    await expect(page).toHaveURL(/polyester-0-4-ral-3005$/);
    await expect(page.locator("h1")).toContainText("Ламонтерра-X");
    await expect(page.locator(".product-view__subtitle")).toContainText("0,4 мм");
  });

  test("выбор цвета и покрытия не прокручивает страницу наверх", async ({ page }) => {
    await page.goto("/catalog/metallocherepitsa/lamonterra-x");
    // Кликаем и проверяем, что прокрутка осталась той же, что была перед кликом
    const pickAndKeepScroll = async (group: string, name: string | RegExp, url: RegExp) => {
      const link = page.getByRole("group", { name: group }).getByRole("link", { name });
      // По центру экрана, чтобы ссылку не закрывала липкая шапка
      await link.evaluate((el) => el.scrollIntoView({ block: "center" }));
      const before = await page.evaluate(() => window.scrollY);
      expect(before).toBeGreaterThan(100);
      // Нативный клик: Playwright перед своим кликом сам прокручивает страницу из-под липкой шапки
      await link.evaluate((el: HTMLElement) => el.click());
      await expect(page).toHaveURL(url);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
    };
    await pickAndKeepScroll("Цвет", "RAL 3005 Красное вино", /normanmp-0-5-ral-3005$/);
    await pickAndKeepScroll("Покрытие", /VikingMP E/, /vikingmp-e-0-5-ral-3005$/);
  });

  test("таблица покрытий: цвета кружками ведут на варианты, на телефоне без прокрутки вбок", async ({
    page,
  }) => {
    await page.goto("/catalog/metallocherepitsa/lamonterra-x");
    const row = page.locator(".coatings-table tbody tr", { hasText: "PURMAN" });
    await expect(row.locator(".coatings-table__swatch")).toHaveCount(2);
    await row.locator(".coatings-table__swatch").first().click();
    await expect(page).toHaveURL(/\/lamonterra-x\/purman-0-5-/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  test("калькулятор: сумма по площади, наценка до 50 м², площадь уходит в заявку", async ({
    page,
  }) => {
    await page.goto("/catalog/metallocherepitsa/tramontana/vikingmp-e-0-5-rr32");
    const calc = page.locator(".calc");
    const area = calc.getByLabel("Площадь крыши");
    // 30 м² крыши + 10% запаса = 33 м² по 7 555 ₸
    await area.fill("30");
    await expect(calc.locator(".calc__sum")).toHaveText("249\u00a0315\u00a0₸");
    await expect(calc.locator(".calc__note")).toBeVisible();
    // Слишком большое число: подсказка вместо пустоты
    await area.fill("1234567");
    await expect(calc.locator(".calc__error")).toContainText("рассчитаем индивидуально");
    await expect(calc.locator(".calc__result")).toBeHidden();
    await area.fill("100");
    await expect(calc.locator(".calc__error")).toBeHidden();
    await expect(calc.locator(".calc__sum")).toHaveText("831\u00a0050\u00a0₸");
    await expect(calc.locator(".calc__note")).toBeHidden();

    // Площадь сохраняется при смене цвета
    await page
      .getByRole("group", { name: "Цвет" })
      .getByRole("link", { name: /RAL 3005/ })
      .click();
    await expect(page).toHaveURL(/vikingmp-e-0-5-ral-3005$/);
    await expect(page.locator("#calc-area")).toHaveValue("100");

    await page.getByRole("link", { name: "Получить точный расчёт" }).click();
    const modal = page.locator(".blocker .modal");
    const name = uniqueName();
    await modal.getByLabel("Ваше имя").fill(name);
    await modal.getByLabel("Ваш телефон").pressSequentially("7011234567");
    await modal.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    const sent = await sentMessage(name);
    expect(sent.text).toContain("крыша 100 м², двускатная; 110 м² листа, примерно 831");
  });

  test("калькулятор по размерам дома: доборные элементы, сравнение покрытий, WhatsApp", async ({
    page,
  }) => {
    await page.goto("/catalog/metallocherepitsa/lamonterra-x");
    const calc = page.locator(".calc");
    await calc.getByText("По размерам дома").click();
    await calc.getByLabel("Длина дома").fill("10");
    await calc.getByLabel("Ширина дома").fill("8");
    // Дом 10 × 8 со свесами 11 × 9, наклон 30°: скаты 114,3 м², +10% → 126 м² по 3 875 ₸
    await expect(calc.locator(".calc__sum")).toHaveText("488\u00a0250\u00a0₸");
    await expect(calc.locator(".calc__trims")).toContainText("конёк — 11 м");
    await expect(calc.locator(".calc__trims")).toContainText("саморезы — ~1\u00a0050 шт");
    // Сравнение: все покрытия модели, текущее отмечено, дешёвое сверху
    const options = calc.locator(".calc__option");
    await expect(options).toHaveCount(10);
    await expect(options.first()).toContainText("Полиэстер 0,4 мм");
    await expect(calc.locator('.calc__option[aria-current="true"]')).toContainText("NormanMP");
    const wa = await calc
      .getByRole("link", { name: "Отправить расчёт в WhatsApp" })
      .getAttribute("href");
    expect(wa).toContain("https://wa.me/77010131359?text=");
    expect(decodeURIComponent(wa!)).toContain("дом 10 × 8 м");

    // Вальмовая: запас 20%, доборные считает менеджер
    await calc.getByText("Вальмовая").click();
    await expect(calc.locator(".calc__sum")).toHaveText("534\u00a0750\u00a0₸");
    await expect(calc.locator(".calc__trims")).toBeHidden();

    // Переход на другое покрытие из сравнения: расчёт сохраняется
    await options.filter({ hasText: "Полиэстер 0,45 мм" }).click();
    await expect(page).toHaveURL(/polyester-0-45/);
    await expect(page.locator("#calc-length")).toHaveValue("10");
    await expect(page.locator(".calc__option[aria-current]")).toContainText("Полиэстер 0,45 мм");
  });

  test("двойное нажатие «Отправить» — одна заявка", async ({ page }) => {
    await page.goto("/catalog/metallocherepitsa/kaskad");
    await page.getByRole("link", { name: "Узнать стоимость" }).click();
    const modal = page.locator(".blocker .modal");
    const name = uniqueName();
    await modal.getByLabel("Ваше имя").fill(name);
    await modal.getByLabel("Ваш телефон").pressSequentially("7011234567");
    const submit = modal.getByRole("button", { name: "Отправить заявку" });
    await submit.dblclick();
    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    await expect(submit).toBeDisabled();
    await sentMessage(name);
    await page.waitForTimeout(1000);
    const count = fs
      .readFileSync(TELEGRAM_MOCK_LOG, "utf8")
      .split("\n")
      .filter((l) => l.includes(name)).length;
    expect(count).toBe(1);
  });

  test("заявка с товара уходит с названием варианта", async ({ page }) => {
    await page.goto("/catalog/metallocherepitsa/tramontana/vikingmp-e-0-5-rr32");
    await page.getByRole("link", { name: "Узнать стоимость" }).click();
    const modal = page.locator(".blocker .modal");
    const name = uniqueName();
    await modal.getByLabel("Ваше имя").fill(name);
    await modal.getByLabel("Ваш телефон").pressSequentially("7011234567");
    await modal.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    const sent = await sentMessage(name);
    expect(sent.text).toContain(
      "<b>Товар:</b> Металлочерепица Трамонтана VikingMP E 0,5 мм, RR 32",
    );
  });

  test("Монтерроса: исполнения одной модели, цвет и покрытие сохраняются", async ({ page }) => {
    await page.goto("/catalog/metallocherepitsa");
    await page
      .getByRole("link", { name: /Монтерроса/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/monterrosa-s$/);
    await page.locator(".picker__chip", { hasText: "VikingMP E" }).click();
    await page
      .getByRole("group", { name: "Цвет" })
      .getByRole("link", { name: "RAL 8004 Медно-коричневый" })
      .click();
    await expect(page).toHaveURL(/monterrosa-s\/vikingmp-e-0-5-ral-8004$/);
    await page.getByRole("group", { name: "Исполнение" }).getByRole("link", { name: "X" }).click();
    await expect(page).toHaveURL(/monterrosa-x\/vikingmp-e-0-5-ral-8004$/);
    await expect(page.locator("h1")).toContainText("Монтерроса X");
  });

  test("вариант: свой заголовок, canonical на модель; модель — ProductGroup", async ({ page }) => {
    await page.goto("/catalog/metallocherepitsa/monterrosa-s/vikingmp-0-45-ral-7021");
    await expect(page).toHaveTitle("Металлочерепица Монтерроса S VikingMP RAL 7021 | Velum");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://velum.kz/catalog/metallocherepitsa/monterrosa-s",
    );

    await page.goto("/catalog/metallocherepitsa/monterrosa-s");
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")));
    const group = ld.find((d) => d["@type"] === "ProductGroup");
    expect(group.hasVariant.length).toBe(31);
    expect(group.hasVariant[0].offers.priceCurrency).toBe("KZT");
    await expect(page.locator(".coatings-table tbody tr")).toHaveCount(4);
  });
});

test("цены по прайсу: вариант и раздел", async ({ page }) => {
  await page.goto("/catalog/metallocherepitsa/lamonterra-x/polyester-0-4-ral-3005");
  await expect(page.locator(".product-view__price-value")).toContainText("2 405");
  await page.locator(".picker__chip", { hasText: "PURMAN" }).click();
  await expect(page.locator(".product-view__price-value")).toContainText("8 420");
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")));
  const product = ld.find((d) => d["@type"] === "Product");
  expect(product.offers).toMatchObject({ price: 8420, priceCurrency: "KZT" });

  await page.goto("/catalog/metallocherepitsa");
  await expect(page.locator(".model-card", { hasText: "Ламонтерра-X" })).toContainText("от 2 405");
  await expect(page.locator(".model-card", { hasText: "Монтерроса" })).toContainText("от 3 090");
});

test("наличие: полиэстер и VikingMP в Атырау, остальное под заказ", async ({ page }) => {
  await page.goto("/catalog/metallocherepitsa/lamonterra-x/polyester-0-45-ral-3005");
  await expect(page.locator(".stock")).toContainText("В наличии в Атырау");
  await page.locator(".picker__chip", { hasText: "PURMAN" }).click();
  await expect(page.locator(".stock")).toContainText("Под заказ");
  await expect(page.locator(".stock")).toContainText("из Караганды");
  await expect(page.locator(".picker__chip", { hasText: "VikingMP" }).last()).toContainText(
    "в наличии в Атырау",
  );
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")));
  expect(ld.find((d) => d["@type"] === "Product").offers.availability).toBe(
    "https://schema.org/BackOrder",
  );

  await page.goto("/catalog/metallocherepitsa");
  await expect(page.locator(".model-card", { hasText: "Трамонтана" })).toContainText("Под заказ");
  await expect(page.locator(".model-card", { hasText: "Ламонтерра-X" })).toContainText(
    "В наличии в Атырау: VikingMP, Полиэстер",
  );
});

test.describe("второй поставщик", () => {
  test("Ламонтерра-X: цена по правилу двух поставщиков", async ({ page }) => {
    // Полиэстер 0,45: 3 115 и 3 075 — разница 40, берём меньшую
    await page.goto("/catalog/metallocherepitsa/lamonterra-x/polyester-0-45-ral-3005");
    await expect(page.locator(".product-view__price-value")).toContainText("3 075");
    // VikingMP: 3 280 и 3 300 — разница 20, берём меньшую
    await page.goto("/catalog/metallocherepitsa/lamonterra-x/vikingmp-0-45-ral-8017");
    await expect(page.locator(".product-view__price-value")).toContainText("3 280");
    await expect(page.locator(".product-view__price-note")).toContainText("12.10.2026");
    // Есть у обоих поставщиков — гарантию не показываем
    await expect(page.locator(".product-view__facts")).not.toContainText("гарантия");
    await expect(page.locator(".product-details dl")).not.toContainText("Гарантия");
    // Только у одного поставщика — показываем
    await page.locator(".picker__chip", { hasText: "NormanMP" }).click();
    await expect(page.locator(".product-view__facts")).toContainText("20 лет гарантия");
  });

  test("Stella: модель второго поставщика, в наличии, заявка с ценами поставщиков", async ({
    page,
  }) => {
    await page.goto("/catalog/metallocherepitsa/stella/polyester-0-45-ral-5021");
    await expect(page.locator("h1")).toContainText("Stella");
    await expect(page.locator(".stock")).toContainText("В наличии в Атырау");
    await expect(page.locator(".product-view__price-value")).toContainText("3 075");
    await expect(page.locator(".product-view__price-note")).not.toContainText("наценка");
    await expect(page.locator(".product-view__facts")).not.toContainText("ширина листа");
    await expect(page.locator(".product-view__facts")).toContainText("5 лет гарантия");

    await page.getByRole("link", { name: "Узнать стоимость" }).click();
    const modal = page.locator(".blocker .modal");
    const name = uniqueName();
    await modal.getByLabel("Ваше имя").fill(name);
    await modal.getByLabel("Ваш телефон").pressSequentially("7011234567");
    await modal.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    const sent = await sentMessage(name);
    expect(sent.text).toMatch(/<b>Цены поставщиков:<\/b> П2: 3\s075\s₸/);
  });
});
