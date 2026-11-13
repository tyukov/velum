/** Данные компании: используются в разметке schema.org, политике конфиденциальности и текстах */
export const business = {
  name: "Velum",
  url: "https://velum.kz/",
  city: "Атырау",
  phoneE164: "+77010131359",
  phoneDisplay: "8\u00a0701\u00a0013\u00a013\u00a059",
  /** Профили компании: поисковики связывают их с сайтом (schema.org sameAs) */
  sameAs: ["https://www.instagram.com/velum.kz"],
  description:
    "Магазин кровельных и фасадных материалов: металлочерепица, профнастил, водосточные системы, сайдинг.",
  // Оператор персональных данных для /privacy. Торговля без офиса — указываем город
  legal: {
    name: "ИП «Velum»",
    iin: "980411350668",
    location: "г. Атырау, Республика Казахстан",
    email: "info@velum.kz",
  },
} as const;
