# Публикация на Vercel и заявки в Telegram

Сайт статический: HTML, CSS и немного JS без зависимостей. Заявки с форм уходят
на `/api/send` — это функция Vercel (`api/send.js`), которая пересылает их в Telegram.

## 1. Telegram-бот

1. В @BotFather: `/mybots` → бот → *API Token* → **Revoke**. Старый токен был в открытом
   коде и остаётся в истории git, его обязательно нужно заменить. Сохраните новый.
2. Создайте группу для заявок и добавьте туда бота.
3. Напишите в группе любое сообщение и откройте
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates`. В ответе найдите `"chat":{"id":-100...}` —
   это `TELEGRAM_CHAT_ID`.

## 2. Vercel

1. vercel.com → **Add New… → Project** → импортируйте репозиторий `tyukov/velum`.
2. Framework Preset: **Other**. Build Command и Output Directory оставьте пустыми.
3. **Environment Variables**: `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`, затем **Deploy**.
4. Откройте выданный адрес `*.vercel.app` и отправьте тестовую заявку.

Каждый push в `main` публикует сайт, а каждый pull request получает свой адрес для предпросмотра.

## 3. Домен velum.kz

1. Project → **Settings → Domains** → добавьте `velum.kz` и `www.velum.kz`
   (`www` Vercel предложит перенаправлять на основной домен).
2. У регистратора домена создайте DNS-записи, которые покажет Vercel. Обычно это:
   - `A` для `@` → `76.76.21.21`
   - `CNAME` для `www` → `cname.vercel-dns.com`
3. HTTPS-сертификат выпускается автоматически в течение нескольких минут.

> Для доменов **.kz** уточните у регистратора, требуют ли правила размещать сервер в Казахстане.

## 4. После запуска

- Google Search Console и Яндекс Вебмастер: подтвердите сайт и отправьте `https://velum.kz/sitemap.xml`.
- Проверьте скорость в PageSpeed Insights: https://pagespeed.web.dev/

## Что где лежит

| Путь | Назначение |
|---|---|
| `index.html`, `taplink.html`, `thanks.html` | Страницы сайта |
| `css/`, `fonts/`, `img/` | Стили, шрифт Inter, изображения (WebP) |
| `js/main.js` | Модальные окна, маска телефона, FAQ, отправка форм |
| `api/send.js` | Функция Vercel: заявка → Telegram |
| `vercel.json` | Чистые адреса, кэширование, заголовки безопасности |
| `robots.txt`, `sitemap.xml` | Для поисковиков |
| `.vercelignore` | Черновики, которые не публикуются |
