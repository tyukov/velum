// Эскиз дома отдельной картинкой для окна заявки и страницы 404: тот же рисунок, что на главной,
// но файлом (кэшируется браузером и не утяжеляет каждую страницу). Генерируется при сборке.
// roof — крыша в цвете, остальное линиями; line — только линии.
import type { APIRoute, GetStaticPaths } from "astro";
import houseInner from "../../assets/sketch/house-inner.svg?raw";
import houseCss from "../../assets/sketch/house.css?raw";

export const getStaticPaths = (() => [
  { params: { mode: "roof" } },
  { params: { mode: "line" } },
]) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const [wash, house] = houseInner.split("<!--HOUSE-->");
  // В картинке рисунок сразу готов: без анимации прорисовки
  const css = `${houseCss}\n.la [data-part]{animation:none}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 600"><style>${css}</style>${wash}<g class="la" data-active="${params.mode === "roof" ? "roof" : "none"}" style="--roof:#454a52;--trim:#24272b;--gutter:#2f3237">${house}</g></svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
};
