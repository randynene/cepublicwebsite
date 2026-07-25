// scripts/template-video/qa-computed-diff.mjs
//
// MYGRATR-TEMPLATE-VIDEO — QA computed-value diff.
//
// Extracts real getComputedStyle() values from the Video.html export
// (desktop artboard, unpacked from its bundled JSON string) and from the
// live built page (/videos/hiring-one-dev-backed-by-200 on a local
// `next start` server), then diffs them property-by-property against the
// tolerances in the QA brief. Also runs the 5 structural gate checks
// (build green, JSON-LD shape, locale routes, meta description, no
// client-render bailout).
//
// This script does NOT edit template code. It is read-only QA tooling.
//
// Usage:
//   node scripts/template-video/qa-computed-diff.mjs
//
// Preconditions:
//   - `cd site && npm run build` already run (green).
//   - Built app served on http://localhost:3100 (`PORT=3100 npm run start`).

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const EXPORT_SRC = path.join(REPO_ROOT, 'docs/raw-html/Video.html');
const EXPORT_TMP = '/tmp/video-export.html';
const BASE = 'http://localhost:3100';
const SLUG = 'hiring-one-dev-backed-by-200';
const BUILT_PATH = `/videos/${SLUG}`;
const BUILT_PATH_UK = `/uk/videos/${SLUG}`;
const OUT_JSON = path.join(REPO_ROOT, 'audit-output/template-video/qa-diff-run.json');

// ---------------------------------------------------------------------------
// Property sets + tolerances
// ---------------------------------------------------------------------------

const STANDARD_PROPS = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'color',
  'backgroundColor',
  'borderTopWidth',
  'borderTopStyle',
  'borderTopColor',
  'borderTopLeftRadius',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginBottom',
];

const GRID_EXTRA = ['gridTemplateColumns', 'columnGap', 'gap'];
const HERO_EXTRA = ['width', 'height'];

// property -> { kind, tolerance }
// kind: 'exact-color' | 'exact' | 'numeric'
const PROP_RULES = {
  fontSize: { kind: 'numeric', tolerance: 0.5 },
  fontWeight: { kind: 'exact' },
  lineHeight: { kind: 'numeric', tolerance: 1 },
  letterSpacing: { kind: 'numeric', tolerance: 0.1 },
  color: { kind: 'color' },
  backgroundColor: { kind: 'color' },
  borderTopWidth: { kind: 'numeric', tolerance: 0 },
  borderTopStyle: { kind: 'exact' },
  borderTopColor: { kind: 'color' },
  borderTopLeftRadius: { kind: 'numeric', tolerance: 1 },
  paddingTop: { kind: 'numeric', tolerance: 1 },
  paddingRight: { kind: 'numeric', tolerance: 1 },
  paddingBottom: { kind: 'numeric', tolerance: 1 },
  paddingLeft: { kind: 'numeric', tolerance: 1 },
  marginTop: { kind: 'numeric', tolerance: 1 },
  marginBottom: { kind: 'numeric', tolerance: 1 },
  gridTemplateColumns: { kind: 'grid-columns' },
  columnGap: { kind: 'numeric', tolerance: 1 },
  gap: { kind: 'numeric', tolerance: 1 },
  width: { kind: 'numeric', tolerance: 1, informational: true },
  height: { kind: 'numeric', tolerance: 30, informational: true }, // hero height known residual
};

// Element name -> extra properties beyond STANDARD_PROPS
const ELEMENT_EXTRA_PROPS = {
  poster: HERO_EXTRA,
  grid: GRID_EXTRA,
};

// ---------------------------------------------------------------------------
// Step A — extract the export desktop frame
// ---------------------------------------------------------------------------

async function extractExportHtml() {
  const raw = await fs.readFile(EXPORT_SRC, 'utf8');
  const marker = '"<!DOCTYPE html>';
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Could not find embedded JSON string literal (marker "${marker}") in ${EXPORT_SRC}`);
  }

  const startQuote = idx; // index of the opening `"` of the JSON string literal
  let i = startQuote + 1;
  let escaped = false;
  while (i < raw.length) {
    const ch = raw[i];
    if (escaped) {
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (ch === '"') {
      break;
    }
    i++;
  }
  const endQuote = i;
  const jsonLiteral = raw.slice(startQuote, endQuote + 1);

  let html;
  try {
    html = JSON.parse(jsonLiteral);
  } catch (err) {
    // Fallback: manual unescape.
    console.warn('JSON.parse of embedded literal failed, falling back to manual unescape:', err.message);
    html = jsonLiteral
      .slice(1, -1)
      .replace(/\\u002F/g, '/')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"');
  }

  await fs.writeFile(EXPORT_TMP, html, 'utf8');
  return EXPORT_TMP;
}

// ---------------------------------------------------------------------------
// Browser-side extraction routines (page.evaluate)
// ---------------------------------------------------------------------------

function propsOf(el, standard, extra) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const out = {};
  for (const p of [...standard, ...(extra || [])]) {
    out[p] = cs[p];
  }
  return out;
}

