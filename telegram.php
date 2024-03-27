<?php

/* https://api.telegram.org/bot6077432285:AAH1CHGPCzWC2-lubAZcPFsBqhjbnXoeRpw/getUpdates,
где, XXXXXXXXXXXXXXXXXXXXXXX - токен вашего бота, полученный ранее */

$name = $_POST['user_name'];
$phone = $_POST['user_phone'];
$message = $_POST['user_message'];
$token = "6077432285:AAH1CHGPCzWC2-lubAZcPFsBqhjbnXoeRpw";
$chat_id = "-1001883572330";
$arr = array(
  'Имя: ' => $name,
  'Телефон: ' => $phone,
  'Сообщение: ' => $message
);

foreach($arr as $key => $value) {
  $txt .= "<b>".$key."</b> ".$value."%0A";
};

$sendToTelegram = fopen("https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=html&text={$txt}","r");

if ($sendToTelegram) {
  header('Location: thanks.html');
} else {
  echo "Error";
}
?>