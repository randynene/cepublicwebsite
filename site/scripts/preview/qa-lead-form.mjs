// QA the quick hiring form on every page that carries it, against a real deploy.
//
// This exists because of a bug that every other check passed. The form was placed
// inside a template whose stylesheet carries `.he * { margin: 0; padding: 0 }`.
// That stylesheet is unlayered, so it outranks Tailwind's layered utilities and
// zeroed every piece of spacing in the form. Types were clean, lint was clean, the
// element was present in the HTML, and the page was unreadable.
//
// So this does not check "is the form there". It MEASURES the rendered result and
// fails on numbers, because "present in the DOM" and "laid out correctly" are
// different claims and only the second one matters to a visitor.
//
// Run: node scripts/preview/qa-lead-form.mjs [baseUrl]

import { mkdirSync } from 'node:fs'

import { chromium } from 'playwright'

const BASE =
  process.argv[2] ??
  'https://mygratr-git-cursor-hubspot-gateway-lock-c05e-cloud-employee.vercel.app'
const OUT = '/workspace/artifacts/qa-lead-form'
mkdirSync(OUT, { recursive: true })

/** `form: false` means the page is expected NOT to carry it. */
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/how-it-works', name: 'how-it-works' },
  { path: '/services', name: 'services-hub' },
  { path: '/technology', name: 'technology-hub' },
  { path: '/technology/react-developers', name: 'technology-detail' },
  { path: '/services/ai-engineers', name: 'service-detail' },
  { path: '/services/software-engineers', name: 'hire-engineers' },
  { path: '/services/fractional-ctos', name: 'fractional-cto' },
  { path: '/uk/technology/python-developers', name: 'uk-technology-detail' },
  { path: '/uk/services/devops-engineers', name: 'uk-service-detail' },
  { path: '/uk', name: 'uk-home' },
  // Deliberately without the form, to prove the absence is intentional and that
  // nothing leaked onto pages that were meant to stay clean. The three location
  // pages used to be in this group; they carry it as of 3 Aug.
  { path: '/services/latam-developers', name: 'location-latam' },
  { path: '/services/philippines-developers', name: 'location-philippines' },
  { path: '/services/eastern-europe-developers', name: 'location-eastern-europe' },
  { path: '/blog', name: 'blog-hub', form: false },
  { path: '/pricing', name: 'pricing', form: false },
]

/**
 * Layout invariants. Deliberately loose: they are here to catch a collapsed or
 * clobbered layout, not to police a two-pixel design change.
 */
const EXPECT = {
  formHeightMin: 300, // a collapsed form measured ~120px; a healthy one 500+
  tileHeightMin: 55,
  tileHeightMax: 110,
  tilePaddingLeftMin: 14,
  railNumberSizeMin: 18,
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 })

const rows = []
let failures = 0

for (const spec of PAGES) {
  const url = `${BASE}${spec.path}`
  const expectForm = spec.form !== false
  const problems = []

  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  const status = res?.status() ?? 0
  if (status !== 200) problems.push(`HTTP ${status}`)

  await page.waitForTimeout(700)

  // `.qh-form` not `section.qh-form`: the bare variant renders a div, and the
  // first version of this check silently stopped finding the form when that
  // landed. A selector is part of the assertion and can rot with the code.
  const section = page.locator('.qh-form').first()
  const present = (await section.count()) > 0

  if (expectForm && !present) problems.push('form MISSING')
  if (!expectForm && present) problems.push('form present but should NOT be')

  let measured = null
  if (present && expectForm) {
    await section.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)

    measured = await page.evaluate((expect) => {
      const sec = document.querySelector('.qh-form')
      if (!sec) return null
      const tile = sec.querySelector('button[aria-pressed]')
      const tileCs = tile ? getComputedStyle(tile) : null
      const num = sec.querySelector('ol li span')
      const out = {
        // Overall rendered height is the invariant that actually catches the
        // failure mode. A form clobbered by a host reset collapsed to ~120px;
        // laid out correctly it is 500px or more. Padding is measured per
        // variant and differs between them, so height is the honest check.
        formHeight: Math.round(sec.getBoundingClientRect().height),
        // Null on pages that prefill the role: those open on the skills step,
        // so no role tile exists. Absence there is correct, not a fault.
        tileHeight: tile ? Math.round(tile.getBoundingClientRect().height) : null,
        tilePaddingLeft: tileCs ? parseFloat(tileCs.paddingLeft) : null,
        railNumberSize: num ? Math.round(num.getBoundingClientRect().height) : null,
        // A form wider than the viewport is the other way this breaks.
        overflows: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        steps: sec.querySelectorAll('ol li').length,
      }
      out.problems = []
      if (out.formHeight < expect.formHeightMin)
        out.problems.push(`form only ${out.formHeight}px tall - collapsed layout`)
      if (out.tileHeight !== null && (out.tileHeight < expect.tileHeightMin || out.tileHeight > expect.tileHeightMax))
        out.problems.push(`tile height ${out.tileHeight}px`)
      if (out.tilePaddingLeft !== null && out.tilePaddingLeft < expect.tilePaddingLeftMin)
        out.problems.push(`tile padding-left ${out.tilePaddingLeft}px`)
      if (out.railNumberSize !== null && out.railNumberSize < expect.railNumberSizeMin)
        out.problems.push(`rail number ${out.railNumberSize}px`)
      if (out.overflows) out.problems.push('page overflows horizontally')
      return out
    }, EXPECT)

    problems.push(...(measured?.problems ?? []))
    await section.screenshot({ path: `${OUT}/${spec.name}.png` }).catch(() => {})
  }

  if (problems.length > 0) failures += 1
  rows.push({ name: spec.name, path: spec.path, status, present, measured, problems })
}

await browser.close()

console.log(`\nQA: quick hiring form across ${PAGES.length} pages on ${BASE}\n`)
for (const r of rows) {
  const verdict = r.problems.length === 0 ? 'OK  ' : 'FAIL'
  const detail = r.measured
    ? `steps ${r.measured.steps}, ${r.measured.formHeight}px tall, tile ${r.measured.tileHeight}px, pad-l ${r.measured.tilePaddingLeft}px`
    : r.present
      ? 'present'
      : 'no form (expected)'
  console.log(`${verdict}  ${r.name.padEnd(22)} ${r.path.padEnd(34)} ${detail}`)
  for (const p of r.problems) console.log(`        - ${p}`)
}
console.log(`\n${rows.length - failures}/${rows.length} pages clean. Screenshots in ${OUT}`)
if (failures > 0) process.exitCode = 1
