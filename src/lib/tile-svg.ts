// Рисунок листа металлочерепицы в заданном цвете. Один источник для картинки на странице
// и для JPEG, которые видят поисковики и мессенджеры (/images/tile/<цвет>.jpg).

/** Размер картинки: подходит и для превью ссылки (og:image), и для карточки товара в поиске */
export const TILE_IMAGE = { width: 1200, height: 630 } as const;

export const tileImagePath = (slug: string) => `/images/tile/${slug}.jpg`;

/** Внутренние элементы SVG; id нужен уникальный, если на странице несколько рисунков */
export function tileSvgContent(hex: string, id: string, width = 240, height = 160) {
  return `<defs>
  <pattern id="${id}-p" width="40" height="32" patternUnits="userSpaceOnUse">
    <rect width="40" height="32" fill="${hex}"/>
    <path d="M0 0 Q20 30 40 0 L40 32 L0 32 Z" fill="#000" fill-opacity="0.18"/>
    <path d="M0 2 Q20 30 40 2" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="2"/>
    <rect y="30" width="40" height="2" fill="#000" fill-opacity="0.25"/>
  </pattern>
  <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.18"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.18"/>
  </linearGradient>
</defs>
<rect width="${width}" height="${height}" fill="url(#${id}-p)"/>
<rect width="${width}" height="${height}" fill="url(#${id}-g)"/>`;
}

/** Отдельный SVG-документ для растеризации в JPEG: узор того же масштаба, что на странице */
export function tileSvgDocument(hex: string) {
  // Рисуем в масштабе 240×126 и растягиваем до 1200×630 — узор крупный, как на сайте
  const w = 240;
  const h = Math.round((w * TILE_IMAGE.height) / TILE_IMAGE.width);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_IMAGE.width}" height="${TILE_IMAGE.height}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${tileSvgContent(hex, "t", w, h)}</svg>`;
}
