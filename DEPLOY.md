# Публикация на Vercel и заявки в Telegram

Сайт собирается Astro в статические страницы. Заявки с форм уходят на `/api/send` —
это серверная функция (`src/pages/api/send.ts`), которая пересылает их в Telegram.

## 1. Telegram-бот

1. В @BotFather: `/mybots` → бот → _API Token_ → **Revoke**. Старый токен был в открытом
   коде и остаётся в истории git, его обязательно нужно заменить. Сохраните новый.
2. Создайте группу для заявок и добавьте туда бота.
3. Напишите в группе любое сообщение и откройте
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates`. В ответе найдите `"chat":{"id":-100...}` —
   это `TELEGRAM_CHAT_ID`.

## 2. Vercel

1. vercel.com → **Add New… → Project** → импортируйте репозиторий `tyukov/velum`.
2. Framework Preset: **Astro** (определится сам). Build Command и Output Directory не меняйте.
3. **Environment Variables**: `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`, затем **Deploy**.
   Без них сайт откроется, но заявки отправляться не будут: посетитель увидит
   просьбу позвонить по телефону.
4. Settings → General → **Node.js Version**: 24.x.
5. Откройте выданный адрес `*.vercel.app` и отправьте тестовую заявку.

Каждый push в `main` публикует сайт, а каждый pull request получает свой адрес для предпросмотра.

## 3. Домен velum.kz

1. Project → **Settings → Domains** → добавьте `velum.kz` и `www.velum.kz`
   (`www` Vercel предложит перенаправлять на основной домен).
2. У регистратора домена создайте DNS-записи, которые покажет Vercel. Обычно это:
   - `A` для `@` → `76.76.21.21`
   - `CNAME` для `www` → `cname.vercel-dns.com`
3. HTTPS-сертификат выпускается автоматически в течение нескольких минут.

> Для доменов **.kz** уточните у регистратора, требуют ли правила размещать сервер в Казахстане.

## 4. Политика конфиденциальности

Перед публикацией заполните реквизиты в `src/lib/business.ts` (блок `legal`): юридическое
название, БИН/ИИН, адрес и e-mail. Они выводятся на странице `/privacy`. Текст политики —
шаблон по Закону РК № 94-V, его стоит показать юристу.

## 5. Защита форм от спама

Уже работает: скрытое поле-ловушка и проверка телефона на сервере.

**Cloudflare Turnstile** (невидимая капча, бесплатно):

1. dash.cloudflare.com → **Turnstile** → **Add widget**, домены `velum.kz` и `*.vercel.app`,
   режим **Managed**.
2. В Vercel добавьте переменные `PUBLIC_TURNSTILE_SITE_KEY` (Site Key) и `TURNSTILE_SECRET_KEY`
   (Secret Key), затем Redeploy.
3. Без этих переменных форма работает как раньше, без капчи.

**Ограничение частоты запросов** (Vercel Firewall):

1. Проект → **Firewall** → **Configure** → **New Rule**.
2. If: `Request Path` equals `/api/send`. Then: **Rate Limit**, 5 запросов за 60 секунд
   по IP, действие **Deny** (429).
3. **Save** → **Review Changes** → **Publish**.

## 6. Поисковые системы

### Подтверждение прав

Во всех трёх сервисах выберите способ «мета-тег» и скопируйте только код из `content="…"`.
Добавьте его в Vercel → **Settings → Environment Variables** (Production) и сделайте **Redeploy**:

| Сервис                | Где взять                                                               | Переменная                   |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Яндекс Вебмастер      | webmaster.yandex.ru → Добавить сайт → Мета-тег                          | `PUBLIC_YANDEX_VERIFICATION` |
| Google Search Console | search.google.com/search-console → Префикс URL → HTML-тег               | `PUBLIC_GOOGLE_VERIFICATION` |
| Bing Webmaster Tools  | bing.com/webmasters → можно импортировать сайт из Google Search Console | `PUBLIC_BING_VERIFICATION`   |

Тег появляется только на главной странице. После подтверждения отправьте в каждом сервисе
карту сайта `https://velum.kz/sitemap-index.xml`.

### Настройки в кабинетах

- **Яндекс Вебмастер → Представление в поиске → Региональность**: регион «Атырау».
- **Яндекс Бизнес**, **Google Бизнес-профиль**, **Bing Places** и **2ГИС**: карточка компании
  с тем же названием, адресом и телефоном, что на сайте, и ссылкой на velum.kz.
  Для поиска по городу это даёт больше, чем любые правки на сайте.
- Через 1–2 недели проверьте отчёты «Страницы в поиске» (Яндекс) и «Индексирование» (Google).

### Что уже сделано на сайте

- **IndexNow** (Яндекс, Bing, Seznam, Naver): после каждого обновления main GitHub Actions
  (`.github/workflows/indexnow.yml`) ждёт публикации на Vercel и отправляет адреса из sitemap. Ключ — файл
  `public/<ключ>.txt`, он не секретный. Вручную: Actions → IndexNow → Run workflow.
- **robots.txt**: `Clean-param` для Яндекса — адреса с `utm_*`, `yclid`, `gclid` не считаются отдельными страницами.
- **Разметка schema.org**: компания, сайт, товары с ценами, хлебные крошки. Её читают все поисковики.
- **Уникальность**: `npm run seo` останавливает сборку, если у двух страниц совпадают title,
  description, h1 или og:title, либо текст совпадает больше чем на 65%.

## 7. После запуска

- Проверьте скорость в PageSpeed Insights: https://pagespeed.web.dev/

## 8. Структура проекта

См. [README.md](README.md).
