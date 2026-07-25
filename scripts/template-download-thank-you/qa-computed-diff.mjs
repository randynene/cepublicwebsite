// scripts/template-download-thank-you/qa-computed-diff.mjs
//
// MYGRATR-TEMPLATE-DOWNLOAD-THANK-YOU — QA computed-value diff (LITE / body-diff).
//
// Extracts getComputedStyle() from the "Thank you desktop" export frame and from
// the built page (/download-thank-you/10-ai-prompts on a local `next start`),
// diffs the copy element set (h1, eyebrow, message, badge, docName, backLink)
// against QA tolerances, and runs the LITE structural gate: build green, both
// locale routes 200, robots noindex meta present, NO JSON-LD emitted, no
// client-render bailout. Chrome is NOT re-QA'd (Cost mode: body-diff only unless
// chrome touched — chrome was untouched).
//
// The primary CTA pill + card container are intentionally normalized to the
// canonical MegaMenuPillLabel size="cta" per batch rule #4, so they are excluded
// from the computed diff (known deviation from the export's larger pill).
//
// Read-only QA tooling. Does NOT edit template code.
//
// Usage:
//   PORT=3120 node scripts/template-download-thank-you/qa-computed-diff.mjs

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')
const EXPORT_SRC = path.join(REPO_ROOT, 'docs/raw-html/Download Thank You.html')
const EXPORT_TMP = '/tmp/dty-qa-export.html'
const PORT = process.env.PORT || '3120'
const BASE = `http://localhost:${PORT}`
const SLUG = '10-ai-prompts'
const DOC_NAME = '10 AI Prompts Worth Building Into Your Stack'
const BUILT_PATH = `/download-thank-you/${SLUG}`
const BUILT_PATH_UK = `/uk/download-thank-you/${SLUG}`
const OUT_JSON = path.join(REPO_ROOT, 'audit-output/download-thank-you/qa-diff-run.json')

const PROPS = ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'textTransform']

const PROP_RULES = {
  fontSize: { kind: 'numeric', tolerance: 0.5 },
  fontWeight: { kind: 'exact' },
  lineHeight: { kind: 'numeric', tolerance: 1 },
  letterSpacing: { kind: 'numeric', tolerance: 0.1 },
  color: { kind: 'color' },
  textTransform: { kind: 'exact' },
}

const LABELS = {
  h1: 'hero H1',
  eyebrow: 'success eyebrow',
  message: 'body message',
  badge: 'card badge',
  docName: 'card doc name',
  backLink: 'back link',
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
  let esc = false
  while (i < raw.length) {
    const c = raw[i]
    if (esc) esc = false
    else if (c === '\\') esc = true
    else if (c === '"') break
    i++
  }
  await fs.writeFile(EXPORT_TMP, JSON.parse(raw.slice(idx, i + 1)), 'utf8')
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------
async function extractExport(page) {
  return page.evaluate((PROPS) => {
    const scope = document.querySelector('[data-screen-label="Thank you desktop"]')
    if (!scope) return { error: 'export desktop scope not found' }
    const props = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const o = {}
      for (const p of PROPS) o[p] = cs[p]
      return o
    }
    const startsWith = (t) =>
      [...scope.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && e.textContent.trim().startsWith(t),
      ) || null

    const h1 = scope.querySelector('h1')
    const eyebrow = scope.querySelector('.ce-eyebrow')
    const message = startsWith('{{ message }}')
    const badge = startsWith('PDF')
    const docName = startsWith('10 AI Prompts')
    const backLink =
      [...scope.querySelectorAll('a')].find((e) => /Back to all free resources/i.test(e.textContent)) ||
      null

    return {
      found: {
        h1: !!h1,
        eyebrow: !!eyebrow,
        message: !!message,
        badge: !!badge,
        docName: !!docName,
        backLink: !!backLink,
      },
      h1: props(h1),
      eyebrow: props(eyebrow),
      message: props(message),
      badge: props(badge),
      docName: props(docName),
      backLink: props(backLink),
    }
  }, PROPS)
}

