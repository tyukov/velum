// Металлочерепица по прайсам двух поставщиков: П1 (прайс от 21.09.2026, основной прайс
// и перечень цветов) и П2 (прайс от 12.10.2026). Цены — за м² в тенге с НДС.
// Названия поставщиков на сайте не показываем; расшифровка П1/П2 — у менеджера.

import { colorSlug } from "./colors";
import { resolvePrice } from "../../lib/pricing";

/** Даты прайсов поставщиков */
export const PRICE_DATES = { p1: "21.09.2026", p2: "12.10.2026" } as const;

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
  /** atyrau — есть на складе в Атырау; order — под заказ (Караганда, иначе Россия) */
  stock: Stock;
}

export type Stock = "atyrau" | "order";

export const stockInfo: Record<Stock, { label: string; text: string }> = {
  atyrau: {
    label: "В наличии в Атырау",
    text: "Есть на складе в Атырау.",
  },
  order: {
    label: "Под заказ",
    text: "Везём под заказ из Караганды, если там нет — из России. Срок поставки назовёт менеджер.",
  },
};

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
    stock: "order",
  },
  purman: {
    id: "purman",
    name: "PURMAN",
    class: "Премиум",
    layer: "50 мкм",
    thickness: 0.5,
    warranty: 50,
    colors: ["8017", "9005"],
    stock: "order",
  },
  vikingE: {
    id: "vikingmp-e",
    name: "VikingMP E",
    class: "Премиум",
    layer: "45 мкм",
    thickness: 0.5,
    warranty: 40,
    colors: ["3005", "6005", "6007", "7024", "8004", "8017", "8019", "9005", "RR32"],
    stock: "order",
  },
  cloudy: {
    id: "cloudy",
    name: "CLOUDY",
    class: "Премиум",
    layer: "30 мкм",
    thickness: 0.5,
    warranty: 30,
    colors: ["antique"],
    stock: "order",
  },
  puretan: {
    id: "puretan",
    name: "PURETAN",
    class: "Премиум",
    layer: "35 мкм",
    thickness: 0.5,
    warranty: 30,
    colors: ["RR11", "RR32"],
    stock: "order",
  },
  valori: {
    id: "valori",
    name: "VALORI",
    class: "Премьер",
    layer: "30 мкм",
    thickness: 0.5,
    warranty: 30,
    colors: ["wine", "dark-slate", "grey-slate", "dark-brownie", "bright-brownie"],
    stock: "order",
  },
  norman: {
    id: "normanmp",
    name: "NormanMP",
    class: "Премьер",
    layer: "25 мкм",
    thickness: 0.5,
    warranty: 20,
    colors: ["1014", "3005", "3011", "5005", "5015", "6005", "7024", "8017", "9003", "9006"],
    stock: "order",
  },
  viking: {
    id: "vikingmp",
    name: "VikingMP",
    class: "Стандарт",
    layer: "30 мкм",
    thickness: 0.45,
    warranty: 10,
    colors: ["3005", "6007", "7021", "7024", "8004", "8017", "8019"],
    stock: "atyrau",
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
    stock: "atyrau",
  },
  polyester04: {
    id: "polyester",
    name: "Полиэстер",
    class: "Эконом",
    layer: "25 мкм",
    thickness: 0.4,
    warranty: 5,
    colors: ["1014", "1015", "2004", "3005", "5005", "6005", "7004", "7024", "8017", "9003"],
    stock: "atyrau",
  },
  // П2: матовое = VikingMP, глянцевое = полиэстер 0,45; цвета по прайсу П2
  p2Matte: {
    id: "vikingmp",
    name: "VikingMP",
    class: "Стандарт",
    layer: "30 мкм",
    thickness: 0.45,
    warranty: 10,
    colors: ["7024", "8017"],
    stock: "atyrau",
  },
  p2Glossy: {
    id: "polyester",
    name: "Полиэстер",
    class: "Стандарт",
    layer: "25 мкм",
    thickness: 0.45,
    warranty: 5,
    colors: ["1015", "3005", "5005", "5021", "6005", "7004", "7024", "8017", "9003"],
    stock: "atyrau",
  },
} satisfies Record<string, Coating>;

export interface Family {
  id: string;
  name: string;
  /** Исполнение внутри семейства: A, S, M, X */
  version: string;
  /** Чем это исполнение отличается от других */
  versionNote: string;
  /** Описание семейства для карточки раздела */
  summary: string;
}

