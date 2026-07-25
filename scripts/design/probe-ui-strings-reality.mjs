// scripts/design/probe-ui-strings-reality.mjs
//
// ONE-SHOT — after §6.1 lands, tools/eslint/ui-strings.json is canonical.
// This script is archived to scripts/design/_archive/ post-Brief-B per SA-6 v1.2.
//
// MYGRATR-DESIGN-1 Brief B v1.3 §6.0a — schema-vs-reality probe on UI_STRINGS seed list.
//
// Reads the v2.0 brief §Step 6 seed list (inline below; verbatim from
// docs/briefs/active/MYGRATR-DESIGN-1_BRIEF_v2.0.md lines 1238-1253),
// queries Sanity production for current strings on global singletons +
// sampled CMS docs, and reconciles into 4 buckets per D12.
//
// Output: audit-output/design-1/ui-strings-reality.json
//
// D13 naming convention applied to bucket output keys: dotted, surface-scoped,
// lowerCamelCase tail. Mapping from v2.0 SCREAMING_SNAKE_CASE to D13 form is
// documented inline (D13_MAP).

import 'dotenv/config'
import { createClient } from '@sanity/client'
import fs from 'node:fs/promises'
import path from 'node:path'

// === v2.0 brief §Step 6 seed list (verbatim, lines 1238-1253) ===
const V2_SEED = {
  EMAIL_LABEL: 'Email',
  NAME_LABEL: 'Name',
  SUBMIT: 'Submit',
  CLOSE: 'Close',
  CANCEL: 'Cancel',
  RETRY: 'Try again',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  EMPTY_RESULTS: 'No results found.',
  LOADING: 'Loading',
  MENU: 'Menu',
}

// === D13 v1.3 naming-convention mapping (v2.0 SCREAMING_SNAKE → dotted lowerCamelCase) ===
// Surface-classification per D13: nav → nav.*, form labels → form.*, CTA → cta.*,
// errors → error.*, footer → footer.*, page-meta → meta.*, aria → aria.*
const D13_MAP = {
  EMAIL_LABEL: 'form.email.label',
  NAME_LABEL: 'form.name.label',
  SUBMIT: 'form.submit',
  CLOSE: 'cta.close',
  CANCEL: 'cta.cancel',
  RETRY: 'cta.retry',
  REQUIRED_FIELD: 'error.requiredField',
  INVALID_EMAIL: 'error.invalidEmail',
  GENERIC_ERROR: 'error.generic',
  EMPTY_RESULTS: 'error.emptyResults',
  LOADING: 'meta.loading',
  MENU: 'nav.menu',
}

// === Heuristic chrome-surface detector (for in_sanity_only candidates from globals) ===
// Match path-segment names that typically hold UI chrome strings rather than long-form copy.
const CHROME_PATH_SEGMENTS = new Set([
  'label', 'ctaLabel', 'ctaText', 'buttonLabel', 'buttonText',
  'linkText', 'linkLabel', 'menuLabel', 'placeholder',
  'errorMessage', 'helpText', 'submitLabel', 'cancelLabel',
  'closeLabel', 'title', 'heading', 'subheading',
  'announcement', 'text', 'siteName', 'copyrightText',
])

// Sanity meta keys to skip during walks
const SANITY_META = new Set(['_id', '_type', '_ref', '_key', '_rev', '_createdAt', '_updatedAt', '_weak'])

const PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'lzbhll1u'
const DATASET = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  // Public reads — no token needed for published perspective.
})

// === Walker: emit { path, value } for every string-leaf field ===
function walkStrings(node, pathSoFar, out) {
  if (node === null || node === undefined) return
  if (typeof node === 'string') {
    out.push({ path: pathSoFar, value: node })
    return
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walkStrings(node[i], `${pathSoFar}[${i}]`, out)
    }
    return
  }
  if (typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (SANITY_META.has(key)) continue
      walkStrings(value, pathSoFar ? `${pathSoFar}.${key}` : key, out)
    }
  }
}

