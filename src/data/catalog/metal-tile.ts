// Металлочерепица «Металл Профиль»: ассортимент по прайс-листу ТОО «Завод Металл Профиль»
// (Атырау) от 21.09.2026, прайс-лист №1 и приложение №1 (перечень цветов). Цены не публикуются.

import { colorSlug } from "./colors";

export type CoatingClass = "Премиум" | "Премьер" | "Стандарт" | "Эконом";

export interface Coating {
  /** Часть адреса страницы */
  id: string;
  name: string;
  class: CoatingClass;
  /** Толщина полимерного слоя */
  layer: string;
  /** Толщина металла, мм */
  thickness: number;
  /** Гарантия производителя, лет */
  warranty: number;
  /** Коды цветов из приложения №1 */
  colors: string[];
}

// Покрытия и цвета (приложение №1, колонки толщин металла)
const coatings = {
  agneta: {
    id: "agneta",
    name: "AGNETA",
    class: "Премиум",
    layer: "25/25 мкм",
    thickness: 0.5,
    warranty: 25,
    colors: ["copper"],
  },
  purman: {
    id: "purman",
    name: "PURMAN",
    class: "Премиум",
    layer: "50 мкм",
    thickness: 0.5,
    warranty: 50,
    colors: ["8017", "9005"],
  },
  vikingE: {
    id: "vikingmp-e",
    name: "VikingMP E",
    class: "Премиум",
    layer: "45 мкм",
    thickness: 0.5,
    warranty: 40,
    colors: ["3005", "6005", "6007", "7024", "8004", "8017", "8019", "9005", "RR32"],
  },
  cloudy: {
    id: "cloudy",
    name: "CLOUDY",
    class: "Премиум",
    layer: "30 мкм",
    thickness: 0.5,
    warranty: 30,
    colors: ["antique"],
  },
  puretan: {
    id: "puretan",
    name: "PURETAN",
    class: "Премиум",
    layer: "35 мкм",
    thickness: 0.5,
    warranty: 30,
    colors: ["RR11", "RR32"],
  },
  valori: {
    id: "valori",
    name: "VALORI",
    class: "Премьер",
    layer: "30 мкм",
    thickness: 0.5,
    warranty: 30,
    colors: ["wine", "dark-slate", "grey-slate", "dark-brownie", "bright-brownie"],
  },
  norman: {
    id: "normanmp",
    name: "NormanMP",
    class: "Премьер",
    layer: "25 мкм",
    thickness: 0.5,
    warranty: 20,
    colors: ["1014", "3005", "3011", "5005", "5015", "6005", "7024", "8017", "9003", "9006"],
  },
  viking: {
    id: "vikingmp",
    name: "VikingMP",
    class: "Стандарт",
    layer: "30 мкм",
    thickness: 0.45,
    warranty: 10,
    colors: ["3005", "6007", "7021", "7024", "8004", "8017", "8019"],
  },
  polyester045: {
    id: "polyester",
    name: "Полиэстер",
    class: "Стандарт",
    layer: "25 мкм",
    thickness: 0.45,
    warranty: 5,
    colors: [
      "1014",
      "1015",
      "1018",
      "1035",
      "2004",
      "3005",
      "3011",
      "3020",
      "5002",
      "5005",
      "5021",
      "6002",
      "6005",
      "6018",
      "7004",
      "7024",
      "8004",
      "8017",
      "9002",
      "9003",
      "9006",
    ],
  },
  polyester04: {
    id: "polyester",
    name: "Полиэстер",
    class: "Эконом",
    layer: "25 мкм",
    thickness: 0.4,
    warranty: 5,
    colors: ["1014", "1015", "2004", "3005", "5005", "6005", "7004", "7024", "8017", "9003"],
  },
} satisfies Record<string, Coating>;

export interface Model {
  slug: string;
  name: string;
  /** Полная ширина листа, мм */
  width: number;
  /** Короткое описание для карточки */
  summary: string;
  description: string[];
  coatings: Coating[];
}

const c = coatings;

