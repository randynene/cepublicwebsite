// scripts/template-service/inspect-export.mjs
//
// Read-only structural inspector for docs/raw-html/Service.html.
// Unpacks the bundled JSON export string, lists all data-screen-label frames,
// then dumps a structural outline (eyebrows, headings, paragraphs, bullet/item
// blocks, images) of the DESKTOP frame so the Conductor can author the
// export-spec + Builder field->element map without eyeballing 992KB of HTML.
//
// Usage: node scripts/template-service/inspect-export.mjs

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')
const EXPORT_SRC = path.join(REPO_ROOT, process.argv[2] || 'docs/raw-html/Service.html')
const EXPORT_TMP = '/tmp/inspect-export.html'

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
  return html
}

async function main() {
  await extractExportHtml()
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 3000 } })
    await page.goto(`file://${EXPORT_TMP}`, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(400)

    const labels = await page.evaluate(() =>
      [...document.querySelectorAll('[data-screen-label]')].map((e) => ({
        label: e.getAttribute('data-screen-label'),
        w: Math.round(e.getBoundingClientRect().width),
      })),
    )
    console.log('=== data-screen-label frames ===')
    for (const l of labels) console.log(`  "${l.label}" (w=${l.w})`)

    // Pick the widest desktop-ish frame (or one whose label includes "desktop")
    const target =
      labels.find((l) => /desktop/i.test(l.label))?.label ||
      labels.sort((a, b) => b.w - a.w)[0]?.label
    console.log(`\n=== Structural outline of frame: "${target}" ===\n`)

    const outline = await page.evaluate((label) => {
      const scope = document.querySelector(`[data-screen-label="${label}"]`)
      if (!scope) return { error: 'not found' }
      const out = []
      const walk = (el, depth) => {
        for (const child of el.children) {
          const tag = child.tagName.toLowerCase()
          const cs = getComputedStyle(child)
          const txt = (child.childElementCount === 0 ? child.textContent : '')
            .trim()
            .slice(0, 70)
          const interesting =
            /^(h1|h2|h3|h4|h5|h6|p|ul|ol|li|img|blockquote|button|a)$/.test(tag) ||
            (txt && child.childElementCount === 0)
          if (interesting) {
            out.push({
              depth,
              tag,
              fontSize: cs.fontSize,
              fontWeight: cs.fontWeight,
              lineHeight: cs.lineHeight,
              letterSpacing: cs.letterSpacing,
              color: cs.color,
              textTransform: cs.textTransform,
              cls: (child.className || '').toString().slice(0, 40),
              txt,
            })
          }
          if (child.childElementCount > 0 && depth < 14) walk(child, depth + 1)
        }
      }
      walk(scope, 0)
      return { count: out.length, out }
    }, target)

    if (outline.error) {
      console.log('ERROR:', outline.error)
    } else {
      for (const n of outline.out) {
        const indent = '  '.repeat(Math.min(n.depth, 10))
        const meta = `${n.fontSize}/${n.fontWeight}/lh${n.lineHeight}/ls${n.letterSpacing}/${n.color}${n.textTransform !== 'none' ? '/' + n.textTransform : ''}`
        console.log(`${indent}${n.tag} [${meta}] ${n.txt ? '"' + n.txt + '"' : '(' + n.cls + ')'}`)
      }
      console.log(`\nTotal nodes: ${outline.count}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('inspect-export FAILED', err)
  process.exit(1)
})