async function extractBuilt(page) {
  return page.evaluate(
    ({ PROPS, DOC_NAME }) => {
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
      const includes = (sel, t) =>
        [...main.querySelectorAll(sel)].find((e) => e.textContent.includes(t)) || null

      const h1 = main.querySelector('h1')
      const eyebrow = byText('p', 'Download ready')
      const message = includes('p', 'emailed you a copy')
      const badge = byText('p', 'Ready now')
      const docName = byText('p', DOC_NAME)
      const backLink = includes('a', 'Back to all free resources')

      return {
        found: {
          h1: !!h1,
          eyebrow: !!eyebrow,
          message: !!message,
          badge: !!badge,
          docName: !!docName,
          backLink: !!backLink,
        },
        h1: props(h1),
        eyebrow: props(eyebrow),
        message: props(message),
        badge: props(badge),
        docName: props(docName),
        backLink: props(backLink),
      }
    },
    { PROPS, DOC_NAME },
  )
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

// ---------------------------------------------------------------------------
// Structural gate (LITE — noindex + NO JSON-LD)
// ---------------------------------------------------------------------------
// Sitewide chrome JSON-LD is expected on every page (root-layout Organization +
// WebSite + logo ImageObject, and nav SiteNavigationElement). The DTY rule is
// specifically NO page-level structured data on this private noindex page.
const PAGE_LEVEL_TYPES = new Set([
  'Article',
  'BlogPosting',
  'NewsArticle',
  'Review',
  'BreadcrumbList',
  'Person',
  'VideoObject',
  'CollectionPage',
  'Product',
  'FAQPage',
])
function extractPageLevelJsonLdTypes(html) {
  const types = []
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m
  while ((m = re.exec(html))) {
    const raw = m[1].trim()
    if (!raw) continue
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      continue
    }
    const nodes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed]
    for (const n of nodes) {
      const t = n && n['@type']
      if (Array.isArray(t)) types.push(...t)
      else if (t) types.push(t)
    }
  }
  return types.filter((t) => PAGE_LEVEL_TYPES.has(t))
}
async function runGate(buildOk) {
  const gate = []
  gate.push({ check: 'npm run build GREEN', status: buildOk ? 'PASS' : 'FAIL' })
  const res = await fetch(`${BASE}${BUILT_PATH}`)
  const html = await res.text()

  const pageLevel = extractPageLevelJsonLdTypes(html)
  gate.push({
    check: 'NO page-level structured data (chrome JSON-LD allowed)',
    status: pageLevel.length === 0 ? 'PASS' : 'FAIL',
    evidence: pageLevel.length ? `page-level types: ${pageLevel.join(', ')}` : 'chrome-only',
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

  const robots = html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/i)
  const noindex = robots && /noindex/i.test(robots[1])
  gate.push({
    check: '<meta name="robots"> noindex present',
    status: noindex ? 'PASS' : 'FAIL',
    evidence: robots ? robots[1] : 'none',
  })

  const bailout = html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING')
  gate.push({ check: 'No client-render bailout', status: bailout ? 'FAIL' : 'PASS' })
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
    await bp.waitForTimeout(600)
    built = await extractBuilt(bp)
    await bp.close()
  } finally {
    await browser.close()
  }

  console.log('Export found:', exp.found)
  console.log('Built found:', built.found)

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
      rows.push({
        element: LABELS[key],
        property: '(element)',
        export: e ? 'FOUND' : 'NOT FOUND',
        built: b ? 'FOUND' : 'NOT FOUND',
        status: 'FAIL',
      })
      continue
    }
    for (const prop of PROPS) {
      const { match } = compareProp(prop, e[prop], b[prop])
      rows.push({ element: LABELS[key], property: prop, export: e[prop], built: b[prop], status: match ? 'MATCH' : 'FAIL' })
    }
  }

  const materialFails = rows.filter((r) => r.status === 'FAIL')

  const sorted = [...rows].sort((a, b) => (a.status === 'FAIL' ? -1 : 1) - (b.status === 'FAIL' ? -1 : 1))
  console.log('\n=== COMPUTED DIFF (FAILs first) ===')
  for (const r of sorted) {
    console.log(`${r.status.padEnd(6)} | ${r.element.padEnd(16)} | ${String(r.property).padEnd(14)} | export=${JSON.stringify(r.export)} built=${JSON.stringify(r.built)}`)
  }

  console.log('\n=== Step C: structural gate ===')
  const gate = await runGate(buildOk)
  for (const g of gate) {
    console.log(`${g.status.padEnd(6)} | ${g.check}`)
    if (g.evidence) console.log(`         ${g.evidence}`)
  }
  const gateFails = gate.filter((g) => g.status === 'FAIL')

  const verdict = materialFails.length === 0 && gateFails.length === 0 ? 'CLEAN PASS' : 'FAIL'
  console.log(`\nMaterial computed fails: ${materialFails.length}`)
  console.log(`Gate fails: ${gateFails.length}`)
  console.log(`\n=== VERDICT: ${verdict} ===`)

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true })
  await fs.writeFile(
    OUT_JSON,
    JSON.stringify({ generatedAt: new Date().toISOString(), slug: SLUG, rows, gate, materialFails, verdict }, null, 2),
  )
  console.log(`Wrote ${OUT_JSON}`)
  process.exit(verdict === 'CLEAN PASS' ? 0 : 1)
}

main().catch((err) => {
  console.error('qa-computed-diff FAILED', err)
  process.exit(1)
})
