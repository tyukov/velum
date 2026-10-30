/**
 * Проверка токена Cloudflare Turnstile на сервере.
 * Если Cloudflare недоступен, заявка пропускается: потерять клиента хуже, чем пропустить спам.
 */
export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  let data: { success?: boolean };
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5_000),
    });
    data = await res.json();
  } catch (err) {
    console.error("Turnstile is unreachable, accepting the request", err);
    return true;
  }
  return data.success === true;
}
