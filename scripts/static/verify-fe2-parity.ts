// Parity gate for the For Engineers (/for-developers) page body.
//
// The page body is a tokenised copy of a frozen Figma HTML export. This asserts
// that hydrating the tokenised template (fe2-body.ts) with the static defaults
// (FOR_ENGINEERS_CONTENT, all image slots empty) reproduces the ORIGINAL export
// byte-for-byte. The pristine original lives in __fe2-original.json (never
// regenerated once the body is tokenised).
//
// Run: npm run static:verify-fe2-parity
// Exit code 0 = byte-identical; 1 = drift (prints the first differing offset).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { FOR_ENGINEERS_CONTENT } from '../../site/src/components/templates/for-engineers/content'
import { FE2_POST_HTML, FE2_PRE_HTML } from '../../site/src/components/templates/for-engineers/fe2-body'
import { hydrateFe2 } from '../../site/src/components/templates/for-engineers/fe2-hydrate'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = JSON.parse(readFileSync(join(here, '__fe2-original.json'), 'utf8')) as {
  pre: string
  post: string
}

function firstDiff(a: string, b: string): number {
  const n = Math.max(a.length, b.length)
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return i
  }
  return -1
}

let failed = false
for (const [label, template, original] of [
  ['PRE', FE2_PRE_HTML, fixture.pre],
  ['POST', FE2_POST_HTML, fixture.post],
] as const) {
  const rendered = hydrateFe2(template, FOR_ENGINEERS_CONTENT)
  if (rendered === original) {
    console.log(`${label}: PASS (byte-identical, ${original.length} chars)`)
  } else {
    failed = true
    const i = firstDiff(rendered, original)
    console.error(`${label}: FAIL at offset ${i}`)
    console.error(`  rendered: ${JSON.stringify(rendered.slice(Math.max(0, i - 40), i + 40))}`)
    console.error(`  original: ${JSON.stringify(original.slice(Math.max(0, i - 40), i + 40))}`)
  }
}

if (failed) {
  console.error('\nFE2 PARITY FAIL - the rebuilt body no longer matches the frozen export.')
  process.exit(1)
}
console.log('\nFE2 PARITY PASS - hydrate(tokenised, defaults) === frozen export.')
