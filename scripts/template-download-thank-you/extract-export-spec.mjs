// scripts/template-download-thank-you/extract-export-spec.mjs
// Step 0.5 export-spec extractor for Download Thank You (LITE).
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..')
const EXPORT_SRC = path.join(REPO_ROOT, 'docs/raw-html/Download Thank You.html')
const EXPORT_TMP = '/tmp/dty-export.html'
const OUT_JSON = path.join(REPO_ROOT, 'audit-output/download-thank-you/export-spec.json')

const PROPS = [
  'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'backgroundColor',
  'fontStyle', 'textTransform', 'borderTopWidth', 'borderTopStyle', 'borderTopColor',
  'borderTopLeftRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginBottom', 'gap', 'display', 'width', 'height',
]

async function unpack() {
  const raw = await fs.readFile(EXPORT_SRC, 'utf8')
  const marker = '"<!DOCTYPE html>'
  const idx = raw.indexOf(marker)
  let i = idx + 1, esc = false
  while (i < raw.length) { const c = raw[i]; if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') break; i++ }
  await fs.writeFile(EXPORT_TMP, JSON.parse(raw.slice(idx, i + 1)), 'utf8')
}

async function main() {
  await unpack()
  const b = await chromium.launch({ headless: true })
  const p = await b.newPage({ viewport: { width: 1280, height: 2000 } })
  await p.goto(`file://${EXPORT_TMP}`, { waitUntil: 'load', timeout: 30000 })
  await p.waitForTimeout(400)
  const spec = await p.evaluate((PROPS) => {
    const scope = document.querySelector('[data-screen-label="Thank you desktop"]')
    const props = (el) => { if (!el) return null; const cs = getComputedStyle(el); const o = {}; for (const k of PROPS) o[k] = cs[k]; return o }
    const startsWith = (t) => [...scope.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim().startsWith(t)) || null
    const h1 = scope.querySelector('h1')
    const eyebrow = scope.querySelector('.ce-eyebrow')
    const message = startsWith('{{ message }}')
    const primary = scope.querySelector('.ce-primary')
    const card = scope.querySelector('.ce-card')
    const badge = startsWith('PDF')
    const docName = startsWith('10 AI Prompts')
    const backLink = [...scope.querySelectorAll('a')].find((e) => /Back to all free resources/i.test(e.textContent)) || null
    const introDiv = scope.querySelector(':scope > div')
    return {
      contentInsetLeft: introDiv ? parseFloat(getComputedStyle(introDiv).paddingLeft) || 0 : null,
      frameWidth: scope.getBoundingClientRect().width,
      elements: {
        h1: props(h1), eyebrow: props(eyebrow), message: props(message),
        primary: props(primary), card: props(card), badge: props(badge),
        docName: props(docName), backLink: props(backLink),
      },
    }
  }, PROPS)
  await b.close()
  spec.generatedAt = new Date().toISOString()
  spec.source = 'docs/raw-html/Download Thank You.html (Thank you desktop)'
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true })
  await fs.writeFile(OUT_JSON, JSON.stringify(spec, null, 2))
  console.log(JSON.stringify(spec, null, 2))
}
main().catch((e) => { console.error(e); process.exit(1) })
