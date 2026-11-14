// Статьи: тексты перенесены из макета (articles.json), рисунки — /images/art/<name>.svg
import data from "./articles.json";

export interface Article {
  slug: string;
  category: string;
  minutes: number;
  title: string;
  lead: string;
  /** Короткое описание для карточки в списке */
  card: string;
  /** Рисунок: /images/art/<art>.svg */
  art: string;
  toc: { id: string; title: string }[];
  html: string;
  faq: { q: string; a: string }[];
  cta: { title: string; text: string; button: string } | null;
  related: string[];
}

/** Дата публикации и последнего обновления статей */
export const ARTICLES_UPDATED = "2026-11-14";

// Порядок в списке: сначала выбор, потом расчёт, монтаж, уход, забор
const ORDER = ["Выбор", "Расчёт", "Монтаж", "Уход", "Забор и фасад"];
export const articles: Article[] = (data as Article[])
  .slice()
  .sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));

export const categories = ORDER.filter((c) => articles.some((a) => a.category === c));

/** Короткие названия для хлебных крошек */
export const SHORT: Record<string, string> = {
  raschet: "Расчёт металлочерепицы",
  vybor: "Выбор металлочерепицы",
  pokrytiya: "Покрытия",
  "vs-profnastil": "Металлочерепица или профнастил",
  cvet: "Цвет крыши",
  oshibki: "Ошибки монтажа",
  samorezy: "Саморезы",
  vodostok: "Водосток",
  zabor: "Забор из профнастила",
  uhod: "Уход за крышей",
  hranenie: "Разгрузка и хранение",
};

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);

export const formatDate = (iso: string) => iso.split("-").reverse().join(".");