export interface Model {
  slug: string;
  name: string;
  /** Исполнения одной металлочерепицы (Монтерроса A/S/M/X) объединяются в одну модель */
  family?: Family;
  /** Полная ширина листа, мм (если известна) */
  width?: number;
  /** Короткое описание для карточки */
  summary: string;
  description: string[];
  coatings: Coating[];
  /** Цены П1 за м², ₸ с НДС: ключ — priceKey(покрытие) */
  prices: Record<string, number>;
  /** Цены П2 за тот же товар (если он есть и у второго поставщика) */
  prices2?: Record<string, number>;
  /** Примечание к цене из прайса */
  priceNote?: string;
}

export const priceKey = (coating: Coating) => `${coating.id}@${coating.thickness}`;
/** Цены обоих поставщиков за вариант (для менеджера) */
export const supplierPrices = (model: Model, coating: Coating) => ({
  p1: model.prices[priceKey(coating)],
  p2: model.prices2?.[priceKey(coating)],
});

/** Цена на сайте по правилу двух поставщиков */
export const priceOf = (model: Model, coating: Coating) => {
  const { p1, p2 } = supplierPrices(model, coating);
  return resolvePrice(p1, p2);
};

/**
 * Гарантия на сайте: если вариант есть у обоих поставщиков, гарантию не показываем
 * (неизвестно, у кого возьмём); если только у одного — показываем.
 */
export const warrantyOf = (model: Model, coating: Coating): number | undefined => {
  const { p1, p2 } = supplierPrices(model, coating);
  return p1 !== undefined && p2 !== undefined ? undefined : coating.warranty;
};

/** Наибольшая показываемая гарантия среди покрытий моделей */
export const maxWarranty = (models: Model[]) =>
  Math.max(0, ...models.flatMap((m) => m.coatings.map((c) => warrantyOf(m, c) ?? 0)));

/** Для менеджера в заявке: цены поставщиков, «П1: 3 280 ₸, П2: 3 300 ₸» */
export const supplyNote = (model: Model, coating: Coating) => {
  const { p1, p2 } = supplierPrices(model, coating);
  return [
    p1 !== undefined && `П1: ${formatPrice(p1)}`,
    p2 !== undefined && `П2: ${formatPrice(p2)}`,
  ]
    .filter(Boolean)
    .join(", ");
};

