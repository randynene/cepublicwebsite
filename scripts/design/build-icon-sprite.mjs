// scripts/design/build-icon-sprite.mjs
// Step 2.1 — vendor-filter pass + sprite generator + IconName type emitter.
//
// Input:  audit-output/design-1/icon-inventory.json (78 distinct SVGs from probe)
// Output:
//   - audit-output/design-1/icon-classification.json (full classification dump)
//   - site/src/components/ui/_icons/sprite.svg (production sprite — CE-brand only)
//   - site/src/components/ui/_icons/icon-names.ts (typed union)
//
// Vendor-filter heuristics:
//   - viewBox 36×36 + ytp-* class refs → YouTube player UI
//   - viewBox 67×60 → YouTube logo
//   - viewBox 110×26 → YouTube wordmark
//   - viewBox 22×32 → YouTube settings/icons
//   - viewBox 1260×1122, 1600×858, 270×204 → YouTube-area illustrative
//   - 24×24 chat-bubble path (M21 15a2 2 0 …) → Clara/Hotjar chat widget
//   - 24×24 search (circle + line stroke) at 616× → vendor search
//
// Anything else → CE candidate. Naming inferred from path shape where
// possible; otherwise flagged ambiguous.

import fs from 'node:fs';
import path from 'node:path';

const inventory = JSON.parse(
  fs.readFileSync('audit-output/design-1/icon-inventory.json', 'utf8'),
);

const VENDOR_VIEWBOXES_AUTO_DROP = new Set([
  '0 0 36 36',     // YouTube player
  '0 0 67 60',     // YouTube logo
  '0 0 110 26',    // YouTube wordmark
  '0 0 22 32',     // YouTube settings
  '0 0 1260 1122', // YouTube area illustration
  '0 0 1600 858',  // YouTube area illustration
  '0 0 270 204',   // YouTube area illustration
]);

// Path-data signatures of vendor icons we know to drop
const VENDOR_PATH_SIGNATURES = [
  // Clara/Hotjar chat bubble — 924× usage
  'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
];

// YouTube player icons all carry these distinctive style/attribute combinations.
// Inline SVGs in CE's CMS content / Webflow templates do NOT use these.
const YT_PLAYER_STYLE_SIGNATURES = [
  'pointer-events: none; display: inherit',
  'pointer-events: none;display: inherit',
];

// Try to guess a slug from path content + viewBox shape
function guessName(viewBox, sample) {
  const path1 = (sample.match(/<path[^>]+d=["']([^"']+)["']/) || [])[1] || '';
  const has = (s) => sample.includes(s);

  // Common shape recognizers (CE-style icons)
  if (/M\s*\d+\s+\d+\s*L/.test(path1) && viewBox === '0 0 24 24') return 'unknown-line-24';
  if (has('<circle') && has('<line')) {
    const r = sample.match(/<circle[^>]+r=["']([^"']+)["']/);
    if (r && parseFloat(r[1]) >= 7 && parseFloat(r[1]) <= 11) return 'search';
  }
  // Arrow / chevron heuristics: small triangular paths
  if (/m\s*\d+(\.\d+)?[\s,]+\d+(\.\d+)?\s*l\s*-?\d+(\.\d+)?[\s,]+\d+(\.\d+)?\s*l\s*-?\d+(\.\d+)?[\s,]+-?\d+(\.\d+)?\s*z?/i.test(path1) && /22 32/.test(viewBox)) {
    return 'play-triangle';
  }
  // Plus / X / close
  if (/M\s*1[27](\.\d+)?\s*[,.\s]/.test(path1) && viewBox === '0 0 24 24' && path1.length < 80) {
    if (/M.*L.*L.*L.*L/.test(path1)) return 'plus-or-close';
  }
  return null;
}

const classified = []; // { hash, classification, suggestedName, ambiguous, ... }

