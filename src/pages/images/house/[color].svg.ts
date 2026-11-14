// Эскиз дома с крышей нужного цвета — вид «На доме» на странице товара. Генерируется при сборке
// для каждого цвета каталога.
import type { APIRoute, GetStaticPaths } from "astro";
import { colors, colorSlug } from "../../../data/catalog/colors";
import { metalTileModels } from "../../../data/catalog/metal-tile";
import { houseSvg, svgResponse } from "../../../lib/house-svg";

export const getStaticPaths = (() => {
  const used = new Set(metalTileModels.flatMap((m) => m.coatings.flatMap((c) => c.colors)));
  return [...used].map((code) => ({
    params: { color: colorSlug(code) },
    props: { hex: colors[code]!.hex },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => svgResponse(houseSvg("roof", props.hex as string));
