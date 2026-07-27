// Reports any technology that would render without a real logo.
//
// Sanity `technology.techLogo` is the source of truth. This checks which docs are
// missing one, and whether the fallback mapping covers them - so a technology
// added in Studio without a logo is surfaced rather than quietly falling back to
// its two letters.
//
// Read-only. Run: npm run verify:tech-icons

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Read the fallback slugs straight out of the component map, so there is one
// source of truth rather than a copy that can drift.
const mapFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/components/ui/_tech-icons/tech-icon-map.ts',
)
const TECH_ICON_MAP = Object.fromEntries(
  [...fs.readFileSync(mapFile, 'utf8').matchAll(/^\s{2}'?([a-z0-9-]+)'?:\s*'([^']+)'/gm)].map((m) => [
    m[1],
    m[2],
  ]),
)

const PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'lzbhll1u'
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

const query = `*[_type=="technology" && !(_id in path("drafts.**"))]{
  "slug": slug.current,
  "name": technologyName,
  "hasLogo": defined(techLogo.asset),
  "onHub": listItemOnly != true && retired != true
}`

const res = await fetch(
  `https://${PROJECT}.api.sanity.io/v2023-05-03/data/query/${DATASET}?query=${encodeURIComponent(query)}`,
)
if (!res.ok) {
  console.error(`Sanity query failed: ${res.status} ${res.statusText}`)
  process.exit(1)
}
const { result } = await res.json()

const withLogo = result.filter((t) => t.hasLogo)
const noLogo = result.filter((t) => !t.hasLogo)
const covered = noLogo.filter((t) => TECH_ICON_MAP[t.slug])
const bare = noLogo.filter((t) => !TECH_ICON_MAP[t.slug])
const stale = Object.keys(TECH_ICON_MAP).filter((s) =>
  result.some((t) => t.slug === s && t.hasLogo),
)

console.log(`technologies:        ${result.length}`)
console.log(`  real logo (Sanity): ${withLogo.length}`)
console.log(`  fallback glyph:     ${covered.length}${covered.length ? ` (${covered.map((t) => t.slug).join(', ')})` : ''}`)
console.log(`  letters only:       ${bare.length}`)

if (bare.length > 0) {
  console.warn(`\nNo logo and no glyph - these render as two letters:`)
  for (const t of bare) {
    console.warn(`  ${t.slug}${t.onHub ? '' : '  (not shown on the hub)'} - "${t.name}"`)
  }
  console.warn(`\nFix by uploading techLogo in Studio. Only if no logo exists,`)
  console.warn(`add a glyph to public/icons/tech-sprite.svg + tech-icon-map.ts.`)
}

if (stale.length > 0) {
  console.warn(`\nMapped but Sanity now has a real logo - remove from mapping.mjs:`)
  for (const s of stale) console.warn(`  ${s}`)
}

if (bare.length === 0 && stale.length === 0) {
  console.log('\nEvery technology renders a logo or a deliberate glyph.')
}
