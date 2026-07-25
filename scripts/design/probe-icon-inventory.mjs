// scripts/design/probe-icon-inventory.mjs
// Pre-Step-2 Probe 1: enumerate distinct SVG icons + Material Symbols
// ligatures across CE's audit-captured page set.
//
// Source: audit-output/pages/{slug}/content.json `rawHtml` field.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';

const PAGES_DIR = path.resolve('audit-output/pages');
const dirs = fs.readdirSync(PAGES_DIR);

// Maps for dedup
const svgByHash = new Map(); // hash → { count, viewBox, sample, sources: [pageSlug, ...] }
const ligaturesByName = new Map(); // ligature text → { count, classes, sources }

let pagesScanned = 0;
let pagesWithRawHtml = 0;
let svgErrors = 0;

function hashSvg(viewBox, paths) {
  const norm = (viewBox || '') + '|' + paths.map((p) => p.replace(/\s+/g, ' ').trim()).sort().join('||');
  return crypto.createHash('sha1').update(norm).digest('hex').slice(0, 12);
}

for (const slug of dirs) {
  const f = path.join(PAGES_DIR, slug, 'content.json');
  if (!fs.existsSync(f)) continue;
  pagesScanned++;
  let j;
  try {
    j = JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    continue;
  }
  const html = j.rawHtml;
  if (!html || typeof html !== 'string') continue;
  pagesWithRawHtml++;

  let $;
  try {
    $ = cheerio.load(html, { xml: false }, false);
  } catch {
    svgErrors++;
    continue;
  }

  // SVG extraction
  $('svg').each((_, svg) => {
    const $svg = $(svg);
    const viewBox = $svg.attr('viewBox') || '';
    const paths = $svg.find('path').map((__, p) => $(p).attr('d') || '').get().filter(Boolean);
    const hasOtherShapes = $svg.find('rect, circle, polygon, polyline, line, ellipse').length > 0;
    if (paths.length === 0 && !hasOtherShapes) return;
    const hash = hashSvg(viewBox, paths);
    const e = svgByHash.get(hash) || {
      count: 0,
      viewBox,
      sample: $.html(svg).slice(0, 600),
      sources: [],
      pathCount: paths.length,
    };
    e.count++;
    if (e.sources.length < 5) e.sources.push(slug);
    svgByHash.set(hash, e);
  });

  // Material Symbols extraction
  $('[class*="material-symbols"]').each((_, el) => {
    const text = ($(el).text() || '').trim();
    if (!text || text.length > 60) return;
    const e = ligaturesByName.get(text) || {
      count: 0,
      classes: $(el).attr('class') || '',
      sources: [],
    };
    e.count++;
    if (e.sources.length < 5) e.sources.push(slug);
    ligaturesByName.set(text, e);
  });
}

console.log('--- scan summary ---');
console.log('pages scanned:               ', pagesScanned);
console.log('pages with rawHtml:          ', pagesWithRawHtml);
console.log('JSDOM parse errors:          ', svgErrors);
console.log('distinct SVG icons:          ', svgByHash.size);
console.log('distinct Material Symbols:   ', ligaturesByName.size);

console.log('\n--- top 10 SVG icons by frequency ---');
const svgSorted = [...svgByHash.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [hash, e] of svgSorted.slice(0, 10)) {
  console.log(`${String(e.count).padStart(5)}× hash=${hash} viewBox="${e.viewBox || '(none)'}" pathCount=${e.pathCount}`);
  console.log(`        sources: ${e.sources.slice(0, 3).join(', ')}${e.sources.length > 3 ? ` (+${e.sources.length - 3} more)` : ''}`);
}

console.log('\n--- top 10 Material Symbols by frequency ---');
const ligSorted = [...ligaturesByName.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [name, e] of ligSorted.slice(0, 10)) {
  console.log(`${String(e.count).padStart(5)}× ${name.padEnd(30)} class="${e.classes.slice(0, 50)}"`);
}

console.log('\n--- 5 sample SVG icons (full markup, top of frequency list) ---');
for (const [hash, e] of svgSorted.slice(0, 5)) {
  console.log(`\n=== hash ${hash} (${e.count}× across site) ===`);
  console.log(e.sample);
}

// Persist full inventory for reference (not surfaced — too large for chat).
fs.mkdirSync('audit-output/design-1', { recursive: true });
fs.writeFileSync(
  'audit-output/design-1/icon-inventory.json',
  JSON.stringify({
    measuredAt: new Date().toISOString(),
    pagesScanned,
    pagesWithRawHtml,
    svgs: Object.fromEntries(svgSorted.map(([h, e]) => [h, { count: e.count, viewBox: e.viewBox, pathCount: e.pathCount, sources: e.sources, sample: e.sample }])),
    ligatures: Object.fromEntries(ligSorted.map(([n, e]) => [n, { count: e.count, classes: e.classes, sources: e.sources }])),
  }, null, 2),
);
console.log('\nFull inventory: audit-output/design-1/icon-inventory.json');