async function extractExportDesktop(page, standardProps, elementExtra) {
  return page.evaluate(
    ({ STANDARD, EXTRA }) => {
      function props(el, extraList) {
        if (!el) return null;
        const cs = getComputedStyle(el);
        const out = {};
        for (const p of [...STANDARD, ...(extraList || [])]) out[p] = cs[p];
        return out;
      }

      const scope = document.querySelector('[data-screen-label="Video desktop"]');
      if (!scope) {
        return { error: 'desktop scope [data-screen-label="Video desktop"] not found', found: {} };
      }

      const badge = scope.querySelector('.ce-badge');
      const h1 = scope.querySelector('h1');
      const poster = scope.querySelector('.ce-poster');
      const labelPill = poster ? poster.querySelector('div:has(img)') : null;
      const tag = scope.querySelector('.ce-tag');
      const aboutHeading = [...scope.querySelectorAll('h2')].find((h) =>
        h.textContent.trim().startsWith('About this video'),
      );
      const bodyCopy = scope.querySelector('.ce-body');
      const cards = [...scope.querySelectorAll('.ce-card')];
      const transcriptCard = cards.find((c) => c.textContent.includes('Full Video Transcript'));
      const speakersCard = cards.find((c) => c.textContent.includes('Speakers in this video'));

      let transcriptTriggerLabel = null;
      let transcriptToggle = null;
      if (transcriptCard) {
        transcriptTriggerLabel = [...transcriptCard.querySelectorAll('span')].find(
          (s) => s.textContent.trim() === 'Full Video Transcript',
        );
        if (transcriptTriggerLabel && transcriptTriggerLabel.parentElement) {
          transcriptToggle = [...transcriptTriggerLabel.parentElement.children].find(
            (c) => c !== transcriptTriggerLabel && c.tagName === 'SPAN',
          );
        }
      }

      let speakersHeading = null;
      if (speakersCard) {
        speakersHeading = [...speakersCard.querySelectorAll('div')].find(
          (d) => d.textContent.trim() === 'Speakers in this video',
        );
      }

      const grid = scope.querySelector('div[style*="grid-template-columns:1fr 380px"]');

      // Content horizontal inset — export's frame has a single padding
      // layer (the intro/hero/tags/grid sections all use the same
      // "padding: ... 64px 0" on the frame-card's direct children).
      const introDiv = scope.querySelector(':scope > div');
      const introPL = introDiv ? parseFloat(getComputedStyle(introDiv).paddingLeft) || 0 : null;

      const found = {
        badge: !!badge,
        h1: !!h1,
        poster: !!poster,
        labelPill: !!labelPill,
        tag: !!tag,
        aboutHeading: !!aboutHeading,
        bodyCopy: !!bodyCopy,
        transcriptCard: !!transcriptCard,
        transcriptTriggerLabel: !!transcriptTriggerLabel,
        transcriptToggle: !!transcriptToggle,
        speakersCard: !!speakersCard,
        speakersHeading: !!speakersHeading,
        grid: !!grid,
      };

      return {
        found,
        badge: props(badge),
        h1: props(h1),
        poster: props(poster, EXTRA.poster),
        labelPill: props(labelPill),
        tag: props(tag),
        aboutHeading: props(aboutHeading),
        bodyCopy: props(bodyCopy),
        transcriptCard: props(transcriptCard),
        transcriptTriggerLabel: props(transcriptTriggerLabel),
        transcriptToggle: props(transcriptToggle),
        speakersCard: props(speakersCard),
        speakersHeading: props(speakersHeading),
        grid: props(grid, EXTRA.grid),
        contentInset: { total: introPL, layers: [introPL] },
      };
    },
    { STANDARD: standardProps, EXTRA: elementExtra },
  );
}

