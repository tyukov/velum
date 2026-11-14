// Рисунки к статьям: эскиз дома с нужной частью в цвете и пометками поверх (размеры, подписи)
// или отдельная схема (слои покрытия, кровельный пирог, саморез, хранение). Генерируется при сборке.
import type { APIRoute, GetStaticPaths } from "astro";
import arts from "../../../data/articles/art.json";
import { houseSvg, svgResponse } from "../../../lib/house-svg";

type Art = { title: string; house: { active: string; roof: string } | null; svg: string };

export const getStaticPaths = (() =>
  Object.keys(arts).map((name) => ({ params: { name } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const art = (arts as Record<string, Art>)[params.name!]!;
  if (art.house)
    return svgResponse(houseSvg(art.house.active, art.house.roof || undefined, art.svg));
  return svgResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 600">${art.svg}</svg>`,
  );
};
