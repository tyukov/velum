import { expect, test, type Locator } from "@playwright/test";
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

// Сервер отклоняет заявки, отправленные быстрее 0,5 с после открытия окна (ловушка для ботов).
// Playwright заполняет форму быстрее человека, поэтому перед отправкой ждём, как человек
const humanPause = async (modal: Locator) => {
  const openedAt = Number(await modal.getAttribute("data-opened-at"));
  const wait = openedAt + 600 - (await modal.page().evaluate(() => Date.now()));
  if (wait > 0) await modal.page().waitForTimeout(wait);
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
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")));
    const graph = ld.find((d) => d["@graph"]);
    const types = graph["@graph"].map((item: { "@type": string }) => item["@type"]);
    expect(types).toEqual(["WebSite", "HomeAndConstructionBusiness"]);
    expect(graph["@graph"][1].sameAs).toContain("https://www.instagram.com/velum.kz");
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("FAQ в разметке FAQPage, визитка для Instagram не индексируется", async ({ page }) => {
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")));
    const faq = ld.find((d) => d["@type"] === "FAQPage");
    expect(faq.mainEntity.length).toBe(await page.locator(".faq-list__item").count());
    await page.goto("/taplink");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  });

  test("кнопка WhatsApp: на всех страницах с текстом про страницу, кроме визитки", async ({
    page,
  }) => {
    // На телефоне плавающая кнопка скрыта там, где есть нижняя панель (там своя ссылка WhatsApp)
    const wa = page.locator("a.whatsapp-float");
    await expect(wa).toHaveAttribute("aria-label", "Написать в WhatsApp");
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/77010131359\?text=/);
    await page.goto("/catalog/metallocherepitsa/kaskad");
    const href = decodeURIComponent((await wa.getAttribute("href")) ?? "");
    expect(href).toContain("Металлочерепица Каскад");
    const bar = decodeURIComponent((await page.locator(".s-bar__wa").getAttribute("href")) ?? "");
    expect(bar).toContain("Металлочерепица Каскад");
    await page.goto("/taplink");
    await expect(page.locator(".whatsapp-float")).toHaveCount(0);
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
    await page.locator('.hero a[href="#ex1"]').click();
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
    await modal.getByLabel("Ваш вопрос").fill("Нужна черепица <b>");
    await humanPause(modal);
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
    await page.locator('.hero a[href="#ex1"]').click();
    await page.locator(".blocker").evaluate((el) => (el.scrollTop = 0));
    const close = page.locator(".close-modal");
    await close.click();
    await expect(page.locator(".blocker")).toHaveCount(0);
  });

  test("неполный телефон не отправляется", async ({ page }) => {
    // На компьютере «Заказать звонок» в шапке, на телефоне — в меню
    const call = page.locator(".s-header__call");
    if (await call.isVisible()) await call.click();
    else {
      await page.locator(".s-menu > summary").click();
      await page.locator('.s-menu__panel a[href="#ex2"]').click();
    }
    const modal = page.locator(".blocker .modal");
    await modal.getByLabel("Ваше имя").fill("Тест");
    await modal.getByLabel("Ваш телефон").pressSequentially("701");
    await humanPause(modal);
    await modal.getByRole("button", { name: "Заказать звонок" }).click();
    // Браузер не даёт отправить форму, пока номер не совпадает с шаблоном
    expect(
      await modal.getByLabel("Ваш телефон").evaluate((el: HTMLInputElement) => el.validity.valid),
    ).toBe(false);
    await expect(modal.locator(".form-status")).toHaveCount(0);
  });

  test("FAQ раскрывается", async ({ page }) => {
    // Первый вопрос раскрыт сразу; проверяем второй
    await expect(page.locator(".faq-list__question").first()).toHaveClass(/active/);
    const question = page.locator(".faq-list__question").nth(1);
    await question.click();
    await expect(question).toHaveClass(/active/);
  });

  test("фото работ: просмотр целиком, листание, закрытие", async ({ page }) => {
    const photo = page.locator(".works__open").first();
    await photo.scrollIntoViewIfNeeded();
    await photo.click();
    const viewer = page.locator("dialog.lightbox");
    await expect(viewer).toBeVisible();
    await expect(viewer.locator(".lightbox__count")).toHaveText("1 / 5");
    // Фото не искажено: вписано целиком с сохранением пропорций
    await expect(viewer.locator(".lightbox__img")).toHaveCSS("object-fit", "contain");
    await viewer.getByRole("button", { name: "Следующее фото" }).click();
    await expect(viewer.locator(".lightbox__count")).toHaveText("2 / 5");
    // Клавиши-стрелки листают, с первого фото назад — на последнее
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(viewer.locator(".lightbox__count")).toHaveText("5 / 5");
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("в подвале есть ссылка на политику", async ({ page }) => {
    await expect(
      page.locator("footer").getByRole("link", { name: "Политика конфиденциальности" }),
    ).toHaveAttribute("href", "/privacy");
  });
});