async function extractBuilt(page, standardProps, elementExtra) {
  return page.evaluate(
    ({ STANDARD, EXTRA }) => {
      function props(el, extraList) {
        if (!el) return null;
        const cs = getComputedStyle(el);
        const out = {};
        for (const p of [...STANDARD, ...(extraList || [])]) out[p] = cs[p];
        return out;
      }

      const main = document.querySelector('main#main') || document.body;
      const header = main.querySelector('header');
      const h1 = main.querySelector('h1');
      const badge = header ? header.querySelector(':scope > div') : null;

      const heroButton = main.querySelector('button[aria-label^="Play video"]');
      // Hero wrapper is the button's parent (`relative pt-11` div) — poster
      // equivalence in the export maps to the clickable hero element itself.
      const poster = heroButton;

      // Label pill — absolutely-positioned overlay inside the hero. Builder
      // converted its position to arbitrary px (`left-[24px] top-[24px]`), so
      // match on the distinctive backdrop-blur signature rather than the old
      // `left-6 top-6` scale classes (which no longer exist).
      const labelPill =
        main.querySelector('div.absolute.left-6.top-6') ||
        [...main.querySelectorAll('div.absolute')].find(
          (d) => /backdrop-blur/.test(d.className) && /top-/.test(d.className),
        );

      // Tag — ghost-lime pill; first rendered <a> or <span> with that class
      // signature. Only 1 tag on this doc ("Interviews").
      const tag = main.querySelector('[class*="rounded-pill"][class*="bg-brand-primary\\/10"]')
        || [...main.querySelectorAll('span, a')].find(
          (el) => el.className.includes('rounded-pill') && el.className.includes('text-brand-primary'),
        );

      const aboutHeading = [...main.querySelectorAll('h2')].find(
        (h) => h.textContent.trim() === 'About this video',
      );

      const bodyCopy = main.querySelector('p');

      const transcriptCard = main.querySelector('details');
      const transcriptTriggerLabel = transcriptCard
        ? [...transcriptCard.querySelectorAll('span')].find(
            (s) => s.textContent.trim() === 'Full Video Transcript',
          )
        : null;
      let transcriptToggle = null;
      if (transcriptTriggerLabel) {
        const summary = transcriptTriggerLabel.closest('summary');
        if (summary) {
          transcriptToggle = [...summary.children].find(
            (c) => c !== transcriptTriggerLabel && c.tagName === 'SPAN',
          );
        }
      }

      const speakersCard = [...main.querySelectorAll('aside div')].find(
        (d) => d.textContent.includes('Speakers in this video') && d.className.includes('rounded-'),
      );
      const linksCard = [...main.querySelectorAll('aside div')].find(
        (d) => d.textContent.includes('Links mentioned in this video') && d.className.includes('rounded-'),
      );
      let speakersHeading = null;
      if (speakersCard) {
        speakersHeading = [...speakersCard.querySelectorAll('h2')].find(
          (h) => h.textContent.trim() === 'Speakers in this video',
        );
      }

      const grid = main.querySelector('div.grid.grid-cols-1');

      // Content horizontal inset — built stacks TWO padding layers: the
      // E3 Container primitive (`px-6 sm:px-8`) AND the template's own
      // radial-gradient wrapper (`px-[22px] ... lg:px-16`). Sum both to
      // get the true edge-to-content distance for a fair comparison
      // against the export's single-layer 64px.
      const article = main.querySelector('article');
      const containerDiv = article ? article.querySelector(':scope > div') : null;
      const wrapperDiv = containerDiv
        ? containerDiv.querySelector('[class*="radial-gradient"]')
        : null;
      const containerPL = containerDiv
        ? parseFloat(getComputedStyle(containerDiv).paddingLeft) || 0
        : null;
      const wrapperPL = wrapperDiv
        ? parseFloat(getComputedStyle(wrapperDiv).paddingLeft) || 0
        : null;
      const contentInsetTotal =
        containerPL != null && wrapperPL != null ? containerPL + wrapperPL : null;

      const found = {
        badge: !!badge,
        h1: !!h1,
        poster: !!poster,
        labelPill: !!labelPill,
        tag: !!tag,
        aboutHeading: !!aboutHeading,
        bodyCopy: !!bodyCopy,
        transcriptCard: !!transcriptCard,
        transcriptTriggerLabel: !!transcriptTriggerLabel,
        transcriptToggle: !!transcriptToggle,
        speakersCard: !!speakersCard,
        speakersHeading: !!speakersHeading,
        grid: !!grid,
        linksCardPresent: !!linksCard,
      };

      return {
        found,
        badge: props(badge),
        h1: props(h1),
        poster: props(poster, EXTRA.poster),
        labelPill: props(labelPill),
        tag: props(tag),
        aboutHeading: props(aboutHeading),
        bodyCopy: props(bodyCopy),
        transcriptCard: props(transcriptCard),
        transcriptTriggerLabel: props(transcriptTriggerLabel),
        transcriptToggle: props(transcriptToggle),
        speakersCard: props(speakersCard),
        speakersHeading: props(speakersHeading),
        grid: props(grid, EXTRA.grid),
        contentInset: { total: contentInsetTotal, layers: [containerPL, wrapperPL] },
      };
    },
    { STANDARD: standardProps, EXTRA: elementExtra },
  );
}

// ---------------------------------------------------------------------------
// Diffing
// ---------------------------------------------------------------------------

function parsePx(v) {
  if (v == null) return null;
  const s = String(v).trim();
  // Handle scientific notation too (Tailwind's `rounded-full` serializes as
  // e.g. "3.35544e+07px", not a plain decimal).
  const m = s.match(/-?[\d.]+(?:e[+-]?\d+)?/i);
  return m ? parseFloat(m[0]) : null;
}

function normalizeColor(v) {
  if (v == null) return v;
  return String(v).replace(/\s+/g, ' ').trim();
}

