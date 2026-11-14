// Эскиз дома для окна заявки и страницы 404. Генерируется при сборке.
// roof — крыша в цвете, остальное линиями; line — только линии.
import type { APIRoute, GetStaticPaths } from "astro";
import { houseSvg, svgResponse } from "../../lib/house-svg";

export const getStaticPaths = (() => [
  { params: { mode: "roof" } },
  { params: { mode: "line" } },
]) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  svgResponse(houseSvg(params.mode === "roof" ? "roof" : "none"));