test("Taplink: главные кнопки, товары, 2ГИС, форма открывается", async ({ page }) => {
  await page.goto("/taplink");
  await expect(page.locator("h1")).toHaveText("Кровля и фасад в Атырау");
  const actions = page.getByRole("navigation", { name: "Связаться с нами" });
  await expect(actions.getByRole("link")).toHaveCount(5);
  await expect(actions.getByRole("link", { name: "Как добраться (2ГИС)" })).toHaveAttribute(
    "href",
    "https://go.2gis.com/v1o8m",
  );
  await expect(page.locator(".tl__goods li")).toHaveCount(16);
  await page.locator('a[href="#ex1"]').click();
  await expect(page.locator(".blocker .modal")).toBeVisible();
});

test("политика конфиденциальности", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Политика конфиденциальности");
  await expect(page.getByText("№ 94-V")).toBeVisible();
});

test("инструкции: шаги и разметка HowTo, ссылка в шапке", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.locator(".s-menu > summary").click();
  await page
    .locator(isMobile ? ".s-menu__panel" : ".s-nav")
    .getByRole("link", { name: "Инструкции" })
    .click();
  await expect(page).toHaveURL(/\/instructions$/);
  await expect(page.getByRole("heading", { level: 2, name: "Как измерить крышу" })).toBeVisible();
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.flatMap((e) => JSON.parse(e.textContent ?? "[]")));
  expect(ld.filter((d) => d["@type"] === "HowTo")).toHaveLength(4);
});

test("нижняя панель на телефоне: цена товара и «Получить расчёт»", async ({ page, isMobile }) => {
  test.skip(!isMobile, "панель только на телефоне");
  await page.goto("/catalog/metallocherepitsa/lamonterra-x");
  const bar = page.locator(".s-bar");
  await expect(bar.locator(".s-bar__price b")).toHaveText(
    (await page.locator(".product-view__price-value").innerText()).split(" за")[0]!.trim(),
  );
  await bar.getByRole("link", { name: "Получить расчёт" }).click();
  await expect(page.locator(".blocker .modal")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".s-bar").getByRole("link", { name: "Оставить заявку" })).toBeVisible();
});

test("меню: переход к разделу закрывает меню, заголовок не под шапкой", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    await page.locator(".s-menu > summary").click();
    await page.locator('.s-menu__panel a[href="/#works"]').click();
    await expect(page.locator("details.s-menu")).not.toHaveAttribute("open");
  } else {
    await page.locator('.s-nav a[href="/#works"]').click();
  }
  const header = (await page.locator(".s-header").boundingBox())!;
  const gap = async () =>
    (await page.locator("#works-title").boundingBox())!.y - (header.y + header.height);
  await expect.poll(gap).toBeGreaterThanOrEqual(0);
  await expect.poll(gap).toBeLessThan(60);
});