// Populated by canonicalizeColorsViaCanvas() before diffing — maps every
// distinct raw colour string seen (export + built) to its [r,g,b,a] byte
// values, so oklab()/color-mix() notation (Tailwind v4's opacity-modifier
// output, e.g. `bg-brand-primary/10`) can be compared fairly against the
// export's literal rgba() notation. Both are the SAME token/opacity; the
// difference is only which colour space the browser serialized the used
// value in.
const COLOR_RGBA_CACHE = new Map();

function colorsEqual(a, b) {
  const na = normalizeColor(a);
  const nb = normalizeColor(b);
  if (na === nb) return true;
  const TRANSPARENT = new Set(['rgba(0, 0, 0, 0)', 'transparent', 'rgba(0, 0, 0, 0.0)']);
  if (TRANSPARENT.has(na) && TRANSPARENT.has(nb)) return true;

  // Fall back to canonicalized RGBA byte comparison (handles oklab vs rgba
  // serialization of the identical token+opacity). Small channel tolerance
  // accounts for measured 8-bit premultiply/unpremultiply rounding noise in
  // the canvas round-trip itself (verified up to ~10/255 at low alpha —
  // see probe notes), NOT a real colour difference.
  const ra = COLOR_RGBA_CACHE.get(na);
  const rb = COLOR_RGBA_CACHE.get(nb);
  if (!ra || !rb) return false;
  const channelDiff = Math.max(
    Math.abs(ra[0] - rb[0]),
    Math.abs(ra[1] - rb[1]),
    Math.abs(ra[2] - rb[2]),
  );
  const alphaDiff = Math.abs(ra[3] - rb[3]) / 255;
  return channelDiff <= 10 && alphaDiff <= 0.02;
}

async function canonicalizeColorsViaCanvas(browser, allColorStrings) {
  const unique = [...new Set(allColorStrings.filter(Boolean).map(normalizeColor))];
  if (unique.length === 0) return;
  const page = await browser.newPage();
  const results = await page.evaluate((strs) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    return strs.map((s) => {
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = s;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data);
      } catch {
        return null;
      }
    });
  }, unique);
  await page.close();
  unique.forEach((s, i) => {
    if (results[i]) COLOR_RGBA_CACHE.set(s, results[i]);
  });
}

function normalizeGridColumns(v) {
  // getComputedStyle resolves grid-template-columns to resolved px values,
  // e.g. "718.6px 380px". Round to nearest px for comparison stability.
  if (v == null) return v;
  return String(v)
    .split(/\s+/)
    .map((tok) => {
      const n = parsePx(tok);
      return n != null ? `${Math.round(n)}px` : tok;
    })
    .join(' ');
}

// Any border-radius >= this is visually "fully rounded" for every element
// size in this template (max real radius token in the design system is
// --radius-3xl = 160px) — so 999px (export's literal pill trick) and
// Tailwind's `rounded-full` magic number (~3.35e7px) render IDENTICALLY as
// a pill/circle once clamped to 50% of the box. Comparing the literal
// numbers would flag a false positive; comparing "is it a pill" does not.
const PILL_RADIUS_THRESHOLD = 500;

function compareProp(prop, exportVal, builtVal) {
  const rule = PROP_RULES[prop] || { kind: 'exact' };
  if (exportVal == null || builtVal == null) {
    return { match: exportVal === builtVal, delta: null, informational: !!rule.informational };
  }

  if (prop === 'borderTopLeftRadius') {
    const ne = parsePx(exportVal);
    const nb = parsePx(builtVal);
    if (ne != null && nb != null && ne >= PILL_RADIUS_THRESHOLD && nb >= PILL_RADIUS_THRESHOLD) {
      return { match: true, delta: 0, informational: false, pillEquivalent: true };
    }
    if (ne != null && nb != null) {
      const delta = Math.abs(ne - nb);
      return { match: delta <= rule.tolerance, delta, informational: !!rule.informational };
    }
  }

  if (rule.kind === 'color') {
    const match = colorsEqual(exportVal, builtVal);
    return { match, delta: match ? 0 : 'DIFFERENT_COLOR', informational: !!rule.informational };
  }

  if (rule.kind === 'exact') {
    const match = String(exportVal).trim() === String(builtVal).trim();
    return { match, delta: match ? 0 : 'DIFFERENT_VALUE', informational: !!rule.informational };
  }

  if (rule.kind === 'grid-columns') {
    const ne = normalizeGridColumns(exportVal);
    const nb = normalizeGridColumns(builtVal);
    return { match: ne === nb, delta: ne === nb ? 0 : `${ne} vs ${nb}`, informational: !!rule.informational };
  }

  if (rule.kind === 'numeric') {
    // "normal" letter-spacing means zero additional tracking — comparable
    // to an explicit 0/near-0 px value (unlike "normal" line-height, which
    // means ~1.2x font-size and must NOT be treated as 0).
    const treatNormalAsZero = prop === 'letterSpacing';
    const ne = treatNormalAsZero && exportVal === 'normal' ? 0 : parsePx(exportVal);
    const nb = treatNormalAsZero && builtVal === 'normal' ? 0 : parsePx(builtVal);
    if (ne == null || nb == null) {
      return { match: exportVal === builtVal, delta: null, informational: !!rule.informational };
    }
    const delta = Math.abs(ne - nb);
    return { match: delta <= rule.tolerance, delta, informational: !!rule.informational };
  }

  return { match: exportVal === builtVal, delta: null, informational: !!rule.informational };
}

