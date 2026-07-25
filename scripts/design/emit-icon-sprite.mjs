// scripts/design/emit-icon-sprite.mjs
// Step 2.1c — emit production sprite.svg + icon-names.ts.
//
// Locked mappings per HALT 1A approval:
//   - 9 Tier-A icons: menu, copy-link, linkedin, linkedin-filled,
//     x-twitter, facebook, chevron-right, close
//   - 1 Tier-B icon: more-vertical
//
// (close-sm collapsed into close per Jake's Q2 disposition;
//  chain-link renamed to copy-link per parent-context push-back —
//  aria-label is "copy resource", parent class is .share-flex-item.)
//
// Normalization rules:
//   - Strip xmlns, width, height, fill="..." literal hex, stroke="..." literal hex,
//     style="cursor:..." / style="fill:..." encoded colors
//   - Strip class="...", id="..."
//   - Strip SMIL <animate> elements
//   - Preserve fill="none" and stroke-width attributes
//   - Preserve viewBox + path / circle / rect / polygon / line geometry
//   - Convert hex fills/strokes to "currentColor" (so Tailwind text color drives icon color)
//   - Convert rgba(0,0,0,0) and similar "transparent" fills to fill="none"

import fs from 'node:fs';
import path from 'node:path';

const inventory = JSON.parse(
  fs.readFileSync('audit-output/design-1/icon-classification.json', 'utf8'),
);

// Full-markup SVG re-fetch (the inventory's `sample` is truncated at 600 chars
// so paths longer than that are incomplete). icons-full-svg.json captures
// complete <svg>...</svg> markup via cheerio re-parse from rawHtml.
const fullSvg = JSON.parse(
  fs.readFileSync('audit-output/design-1/icons-full-svg.json', 'utf8'),
);

// Locked name map per HALT 1A approval
const NAME_MAP = [
  { hash: '0d0a7aa389b2', name: 'menu' },
  { hash: 'f74bb9e1af5e', name: 'copy-link' },        // was chain-link, renamed per aria-label "copy resource"
  { hash: '1036664bfffb', name: 'linkedin' },
  { hash: 'e189f7f56d6c', name: 'linkedin-filled' },  // was linkedin-square, renamed per Jake
  { hash: 'd25c3731b9e3', name: 'x-twitter' },
  { hash: 'd4652d3d0629', name: 'facebook' },
  { hash: '351f2db3bfec', name: 'chevron-right' },
  { hash: 'c1811fc69ba5', name: 'close' },
  { hash: 'abefe4fc2634', name: 'more-vertical' },
];

// Hashes explicitly dropped per HALT 1A approval (do not warn about these)
const DROPPED_KNOWN = new Set([
  'b9197bcf85fa', // close-sm — collapsed into close
  '9b8af86e8c74', // chevron-down — vendor-likely (HubSpot Tailwind embed)
]);

function getEntry(hash) {
  return inventory.classified.find((c) => c.hash === hash);
}

// SVG normalization — operate on the inner content (everything BETWEEN
// <svg ...> and </svg>) since we wrap with <symbol>.
function normalizeInnerContent(svgString) {
  // Extract inner content (between opening <svg ...> tag and closing </svg>)
  const innerMatch = svgString.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/);
  let inner = innerMatch ? innerMatch[1] : svgString;

  // Strip SMIL animation elements (CE menu icon has these — animation belongs in template, not sprite)
  inner = inner.replace(/<animate[\s\S]*?\/>/g, '');
  inner = inner.replace(/<animate\b[\s\S]*?<\/animate>/g, '');
  inner = inner.replace(/<animateTransform[\s\S]*?\/>/g, '');
  inner = inner.replace(/<animateTransform\b[\s\S]*?<\/animateTransform>/g, '');

  // Strip class / id / style="cursor:..." attributes from any nested element
  inner = inner.replace(/\s+class="[^"]*"/g, '');
  inner = inner.replace(/\s+id="[^"]*"/g, '');
  inner = inner.replace(/\s+style="[^"]*cursor:[^"]*"/gi, '');
  inner = inner.replace(/\s+style="[^"]*pointer-events:[^"]*"/gi, '');

  // Normalize fill/stroke colors
  // 1. Hex literals → currentColor
  inner = inner.replace(/\bfill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"');
  inner = inner.replace(/\bstroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"');
  // 2. The literal string "currentcolor" (lowercase) → "currentColor" (canonical case)
  inner = inner.replace(/\bfill="currentcolor"/gi, 'fill="currentColor"');
  inner = inner.replace(/\bstroke="currentcolor"/gi, 'stroke="currentColor"');
  // 3. rgba(0,0,0,0) and similar fully-transparent → fill="none"
  inner = inner.replace(/\bfill="rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0(\.0+)?\s*\)"/g, 'fill="none"');
  // 4. style="fill: #xxx" or style="fill: rgb(...)" → strip
  inner = inner.replace(/\s+style="[^"]*\bfill:\s*[^;"\)]*[;)]?[^"]*"/g, '');

  // 5. For shape elements (path/rect/circle/polygon/polyline/line/ellipse) with NO fill
  //    AND NO stroke attribute, add fill="currentColor". Without this, the symbol's
  //    parent fill="none" would cascade and render the shape invisible (per SVG spec
  //    presentation-attribute inheritance). CE's site CSS overrode this implicitly;
  //    we make it explicit here.
  inner = inner.replace(
    /<(path|rect|circle|polygon|polyline|line|ellipse)\b([^>]*)\/?>/g,
    (full, tag, attrs) => {
      if (/\bfill\s*=/.test(attrs) || /\bstroke\s*=/.test(attrs)) return full;
      // Append fill="currentColor"
      const trimmed = attrs.replace(/\/$/, '').trimEnd();
      return `<${tag}${trimmed} fill="currentColor"${full.endsWith('/>') ? ' />' : '>'}`;
    },
  );

  // 6. Collapse blank lines and whitespace introduced by element stripping
  inner = inner.replace(/\n\s*\n+/g, '\n');
  return inner.trim();
}

// Build symbol element
function buildSymbol(name, viewBox, normalizedInner, originalAttrs = {}) {
  // Pull stroke-related attrs from original outer <svg> if present —
  // they're often set at the SVG level and inherited by inner paths.
  // Specifically: fill, stroke, stroke-width, stroke-linecap, stroke-linejoin, fill-rule
  const carryOver = [];
  for (const attr of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule']) {
    if (originalAttrs[attr] !== undefined) {
      let val = originalAttrs[attr];
      // Normalize hex to currentColor
      if ((attr === 'fill' || attr === 'stroke') && /^#[0-9a-fA-F]{3,8}$/.test(val)) val = 'currentColor';
      if ((attr === 'fill' || attr === 'stroke') && /^currentcolor$/i.test(val)) val = 'currentColor';
      if ((attr === 'fill' || attr === 'stroke') && /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0(\.0+)?\s*\)$/.test(val)) val = 'none';
      carryOver.push(`${attr}="${val}"`);
    }
  }
  const attrStr = carryOver.length > 0 ? ' ' + carryOver.join(' ') : '';
  return `  <symbol id="${name}" viewBox="${viewBox}"${attrStr}>\n    ${normalizedInner}\n  </symbol>`;
}

// Parse outer <svg> attributes (so we can carry over stroke/fill defaults)
function parseSvgAttrs(svgString) {
  const m = svgString.match(/<svg\b([^>]*)>/);
  if (!m) return {};
  const attrStr = m[1];
  const attrs = {};
  // Match attr="value" pairs
  const pairs = attrStr.match(/(\w[\w-]*)="([^"]*)"/g) || [];
  for (const p of pairs) {
    const [k, v] = p.split('=');
    attrs[k] = v.slice(1, -1);
  }
  return attrs;
}

