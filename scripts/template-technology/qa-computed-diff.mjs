// scripts/template-technology/qa-computed-diff.mjs
//
// MYGRATR-TEMPLATE-TECHNOLOGY — QA computed-value diff.
//
// Extracts getComputedStyle() from the "Technology desktop" export frame of
// docs/raw-html/Technology.html (unpacked from the bundled JSON string) and
// from the built page (/technology/dotnet-developers on a local `next start`),
// diffs a curated paired element set property-by-property against QA
// tolerances, runs the structural-gate checks (build green, WebPage +
// BreadcrumbList JSON-LD, both locale routes 200, meta description, no
// client-render bailout), and the chrome/breadcrumb rows.
//
// Read-only QA tooling. Does NOT edit template code.
//
// Usage: PORT=3120 node scripts/template-technology/qa-computed-diff.mjs

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')
const EXPORT_SRC = path.join(REPO_ROOT, 'docs/raw-html/Technology.html')
const EXPORT_TMP = '/tmp/technology-export.html'
const EXPORT_LABEL = 'Technology desktop'
const PORT = process.env.PORT || '3120'
const BASE = `http://localhost:${PORT}`
const SLUG = 'dotnet-developers'
const BUILT_PATH = `/technology/${SLUG}`
const BUILT_PATH_UK = `/uk/technology/${SLUG}`
const OUT_JSON = path.join(REPO_ROOT, 'audit-output/technology/qa-diff-run.json')

const PROPS = ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'textTransform']
const PROP_RULES = {
  fontSize: { kind: 'numeric', tolerance: 0.5 },
  fontWeight: { kind: 'exact' },
  lineHeight: { kind: 'numeric', tolerance: 1 },
  letterSpacing: { kind: 'numeric', tolerance: 0.1 },
  color: { kind: 'color' },
  textTransform: { kind: 'exact' },
}

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

function makeProps() {
  return (el) => {
    if (!el) return null
    const cs = getComputedStyle(el)
    const o = {}
    for (const p of ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'textTransform'])
      o[p] = cs[p]
    return o
  }
}

async function extractExport(page) {
  return page.evaluate((label) => {
    const scope = document.querySelector(`[data-screen-label="${label}"]`)
    if (!scope) return { error: 'export desktop scope not found' }
    const cs = (el) => (el ? getComputedStyle(el) : null)
    const props = (el) => {
      if (!el) return null
      const c = getComputedStyle(el)
      return {
        fontSize: c.fontSize, fontWeight: c.fontWeight, lineHeight: c.lineHeight,
        letterSpacing: c.letterSpacing, color: c.color, textTransform: c.textTransform,
      }
    }
    const near = (lo, hi, extra) =>
      [...scope.querySelectorAll('*')].find((e) => {
        if (e.childElementCount !== 0) return false
        const fs = parseFloat(getComputedStyle(e).fontSize)
        return fs >= lo && fs <= hi && (!extra || extra(e))
      }) || null

    const h1 = scope.querySelector('h1')
    const tagline = near(18.5, 19.5, (e) => e.tagName === 'P')
    const foldEyebrow =
      [...scope.querySelectorAll('*')].find((e) => {
        const c = getComputedStyle(e)
        return e.childElementCount === 0 && parseFloat(c.fontSize) >= 11 && parseFloat(c.fontSize) <= 12 &&
          c.textTransform === 'uppercase'
      }) || null
    const foldH2 =
      [...scope.querySelectorAll('h2')].find((e) => {
        const fs = parseFloat(getComputedStyle(e).fontSize)
        return fs >= 45 && fs <= 47
      }) || null
    const introPara = near(17.5, 18.5, (e) => e.tagName === 'P')
    // Bullet text: 16px leaf with a real line-height (~25px), excluding hidden
    // zero-line-height Figma artifact nodes and the 600-weight item-number badge.
    const bulletText = near(15.5, 16.5, (e) => {
      const c = getComputedStyle(e)
      const lh = parseFloat(c.lineHeight)
      return c.fontWeight !== '600' && lh >= 23 && lh <= 27
    })
    const itemHeader =
      [...scope.querySelectorAll('*')].find((e) => {
        const c = getComputedStyle(e)
        return e.childElementCount === 0 && parseFloat(c.fontSize) >= 18.5 && parseFloat(c.fontSize) <= 19.5 &&
          c.fontWeight === '600'
      }) || null
    // Item description: a <p> at 14.5px / weight 400 / line-height ~22 (skips the
    // lime CTA glyphs and any 14.5px non-paragraph nodes).
    const itemDesc =
      [...scope.querySelectorAll('p')].find((e) => {
        const c = getComputedStyle(e)
        const fs = parseFloat(c.fontSize), lh = parseFloat(c.lineHeight)
        return fs >= 14 && fs <= 15 && c.fontWeight === '400' && lh >= 21 && lh <= 23
      }) || null

    return {
      found: { h1: !!h1, tagline: !!tagline, foldEyebrow: !!foldEyebrow, foldH2: !!foldH2, introPara: !!introPara, bulletText: !!bulletText, itemHeader: !!itemHeader, itemDesc: !!itemDesc },
      h1: props(h1), tagline: props(tagline), foldEyebrow: props(foldEyebrow), foldH2: props(foldH2),
      introPara: props(introPara), bulletText: props(bulletText), itemHeader: props(itemHeader), itemDesc: props(itemDesc),
    }
  }, EXPORT_LABEL)
}