for (const [hash, e] of Object.entries(inventory.svgs)) {
  const sample = e.sample || '';
  const viewBox = e.viewBox || '';
  let classification, suggestedName = null, reason = '';

  // 1. Auto-drop vendor viewBoxes
  if (VENDOR_VIEWBOXES_AUTO_DROP.has(viewBox)) {
    classification = 'vendor-youtube';
    reason = `viewBox ${viewBox} — YouTube area`;
  }
  // 2. YouTube class signatures
  else if (/ytp-svg-(shadow|fill)|ytp-id-/.test(sample)) {
    classification = 'vendor-youtube';
    reason = 'ytp-* class signature';
  }
  // 2b. YouTube player icon style signature (fills 414-422× hashes that escape #1, #2)
  else if (YT_PLAYER_STYLE_SIGNATURES.some((sig) => sample.includes(sig))) {
    classification = 'vendor-youtube';
    reason = 'YouTube player style signature ("pointer-events: none; display: inherit")';
  }
  // 2c. Vimeo player UI — CSS-module class names + data-* attributes
  else if (
    /_module_[a-z]+__[a-f0-9]+/i.test(sample) ||
    /data-(play-icon|volume-icon|volume-muted-icon|cc-icon|enter-fullscreen|spinner|tiny-buffer-pattern|spinner-trace|spinner-circle)=/i.test(sample)
  ) {
    classification = 'vendor-vimeo';
    reason = 'Vimeo player CSS-module / data-* signature';
  }
  // 2d. Webflow stock UI components (w-pagination-*, w-nav-*, etc.)
  else if (/class=["'][^"']*\bw-(pagination|nav|tabs|slider|dropdown)-/i.test(sample)) {
    classification = 'vendor-webflow';
    reason = 'Webflow w-* stock UI class signature';
  }
  // 2e. CSS-in-JS hash class signature (Atlassian / Emotion / styled-components vendor widgets)
  else if (/class=["'][^"']*\bcss-[a-z0-9]{4,}\b/i.test(sample)) {
    classification = 'vendor-css-in-js';
    reason = 'CSS-in-JS hash class signature (vendor widget)';
  }
  // 3. Specific known vendor path signatures
  else if (VENDOR_PATH_SIGNATURES.some((sig) => sample.includes(sig))) {
    classification = 'vendor-chat';
    reason = 'matches Clara/Hotjar chat-bubble path';
  }
  // 4. Massive footprint at 24×24 with stroke icons (likely vendor unless content matches CE)
  else if (e.count >= 400 && viewBox === '0 0 24 24' && sample.includes('stroke="currentColor"') && sample.includes('stroke-width')) {
    // Search icon variants typically have count >= 600
    if (sample.includes('<circle') && sample.includes('<line')) {
      classification = 'vendor-search';
      reason = `search-shape stroke icon at ${e.count}× usage`;
    } else {
      classification = 'ambiguous';
      reason = `high-frequency stroke icon at 24×24, ${e.count}×`;
      suggestedName = guessName(viewBox, sample);
    }
  }
  // 5. Everything else — CE candidate
  else {
    classification = 'ce-candidate';
    suggestedName = guessName(viewBox, sample);
  }

  classified.push({
    hash,
    classification,
    suggestedName,
    reason,
    count: e.count,
    viewBox,
    pathCount: e.pathCount,
    sample,
    sources: e.sources,
  });
}

// Categorise
const buckets = {
  ce: classified.filter((c) => c.classification === 'ce-candidate'),
  vendorYouTube: classified.filter((c) => c.classification === 'vendor-youtube'),
  vendorVimeo: classified.filter((c) => c.classification === 'vendor-vimeo'),
  vendorWebflow: classified.filter((c) => c.classification === 'vendor-webflow'),
  vendorCssInJs: classified.filter((c) => c.classification === 'vendor-css-in-js'),
  vendorChat: classified.filter((c) => c.classification === 'vendor-chat'),
  vendorSearch: classified.filter((c) => c.classification === 'vendor-search'),
  ambiguous: classified.filter((c) => c.classification === 'ambiguous'),
};

console.log('--- pre-filter ---');
console.log('total distinct SVGs:', classified.length);
console.log();
console.log('--- post-filter classification ---');
console.log('CE candidates:           ', buckets.ce.length);
console.log('vendor — YouTube:        ', buckets.vendorYouTube.length);
console.log('vendor — Vimeo:          ', buckets.vendorVimeo.length);
console.log('vendor — Webflow stock:  ', buckets.vendorWebflow.length);
console.log('vendor — CSS-in-JS widget:', buckets.vendorCssInJs.length);
console.log('vendor — chat:           ', buckets.vendorChat.length);
console.log('vendor — search:         ', buckets.vendorSearch.length);
console.log('ambiguous:               ', buckets.ambiguous.length);
const totalVendor = buckets.vendorYouTube.length + buckets.vendorVimeo.length + buckets.vendorWebflow.length + buckets.vendorCssInJs.length + buckets.vendorChat.length + buckets.vendorSearch.length;
console.log('TOTAL FILTERED OUT:      ', totalVendor);
console.log('TOTAL RETAINED (CE):     ', buckets.ce.length, '(plus', buckets.ambiguous.length, 'ambiguous awaiting classify)');

// Persist classification dump
fs.writeFileSync(
  'audit-output/design-1/icon-classification.json',
  JSON.stringify({ classified, buckets: {
    ce: buckets.ce.map(b => b.hash),
    vendorYouTube: buckets.vendorYouTube.map(b => b.hash),
    vendorVimeo: buckets.vendorVimeo.map(b => b.hash),
    vendorChat: buckets.vendorChat.map(b => b.hash),
    vendorSearch: buckets.vendorSearch.map(b => b.hash),
    ambiguous: buckets.ambiguous.map(b => b.hash),
  } }, null, 2),
);
console.log('\nFull classification: audit-output/design-1/icon-classification.json');

// Sample 5 CE candidates by frequency for HALT eyeball
const ceSorted = buckets.ce.sort((a, b) => b.count - a.count);
console.log('\n--- 5 sample CE-candidate icons (top of frequency) ---');
for (const c of ceSorted.slice(0, 5)) {
  console.log(`\n=== hash ${c.hash}  count=${c.count}×  viewBox="${c.viewBox}"  suggestedName=${c.suggestedName || '(none)'} ===`);
  console.log(c.sample);
}

console.log('\n--- ALL CE candidates (frequency-ordered, no markup) ---');
for (const c of ceSorted) {
  console.log(`  ${c.hash}  ${String(c.count).padStart(4)}×  vB="${c.viewBox.padEnd(13)}"  pathCount=${c.pathCount}  suggested=${c.suggestedName || '(none)'}`);
}

if (buckets.ambiguous.length > 0) {
  console.log('\n--- AMBIGUOUS — manual classify needed ---');
  for (const c of buckets.ambiguous) {
    console.log(`\n=== hash ${c.hash}  count=${c.count}×  viewBox="${c.viewBox}" ===`);
    console.log(`Reason: ${c.reason}`);
    console.log(c.sample);
  }
}

// At this point we don't yet write the sprite or the type union — that
// requires Jake's manual naming pass on the CE candidates + ambiguous
// classification. HALT 1A surfaces the data; sprite gen is gated on
// Jake's go-ahead with confirmed names.
console.log('\n--- HALT 1A ---');
console.log('Sprite + IconName type emission is gated on Jake confirming the');
console.log('CE candidate set + manual names per icon. Awaiting eyeball.');