// Last segment of a dot/bracket path, normalised
function lastSegment(p) {
  const m = p.match(/[A-Za-z_][A-Za-z0-9_]*$/)
  return m ? m[0] : p
}

// Heuristic: short string at a chrome-y path segment, plain text only
function looksLikeChromeString(value, pathSegment) {
  if (typeof value !== 'string') return false
  if (value.length === 0 || value.length > 80) return false
  if (/[<>{}\n]/.test(value)) return false
  return CHROME_PATH_SEGMENTS.has(pathSegment)
}

async function main() {
  const ranAt = new Date().toISOString()
  console.log(`[probe-ui-strings-reality] ${ranAt}  project=${PROJECT_ID} dataset=${DATASET}`)

  // === Query Sanity ===
  // Globals: full read (per CMA prior-round F-8 v1.3 — globals are small, fully enumerable).
  const globalsQuery = `*[_type in ["siteSettings", "navigation", "footer"]]`
  const globals = await client.fetch(globalsQuery)
  console.log(`globals fetched: ${globals.length}`)

  // Sample 10 each from blogPost / customerStory / technology / service.
  // Stable sample via _id ordering (deterministic across runs).
  const SAMPLE_TYPES = ['blogPost', 'customerStory', 'technology', 'service']
  const samples = {}
  for (const t of SAMPLE_TYPES) {
    const q = `*[_type=="${t}"] | order(_id asc) [0...10]`
    samples[t] = await client.fetch(q)
    console.log(`  ${t}: ${samples[t].length} sampled`)
  }

  // === Build string corpus ===
  const globalsLeaves = []
  for (const doc of globals) {
    const leaves = []
    walkStrings(doc, doc._type, leaves)
    for (const leaf of leaves) {
      globalsLeaves.push({ ...leaf, doc_id: doc._id, doc_type: doc._type })
    }
  }

  const sampleLeaves = []
  for (const t of SAMPLE_TYPES) {
    for (const doc of samples[t]) {
      const leaves = []
      walkStrings(doc, doc._type, leaves)
      for (const leaf of leaves) {
        sampleLeaves.push({ ...leaf, doc_id: doc._id, doc_type: doc._type })
      }
    }
  }

  const allLeaves = [...globalsLeaves, ...sampleLeaves]
  const allValues = new Set(allLeaves.map((l) => l.value))
  console.log(`globals string-leaves: ${globalsLeaves.length}`)
  console.log(`sample  string-leaves: ${sampleLeaves.length}`)
  console.log(`unique strings (corpus): ${allValues.size}`)

  // === Forward match: each seed value vs corpus ===
  const both = []
  const inSeedOnly = []

  for (const [v2Key, seedValue] of Object.entries(V2_SEED)) {
    const matches = allLeaves.filter((l) => l.value === seedValue)
    const d13Key = D13_MAP[v2Key]
    if (matches.length > 0) {
      both.push({
        v2_key: v2Key,
        d13_key: d13Key,
        value: seedValue,
        found_at: matches.slice(0, 5).map((m) => `${m.doc_id} :: ${m.path}`),
        match_count: matches.length,
      })
    } else {
      inSeedOnly.push({
        v2_key: v2Key,
        d13_key: d13Key,
        value: seedValue,
        reason: 'value not found verbatim in queried Sanity content',
      })
    }
  }

  // === Backward analysis (globals only): chrome-shaped strings the seed missed ===
  // For each chrome-shaped string-leaf in globals, check whether it's already in `both`.
  // If not, it's a candidate for `in_sanity_only`.
  const bothValues = new Set(both.map((b) => b.value))
  const inSanityOnly = []
  const seenSanityCandidates = new Set()

  for (const leaf of globalsLeaves) {
    const seg = lastSegment(leaf.path)
    if (!looksLikeChromeString(leaf.value, seg)) continue
    if (bothValues.has(leaf.value)) continue

    // Dedupe by value
    const dedupeKey = leaf.value
    if (seenSanityCandidates.has(dedupeKey)) continue
    seenSanityCandidates.add(dedupeKey)

    // Surface-classify by doc_type + path-segment
    let surface = 'unknown'
    if (leaf.doc_type === 'navigation') surface = 'nav'
    else if (leaf.doc_type === 'footer') surface = 'footer'
    else if (leaf.doc_type === 'siteSettings') {
      if (seg === 'ctaLabel' || seg === 'ctaText') surface = 'cta'
      else if (seg === 'siteName' || seg === 'defaultMetaTitle') surface = 'meta'
      else if (seg === 'text' && /announcement/i.test(leaf.path)) surface = 'meta.announcement'
      else surface = 'meta'
    }

    inSanityOnly.push({
      d13_key_candidate: `${surface}.<choose>`,
      value: leaf.value,
      surface_inferred: surface,
      field_path: leaf.path,
      doc_id: leaf.doc_id,
      doc_type: leaf.doc_type,
    })
  }

  // === Divergent value detection ===
  // For seed entries whose surface naturally maps to a known field path in globals,
  // compare seed value against the field value. Surface known-shape divergences.
  const divergent = []
  // Map of likely chrome surface paths in globals → seed key it would correspond to
  const KNOWN_SURFACE_TO_SEED = [
    // siteSettings.announcementBar.ctaLabel might match SUBMIT/CANCEL etc — but those
    // are conceptually distinct CTA flavours, so we don't auto-pair them.
    // Only surface as "divergent" when the seed key has an unambiguous matching field.
    // For this probe, we have no such unambiguous pairing — left empty by design.
    // Future probes may add entries here once schema-shape ↔ seed-key pairings are firmed.
  ]
  // Intentionally empty for v2.0 seed list — divergent analysis is a flag-on-discovery
  // operation only when a 1:1 pairing exists. Surfaced as `divergent_value: []` in output.

  // === Write output ===
  const output = {
    _meta: {
      probe: 'scripts/design/probe-ui-strings-reality.mjs',
      ran_at: ranAt,
      sanity_project: PROJECT_ID,
      sanity_dataset: DATASET,
      v2_seed_keys: Object.keys(V2_SEED).length,
      d13_mapping: D13_MAP,
      queried: {
        globals_full_read: ['siteSettings', 'navigation', 'footer'],
        sampled_doc_types: Object.fromEntries(SAMPLE_TYPES.map((t) => [t, samples[t].length])),
      },
      corpus_stats: {
        globals_docs: globals.length,
        sampled_docs: SAMPLE_TYPES.reduce((sum, t) => sum + samples[t].length, 0),
        globals_string_leaves: globalsLeaves.length,
        sample_string_leaves: sampleLeaves.length,
        unique_strings_corpus: allValues.size,
      },
      classifier_notes: {
        forward_match: 'Each seed value scanned across full corpus (globals + samples) for exact-string presence',
        backward_match: 'Chrome-shaped string-leaves in globals at recognised path segments surfaced as in_sanity_only candidates; dedup by value',
        divergent_analysis: 'Disabled for v2.0 seed (no 1:1 schema-shape ↔ seed-key pairings exist). Treat divergent_value: [] as design-intent, not gap.',
      },
    },
    in_seed_only: inSeedOnly,
    in_sanity_only: inSanityOnly,
    both,
    divergent_value: divergent,
  }

  const outPath = path.resolve('audit-output/design-1/ui-strings-reality.json')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(output, null, 2) + '\n')
  console.log(`\nwrote ${outPath}`)
  console.log(`  in_seed_only:    ${inSeedOnly.length}`)
  console.log(`  in_sanity_only:  ${inSanityOnly.length}`)
  console.log(`  both:            ${both.length}`)
  console.log(`  divergent_value: ${divergent.length}`)
}

main().catch((err) => {
  console.error('probe failed:', err)
  process.exit(1)
})
