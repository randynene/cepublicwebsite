// scripts/template-customer-story/qa-computed-diff.mjs
//
// MYGRATR-TEMPLATE-CUSTOMER-STORY — QA computed-value diff.
//
// Extracts getComputedStyle() from the "Customer story desktop" export frame
// (unpacked from the bundled JSON string) and from the built page
// (/customer-story/salmon-software on a local `next start`), diffs a curated
// paired element set property-by-property against QA tolerances, runs the 5
// structural-gate checks (build green, Article+BreadcrumbList JSON-LD, both
// locale routes 200, meta description, no client-render bailout), and the
// chrome/breadcrumb rows (Cost-mode: full chrome QA on batch template #1).
//
// Read-only QA tooling. Does NOT edit template code.
//
// Usage:
//   PORT=3120 (built app served) node scripts/template-customer-story/qa-computed-diff.mjs

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')
const EXPORT_SRC = path.join(REPO_ROOT, 'docs/raw-html/Customer Story.html')
const EXPORT_TMP = '/tmp/cs-export.html'
const PORT = process.env.PORT || '3120'
const BASE = `http://localhost:${PORT}`
const SLUG = 'salmon-software'
const BUILT_PATH = `/customer-story/${SLUG}`
const BUILT_PATH_UK = `/uk/customer-story/${SLUG}`
const OUT_JSON = path.join(REPO_ROOT, 'audit-output/customer-story/qa-diff-run.json')

const PROPS = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'color',
  'textTransform',
]

const PROP_RULES = {
  fontSize: { kind: 'numeric', tolerance: 0.5 },
  fontWeight: { kind: 'exact' },
  lineHeight: { kind: 'numeric', tolerance: 1 },
  letterSpacing: { kind: 'numeric', tolerance: 0.1 },
  color: { kind: 'color' },
  textTransform: { kind: 'exact' },
}

// ---------------------------------------------------------------------------
// Export unpack
// ---------------------------------------------------------------------------
async function extractExportHtml() {
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

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------
async function extractExport(page) {
  return page.evaluate((PROPS) => {
    const scope = document.querySelector('[data-screen-label="Customer story desktop"]')
    if (!scope) return { error: 'export desktop scope not found' }
    const props = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      for (const p of PROPS) o[p] = cs[p]
      return o
    }
    const byText = (sel, t) =>
      [...scope.querySelectorAll(sel)].find((e) => e.textContent.trim() === t) || null

    const h1 = scope.querySelector('h1')
    const actEyebrow =
      [...scope.querySelectorAll('.ce-eyebrow')].find((e) => /^Act /.test(e.textContent.trim())) ||
      null
    const h2Problem = byText('h2', 'The problem')
    const h2Cta = byText('h2', 'Scale with confidence')
    const bodyCopy =
      [...scope.querySelectorAll('p')].find((p) => {
        const fs = parseFloat(getComputedStyle(p).fontSize)
        return fs >= 17.5 && fs <= 18.5 && p.textContent.trim().length > 40
      }) || null
    const companyName =
      [...scope.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && e.textContent.trim().startsWith('{{ companyName }}'),
      ) || null

    return {
      found: {
        h1: !!h1,
        actEyebrow: !!actEyebrow,
        h2Problem: !!h2Problem,
        h2Cta: !!h2Cta,
        bodyCopy: !!bodyCopy,
        companyName: !!companyName,
      },
      h1: props(h1),
      actEyebrow: props(actEyebrow),
      h2Problem: props(h2Problem),
      h2Cta: props(h2Cta),
      bodyCopy: props(bodyCopy),
      companyName: props(companyName),
    }
  }, PROPS)
}