export const metalTileModels: Model[] = [
  {
    slug: "lamonterra-x",
    name: "Ламонтерра-X",
    width: 1190,
    summary: "Классический профиль под черепицу и самый широкий выбор покрытий и цветов.",
    description: [
      "Ламонтерра-X — классическая металлочерепица с волной, похожей на керамическую черепицу. Подходит для жилых домов, бань, гаражей и хозяйственных построек.",
      "У этой модели больше всего вариантов: от экономичного полиэстера 0,4 мм до покрытий премиум-класса с гарантией до 50 лет. Поэтому её легко подобрать и под бюджет, и под цвет фасада.",
    ],
    coatings: [
      c.agneta,
      c.purman,
      c.vikingE,
      c.cloudy,
      c.puretan,
      c.valori,
      c.norman,
      c.viking,
      c.polyester045,
      c.polyester04,
    ],
  },
  {
    slug: "monterrosa-a",
    name: "Монтерроса-A",
    width: 1160,
    summary: "Модульная металлочерепица: листы удобно возить и монтировать без длинных пролётов.",
    description: [
      "Монтерроса-A — модульная металлочерепица. Листы короткие, их проще привезти на участок и поднять на крышу, а монтаж под силу небольшой бригаде.",
      "Подходит для крыш со сложной формой, где длинные листы неудобны.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking, c.polyester045],
  },
  {
    slug: "monterrosa-s",
    name: "Монтерроса S",
    width: 1170,
    summary: "Монтерроса в исполнении S: четыре покрытия, гарантия от 10 до 40 лет.",
    description: [
      "Монтерроса выпускается в трёх исполнениях: S, M и X. Какое подойдёт под размеры ваших скатов, подскажет менеджер после замера.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
  },
  {
    slug: "monterrosa-m",
    name: "Монтерроса M",
    width: 1170,
    summary: "Монтерроса в исполнении M: четыре покрытия, гарантия от 10 до 40 лет.",
    description: [
      "Монтерроса выпускается в трёх исполнениях: S, M и X. Какое подойдёт под размеры ваших скатов, подскажет менеджер после замера.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
  },
  {
    slug: "monterrosa-x",
    name: "Монтерроса X",
    width: 1170,
    summary: "Монтерроса в исполнении X: четыре покрытия, гарантия от 10 до 40 лет.",
    description: [
      "Монтерроса выпускается в трёх исполнениях: S, M и X. Какое подойдёт под размеры ваших скатов, подскажет менеджер после замера.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
  },
  {
    slug: "tramontana",
    name: "Трамонтана",
    width: 1195,
    summary: "Объёмный рисунок черепицы и только покрытия высокого класса.",
    description: [
      "Трамонтана — металлочерепица с объёмным рисунком, который издалека похож на натуральную черепицу.",
      "Выпускается только с покрытиями классов «Премиум» и «Премьер», поэтому срок гарантии начинается от 20 лет.",
    ],
    coatings: [c.agneta, c.purman, c.vikingE, c.cloudy, c.puretan, c.valori, c.norman],
  },
  {
    slug: "montecristo",
    name: "Монтекристо",
    width: 1200,
    summary: "Широкий лист 1200 мм и только покрытия высокого класса.",
    description: [
      "Монтекристо — металлочерепица с самым широким листом в линейке: 1200 мм.",
      "Как и Трамонтана, выпускается только с покрытиями классов «Премиум» и «Премьер», поэтому гарантия начинается от 20 лет.",
    ],
    coatings: [c.agneta, c.vikingE, c.cloudy, c.puretan, c.valori, c.norman],
  },
];

export interface Variant {
  model: Model;
  coating: Coating;
  color: string;
  /** Часть адреса: normanmp-0-5-ral-3005 */
  slug: string;
}

export const variantSlug = (coating: Coating, color: string) =>
  `${coating.id}-${String(coating.thickness).replace(".", "-")}-${colorSlug(color)}`;

export const variantsOf = (model: Model): Variant[] =>
  model.coatings.flatMap((coating) =>
    coating.colors.map((color) => ({ model, coating, color, slug: variantSlug(coating, color) })),
  );

/** Вариант по умолчанию для страницы модели: ходовой NormanMP 8017, иначе первый */
export const defaultVariant = (model: Model): Variant => {
  const all = variantsOf(model);
  return all.find((v) => v.coating.id === "normanmp" && v.color === "8017") ?? all[0]!;
};

export const formatThickness = (t: number) => `${String(t).replace(".", ",")} мм`;
