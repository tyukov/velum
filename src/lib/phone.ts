/** Форматирует ввод в вид +7 (XXX) XXX-XX-XX. Используется маской телефона в формах. */
export function formatPhone(value: string): string {
  // Цифры после кода страны; коды операторов в Казахстане не начинаются с 8,
  // поэтому ведущая 8 (как в «8 701…») — это префикс, а не часть номера
  const hasPrefix = value.includes("+7");
  let d = value.replace("+7", "").replace(/\D/g, "");
  if (!hasPrefix && d.length === 11 && /^[78]/.test(d)) d = d.slice(1);
  if (d.startsWith("8")) d = d.slice(1);
  d = d.slice(0, 10);
  let out = "+7";
  if (d.length) out += " (" + d.slice(0, 3);
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}

/** Номер полный: код страны 7 и 10 цифр */
export const isCompletePhone = (value: string): boolean => value.replace(/\D/g, "").length === 11;