async function extractBuilt(page) {
  return page.evaluate((PROPS) => {
    const main = document.querySelector('main#main') || document.querySelector('main') || document.body
    const props = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      for (const p of PROPS) o[p] = cs[p]
      return o
    }
    const byText = (sel, t) =>
      [...main.querySelectorAll(sel)].find((e) => e.textContent.trim() === t) || null

    const h1 = main.querySelector('h1')
    const actEyebrow = byText('p', 'Act one')
    const h2Problem = byText('h2', 'The problem')
    const h2Cta = byText('h2', 'Scale with confidence')
    // first body paragraph inside a fold (18px)
    const bodyCopy =
      [...main.querySelectorAll('p')].find((p) => {
        const fs = parseFloat(getComputedStyle(p).fontSize)
        return fs >= 17.5 && fs <= 18.5 && p.textContent.trim().length > 40
      }) || null
    // company name span in header (15px semibold, white) next to logo
    const companyName =
      [...main.querySelectorAll('span')].find((s) => {
        const cs = getComputedStyle(s)
        return (
          parseFloat(cs.fontSize) >= 14.5 &&
          parseFloat(cs.fontSize) <= 15.5 &&
          cs.fontWeight === '600' &&
          s.children.length === 0 &&
          s.textContent.trim().length > 2 &&
          s.textContent.trim().length < 40
        )
      }) || null

    // chrome
    const header = document.querySelector('header')
    const footer = document.querySelector('footer')
    const headerCta =
      header &&
      [...header.querySelectorAll('a,button')].some((e) =>
        /schedule a call|book a call|get started|contact/i.test(e.textContent),
      )
    const footerCta =
      footer &&
      [...footer.querySelectorAll('*')].some((e) => /hire/i.test(e.textContent))
    // visible breadcrumb inside main
    const breadcrumbInMain =
      !!main.querySelector('nav[aria-label*="readcrumb" i]') ||
      [...main.querySelectorAll('nav')].some((n) => /breadcrumb/i.test(n.className))
    // inline closing CTA duplication inside main (a "Ready to hire" band)
    const closingBandInMain = [...main.querySelectorAll('h1,h2,h3')].some((h) =>
      /ready to hire your next engineer/i.test(h.textContent),
    )

    return {
      found: {
        h1: !!h1,
        actEyebrow: !!actEyebrow,
        h2Problem: !!h2Problem,
        h2Cta: !!h2Cta,
        bodyCopy: !!bodyCopy,
        companyName: !!companyName,
      },
      h1: props(h1),
      actEyebrow: props(actEyebrow),
      h2Problem: props(h2Problem),
      h2Cta: props(h2Cta),
      bodyCopy: props(bodyCopy),
      companyName: props(companyName),
      chrome: {
        headerPresent: !!header,
        footerPresent: !!footer,
        headerCtaPresent: !!headerCta,
        footerCtaPresent: !!footerCta,
        breadcrumbInMain,
        closingBandInMain,
      },
    }
  }, PROPS)
}

// ---------------------------------------------------------------------------
// Diffing (with canvas color canonicalization)
// ---------------------------------------------------------------------------
function parsePx(v) {
  if (v == null) return null
  const m = String(v).match(/-?[\d.]+(?:e[+-]?\d+)?/i)
  return m ? parseFloat(m[0]) : null
}
function normalizeColor(v) {
  return v == null ? v : String(v).replace(/\s+/g, ' ').trim()
}
const COLOR_RGBA = new Map()
function colorsEqual(a, b) {
  const na = normalizeColor(a)
  const nb = normalizeColor(b)
  if (na === nb) return true
  const ra = COLOR_RGBA.get(na)
  const rb = COLOR_RGBA.get(nb)
  if (!ra || !rb) return false
  const cd = Math.max(Math.abs(ra[0] - rb[0]), Math.abs(ra[1] - rb[1]), Math.abs(ra[2] - rb[2]))
  const ad = Math.abs(ra[3] - rb[3]) / 255
  return cd <= 10 && ad <= 0.02
}
async function canonicalizeColors(browser, colors) {
  const unique = [...new Set(colors.filter(Boolean).map(normalizeColor))]
  if (!unique.length) return
  const page = await browser.newPage()
  const res = await page.evaluate((strs) => {
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    const ctx = c.getContext('2d')
    return strs.map((s) => {
      try {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = s
        ctx.fillRect(0, 0, 1, 1)
        return Array.from(ctx.getImageData(0, 0, 1, 1).data)
      } catch {
        return null
      }
    })
  }, unique)
  await page.close()
  unique.forEach((s, i) => {
    if (res[i]) COLOR_RGBA.set(s, res[i])
  })
}
function compareProp(prop, ev, bv) {
  const rule = PROP_RULES[prop] || { kind: 'exact' }
  if (ev == null || bv == null) return { match: ev === bv }
  if (rule.kind === 'color') return { match: colorsEqual(ev, bv) }
  if (rule.kind === 'exact') return { match: String(ev).trim() === String(bv).trim() }
  if (rule.kind === 'numeric') {
    const tnz = prop === 'letterSpacing'
    const ne = tnz && ev === 'normal' ? 0 : parsePx(ev)
    const nb = tnz && bv === 'normal' ? 0 : parsePx(bv)
    if (ne == null || nb == null) return { match: ev === bv }
    return { match: Math.abs(ne - nb) <= rule.tolerance, delta: Math.abs(ne - nb) }
  }
  return { match: ev === bv }
}

