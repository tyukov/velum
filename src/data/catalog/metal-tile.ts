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

export interface Family {
  id: string;
  name: string;
  /** Исполнение внутри семейства: A, S, M, X */
  version: string;
  /** Чем это исполнение отличается от других */
  versionNote: string;
}

export interface Model {
  slug: string;
  name: string;
  /** Исполнения одной металлочерепицы (Монтерроса A/S/M/X) объединяются в одну модель */
  family?: Family;
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
    name: "Монтерроса A",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "A",
      versionNote: "Модульное исполнение: листы удобно возить и монтировать на сложных крышах.",
    },
    width: 1160,
    summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
    description: [
      "Монтерроса — одна металлочерепица в четырёх исполнениях: A, S, M и X. Исполнения отличаются длиной шага, а значит и рисунком крыши. Какое лучше подойдёт под ваши скаты, подскажет менеджер после замера.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking, c.polyester045],
  },
  {
    slug: "monterrosa-s",
    name: "Монтерроса S",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "S",
      versionNote: "Стандартный рельеф и классический вид.",
    },
    width: 1170,
    summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
    description: [
      "Монтерроса — одна металлочерепица в четырёх исполнениях: A, S, M и X. Исполнения отличаются длиной шага, а значит и рисунком крыши. Какое лучше подойдёт под ваши скаты, подскажет менеджер после замера.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
  },
  {
    slug: "monterrosa-m",
    name: "Монтерроса M",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "M",
      versionNote: "Другая длина шага, чем у S.",
    },
    width: 1170,
    summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
    description: [
      "Монтерроса — одна металлочерепица в четырёх исполнениях: A, S, M и X. Исполнения отличаются длиной шага, а значит и рисунком крыши. Какое лучше подойдёт под ваши скаты, подскажет менеджер после замера.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
  },
  {
    slug: "monterrosa-x",
    name: "Монтерроса X",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "X",
      versionNote: "Другая длина шага, чем у S и M.",
    },
    width: 1170,
    summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
    description: [
      "Монтерроса — одна металлочерепица в четырёх исполнениях: A, S, M и X. Исполнения отличаются длиной шага, а значит и рисунком крыши. Какое лучше подойдёт под ваши скаты, подскажет менеджер после замера.",
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

/** Пункт раздела: отдельная модель или семейство исполнений (Монтерроса A/S/M/X) */
export interface CatalogEntry {
  name: string;
  /** Куда ведёт карточка: для семейства — стандартное исполнение S */
  slug: string;
  summary: string;
  models: Model[];
}

export const catalogEntries = (): CatalogEntry[] => {
  const entries: CatalogEntry[] = [];
  for (const model of metalTileModels) {
    if (!model.family) {
      entries.push({ name: model.name, slug: model.slug, summary: model.summary, models: [model] });
      continue;
    }
    const existing = entries.find((e) => e.models[0]?.family?.id === model.family!.id);
    if (existing) existing.models.push(model);
    else
      entries.push({
        name: model.family.name,
        slug: model.slug,
        summary: model.summary,
        models: [model],
      });
  }
  // Карточка семейства ведёт на исполнение S — стандартный рельеф
  for (const e of entries)
    e.slug = (e.models.find((m) => m.family?.version === "S") ?? e.models[0]!).slug;
  return entries;
};

export const familyOf = (model: Model) =>
  model.family ? metalTileModels.filter((m) => m.family?.id === model.family!.id) : [model];

/** Вариант по умолчанию для страницы модели: ходовой NormanMP 8017, иначе первый */
export const defaultVariant = (model: Model): Variant => {
  const all = variantsOf(model);
  return all.find((v) => v.coating.id === "normanmp" && v.color === "8017") ?? all[0]!;
};

export const formatThickness = (t: number) => `${String(t).replace(".", ",")} мм`;
