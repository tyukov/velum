<?php
// Отправка заявки в Telegram для обычного PHP-хостинга.
// Токен и чат берутся из config.php (не хранится в git) или из переменных окружения.

$config = file_exists(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$token = $config['TELEGRAM_BOT_TOKEN'] ?? getenv('TELEGRAM_BOT_TOKEN');
$chat_id = $config['TELEGRAM_CHAT_ID'] ?? getenv('TELEGRAM_CHAT_ID');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  exit;
}

// Ловушка для ботов: скрытое поле должно остаться пустым
if (!empty($_POST['website'])) {
  header('Location: /thanks.html');
  exit;
}

function clean($key) {
  return htmlspecialchars(mb_substr(trim($_POST[$key] ?? ''), 0, 1000), ENT_QUOTES, 'UTF-8');
}

$name = clean('user_name');
$phone = clean('user_phone');
$message = clean('user_message');

if ($name === '' || $phone === '') {
  http_response_code(400);
  echo 'Заполните имя и телефон';
  exit;
}

$text = "<b>Новая заявка с сайта</b>\n<b>Имя:</b> $name\n<b>Телефон:</b> $phone";
if ($message !== '') {
  $text .= "\n<b>Сообщение:</b> $message";
}

$ch = curl_init("https://api.telegram.org/bot{$token}/sendMessage");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => ['chat_id' => $chat_id, 'text' => $text, 'parse_mode' => 'HTML'],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 10,
]);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);

if (!empty($response['ok'])) {
  header('Location: /thanks.html');
} else {
  http_response_code(502);
  echo 'Не удалось отправить заявку, позвоните нам: 8 701 013 13 59';
}