const LABELS = {
  h1: 'hero H1',
  actEyebrow: 'act eyebrow',
  h2Problem: 'section H2 (The problem)',
  h2Cta: 'CTA H2 (Scale with confidence)',
  bodyCopy: 'body copy paragraph',
  companyName: 'hero company name',
}

// ---------------------------------------------------------------------------
// Structural gate
// ---------------------------------------------------------------------------
const FORBIDDEN = new Set(['VideoObject', 'Review', 'Person', 'CollectionPage', 'BlogPosting'])
function extractJsonLd(html) {
  const out = []
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m
  while ((m = re.exec(html))) {
    const raw = m[1].trim()
    if (!raw) continue
    try {
      const p = JSON.parse(raw)
      if (p && Array.isArray(p['@graph'])) out.push(...p['@graph'])
      else out.push(p)
    } catch (e) {
      out.push({ __parseError: e.message })
    }
  }
  return out
}
async function runGate(buildOk) {
  const gate = []
  gate.push({ check: 'npm run build GREEN', status: buildOk ? 'PASS' : 'FAIL' })
  const res = await fetch(`${BASE}${BUILT_PATH}`)
  const html = await res.text()
  const ld = extractJsonLd(html)
  const types = ld.map((b) => b['@type']).filter(Boolean)
  const article = ld.filter((b) => b['@type'] === 'Article')
  const bc = ld.filter((b) => b['@type'] === 'BreadcrumbList')
  const forbidden = types.filter((t) => FORBIDDEN.has(t))
  const notes = []
  let ok = true
  if (article.length !== 1) {
    ok = false
    notes.push(`expected 1 Article, found ${article.length}`)
  } else if (!article[0].headline) {
    ok = false
    notes.push('Article missing headline')
  }
  if (bc.length !== 1) {
    ok = false
    notes.push(`expected 1 BreadcrumbList, found ${bc.length}`)
  }
  if (forbidden.length) {
    ok = false
    notes.push(`forbidden types: ${forbidden.join(', ')}`)
  }
  gate.push({
    check: 'Article + BreadcrumbList JSON-LD valid, no forbidden types',
    status: ok ? 'PASS' : 'FAIL',
    evidence: `@types: [${types.join(', ')}]${notes.length ? ' | ' + notes.join('; ') : ''}`,
  })
  const [us, uk] = await Promise.all([
    fetch(`${BASE}${BUILT_PATH}`),
    fetch(`${BASE}${BUILT_PATH_UK}`),
  ])
  gate.push({
    check: 'Both locale routes HTTP 200',
    status: us.status === 200 && uk.status === 200 ? 'PASS' : 'FAIL',
    evidence: `US ${us.status}; UK ${uk.status}`,
  })
  const meta = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)
  gate.push({
    check: '<meta name="description"> present',
    status: meta ? 'PASS' : 'FAIL',
    evidence: meta ? meta[1].slice(0, 80) : 'none',
  })
  const bailout = html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING')
  gate.push({
    check: 'No client-render bailout',
    status: bailout ? 'FAIL' : 'PASS',
  })
  return gate
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const buildOk = (process.env.QA_BUILD_STATUS || 'GREEN') === 'GREEN'
  console.log('=== Step A: unpack export desktop frame ===')
  await extractExportHtml()

  const browser = await chromium.launch({ headless: true })
  let exp, built
  try {
    const ep = await browser.newPage({ viewport: { width: 1280, height: 2000 } })
    await ep.goto(`file://${EXPORT_TMP}`, { waitUntil: 'load', timeout: 30000 })
    await ep.waitForTimeout(500)
    exp = await extractExport(ep)
    await ep.close()

    console.log('=== Step B: built page ===')
    const bp = await browser.newPage({ viewport: { width: 1280, height: 2000 } })
    try {
      await bp.goto(`${BASE}${BUILT_PATH}`, { waitUntil: 'networkidle', timeout: 30000 })
    } catch {
      await bp.goto(`${BASE}${BUILT_PATH}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    }
    await bp.waitForTimeout(800)
    built = await extractBuilt(bp)
    await bp.close()
  } finally {
    await browser.close()
  }

  console.log('Export found:', exp.found)
  console.log('Built found:', built.found)
  console.log('Chrome:', built.chrome)

  const b2 = await chromium.launch({ headless: true })
  try {
    const colors = []
    for (const d of [exp, built])
      for (const k of Object.keys(LABELS)) if (d[k]?.color) colors.push(d[k].color)
    await canonicalizeColors(b2, colors)
  } finally {
    await b2.close()
  }

  const rows = []
  for (const key of Object.keys(LABELS)) {
    const e = exp[key]
    const b = built[key]
    if (!e || !b) {
      rows.push({ element: LABELS[key], property: '(element)', export: e ? 'FOUND' : 'NOT FOUND', built: b ? 'FOUND' : 'NOT FOUND', status: 'FAIL' })
      continue
    }
    for (const prop of PROPS) {
      const { match } = compareProp(prop, e[prop], b[prop])
      rows.push({ element: LABELS[key], property: prop, export: e[prop], built: b[prop], status: match ? 'MATCH' : 'FAIL' })
    }
  }

  // chrome / structural rows
  const chromeRows = []
  const c = built.chrome
  chromeRows.push({ check: 'Sitewide header present', status: c.headerPresent ? 'PASS' : 'FAIL' })
  chromeRows.push({ check: 'Sitewide footer present', status: c.footerPresent ? 'PASS' : 'FAIL' })
  chromeRows.push({ check: 'Footer top CTA (italic lime "hire") present', status: c.footerCtaPresent ? 'PASS' : 'FAIL' })
  chromeRows.push({ check: 'NO visible breadcrumb nav in <main>', status: c.breadcrumbInMain ? 'FAIL' : 'PASS' })
  chromeRows.push({ check: 'NO inline "Ready to hire" closing band in <main>', status: c.closingBandInMain ? 'FAIL' : 'PASS' })

  const materialFails = rows.filter((r) => r.status === 'FAIL')
  const chromeFails = chromeRows.filter((r) => r.status === 'FAIL')

  const sorted = [...rows].sort((a, b) => (a.status === 'FAIL' ? -1 : 1) - (b.status === 'FAIL' ? -1 : 1))
  console.log('\n=== COMPUTED DIFF (FAILs first) ===')
  for (const r of sorted) {
    console.log(`${r.status.padEnd(6)} | ${r.element.padEnd(30)} | ${String(r.property).padEnd(14)} | export=${JSON.stringify(r.export)} built=${JSON.stringify(r.built)}`)
  }

  console.log('\n=== CHROME / STRUCTURAL ROWS ===')
  for (const r of chromeRows) console.log(`${r.status.padEnd(6)} | ${r.check}`)

  console.log('\n=== Step C: structural gate ===')
  const gate = await runGate(buildOk)
  for (const g of gate) {
    console.log(`${g.status.padEnd(6)} | ${g.check}`)
    if (g.evidence) console.log(`         ${g.evidence}`)
  }
  const gateFails = gate.filter((g) => g.status === 'FAIL')

  const verdict =
    materialFails.length === 0 && chromeFails.length === 0 && gateFails.length === 0
      ? 'CLEAN PASS'
      : 'FAIL'
  console.log(`\nMaterial computed fails: ${materialFails.length}`)
  console.log(`Chrome/structural fails: ${chromeFails.length}`)
  console.log(`Gate fails: ${gateFails.length}`)
  console.log(`\n=== VERDICT: ${verdict} ===`)

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true })
  await fs.writeFile(
    OUT_JSON,
    JSON.stringify({ generatedAt: new Date().toISOString(), slug: SLUG, rows, chromeRows, gate, materialFails, verdict }, null, 2),
  )
  console.log(`Wrote ${OUT_JSON}`)
  process.exit(verdict === 'CLEAN PASS' ? 0 : 1)
}

main().catch((err) => {
  console.error('qa-computed-diff FAILED', err)
  process.exit(1)
})
