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

## 4. После запуска

- Google Search Console и Яндекс Вебмастер: подтвердите сайт и отправьте `https://velum.kz/sitemap-index.xml`.
- Проверьте скорость в PageSpeed Insights: https://pagespeed.web.dev/

## Структура проекта

См. [README.md](README.md).
