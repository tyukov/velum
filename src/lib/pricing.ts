/**
 * Цена на сайте, когда товар есть у двух поставщиков (П1 и П2).
 * Берём меньшую цену. Если разница больше 50 ₸ — берём большую и вычитаем 20 ₸.
 * Если товар есть только у одного поставщика — его цена.
 */
export const PRICE_GAP = 50;
export const PRICE_DISCOUNT = 20;

export function resolvePrice(p1?: number, p2?: number): number | undefined {
  if (p1 === undefined) return p2;
  if (p2 === undefined) return p1;
  if (Math.abs(p1 - p2) > PRICE_GAP) return Math.max(p1, p2) - PRICE_DISCOUNT;
  return Math.min(p1, p2);
}
