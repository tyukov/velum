// JPEG рисунка металлочерепицы для каждого цвета каталога: картинка товара в разметке
// schema.org и превью ссылки в мессенджерах. Генерируется при сборке.
import type { APIRoute, GetStaticPaths } from "astro";
import sharp from "sharp";
import { colors, colorSlug } from "../../../data/catalog/colors";
import { metalTileModels } from "../../../data/catalog/metal-tile";
import { tileSvgDocument } from "../../../lib/tile-svg";

export const getStaticPaths = (() => {
  const used = new Set(metalTileModels.flatMap((m) => m.coatings.flatMap((c) => c.colors)));
  return [...used].map((code) => ({
    params: { slug: colorSlug(code) },
    props: { hex: colors[code]!.hex },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const jpeg = await sharp(Buffer.from(tileSvgDocument(props.hex as string)))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg" } });
};
