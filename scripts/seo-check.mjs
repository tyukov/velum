#!/usr/bin/env node
// SEO-проверка собранного сайта. Запускается после `astro build` (npm run seo) и в CI.
// Останавливает сборку, если у страницы нет обязательных SEO-элементов или они нарушают правила.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SITE = "https://velum.kz";
const ROOT = process.argv[2] ?? ".vercel/output/static";

const RULES = {
  /** Заголовок индексируемой страницы: Google показывает около 60 символов */
  titleMax: 60,
  /** Заголовок страницы варианта (canonical на модель) — немного длиннее допустимо */
  variantTitleMax: 70,
  descriptionMin: 70,
  descriptionMax: 160,
};

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith(".html") ? [full] : [];
  });

const pathOf = (file) => {
  const p =
    "/" +
    relative(ROOT, file)
      .replace(/\\/g, "/")
      .replace(/(index)?\.html$/, "");
  return p === "/" ? "/" : p.replace(/\/$/, "");
};

const attr = (html, re) => html.match(re)?.[1];
const decode = (s) =>
  s
    ?.replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'");

if (!existsSync(ROOT)) {
  console.error(`Нет папки сборки ${ROOT}: сначала выполните npm run build`);
  process.exit(1);
}

const problems = [];
const pages = htmlFiles(ROOT).map((file) => {
  const html = readFileSync(file, "utf8");
  const path = pathOf(file);
  const page = {
    path,
    title: decode(attr(html, /<title>([^<]*)<\/title>/)),
    description: decode(attr(html, /<meta name="description" content="([^"]*)"/)),
    canonical: attr(html, /<link rel="canonical" href="([^"]*)"/),
    noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
  };
  const fail = (msg) => problems.push(`${path}: ${msg}`);

  if (!/<html lang="ru"/.test(html)) fail('нет <html lang="ru">');
  if (!page.title) fail("нет <title>");
  if (!page.description) fail("нет meta description");
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(`должен быть один <h1>, найдено ${h1}`);
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) {
    if (!/\balt(=|\s|>)/.test(img)) fail(`картинка без alt: ${img.slice(0, 80)}`);
  }
  for (const [, json] of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      JSON.parse(json);
    } catch {
      fail("ошибка в JSON-LD разметке");
    }
  }

  if (!page.noindex) {
    if (!page.canonical?.startsWith(SITE)) fail(`canonical должен начинаться с ${SITE}`);
    page.isCanonical = page.canonical === SITE + (path === "/" ? "/" : path);
    const max = page.isCanonical ? RULES.titleMax : RULES.variantTitleMax;
    if (page.title && page.title.length > max)
      fail(`title длиннее ${max} символов (${page.title.length}): «${page.title}»`);
    const d = page.description?.length ?? 0;
    if (page.description && (d < RULES.descriptionMin || d > RULES.descriptionMax))
      fail(`description ${d} символов, нужно ${RULES.descriptionMin}–${RULES.descriptionMax}`);
    for (const prop of ["og:title", "og:description", "og:image"]) {
      if (!html.includes(`property="${prop}"`)) fail(`нет ${prop}`);
    }
  }
  return page;
});

// Уникальные title и description у канонических страниц
const canonical = pages.filter((p) => !p.noindex && p.isCanonical);
for (const key of ["title", "description"]) {
  const seen = new Map();
  for (const p of canonical) {
    if (seen.has(p[key])) problems.push(`${p.path}: ${key} совпадает с ${seen.get(p[key])}`);
    else seen.set(p[key], p.path);
  }
}

// Карта сайта: все канонические страницы и только они
const sitemapFile = join(ROOT, "sitemap-0.xml");
if (!existsSync(sitemapFile)) problems.push("нет sitemap-0.xml");
else {
  const inSitemap = new Set(
    [...readFileSync(sitemapFile, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      m[1] === `${SITE}/` ? "/" : m[1].replace(SITE, ""),
    ),
  );
  for (const p of canonical) {
    if (!inSitemap.has(p.path)) problems.push(`${p.path}: нет в sitemap`);
  }
  for (const p of pages.filter((p) => p.noindex || (p.canonical && !p.isCanonical))) {
    if (inSitemap.has(p.path)) problems.push(`${p.path}: не каноническая страница в sitemap`);
  }
}

if (problems.length) {
  console.error(`SEO-проверка: ${problems.length} проблем`);
  for (const p of problems.slice(0, 50)) console.error("  " + p);
  if (problems.length > 50) console.error(`  … и ещё ${problems.length - 50}`);
  process.exit(1);
}
console.log(
  `SEO-проверка пройдена: ${pages.length} страниц, ${canonical.length} канонических в sitemap`,
);
