import 'dotenv/config'

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { z } from 'zod'

// Ingest Ahrefs UI exports (CSV) and normalise them into the same JSON shapes as
// the API pull, so downstream analysis does not care where a row came from.
//
// This exists because the Ahrefs v3 API cannot supply everything we need:
// content gap, keyword gap and link intersect have no endpoint at ANY plan tier
// (they are UI-only features), and the API unit pool was exhausted on 6 Aug 2026
// (resets 17 Aug). See audit-output/seo-intel/2026-08-06/ahrefs/ENDPOINTS.md.
//
// Provenance matters: every file this writes is tagged `source: "ui-export"` so
// nobody later mistakes a hand-exported CSV for an API pull with a known query.
//
// Run:    npx tsx scripts/seo/ahrefs-import-exports.ts [extra dir...]
// Reads:  audit-output/seo-intel/<DATE>/ahrefs-exports/ and ~/Downloads
// Writes: audit-output/seo-intel/<DATE>/ahrefs/<report>.export.json
//         audit-output/seo-intel/<DATE>/MANIFEST-ahrefs-exports.md

const DATE = '2026-08-06'
const BASE = `audit-output/seo-intel/${DATE}`
const DROP_DIR = `${BASE}/ahrefs-exports`
const OUT_DIR = `${BASE}/ahrefs`
const MANIFEST = `${BASE}/MANIFEST-ahrefs-exports.md`

/**
 * Report fingerprints. Ahrefs names exports inconsistently and users rename
 * them, so classification is by COLUMN SIGNATURE first and filename second: a
 * file is only claimed if it carries every column in `requires`.
 *
 * `expected` is the row count we believe is correct, taken from the Site
 * Explorer Overview on the day of export. A material shortfall usually means
 * the export was paginated rather than "Full export", which is the single most
 * common way one of these arrives silently truncated.
 */
interface ReportSpec {
  name: string
  requires: string[]
  expected: number | null
  note: string
}

const REPORTS: ReportSpec[] = [
  {
    name: 'content-gap',
    requires: ['keyword'],
    expected: null,
    note: 'Keyword gap vs the 5 competitors. No API equivalent exists at any Ahrefs tier.',
  },
  {
    name: 'link-intersect',
    requires: ['domain'],
    expected: null,
    note: 'Domains linking to competitors but not to us. No API equivalent at any tier.',
  },
  {
    name: 'backlinks',
    requires: ['referring page url', 'target url'],
    expected: 8800,
    note: 'Live backlinks. The gap the exhausted API quota left biggest.',
  },
  {
    name: 'refdomains',
    requires: ['referring domain'],
    expected: 693,
    note: 'Live referring domains.',
  },
  {
    name: 'anchors',
    requires: ['anchor'],
    expected: null,
    note: 'Anchor text distribution.',
  },
  {
    name: 'best-by-links',
    requires: ['url', 'referring domains'],
    expected: null,
    note: 'Pages ranked by referring domains.',
  },
  {
    name: 'top-pages',
    requires: ['url', 'traffic'],
    expected: null,
    note: 'Top pages by organic traffic. Export once per location.',
  },
  {
    name: 'organic-keywords',
    requires: ['keyword', 'current position'],
    expected: null,
    note: 'Ranking keywords with positions. Export once per location.',
  },
  {
    name: 'organic-competitors',
    requires: ['competitor domain'],
    expected: null,
    note: 'Domains competing on the same keywords.',
  },
  {
    name: 'brand-radar',
    requires: ['prompt'],
    expected: null,
    note: 'AI-answer citations. The API rejects every ai_responses_* column on this plan.',
  },
  {
    name: 'matching-terms',
    requires: ['keyword', 'volume'],
    expected: null,
    note: 'Keywords Explorer term expansion.',
  },
]

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/**
 * Ahrefs exports are not consistently encoded: some are UTF-16LE with a BOM and
 * tab separators, others UTF-8 with commas. Sniff rather than assume, because
 * reading UTF-16 as UTF-8 yields a single unparseable column of NUL-laced text
 * and looks like an empty export.
 */
function decode(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le').slice(1)
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    const swapped = Buffer.from(buf.subarray(2))
    swapped.swap16()
    return swapped.toString('utf16le')
  }
  return buf.toString('utf8').replace(/^﻿/, '')
}

function detectDelimiter(headerLine: string): string {
  const tabs = headerLine.split('\t').length
  const commas = headerLine.split(',').length
  const semis = headerLine.split(';').length
  if (tabs >= commas && tabs >= semis) return '\t'
  return commas >= semis ? ',' : ';'
}

/** RFC4180-ish parser: handles quoted fields, embedded delimiters and newlines. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else quoted = false
      } else field += c
      continue
    }
    if (c === '"') quoted = true
    else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else if (c !== '\r') field += c
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

const normaliseHeader = (h: string): string => h.trim().toLowerCase().replace(/\s+/g, ' ')

interface ParsedFile {
  file: string
  headers: string[]
  rows: Record<string, string>[]
}

function readExport(path: string): ParsedFile | null {
  const text = decode(readFileSync(path))
  const firstLine = text.split('\n')[0] ?? ''
  if (firstLine.trim() === '') return null
  const table = parseCsv(text, detectDelimiter(firstLine))
  const [headerRow, ...bodyRows] = table
  if (headerRow === undefined) return null
  const headers = headerRow.map(normaliseHeader)
  const rows = bodyRows.map((cells) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? ''
    })
    return obj
  })
  return { file: path, headers, rows }
}

/**
 * Pick the report whose required columns are all present, preferring the most
 * specific match so `organic-keywords` wins over a looser `keyword`-only spec.
 */