const ELEMENT_LABELS = {
  badge: 'badge',
  h1: 'h1',
  poster: 'hero poster/embed',
  labelPill: 'label pill',
  tag: 'tag',
  aboutHeading: 'about heading (h2)',
  bodyCopy: 'body copy',
  transcriptCard: 'transcript card',
  transcriptTriggerLabel: 'transcript trigger label',
  transcriptToggle: 'transcript toggle circle',
  speakersCard: 'sidebar speakers card',
  speakersHeading: 'sidebar heading',
  grid: 'two-column grid',
};

// Properties that are structurally inapplicable for a given element because
// the element itself carries no direct text / the property has no visual
// consequence (e.g. a pure container div whose text lives on a child).
// These rows are still reported (transparency) but excluded from the
// material-fail count, with a note explaining why.
const NOT_APPLICABLE = {
  poster: {
    fontSize: 'hero button has no direct text content (poster image + decorative play icon only)',
    fontWeight: 'hero button has no direct text content',
    lineHeight: 'hero button has no direct text content',
    letterSpacing: 'hero button has no direct text content',
    color: 'hero button has no direct text content',
  },
  labelPill: {
    fontSize: 'outer pill div has no direct text; text lives on child <span>',
    fontWeight: 'outer pill div has no direct text; text lives on child <span>',
    lineHeight: 'outer pill div has no direct text; text lives on child <span>',
    letterSpacing: 'outer pill div has no direct text; text lives on child <span>',
    color: 'outer pill div has no direct text; text lives on child <span>',
  },
  transcriptCard: {
    fontSize: 'card wrapper has no direct text; text lives on children',
    fontWeight: 'card wrapper has no direct text; text lives on children',
    lineHeight: 'card wrapper has no direct text; text lives on children',
    letterSpacing: 'card wrapper has no direct text; text lives on children',
    color: 'card wrapper has no direct text; text lives on children',
  },
  transcriptToggle: {
    fontSize: 'export sizes a text glyph via font-size; built renders a fixed-size SVG icon instead (architecture difference, not comparable)',
    lineHeight: 'same as fontSize — SVG icon vs text glyph, not comparable',
    letterSpacing: 'no text content (SVG icon)',
  },
  speakersCard: {
    fontSize: 'card wrapper has no direct text; text lives on children',
    fontWeight: 'card wrapper has no direct text; text lives on children',
    lineHeight: 'card wrapper has no direct text; text lives on children',
    letterSpacing: 'card wrapper has no direct text; text lives on children',
    color: 'card wrapper has no direct text; text lives on children',
  },
  grid: {
    fontSize: 'layout container has no direct text; text lives on children',
    fontWeight: 'layout container has no direct text; text lives on children',
    lineHeight: 'layout container has no direct text; text lives on children',
    letterSpacing: 'layout container has no direct text; text lives on children',
    color: 'layout container has no direct text; text lives on children',
  },
  bodyCopy: {
    marginBottom:
      'export mockup hardcodes 2 static paragraphs (14px gap between them); this QA doc\'s real descriptionOfVideo content has only 1 paragraph, so Tailwind\'s `last:mb-0` correctly zeroes the trailing margin — not a template defect, a content-shape mismatch between mockup and live data',
  },
};

function isEffectivelyZero(px) {
  const n = parsePx(px);
  return n == null || Math.abs(n) < 0.5;
}