// Generate sprite.svg
const symbols = [];
const generatedAt = new Date().toISOString().slice(0, 10);

for (const { hash, name } of NAME_MAP) {
  const e = getEntry(hash);
  if (!e) {
    console.error(`✗ hash not found in inventory: ${hash} (intended: ${name})`);
    process.exit(1);
  }
  const fullMarkup = fullSvg[hash]?.fullSvg;
  if (!fullMarkup) {
    console.error(`✗ no full SVG markup for ${hash} (run refetch-full-svgs.mjs first)`);
    process.exit(1);
  }
  const originalAttrs = parseSvgAttrs(fullMarkup);
  const inner = normalizeInnerContent(fullMarkup);
  symbols.push(buildSymbol(name, e.viewBox, inner, originalAttrs));
  console.log(`✓ ${name.padEnd(18)} hash=${hash} viewBox="${e.viewBox}" inner=${inner.length}b`);
}

const spriteSvg = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Generated by scripts/design/emit-icon-sprite.mjs on ${generatedAt}.
  Source: audit-output/design-1/icon-classification.json (CE live-site icon probe).
  Naming + dispositions locked at MYGRATR-DESIGN-1 Step 2.1 HALT 1A.

  9 brand-curated CE icons after vendor filter (78 distinct → 41 vendor → 9 retained
  + 1 Tier-B = ${NAME_MAP.length} sprite symbols).

  All fills/strokes normalized to "currentColor" so Tailwind text color drives
  icon color via the Icon primitive's CSS.

  Do not hand-edit. Regenerate via: node scripts/design/emit-icon-sprite.mjs
-->
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true">
${symbols.join('\n')}
</svg>
`;

// Generate icon-names.ts
const tsBanner = `// AUTO-GENERATED — do not edit.
// Regenerate via: node scripts/design/emit-icon-sprite.mjs
// Source of truth: audit-output/design-1/icon-classification.json
// Naming locked at MYGRATR-DESIGN-1 Step 2.1 HALT 1A.

`;

const iconNamesArray = NAME_MAP.map((m) => `  '${m.name}',`).join('\n');
const iconNamesTs = `${tsBanner}export const ICON_NAMES = [
${iconNamesArray}
] as const

export type IconName = (typeof ICON_NAMES)[number]
`;

// Write outputs
const SPRITE_PATH = 'site/src/components/ui/_icons/sprite.svg';
const NAMES_PATH = 'site/src/components/ui/_icons/icon-names.ts';
fs.mkdirSync(path.dirname(SPRITE_PATH), { recursive: true });
fs.writeFileSync(SPRITE_PATH, spriteSvg);
fs.writeFileSync(NAMES_PATH, iconNamesTs);

// Also copy to public/ for static serving
const PUBLIC_SPRITE_PATH = 'site/public/icons/sprite.svg';
fs.mkdirSync(path.dirname(PUBLIC_SPRITE_PATH), { recursive: true });
fs.writeFileSync(PUBLIC_SPRITE_PATH, spriteSvg);

console.log('\n✓ wrote:', SPRITE_PATH);
console.log('✓ wrote:', NAMES_PATH);
console.log('✓ wrote:', PUBLIC_SPRITE_PATH, '(for runtime serving)');
console.log('\nDropped (per HALT 1A approval):');
for (const hash of DROPPED_KNOWN) {
  const e = getEntry(hash);
  console.log(`  ${hash}  ${e ? '(' + e.count + '×, ' + e.viewBox + ')' : '(not found)'}`);
}