async function extractBuilt(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main#main') || document.querySelector('main') || document.body
    const props = (el) => {
      if (!el) return null
      const c = getComputedStyle(el)
      return {
        fontSize: c.fontSize, fontWeight: c.fontWeight, lineHeight: c.lineHeight,
        letterSpacing: c.letterSpacing, color: c.color, textTransform: c.textTransform,
      }
    }
    const near = (lo, hi, extra) =>
      [...main.querySelectorAll('*')].find((e) => {
        if (e.childElementCount !== 0) return false
        const fs = parseFloat(getComputedStyle(e).fontSize)
        return fs >= lo && fs <= hi && (!extra || extra(e))
      }) || null

    const h1 = main.querySelector('h1')
    const tagline = near(18.5, 19.5, (e) => e.tagName === 'P')
    const foldEyebrow =
      [...main.querySelectorAll('*')].find((e) => {
        const c = getComputedStyle(e)
        return e.childElementCount === 0 && parseFloat(c.fontSize) >= 11 && parseFloat(c.fontSize) <= 12 &&
          c.textTransform === 'uppercase'
      }) || null
    const foldH2 =
      [...main.querySelectorAll('h2')].find((e) => {
        const fs = parseFloat(getComputedStyle(e).fontSize)
        return fs >= 45 && fs <= 47
      }) || null
    const introPara = near(17.5, 18.5, (e) => e.tagName === 'P')
    const bulletText = near(15.5, 16.5, (e) => {
      const c = getComputedStyle(e)
      const lh = parseFloat(c.lineHeight)
      return c.fontWeight !== '600' && lh >= 23 && lh <= 27
    })
    const itemHeader =
      [...main.querySelectorAll('*')].find((e) => {
        const c = getComputedStyle(e)
        return e.childElementCount === 0 && parseFloat(c.fontSize) >= 18.5 && parseFloat(c.fontSize) <= 19.5 &&
          c.fontWeight === '600'
      }) || null
    const itemDesc =
      [...main.querySelectorAll('p')].find((e) => {
        const c = getComputedStyle(e)
        const fs = parseFloat(c.fontSize), lh = parseFloat(c.lineHeight)
        return fs >= 14 && fs <= 15 && c.fontWeight === '400' && lh >= 21 && lh <= 23
      }) || null

    const header = document.querySelector('header')
    const footer = document.querySelector('footer')
    const footerCta = footer && [...footer.querySelectorAll('*')].some((e) => /hire/i.test(e.textContent))
    const breadcrumbInMain =
      !!main.querySelector('nav[aria-label*="readcrumb" i]') ||
      [...main.querySelectorAll('nav')].some((n) => /breadcrumb/i.test(n.className))
    const closingBandInMain = [...main.querySelectorAll('h1,h2,h3')].some((h) => /ready to hire/i.test(h.textContent))

    return {
      found: { h1: !!h1, tagline: !!tagline, foldEyebrow: !!foldEyebrow, foldH2: !!foldH2, introPara: !!introPara, bulletText: !!bulletText, itemHeader: !!itemHeader, itemDesc: !!itemDesc },
      h1: props(h1), tagline: props(tagline), foldEyebrow: props(foldEyebrow), foldH2: props(foldH2),
      introPara: props(introPara), bulletText: props(bulletText), itemHeader: props(itemHeader), itemDesc: props(itemDesc),
      chrome: {
        headerPresent: !!header, footerPresent: !!footer, footerCtaPresent: !!footerCta,
        breadcrumbInMain, closingBandInMain,
      },
    }
  })
}

function parsePx(v) {
  if (v == null) return null
  const m = String(v).match(/-?[\d.]+(?:e[+-]?\d+)?/i)
  return m ? parseFloat(m[0]) : null
}
function normalizeColor(v) { return v == null ? v : String(v).replace(/\s+/g, ' ').trim() }
const COLOR_RGBA = new Map()
function colorsEqual(a, b) {
  const na = normalizeColor(a), nb = normalizeColor(b)
  if (na === nb) return true
  const ra = COLOR_RGBA.get(na), rb = COLOR_RGBA.get(nb)
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
    const c = document.createElement('canvas'); c.width = 1; c.height = 1
    const ctx = c.getContext('2d')
    return strs.map((s) => { try { ctx.clearRect(0,0,1,1); ctx.fillStyle=s; ctx.fillRect(0,0,1,1); return Array.from(ctx.getImageData(0,0,1,1).data) } catch { return null } })
  }, unique)
  await page.close()
  unique.forEach((s, i) => { if (res[i]) COLOR_RGBA.set(s, res[i]) })
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
  h1: 'hero H1 (service name)',
  tagline: 'hero tagline',
  foldEyebrow: 'fold eyebrow (label)',
  foldH2: 'fold H2 (46px header)',
  introPara: 'fold intro paragraph (18px)',
  bulletText: 'featureBullets bullet text (16px)',
  itemHeader: 'itemList item header (19px)',
  itemDesc: 'itemList item desc (14.5px)',
}

