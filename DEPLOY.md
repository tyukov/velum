# Публикация сайта и заявки в Telegram

Формы на сайте отправляются на `/api/send`. Этот адрес работает на двух видах хостинга:

- **Cloudflare Pages** — обрабатывает `functions/api/send.js`;
- **PHP-хостинг (Apache)** — `.htaccess` перенаправляет его на `telegram.php`.

## 1. Telegram-бот

1. В @BotFather: `/mybots` → бот → *API Token* → **Revoke** (старый токен был в открытом коде, его нужно заменить). Сохраните новый токен.
2. Создайте группу для заявок, добавьте туда бота.
3. Напишите в группе любое сообщение и откройте
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates` — в ответе найдите `"chat":{"id":-100...}`. Это `TELEGRAM_CHAT_ID`.

## 2а. Cloudflare Pages (рекомендуется)

1. dash.cloudflare.com → *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → репозиторий `velum`.
2. Framework preset: **None**, Build command: пусто, Output directory: `/`.
3. *Settings → Variables and Secrets*: добавьте `TELEGRAM_BOT_TOKEN` (тип Secret) и `TELEGRAM_CHAT_ID`. Сделайте *Retry deployment*.
4. Сайт откроется на `velum.pages.dev`. Отправьте тестовую заявку.
5. Домен: *Custom domains* → *Set up a custom domain* → введите домен и добавьте у регистратора DNS-запись, которую покажет Cloudflare (CNAME на `velum.pages.dev`). HTTPS выпускается автоматически.

## 2б. PHP-хостинг (ps.kz, hoster.kz и т. п.)

1. Загрузите файлы сайта в корень (`public_html`) по FTP или через git.
2. Скопируйте `config.example.php` в `config.php` и впишите токен и chat id.
3. Домен: в панели хостинга добавьте домен, у регистратора укажите NS-серверы хостинга.

> Для доменов **.kz** уточните у регистратора требование о размещении сервера в Казахстане.