/** Дата цены: прайс поставщика, чья цена учтена (если оба — более свежий) */
export const priceDateOf = (model: Model, coating: Coating) =>
  supplierPrices(model, coating).p2 !== undefined ? PRICE_DATES.p2 : PRICE_DATES.p1;

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
    prices: {
      "agneta@0.5": 8140,
      "purman@0.5": 8420,
      "vikingmp-e@0.5": 6040,
      "cloudy@0.5": 8140,
      "puretan@0.5": 6965,
      "valori@0.5": 5355,
      "normanmp@0.5": 3875,
      "vikingmp@0.45": 3280,
      "polyester@0.45": 3115,
      "polyester@0.4": 2405,
    },
    // П2 продаёт этот же профиль как «СуперМонтерей»
    prices2: {
      "vikingmp@0.45": 3300,
      "polyester@0.45": 3075,
    },
  },
  {
    slug: "monterrosa-a",
    name: "Монтерроса A",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "A",
      summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
      versionNote: "Модульное исполнение: листы удобно возить и монтировать на сложных крышах.",
    },
    width: 1160,
    summary: "Модульное исполнение Монтерросы: короткие листы для крыш со сложной геометрией.",
    description: [
      "Монтерроса A — модульное исполнение Монтерросы. Листы короткие: их проще привезти, поднять на крышу и уложить без помощи крана.",
      "Модульный лист удобен там, где длинный пришлось бы много резать: на крышах с ендовами, слуховыми окнами и короткими скатами. Это единственное исполнение Монтерросы, которое выпускается и с экономичным полиэстером 0,45 мм.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking, c.polyester045],
    prices: {
      "vikingmp-e@0.5": 6405,
      "valori@0.5": 5700,
      "normanmp@0.5": 3835,
      "vikingmp@0.45": 3185,
      "polyester@0.45": 3090,
    },
  },
  {
    slug: "monterrosa-s",
    name: "Монтерроса S",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "S",
      summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
      versionNote: "Стандартный рельеф и классический вид.",
    },
    width: 1170,
    summary: "Стандартное исполнение Монтерросы: привычный рельеф и классический вид крыши.",
    description: [
      "Монтерроса S — стандартное исполнение Монтерросы с привычным рельефом и классическим видом. С него удобно начинать выбор: такой рисунок подходит к большинству домов.",
      "Если хочется другой рисунок крыши, сравните S с исполнениями A, M и X — они отличаются длиной шага. Переключатель «Исполнение» сохраняет выбранное покрытие и цвет.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
    prices: {
      "vikingmp-e@0.5": 6365,
      "valori@0.5": 5630,
      "normanmp@0.5": 4050,
      "vikingmp@0.45": 3505,
    },
  },
  {
    slug: "monterrosa-m",
    name: "Монтерроса M",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "M",
      summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
      versionNote: "Другая длина шага, чем у S.",
    },
    width: 1170,
    summary: "Исполнение Монтерросы M: тот же профиль, но другая длина шага, чем у S.",
    description: [
      "Монтерроса M — исполнение с длиной шага, отличной от стандартной S. Шаг задаёт, как часто повторяются ряды «черепиц» на скате, поэтому от него зависит рисунок крыши.",
      "Длина шага влияет и на раскрой: лист режут кратно шагу, и на одних скатах меньше обрезков даёт M, на других — S или X. Пришлите размеры скатов — менеджер посчитает оба варианта.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
    prices: {
      "vikingmp-e@0.5": 6440,
      "valori@0.5": 5700,
      "normanmp@0.5": 4125,
      "vikingmp@0.45": 3550,
    },
  },
  {
    slug: "monterrosa-x",
    name: "Монтерроса X",
    family: {
      id: "monterrosa",
      name: "Монтерроса",
      version: "X",
      summary: "Одна металлочерепица в четырёх исполнениях — A, S, M и X — с разной длиной шага.",
      versionNote: "Другая длина шага, чем у S и M.",
    },
    width: 1170,
    summary: "Исполнение Монтерросы X: собственная длина шага, отличная от S и M.",
    description: [
      "Монтерроса X — четвёртое исполнение Монтерросы со своей длиной шага, не такой, как у S и M. Крыша из X выглядит иначе: ряды «черепиц» повторяются с другим интервалом.",
      "Выбирать X стоит, когда важен именно такой рисунок или когда этот шаг лучше ложится на длину ваших скатов. Покрытия те же, что у S и M — от NormanMP до VikingMP E.",
    ],
    coatings: [c.vikingE, c.valori, c.norman, c.viking],
    prices: {
      "vikingmp-e@0.5": 6520,
      "valori@0.5": 5770,
      "normanmp@0.5": 4175,
      "vikingmp@0.45": 3590,
    },
  },
  {
    slug: "tramontana",
    name: "Трамонтана",
    width: 1195,
    summary: "Объёмный рисунок черепицы и только покрытия высокого класса.",
    description: [
      "Трамонтана — металлочерепица с объёмным рисунком, который издалека похож на натуральную черепицу. Между рядами видны тени, поэтому крыша выглядит рельефной даже в спокойных цветах.",
      "Выпускается только с покрытиями классов «Премиум» и «Премьер», поэтому срок гарантии начинается от 20 лет. Среди премиальных моделей только у Трамонтаны есть покрытие Purman.",
    ],
    coatings: [c.agneta, c.purman, c.vikingE, c.cloudy, c.puretan, c.valori, c.norman],
    prices: {
      "agneta@0.5": 8590,
      "purman@0.5": 8870,
      "vikingmp-e@0.5": 7555,
      "cloudy@0.5": 8590,
      "puretan@0.5": 7525,
      "valori@0.5": 6715,
      "normanmp@0.5": 6010,
    },
    priceNote: "Для высоты ступеньки 30 и 35 мм цена выше на 55 и 85 ₸/м² соответственно.",
  },
  {
    slug: "montecristo",
    name: "Монтекристо",
    width: 1200,
    summary: "Широкий лист 1200 мм и только покрытия высокого класса.",
    description: [
      "Монтекристо — металлочерепица с самым широким листом в линейке: 1200 мм. Чем шире лист, тем меньше листов уходит на скат и тем меньше продольных нахлёстов, через которые может пройти вода.",
      "Покрытия у Монтекристо только премиальные, с гарантией от 20 лет. С тем же покрытием она стоит столько же, сколько Трамонтана, так что между ними выбирают по рисунку и ширине листа.",
    ],
    coatings: [c.agneta, c.vikingE, c.cloudy, c.puretan, c.valori, c.norman],
    prices: {
      "agneta@0.5": 8590,
      "vikingmp-e@0.5": 7555,
      "cloudy@0.5": 8590,
      "puretan@0.5": 7525,
      "valori@0.5": 6715,
      "normanmp@0.5": 6010,
    },
    priceNote: "Для высоты ступеньки 30 и 35 мм цена выше на 55 и 85 ₸/м² соответственно.",
  },
  {
    slug: "kaskad",
    name: "Каскад",
    summary: "Металлочерепица Каскад со склада в Атырау: матовое или глянцевое покрытие 0,45 мм.",
    description: [
      "Каскад лежит на складе в Атырау, поэтому крышу можно начинать без ожидания поставки из Караганды или России.",
      "Покрытий два, оба на металле 0,45 мм: матовое VikingMP — сдержанный вид без бликов, и глянцевый полиэстер — самый широкий выбор цветов по доступной цене.",
    ],
    coatings: [c.p2Matte, c.p2Glossy],
    prices: {},
    prices2: {
      "vikingmp@0.45": 3300,
      "polyester@0.45": 3075,
    },
  },
  {
    slug: "stella",
    name: "Stella",
    summary: "Модульная металлочерепица Stella: короткие листы со склада в Атырау.",
    description: [
      "Stella — модульная металлочерепица: лист состоит из нескольких рядов «черепиц», поэтому он короткий и лёгкий. Такие листы помещаются в легковой прицеп и легко поднимаются на крышу.",
      "Модульный лист хорошо подходит для бань, беседок, навесов и небольших домов: на короткие скаты уходит меньше обрезков. Stella есть на складе в Атырау, с матовым VikingMP и глянцевым полиэстером 0,45 мм.",
    ],
    coatings: [c.p2Matte, c.p2Glossy],
    prices: {},
    prices2: {
      "vikingmp@0.45": 3300,
      "polyester@0.45": 3075,
    },
  },
  {
    slug: "como",
    name: "Como",
    summary:
      "Модульная металлочерепица Como со склада в Атырау: свой рисунок, матовая или глянцевая.",
    description: [
      "Como — модульная металлочерепица со своим рисунком, отличным от Stella. Её укладывают ряд за рядом снизу вверх, поэтому длинный лист не приходится тянуть по всему скату.",
      "Если модуль повредили при монтаже или через годы, меняют только его, а не длинный лист через весь скат. Como продаётся со склада в Атырау: матовое VikingMP или глянцевый полиэстер, металл 0,45 мм.",
    ],
    coatings: [c.p2Matte, c.p2Glossy],
    prices: {},
    prices2: {
      "vikingmp@0.45": 3300,
      "polyester@0.45": 3075,
    },
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
        summary: model.family.summary,
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

/** 8140 → «8 140 ₸» */
export const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(value).replace(/\s/g, "\u00a0")}\u00a0₸`;

/** Минимальная цена за м² среди всех покрытий моделей */
export const minPrice = (models: Model[]) =>
  Math.min(...models.flatMap((m) => m.coatings.map((c) => priceOf(m, c) ?? Infinity)));

export const formatThickness = (t: number) => `${String(t).replace(".", ",")} мм`;

/**
 * Абзацы о ценах и наличии, собранные из прайса. У каждой модели свои цифры,
 * поэтому текст страниц моделей не повторяет друг друга.
 */
export const modelFacts = (model: Model): string[] => {
  const facts: string[] = [];
  const priced = model.coatings
    .map((c) => ({ c, price: priceOf(model, c) }))
    .filter((x): x is { c: Coating; price: number } => x.price !== undefined)
    .sort((a, b) => a.price - b.price);
  const label = (c: Coating) => `${c.name} ${formatThickness(c.thickness)}`;
  const cheap = priced[0];
  const dear = priced.at(-1);
  if (cheap && dear && cheap !== dear)
    facts.push(
      `Цена металлочерепицы ${model.name} в Атырау — от ${formatPrice(cheap.price)} за м² с покрытием ${label(cheap.c)} до ${formatPrice(dear.price)} с покрытием ${label(dear.c)}.`,
    );

  const inStock = [...new Set(model.coatings.filter((c) => c.stock === "atyrau").map(label))];
  const colorCount = new Set(model.coatings.flatMap((c) => c.colors)).size;
  if (inStock.length === model.coatings.length)
    facts.push(`Все покрытия ${model.name} есть на складе в Атырау, всего ${colorCount} цветов.`);
  else if (inStock.length === 0)
    facts.push(
      `${model.name} привозим под заказ: из Караганды, а если там нет — из России. Цветов на выбор: ${colorCount}.`,
    );
  else
    facts.push(
      `На складе в Атырау: ${inStock.join(", ")}. Остальные покрытия привозим под заказ. Цветов на выбор: ${colorCount}.`,
    );

  // Исполнения одного семейства сравниваем по общему покрытию со стандартным S
  const base = familyOf(model).find((m) => m.family?.version === "S");
  if (base && base !== model) {
    const shared = priced.find((x) => base.coatings.includes(x.c));
    const basePrice = shared && priceOf(base, shared.c);
    if (shared && basePrice && basePrice !== shared.price) {
      const diff = shared.price - basePrice;
      facts.push(
        `${label(shared.c)} у исполнения ${model.family!.version} стоит ${formatPrice(shared.price)} за м² — на ${formatPrice(Math.abs(diff))} ${diff > 0 ? "дороже" : "дешевле"}, чем у стандартного S.`,
      );
    }
  }
  return facts;
};