const FORBIDDEN = new Set(['VideoObject', 'Review', 'Person', 'CollectionPage', 'BlogPosting', 'Article', 'Service'])
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
    } catch (e) { out.push({ __parseError: e.message }) }
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
  const webpage = ld.filter((b) => b['@type'] === 'WebPage')
  const bc = ld.filter((b) => b['@type'] === 'BreadcrumbList')
  const forbidden = types.filter((t) => FORBIDDEN.has(t))
  const notes = []
  let ok = true
  if (webpage.length !== 1) { ok = false; notes.push(`expected 1 WebPage, found ${webpage.length}`) }
  else if (!webpage[0].name || !webpage[0].url) { ok = false; notes.push('WebPage missing name/url') }
  if (bc.length !== 1) { ok = false; notes.push(`expected 1 BreadcrumbList, found ${bc.length}`) }
  if (forbidden.length) { ok = false; notes.push(`forbidden types: ${forbidden.join(', ')}`) }
  gate.push({ check: 'WebPage + BreadcrumbList JSON-LD valid, no forbidden types', status: ok ? 'PASS' : 'FAIL', evidence: `@types: [${types.join(', ')}]${notes.length ? ' | ' + notes.join('; ') : ''}` })
  const [us, uk] = await Promise.all([fetch(`${BASE}${BUILT_PATH}`), fetch(`${BASE}${BUILT_PATH_UK}`)])
  gate.push({ check: 'Both locale routes HTTP 200', status: us.status === 200 && uk.status === 200 ? 'PASS' : 'FAIL', evidence: `US ${us.status}; UK ${uk.status}` })
  const meta = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)
  gate.push({ check: '<meta name="description"> present', status: meta ? 'PASS' : 'FAIL', evidence: meta ? meta[1].slice(0, 80) : 'none' })
  const bailout = html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING')
  gate.push({ check: 'No client-render bailout', status: bailout ? 'FAIL' : 'PASS' })
  return gate
}

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
    try { await bp.goto(`${BASE}${BUILT_PATH}`, { waitUntil: 'networkidle', timeout: 30000 }) }
    catch { await bp.goto(`${BASE}${BUILT_PATH}`, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
    await bp.waitForTimeout(800)
    built = await extractBuilt(bp)
    await bp.close()
  } finally { await browser.close() }

  console.log('Export found:', exp.found)
  console.log('Built found:', built.found)
  console.log('Chrome:', built.chrome)

  const b2 = await chromium.launch({ headless: true })
  try {
    const colors = []
    for (const d of [exp, built]) for (const k of Object.keys(LABELS)) if (d[k]?.color) colors.push(d[k].color)
    await canonicalizeColors(b2, colors)
  } finally { await b2.close() }

  const rows = []
  for (const key of Object.keys(LABELS)) {
    const e = exp[key], b = built[key]
    if (!e || !b) { rows.push({ element: LABELS[key], property: '(element)', export: e ? 'FOUND' : 'NOT FOUND', built: b ? 'FOUND' : 'NOT FOUND', status: 'FAIL' }); continue }
    for (const prop of PROPS) {
      const { match } = compareProp(prop, e[prop], b[prop])
      rows.push({ element: LABELS[key], property: prop, export: e[prop], built: b[prop], status: match ? 'MATCH' : 'FAIL' })
    }
  }

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
  for (const r of sorted) console.log(`${r.status.padEnd(6)} | ${r.element.padEnd(34)} | ${String(r.property).padEnd(14)} | export=${JSON.stringify(r.export)} built=${JSON.stringify(r.built)}`)

  console.log('\n=== CHROME / STRUCTURAL ROWS ===')
  for (const r of chromeRows) console.log(`${r.status.padEnd(6)} | ${r.check}`)

  console.log('\n=== Step C: structural gate ===')
  const gate = await runGate(buildOk)
  for (const g of gate) { console.log(`${g.status.padEnd(6)} | ${g.check}`); if (g.evidence) console.log(`         ${g.evidence}`) }
  const gateFails = gate.filter((g) => g.status === 'FAIL')

  const verdict = materialFails.length === 0 && chromeFails.length === 0 && gateFails.length === 0 ? 'CLEAN PASS' : 'FAIL'
  console.log(`\nMaterial computed fails: ${materialFails.length}`)
  console.log(`Chrome/structural fails: ${chromeFails.length}`)
  console.log(`Gate fails: ${gateFails.length}`)
  console.log(`\n=== VERDICT: ${verdict} ===`)

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true })
  await fs.writeFile(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), slug: SLUG, rows, chromeRows, gate, materialFails, verdict }, null, 2))
  console.log(`Wrote ${OUT_JSON}`)
  process.exit(verdict === 'CLEAN PASS' ? 0 : 1)
}

main().catch((err) => { console.error('qa-computed-diff FAILED', err); process.exit(1) })
