// Расчёт крыши для калькулятора в карточке товара. Ориентировочный: точную раскладку листов
// и доборных элементов делает менеджер по замерам.

export type RoofType = "single" | "gable" | "hip" | "complex";
export type Slope = "low" | "mid" | "steep";

/** Тип крыши и запас на раскрой и нахлёсты: чем больше скатов и подрезки, тем больше отходов */
export const ROOF_TYPES: Record<RoofType, { label: string; reserve: number }> = {
  single: { label: "Односкатная", reserve: 0.05 },
  gable: { label: "Двускатная", reserve: 0.1 },
  hip: { label: "Вальмовая", reserve: 0.2 },
  complex: { label: "Сложная", reserve: 0.25 },
};

export const SLOPES: Record<Slope, { label: string; degrees: number }> = {
  low: { label: "Пологая", degrees: 20 },
  mid: { label: "Средняя", degrees: 30 },
  steep: { label: "Крутая", degrees: 45 },
};

/** Свес кровли за стену дома с каждой стороны, м */
export const OVERHANG = 0.5;
/** Саморезов на 1 м² металлочерепицы */
export const SCREWS_PER_M2 = 8;

const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * Площадь скатов по размерам дома: площадь в плане со свесами, делённая на косинус наклона.
 * Для скатов с одинаковым наклоном это точно для любой формы крыши.
 */
export function roofArea(length: number, width: number, slope: Slope): number {
  const plan = (length + 2 * OVERHANG) * (width + 2 * OVERHANG);
  return round(plan / Math.cos((SLOPES[slope].degrees * Math.PI) / 180), 1);
}

/** Сколько м² металлочерепицы заказать: площадь крыши плюс запас, с округлением вверх */
export function sheetArea(area: number, type: RoofType): number {
  // Округляем до сотых перед ceil: 100 × 1,1 в JS даёт 110,00000000000001
  return Math.ceil(round(area * (1 + ROOF_TYPES[type].reserve)));
}

export interface Trims {
  /** Конёк, м (у односкатной нет) */
  ridge?: number;
  /** Торцевая (ветровая) планка, м */
  gable: number;
  /** Карнизная планка, м */
  eave: number;
}

/**
 * Доборные элементы для простых крыш. Для вальмовой и сложной без чертежа не посчитать — null.
 * Скат идёт поперёк длины дома.
 */
export function trims(length: number, width: number, type: RoofType, slope: Slope): Trims | null {
  const l = length + 2 * OVERHANG;
  const w = width + 2 * OVERHANG;
  const cos = Math.cos((SLOPES[slope].degrees * Math.PI) / 180);
  if (type === "single") return { gable: Math.ceil((2 * w) / cos), eave: Math.ceil(l) };
  if (type === "gable")
    return { ridge: Math.ceil(l), gable: Math.ceil((4 * (w / 2)) / cos), eave: Math.ceil(2 * l) };
  return null;
}

export const screws = (sheets: number) => Math.ceil((sheets * SCREWS_PER_M2) / 50) * 50;