test.describe("статьи", () => {
  test("список: 11 статей, рубрики фильтруют карточки", async ({ page }) => {
    await page.goto("/articles");
    const cards = page.locator(".a-list__grid > li:not([hidden])");
    await expect(cards).toHaveCount(11);
    await page
      .getByRole("group", { name: "Рубрики" })
      .getByRole("button", { name: "Монтаж" })
      .click();
    await expect(cards).toHaveCount(3);
    await page.getByRole("group", { name: "Рубрики" }).getByRole("button", { name: "Все" }).click();
    await expect(cards).toHaveCount(11);
  });

  test("статья: разметка Article и FAQPage, рисунок, «Читайте также»", async ({ page }) => {
    await page.goto("/articles/raschet");
    await expect(page.locator("h1")).toHaveText(
      "Как рассчитать металлочерепицу на крышу: формула и пример",
    );
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.flatMap((e) => JSON.parse(e.textContent ?? "[]")));
    const types = ld.map((d) => d["@type"]);
    expect(types).toContain("Article");
    expect(types).toContain("FAQPage");
    expect(types).toContain("BreadcrumbList");
    const img = page.locator(".a-head__art img");
    expect(
      await img.evaluate((el: HTMLImageElement) => el.decode().then(() => el.naturalWidth)),
    ).toBeGreaterThan(0);
    await page.locator(".a-related li a").first().click();
    await expect(page).toHaveURL(/\/articles\/[a-z-]+$/);
    await expect(page.locator(".a-body h2").first()).toBeVisible();
  });
});

test("часы работы: в подвале и в окне «Заказать звонок»", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator("footer")).toContainText("Работаем с 8:00 до 19:00");
  const call = page.locator(".s-header__call");
  if (await call.isVisible()) await call.click();
  else {
    await page.locator(".s-menu > summary").click();
    await expect(page.locator(".s-menu__panel")).toContainText("с 8:00 до 19:00");
    await page.locator('.s-menu__panel a[href="#ex2"]').click();
  }
  await expect(page.locator(".blocker .modal")).toContainText("Работаем с 8:00 до 19:00");
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
  await page.locator('.hero a[href="#ex1"]').click();
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
    await page.locator('.cats a[href="/catalog/metallocherepitsa"]').click();
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
    await humanPause(modal);
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

  test("ловушка по времени: мгновенная отправка отклоняется, повторная проходит", async ({
    page,
  }) => {
    await page.goto("/catalog/metallocherepitsa/kaskad");
    await page.getByRole("link", { name: "Узнать стоимость" }).click();
    const modal = page.locator(".blocker .modal");
    const name = uniqueName();
    // Как бот: поля и отправка сразу после открытия окна
    await modal.evaluate((el, n) => {
      el.dataset.openedAt = String(Date.now());
      (el.querySelector('input[name="user_name"]') as HTMLInputElement).value = n;
      (el.querySelector('input[type="tel"]') as HTMLInputElement).value = "+7 (701) 123-45-67";
      el.querySelector("form")!.requestSubmit();
    }, name);
    await expect(modal.locator(".form-status")).toHaveText(/отправьте заявку ещё раз/);
    await page.waitForTimeout(600);
    await modal.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    await sentMessage(name);
  });

  test("двойное нажатие «Отправить» — одна заявка", async ({ page }) => {
    await page.goto("/catalog/metallocherepitsa/kaskad");
    await page.getByRole("link", { name: "Узнать стоимость" }).click();
    const modal = page.locator(".blocker .modal");
    const name = uniqueName();
    await modal.getByLabel("Ваше имя").fill(name);
    await modal.getByLabel("Ваш телефон").pressSequentially("7011234567");
    const submit = modal.getByRole("button", { name: "Отправить заявку" });
    await humanPause(modal);
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
    await humanPause(modal);
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

  test("картинка товара: в разметке и превью ссылки, файл отдаётся", async ({ page, request }) => {
    await page.goto("/catalog/metallocherepitsa/lamonterra-x/normanmp-0-5-ral-3005");
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toBe("https://velum.kz/images/tile/ral-3005.jpg");
    const res = await request.get("/images/tile/ral-3005.jpg");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/jpeg");
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")));
    expect(ld.find((d) => d["@type"] === "Product").image).toBe(og);
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
    await humanPause(modal);
    await modal.getByRole("button", { name: "Отправить заявку" }).click();
    await expect(modal.locator(".form-status")).toHaveText(/Спасибо/);
    const sent = await sentMessage(name);
    expect(sent.text).toMatch(/<b>Цены поставщиков:<\/b> П2: 3\s075\s₸/);
  });
});