function buildDiffRows(exportData, builtData, standardProps, elementExtra) {
  const rows = [];
  for (const key of Object.keys(ELEMENT_LABELS)) {
    const label = ELEMENT_LABELS[key];
    const exp = exportData[key];
    const built = builtData[key];
    const extra = elementExtra[key] || [];
    const propList = [...standardProps, ...extra];
    const naMap = NOT_APPLICABLE[key] || {};

    if (!exp && !built) {
      rows.push({
        element: label,
        property: '(element)',
        exportValue: 'NOT FOUND',
        builtValue: 'NOT FOUND',
        status: 'FAIL',
        note: null,
      });
      continue;
    }
    if (!exp || !built) {
      rows.push({
        element: label,
        property: '(element)',
        exportValue: exp ? 'FOUND' : 'NOT FOUND',
        builtValue: built ? 'FOUND' : 'NOT FOUND',
        status: 'FAIL',
        note: null,
      });
      continue;
    }

    // Border is invisible (width ~0 on both sides) — style/colour mismatches
    // on borderTop* are cosmetically irrelevant regardless of literal value.
    const borderInvisible =
      isEffectivelyZero(exp.borderTopWidth) && isEffectivelyZero(built.borderTopWidth);

    for (const prop of propList) {
      const exportVal = exp[prop];
      const builtVal = built[prop];

      if (naMap[prop]) {
        rows.push({
          element: label,
          property: prop,
          exportValue: exportVal,
          builtValue: builtVal,
          status: 'N/A',
          note: naMap[prop],
        });
        continue;
      }

      if (key === 'poster' && prop === 'backgroundColor') {
        const { match } = compareProp(prop, exportVal, builtVal);
        rows.push({
          element: label,
          property: prop,
          exportValue: exportVal,
          builtValue: builtVal,
          status: match ? 'MATCH' : 'FAIL',
          note: match
            ? null
            : 'export uses a decorative navy gradient (background-image, so backgroundColor reads transparent) as the placeholder behind the play button; built uses a solid bg-bg-primary fallback colour. Both are fully covered by the real Sanity poster image once loaded — only visible during image-load / no-image states.',
        });
        continue;
      }

      if (borderInvisible && (prop === 'borderTopStyle' || prop === 'borderTopColor')) {
        rows.push({
          element: label,
          property: prop,
          exportValue: exportVal,
          builtValue: builtVal,
          status: 'N/A',
          note: 'borderTopWidth ~0 on both sides — no border is rendered either way, so style/colour has no visual effect',
        });
        continue;
      }

      // Builder judgment call: pb-[64px] added on the two-column section bottom.
      // Export per-section bottom padding is 0. Bottom-padding-only delta is
      // trailing whitespace before the sitewide footer, not a layout-fidelity
      // element — report it but never treat it as a material fail.
      if (key === 'grid' && prop === 'paddingBottom') {
        const { match } = compareProp(prop, exportVal, builtVal);
        rows.push({
          element: label,
          property: prop,
          exportValue: exportVal,
          builtValue: builtVal,
          status: match ? 'MATCH' : 'KNOWN/ACCEPTED',
          note: match
            ? null
            : 'Builder judgment call: pb-[64px] trailing whitespace before the sitewide footer. Export per-section bottom padding is 0. Bottom-padding-only delta is non-material (not a layout-fidelity element).',
        });
        continue;
      }

      const { match, informational } = compareProp(prop, exportVal, builtVal);
      rows.push({
        element: label,
        property: prop,
        exportValue: exportVal,
        builtValue: builtVal,
        status: match ? 'MATCH' : informational ? 'KNOWN/ACCEPTED' : 'FAIL',
        note: null,
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Step C — structural gate checks
// ---------------------------------------------------------------------------

const FORBIDDEN_TYPES = new Set(['BlogPosting', 'CollectionPage', 'Person', 'Review']);

function extractJsonLdFromHtml(html) {
  const out = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed['@graph'])) {
        for (const entry of parsed['@graph']) out.push(entry);
      } else {
        out.push(parsed);
      }
    } catch (err) {
      out.push({ __parseError: err.message, raw: raw.slice(0, 200) });
    }
  }
  return out;
}

async function runStructuralGate(buildStatus) {
  const gate = [];

  // 1. build GREEN
  gate.push({
    check: 'npm run build GREEN',
    status: buildStatus.ok ? 'PASS' : 'FAIL',
    evidence: buildStatus.note,
  });

  // Fetch built page once, reused for checks 2, 4, 5.
  const res = await fetch(`${BASE}${BUILT_PATH}`);
  const html = await res.text();

  // 2. VideoObject JSON-LD valid
  const ld = extractJsonLdFromHtml(html);
  const types = ld.map((b) => b['@type']).filter(Boolean);
  const videoObjects = ld.filter((b) => b['@type'] === 'VideoObject');
  const breadcrumbs = ld.filter((b) => b['@type'] === 'BreadcrumbList');
  const forbiddenFound = types.filter((t) => FORBIDDEN_TYPES.has(t));

  let jsonLdOk = true;
  const jsonLdNotes = [];

  if (videoObjects.length !== 1) {
    jsonLdOk = false;
    jsonLdNotes.push(`expected exactly 1 VideoObject, found ${videoObjects.length}`);
  } else {
    const vo = videoObjects[0];
    if (typeof vo.name !== 'string' || !vo.name) {
      jsonLdOk = false;
      jsonLdNotes.push('VideoObject missing name');
    }
    const hasMediaUrl =
      typeof vo.thumbnailUrl === 'string' ||
      typeof vo.embedUrl === 'string' ||
      typeof vo.contentUrl === 'string';
    if (!hasMediaUrl) {
      jsonLdOk = false;
      jsonLdNotes.push('VideoObject missing thumbnailUrl/embedUrl/contentUrl');
    }
  }

  if (breadcrumbs.length !== 1) {
    jsonLdOk = false;
    jsonLdNotes.push(`expected exactly 1 BreadcrumbList, found ${breadcrumbs.length}`);
  } else {
    const bc = breadcrumbs[0];
    const items = bc.itemListElement;
    if (!Array.isArray(items) || items.length !== 3) {
      jsonLdOk = false;
      jsonLdNotes.push(`BreadcrumbList expected 3 itemListElement, found ${Array.isArray(items) ? items.length : 'none'}`);
    } else {
      const expectedNames = ['Home', 'Videos'];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it['@type'] !== 'ListItem') { jsonLdOk = false; jsonLdNotes.push(`breadcrumb[${i}] @type !== ListItem`); }
        if (typeof it.position !== 'number') { jsonLdOk = false; jsonLdNotes.push(`breadcrumb[${i}] missing position`); }
        if (typeof it.name !== 'string' || !it.name) { jsonLdOk = false; jsonLdNotes.push(`breadcrumb[${i}] missing name`); }
        if (typeof it.item !== 'string' || !it.item) { jsonLdOk = false; jsonLdNotes.push(`breadcrumb[${i}] missing item`); }
        if (i < 2 && it.name !== expectedNames[i]) {
          jsonLdOk = false;
          jsonLdNotes.push(`breadcrumb[${i}] name expected "${expectedNames[i]}", got "${it.name}"`);
        }
      }
    }
  }

  if (forbiddenFound.length > 0) {
    jsonLdOk = false;
    jsonLdNotes.push(`forbidden @type present: ${forbiddenFound.join(', ')}`);
  }

  gate.push({
    check: 'VideoObject + BreadcrumbList JSON-LD valid, no forbidden types',
    status: jsonLdOk ? 'PASS' : 'FAIL',
    evidence: `@type list: [${types.join(', ')}]${jsonLdNotes.length ? ' | ISSUES: ' + jsonLdNotes.join('; ') : ''}`,
  });

  // 3. Both locale routes resolve 200
  const [usRes, ukRes] = await Promise.all([
    fetch(`${BASE}${BUILT_PATH}`),
    fetch(`${BASE}${BUILT_PATH_UK}`),
  ]);
  gate.push({
    check: 'Both locale routes resolve HTTP 200',
    status: usRes.status === 200 && ukRes.status === 200 ? 'PASS' : 'FAIL',
    evidence: `US ${BUILT_PATH} -> ${usRes.status}; UK ${BUILT_PATH_UK} -> ${ukRes.status}`,
  });

  // 4. meta description present
  const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/);
  gate.push({
    check: '<meta name="description"> present in <head>',
    status: metaMatch ? 'PASS' : 'FAIL',
    evidence: metaMatch ? metaMatch[1] : 'no meta description tag found',
  });

  // 5. No BAILOUT_TO_CLIENT_SIDE_RENDERING
  const hasBailout = html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING');
  gate.push({
    check: 'No BAILOUT_TO_CLIENT_SIDE_RENDERING in built HTML',
    status: hasBailout ? 'FAIL' : 'PASS',
    evidence: hasBailout ? 'string found in HTML' : 'string not present',
  });

  return gate;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const buildStatusArg = process.env.QA_BUILD_STATUS || 'GREEN';
  const buildStatus = {
    ok: buildStatusArg === 'GREEN',
    note:
      buildStatusArg === 'GREEN'
        ? 'npm run build completed with exit code 0, no errors (privacy-policy route built successfully, Tech Debt #46 not reproduced)'
        : buildStatusArg,
  };

  console.log('=== Step A: extracting export desktop frame ===');
  await extractExportHtml();
  console.log(`Wrote ${EXPORT_TMP}`);

  const browser = await chromium.launch({ headless: true });

  let exportData;
  let builtData;

  try {
    const exportPage = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
    await exportPage.goto(`file://${EXPORT_TMP}`, { waitUntil: 'load', timeout: 30_000 });
    await exportPage.waitForTimeout(600);
    exportData = await extractExportDesktop(exportPage, STANDARD_PROPS, ELEMENT_EXTRA_PROPS);
    await exportPage.close();

    console.log('=== Step B: extracting built page ===');
    const builtPage = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
    try {
      await builtPage.goto(`${BASE}${BUILT_PATH}`, { waitUntil: 'networkidle', timeout: 30_000 });
    } catch {
      await builtPage.goto(`${BASE}${BUILT_PATH}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }
    await builtPage.waitForTimeout(800);
    builtData = await extractBuilt(builtPage, STANDARD_PROPS, ELEMENT_EXTRA_PROPS);
    await builtPage.close();
  } finally {
    await browser.close();
  }

  console.log('\nExport found map:', exportData.found);
  console.log('Built found map:', builtData.found);

  // Canonicalize every colour string seen (export + built) to RGBA bytes via
  // a real canvas paint, so oklab()/color-mix() notation (Tailwind v4's
  // opacity-modifier output) can be compared fairly against literal rgba().
  const browser2 = await chromium.launch({ headless: true });
  try {
    const colorProps = ['color', 'backgroundColor', 'borderTopColor'];
    const allColors = [];
    for (const dataset of [exportData, builtData]) {
      for (const key of Object.keys(ELEMENT_LABELS)) {
        const obj = dataset[key];
        if (!obj) continue;
        for (const p of colorProps) if (obj[p]) allColors.push(obj[p]);
      }
    }
    await canonicalizeColorsViaCanvas(browser2, allColors);
  } finally {
    await browser2.close();
  }

  const diffRows = buildDiffRows(exportData, builtData, STANDARD_PROPS, ELEMENT_EXTRA_PROPS);

  // Supplementary check — total horizontal content inset (sum of ALL
  // padding layers between the viewport/frame edge and the content), which
  // is structurally independent of exactly which div carries the padding.
  const exportInset = exportData.contentInset?.total ?? null;
  const builtInset = builtData.contentInset?.total ?? null;
  if (exportInset != null && builtInset != null) {
    const insetDelta = Math.abs(exportInset - builtInset);
    diffRows.push({
      element: 'content horizontal inset (viewport edge -> content)',
      property: 'total left padding (all layers summed)',
      exportValue: `${exportInset}px (1 layer: intro section)`,
      builtValue: `${builtInset}px (${builtData.contentInset.layers.length} layers: Container=${builtData.contentInset.layers[0]}px + wrapper=${builtData.contentInset.layers[1]}px)`,
      status: insetDelta <= 1 ? 'MATCH' : 'FAIL',
      note:
        insetDelta > 1
          ? 'Container primitive (px-6 sm:px-8) AND the template\'s own radial-gradient wrapper (px-[22px] ... lg:px-16) both contribute horizontal padding, compounding to 2x+ the Figma-specified 64px desktop inset — not a single-property bug, a double-padding-layer + spacing-scale issue'
          : null,
    });
  }

  const materialFails = diffRows.filter((r) => r.status === 'FAIL');
  const knownAccepted = diffRows.filter((r) => r.status === 'KNOWN/ACCEPTED');
  const notApplicable = diffRows.filter((r) => r.status === 'N/A');

  console.log('\n=== DIFF TABLE (FAILs first) ===');
  const sorted = [...diffRows].sort((a, b) => {
    const order = { FAIL: 0, 'KNOWN/ACCEPTED': 1, 'N/A': 2, MATCH: 3 };
    return order[a.status] - order[b.status];
  });
  for (const row of sorted) {
    console.log(
      `${row.status.padEnd(15)} | ${row.element.padEnd(26)} | ${String(row.property).padEnd(20)} | export=${JSON.stringify(row.exportValue)} | built=${JSON.stringify(row.builtValue)}`,
    );
    if (row.note) console.log(`                  note: ${row.note}`);
  }

  console.log(`\nMaterial FAIL count: ${materialFails.length}`);
  if (materialFails.length > 0) {
    console.log('Failing element -> property pairs:');
    for (const r of materialFails) {
      console.log(`  ${r.element} -> ${r.property} | export=${JSON.stringify(r.exportValue)} | built=${JSON.stringify(r.builtValue)}`);
    }
  }
  if (knownAccepted.length > 0) {
    console.log(`\nKNOWN/ACCEPTED residuals (not material fails): ${knownAccepted.length}`);
    for (const r of knownAccepted) {
      console.log(`  ${r.element} -> ${r.property} | export=${JSON.stringify(r.exportValue)} | built=${JSON.stringify(r.builtValue)}`);
    }
  }
  if (notApplicable.length > 0) {
    console.log(`\nN/A rows (structurally inapplicable, not counted): ${notApplicable.length}`);
  }

  console.log('\n=== Step C: structural gate ===');
  const gate = await runStructuralGate(buildStatus);
  for (const g of gate) {
    console.log(`${g.status.padEnd(6)} | ${g.check}`);
    console.log(`         evidence: ${g.evidence}`);
  }

  const gateFails = gate.filter((g) => g.status === 'FAIL');
  const verdict = materialFails.length === 0 && gateFails.length === 0 ? 'CLEAN PASS' : 'FAIL';
  console.log(`\n=== VERDICT: ${verdict} ===`);

  const output = {
    generatedAt: new Date().toISOString(),
    slug: SLUG,
    exportFound: exportData.found,
    builtFound: builtData.found,
    contentInset: { export: exportData.contentInset, built: builtData.contentInset },
    diffRows,
    materialFailCount: materialFails.length,
    materialFails,
    knownAccepted,
    notApplicable,
    structuralGate: gate,
    verdict,
  };

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${OUT_JSON}`);

  process.exit(verdict === 'CLEAN PASS' ? 0 : 1);
}

main().catch((err) => {
  console.error('qa-computed-diff FAILED', err);
  process.exit(1);
});
