// Как рисовать модель металлочерепицы (рисунок товара в стиле эскиза) и к какому типу она относится
export type TileType = "Классическая" | "Модульная" | "Объёмная";

interface Look {
  /** Профиль листа для src/lib/product-art.ts */
  art: string;
  type: TileType;
  /** Подпись на карточке раздела */
  badge?: string;
}

const looks: Record<string, Look> = {
  "lamonterra-x": { art: "classic", type: "Классическая", badge: "Больше всего цветов" },
  monterrosa: { art: "flatTop", type: "Классическая" },
  kaskad: { art: "kaskad", type: "Классическая" },
  stella: { art: "stella", type: "Модульная" },
  como: { art: "como", type: "Модульная" },
  tramontana: { art: "volume", type: "Объёмная", badge: "Премиум" },
  montecristo: { art: "wide", type: "Классическая" },
};

/** Вид модели: по slug или по семейству (monterrosa-s → monterrosa) */
export const lookOf = (slug: string, familyId?: string): Look =>
  looks[slug] ??
  (familyId ? looks[familyId] : undefined) ?? { art: "classic", type: "Классическая" };