function classify(parsed: ParsedFile): ReportSpec | null {
  const candidates = REPORTS.filter((r) => r.requires.every((c) => parsed.headers.includes(c)))
  if (candidates.length === 0) return null
  const hinted = candidates.find((r) =>
    basename(parsed.file).toLowerCase().replace(/[^a-z]/g, '').includes(r.name.replace(/-/g, '')),
  )
  return hinted ?? candidates.sort((a, b) => b.requires.length - a.requires.length)[0]
}

// ---------------------------------------------------------------------------

const importedSchema = z.object({
  source: z.literal('ui-export'),
  report: z.string(),
  sourceFile: z.string(),
  exportedAt: z.string(),
  rowCount: z.number(),
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.string())),
})

type Imported = z.infer<typeof importedSchema>

interface Result {
  outFile: string
  report: string
  sourceFile: string
  rows: number
  expected: number | null
  warning: string
}

function candidateFiles(dirs: string[]): string[] {
  const found: string[] = []
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    // ~/Downloads is protected on macOS and can throw EPERM depending on which
    // process is running this. An unreadable directory is a skip, not a crash.
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      console.log(`   ! cannot read ${dir} (permissions); skipping`)
      continue
    }
    for (const entry of entries) {
      const path = join(dir, entry)
      if (!statSync(path).isFile()) continue
      if (!['.csv', '.tsv', '.txt'].includes(extname(entry).toLowerCase())) continue
      // In Downloads, only touch files that look like they came from Ahrefs.
      const fromDrop = dir === DROP_DIR
      if (fromDrop || /ahrefs|cloudemployee|backlink|refdomain|anchor|keyword|gap|intersect/i.test(entry)) {
        found.push(path)
      }
    }
  }
  return found
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(DROP_DIR, { recursive: true })

  const dirs = [DROP_DIR, join(homedir(), 'Downloads'), ...process.argv.slice(2)]
  const files = candidateFiles(dirs)
  if (files.length === 0) {
    console.log(`No CSV exports found. Looked in:\n  ${dirs.join('\n  ')}`)
    return
  }

  const results: Result[] = []
  const unclaimed: string[] = []
  const seen = new Map<string, number>()

  for (const path of files) {
    const parsed = readExport(path)
    if (parsed === null) {
      unclaimed.push(`${path} (empty or unreadable)`)
      continue
    }
    const spec = classify(parsed)
    if (spec === null) {
      unclaimed.push(`${path} (columns: ${parsed.headers.slice(0, 6).join(', ')})`)
      continue
    }
    // Several exports of one report (e.g. top-pages US and UK) get numbered
    // rather than silently overwriting each other.
    const n = (seen.get(spec.name) ?? 0) + 1
    seen.set(spec.name, n)
    const outFile = n === 1 ? `${spec.name}.export.json` : `${spec.name}-${n}.export.json`

    const payload: Imported = {
      source: 'ui-export',
      report: spec.name,
      sourceFile: basename(path),
      exportedAt: statSync(path).mtime.toISOString(),
      rowCount: parsed.rows.length,
      columns: parsed.headers,
      rows: parsed.rows,
    }
    importedSchema.parse(payload)
    writeFileSync(join(OUT_DIR, outFile), JSON.stringify(payload, null, 2))

    const short = spec.expected !== null && parsed.rows.length < spec.expected * 0.9
    results.push({
      outFile,
      report: spec.name,
      sourceFile: basename(path),
      rows: parsed.rows.length,
      expected: spec.expected,
      warning: short
        ? `SHORT: expected about ${spec.expected}. Likely a page export rather than a full export.`
        : '',
    })
    console.log(
      `${String(parsed.rows.length).padStart(7)} rows  ${outFile.padEnd(34)} <- ${basename(path)}` +
        (short ? `  ** SHORT, expected ~${spec.expected} **` : ''),
    )
  }

  const lines = [
    '# MANIFEST - Ahrefs UI exports',
    '',
    `Imported: ${DATE}`,
    'Script: `scripts/seo/ahrefs-import-exports.ts` (re-runnable)',
    '',
    'These came from the Ahrefs web UI, not the API, because the API cannot serve',
    'content gap / keyword gap / link intersect at any plan tier and the unit quota',
    'was exhausted on 6 Aug 2026. Every JSON file here carries `source: "ui-export"`.',
    '',
    '| File | Report | Source CSV | Rows | Expected | Warning |',
    '|---|---|---|---|---|---|',
    ...results.map(
      (r) =>
        `| ${r.outFile} | ${r.report} | ${r.sourceFile} | ${r.rows} | ${r.expected ?? '-'} | ${r.warning || 'none'} |`,
    ),
    '',
    '## Files that could not be classified',
    '',
    ...(unclaimed.length === 0 ? ['None.'] : unclaimed.map((u) => `- ${u}`)),
    '',
    '## Reports still not collected',
    '',
    ...REPORTS.filter((r) => !results.some((res) => res.report === r.name)).map(
      (r) => `- **${r.name}** - ${r.note}`,
    ),
  ]
  writeFileSync(MANIFEST, lines.join('\n') + '\n')

  console.log(`\n${results.length} imported, ${unclaimed.length} unclaimed. Manifest: ${MANIFEST}`)
  const short = results.filter((r) => r.warning !== '')
  if (short.length > 0) {
    console.log('\nRe-export these using "Full export" rather than the page export:')
    for (const r of short) console.log(`  - ${r.report} (${r.rows} rows)`)
  }
}

main()
