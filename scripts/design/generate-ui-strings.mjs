// scripts/design/generate-ui-strings.mjs
//
// MYGRATR-DESIGN-1 Brief B v1.3 §6.1 — UI_STRINGS generator.
//
// Reads tools/eslint/ui-strings.json (the canonical source of truth — `strings`
// block is consumed; `_meta` is provenance only), writes site/src/lib/ui-strings.ts
// with a typed `UI_STRINGS` const + `UIStringKey` keyof type.
//
// Byte-idempotent for ui-strings.ts per CMA F-10 v1.3: a no-op generator run
// produces a no-op git diff. Strategy: compute desired TS content in memory,
// byte-compare against existing file, write only on mismatch. The
// `_meta.provenance.reconciled_at` field in the JSON is updated only when the
// `strings` block actually changed (i.e. when the TS write fires).
//
// Run via `npm run generate-ui-strings` (root package.json script).

import fs from 'node:fs/promises'
import path from 'node:path'

const JSON_PATH = path.resolve('tools/eslint/ui-strings.json')
const TS_PATH = path.resolve('site/src/lib/ui-strings.ts')

const BANNER = [
  '// Generated from tools/eslint/ui-strings.json by scripts/design/generate-ui-strings.mjs.',
  '// DO NOT EDIT BY HAND. Regenerate via `npm run generate-ui-strings`.',
].join('\n')

function buildTsContent(strings) {
  const lines = [BANNER, '', 'export const UI_STRINGS = {']
  for (const [key, value] of Object.entries(strings)) {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
  }
  lines.push('} as const')
  lines.push('')
  lines.push('export type UIStringKey = keyof typeof UI_STRINGS')
  lines.push('') // trailing newline
  return lines.join('\n')
}

async function readFileOrEmpty(p) {
  try {
    return await fs.readFile(p, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return ''
    throw err
  }
}

async function main() {
  const raw = await fs.readFile(JSON_PATH, 'utf8')
  const data = JSON.parse(raw)

  if (!data.strings || typeof data.strings !== 'object') {
    throw new Error(`${JSON_PATH}: missing or malformed "strings" block`)
  }

  const desiredTs = buildTsContent(data.strings)
  const existingTs = await readFileOrEmpty(TS_PATH)

  if (desiredTs === existingTs) {
    console.log(`[generate-ui-strings] no-op — ${TS_PATH} already in sync`)
    return
  }

  await fs.mkdir(path.dirname(TS_PATH), { recursive: true })
  await fs.writeFile(TS_PATH, desiredTs)
  console.log(`[generate-ui-strings] wrote ${TS_PATH} (${Object.keys(data.strings).length} keys)`)

  // Strings block changed → bump reconciled_at + rewrite JSON.
  // Preserve the rest of _meta exactly. JSON.stringify with insertion-order
  // object keys round-trips deterministically.
  if (!data._meta) data._meta = {}
  if (!data._meta.provenance) data._meta.provenance = {}
  data._meta.provenance.reconciled_at = new Date().toISOString()

  const desiredJson = JSON.stringify(data, null, 2) + '\n'
  if (desiredJson !== raw) {
    await fs.writeFile(JSON_PATH, desiredJson)
    console.log(`[generate-ui-strings] bumped _meta.provenance.reconciled_at in ${JSON_PATH}`)
  }
}

main().catch((err) => {
  console.error('[generate-ui-strings] failed:', err)
  process.exit(1)
})
