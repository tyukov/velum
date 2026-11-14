// Эскиз дома отдельным SVG-файлом (для <img>): та же графика, что на главной, со своими стилями
// внутри файла. active — какая часть в цвете (roof, facade, fence, gutter, trims или none).
import houseInner from "../assets/sketch/house-inner.svg?raw";
import houseCss from "../assets/sketch/house.css?raw";

export function houseSvg(active: string, roof = "#454a52", overlay = "") {
  const [wash, house] = houseInner.split("<!--HOUSE-->");
  // В картинке рисунок сразу готов: без анимации прорисовки
  const css = `${houseCss}\n.la [data-part]{animation:none}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 600"><style>${css}</style>${wash}` +
    `<g class="la" data-active="${active}" style="--roof:${roof};--trim:#24272b;--gutter:#2f3237">${house}</g>` +
    `${overlay}</svg>`
  );
}

export const svgResponse = (svg: string) =>
  new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
