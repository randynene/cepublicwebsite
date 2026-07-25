// scripts/design/refetch-full-svgs.mjs
// Re-fetch FULL SVG markup for the 9 locked icons from audit-output/pages/.
// The original probe truncated `sample` to 600 chars; for paths longer
// than that (LinkedIn / copy-link / more-vertical), markup is incomplete.
// This script re-extracts complete <svg>...</svg> from rawHtml using
// path-data signatures to locate each icon.

import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import crypto from 'node:crypto';

// Locked hashes (matches NAME_MAP in emit-icon-sprite.mjs)
const TARGET_HASHES = [
  '0d0a7aa389b2',
  'f74bb9e1af5e',
  '1036664bfffb',
  'e189f7f56d6c',
  'd25c3731b9e3',
  'd4652d3d0629',
  '351f2db3bfec',
  'c1811fc69ba5',
  'abefe4fc2634',
];

const PAGES_DIR = path.resolve('audit-output/pages');
const inventory = JSON.parse(
  fs.readFileSync('audit-output/design-1/icon-classification.json', 'utf8'),
);

// Same hash function the original probe used
function hashSvg(viewBox, paths) {
  const norm = (viewBox || '') + '|' + paths.map((p) => p.replace(/\s+/g, ' ').trim()).sort().join('||');
  return crypto.createHash('sha1').update(norm).digest('hex').slice(0, 12);
}

// For each target hash, find a page that contains it and re-extract.
const results = {};
const dirs = fs.readdirSync(PAGES_DIR);

for (const hash of TARGET_HASHES) {
  const orig = inventory.classified.find((c) => c.hash === hash);
  if (!orig) {
    console.error(`hash not in inventory: ${hash}`);
    continue;
  }
  // Try the first listed source page
  for (const slug of orig.sources) {
    const f = path.join(PAGES_DIR, slug, 'content.json');
    if (!fs.existsSync(f)) continue;
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const html = j.rawHtml || '';
    if (!html) continue;
    const $ = cheerio.load(html, { xml: false }, false);
    let found = null;
    $('svg').each((_, svg) => {
      if (found) return;
      const $svg = $(svg);
      const viewBox = $svg.attr('viewBox') || '';
      const paths = $svg.find('path').map((__, p) => $(p).attr('d') || '').get().filter(Boolean);
      if (paths.length === 0 && !$svg.find('rect, circle, polygon, polyline, line, ellipse').length) return;
      const h = hashSvg(viewBox, paths);
      if (h === hash) {
        // Capture full outerHTML (cheerio's $.html(svg) gives complete markup)
        found = $.html(svg);
      }
    });
    if (found) {
      results[hash] = { slug, fullSvg: found, viewBox: orig.viewBox };
      console.log(`✓ ${hash}  full markup ${found.length} bytes  (from ${slug})`);
      break;
    }
  }
  if (!results[hash]) {
    console.error(`✗ ${hash}: not found in any source page`);
  }
}

// Persist for the emit step to consume
fs.writeFileSync(
  'audit-output/design-1/icons-full-svg.json',
  JSON.stringify(results, null, 2),
);
console.log('\nWrote audit-output/design-1/icons-full-svg.json');
