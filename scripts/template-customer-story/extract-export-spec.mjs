// scripts/template-customer-story/extract-export-spec.mjs
//
// MYGRATR-TEMPLATE-CUSTOMER-STORY — Step 0.5 export-spec extractor (no LLM).
//
// Unpacks the desktop artboard from docs/raw-html/Customer Story.html (bundled
// JSON string), renders it at 1280x2000, and writes real getComputedStyle()
// targets for the key template elements into
// audit-output/customer-story/export-spec.json.
//
// The Builder reads this JSON — not the full bundled HTML string.
//
// Usage: node scripts/template-customer-story/extract-export-spec.mjs

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')
const EXPORT_SRC = path.join(REPO_ROOT, 'docs/raw-html/Customer Story.html')
const EXPORT_TMP = '/tmp/cs-export.html'
const OUT_JSON = path.join(REPO_ROOT, 'audit-output/customer-story/export-spec.json')

const PROPS = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'color',
  'backgroundColor',
  'fontStyle',
  'fontFamily',
  'textTransform',
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
  'gap',
  'columnGap',
  'gridTemplateColumns',
  'display',
  'width',
  'height',
]

async function unpack() {
  const raw = await fs.readFile(EXPORT_SRC, 'utf8')
  const marker = '"<!DOCTYPE html>'
  const idx = raw.indexOf(marker)
  if (idx === -1) throw new Error('embedded JSON literal not found')
  let i = idx + 1
  let escaped = false
  while (i < raw.length) {
    const ch = raw[i]
    if (escaped) escaped = false
    else if (ch === '\\') escaped = true
    else if (ch === '"') break
    i++
  }
  const html = JSON.parse(raw.slice(idx, i + 1))
  await fs.writeFile(EXPORT_TMP, html, 'utf8')
}

async function main() {
  await unpack()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } })
  await page.goto(`file://${EXPORT_TMP}`, { waitUntil: 'load', timeout: 30_000 })
  await page.waitForTimeout(500)

  const spec = await page.evaluate((PROPS) => {
    const scope = document.querySelector('[data-screen-label="Customer story desktop"]')
    if (!scope) return { error: 'desktop scope not found' }

    const props = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const out = {}
      for (const p of PROPS) out[p] = cs[p]
      return out
    }
    const byText = (sel, text) =>
      [...scope.querySelectorAll(sel)].find((e) => e.textContent.trim() === text) || null
    const startsWith = (sel, text) =>
      [...scope.querySelectorAll(sel)].find((e) => e.textContent.trim().startsWith(text)) || null

    const h1 = scope.querySelector('h1')
    const eyebrows = [...scope.querySelectorAll('.ce-eyebrow')]
    const heroCategoryTag = scope.querySelector('.ce-tag')
    const companyName = startsWith('*', '{{ companyName }}')

    // TL;DR panel — the "★ TL;DR - Key results" card + tick list
    const tldrHeading = startsWith('*', '★ TL;DR')
    const tldrPanel = tldrHeading ? tldrHeading.closest('.ce-card') || tldrHeading.parentElement : null
    const tickItem = scope.querySelector('.ce-tick')

    // section headings
    const h2Customer = byText('h2', 'The customer')
    const h2Problem = byText('h2', 'The problem')
    const h2Solution = byText('h2', 'The solution')
    const h2Impact = byText('h2', 'The impact')
    const h2Cta = byText('h2', 'Scale with confidence')

    // eyebrow on an "Act" section
    const actEyebrow = eyebrows.find((e) => /^Act /.test(e.textContent.trim())) || null
    const hiringNeedsEyebrow = eyebrows.find((e) => e.textContent.trim() === 'Hiring needs') || null

    // body copy — first <p> after "The customer"
    let bodyCopy = null
    if (h2Customer) {
      let n = h2Customer
      for (let i = 0; i < 40 && n; i++) {
        n = n.nextElementSibling || (n.parentElement ? n.parentElement.nextElementSibling : null)
        if (n && n.tagName === 'P') {
          bodyCopy = n
          break
        }
        const p = n && n.querySelector ? n.querySelector('p') : null
        if (p) {
          bodyCopy = p
          break
        }
      }
    }

    // table (hiringNeedsTable)
    const table = scope.querySelector('table')
    const tableCell = scope.querySelector('td, th')

    // quote block — look for a blockquote-ish element near "The problem"
    const cards = [...scope.querySelectorAll('.ce-card')]

    // CTA panel — the "Scale with confidence" container + primary button
    const ctaPanel = h2Cta ? h2Cta.closest('.ce-card') || h2Cta.parentElement : null
    const primaryBtn = scope.querySelector('.ce-primary')

    // frame content inset (left padding of a direct section child)
    const introDiv = scope.querySelector(':scope > div')
    const introPL = introDiv ? parseFloat(getComputedStyle(introDiv).paddingLeft) || 0 : null

    return {
      frameWidth: scope.getBoundingClientRect().width,
      contentInsetLeft: introPL,
      elements: {
        h1: props(h1),
        heroCategoryTag: props(heroCategoryTag),
        companyName: props(companyName),
        tldrHeading: props(tldrHeading),
        tldrPanel: props(tldrPanel),
        tickItem: props(tickItem),
        hiringNeedsEyebrow: props(hiringNeedsEyebrow),
        actEyebrow: props(actEyebrow),
        h2Customer: props(h2Customer),
        h2Problem: props(h2Problem),
        h2Solution: props(h2Solution),
        h2Impact: props(h2Impact),
        h2Cta: props(h2Cta),
        bodyCopy: props(bodyCopy),
        table: props(table),
        tableCell: props(tableCell),
        ctaPanel: props(ctaPanel),
        primaryBtn: props(primaryBtn),
        firstCard: props(cards[0]),
      },
      foundMap: {
        h1: !!h1,
        heroCategoryTag: !!heroCategoryTag,
        companyName: !!companyName,
        tldrHeading: !!tldrHeading,
        tickItem: !!tickItem,
        actEyebrow: !!actEyebrow,
        table: !!table,
        ctaPanel: !!ctaPanel,
        primaryBtn: !!primaryBtn,
        h2s: {
          customer: !!h2Customer,
          problem: !!h2Problem,
          solution: !!h2Solution,
          impact: !!h2Impact,
          cta: !!h2Cta,
        },
        cardCount: cards.length,
      },
    }
  }, PROPS)

  await browser.close()

  spec.generatedAt = new Date().toISOString()
  spec.source = 'docs/raw-html/Customer Story.html (Customer story desktop frame)'
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true })
  await fs.writeFile(OUT_JSON, JSON.stringify(spec, null, 2))
  console.log(`Wrote ${OUT_JSON}`)
  console.log('foundMap:', JSON.stringify(spec.foundMap, null, 2))
  console.log('contentInsetLeft:', spec.contentInsetLeft)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
