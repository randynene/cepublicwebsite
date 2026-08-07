import 'dotenv/config'

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import * as cheerio from 'cheerio'
import { z } from 'zod'

// Replay EVERY URL we know of against production and record what it actually
// serves. This is the wide version of scripts/seo/verify-gsc-urls.ts, which only
// replayed the 330 Search Console paths and only looked at status + canonical.
//
// Collection only. Nothing here judges or prioritises: it captures what is
// there, counts it, and writes it down. Interpretation is a later job.
//
// Sources: the live sitemap, Search Console, the Ahrefs exports, and the
// redirect tables the app ships. Deduplicated onto one path per URL.
//
// Run:   npx tsx scripts/seo/replay-all-urls.ts
// Fresh: npx tsx scripts/seo/replay-all-urls.ts --fresh
//
// Resume is the default: per-URL records are cached on disk keyed by path, so a
// re-run only fetches what is missing. This is a live production site.

const ORIGIN = 'https://www.cloudemployee.io'
const HOST = 'www.cloudemployee.io'
const EXCLUDED_HOST = 'talent.cloudemployee.io'

const OUT_DIR = 'audit-output/seo-intel/2026-08-06/crawl'
const CACHE_DIR = join(OUT_DIR, '.cache')
const MANIFEST = 'audit-output/seo-intel/2026-08-06/MANIFEST-crawl.md'

const GSC_PAGES = 'audit-output/seo-post-launch/gsc-pages.json'
const AHREFS_DIR = 'audit-output/seo-intel/2026-08-06/ahrefs'
const REDIRECTS_DIR = 'site/src/lib/redirects'

const CONCURRENCY = 4
const DELAY_MS = 250
const MAX_HOPS = 10
const THIN_WORDS = 300
const USER_AGENT = 'Mygratr-SEO-Audit/2.0 (+replay-all-urls)'

// ---------------------------------------------------------------- source data

const gscPagesSchema = z.object({
  rows: z.array(z.object({ keys: z.array(z.string()).min(1) })),
})

const ahrefsExportSchema = z.object({
  report: z.string().optional(),
  rows: z.array(z.record(z.string(), z.unknown())),
})

type SourceName = 'sitemap' | 'searchConsole' | 'ahrefs' | 'redirects'

interface SourceStats {
  source: SourceName
  detail: string
  rawUrls: number
  usablePaths: number
  excludedTalent: number
  excludedOtherHost: number
}

/** Normalise anything URL-ish onto a site-relative path, or null if off-site. */
function toPath(raw: string): { path: string | null; reason: 'talent' | 'other-host' | null } {
  const trimmed = raw.trim()
  if (!trimmed) return { path: null, reason: 'other-host' }

  if (trimmed.startsWith('/')) {
    // A redirect-table source with a path-to-regexp param cannot be replayed
    // literally: ":slug+" is not a URL, it is a pattern.
    if (/[:*(]/.test(trimmed)) return { path: null, reason: 'other-host' }
    return { path: normalisePath(trimmed), reason: null }
  }

  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    return { path: null, reason: 'other-host' }
  }
  if (u.hostname === EXCLUDED_HOST) return { path: null, reason: 'talent' }
  if (u.hostname !== HOST && u.hostname !== 'cloudemployee.io') {
    return { path: null, reason: 'other-host' }
  }
  return { path: normalisePath(u.pathname + u.search), reason: null }
}

function normalisePath(p: string): string {
  let out = p
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1)
  if (!out.startsWith('/')) out = '/' + out
  return out === '' ? '/' : out
}

async function collectSitemap(): Promise<{ paths: string[]; stats: SourceStats }> {
  const res = await fetch(`${ORIGIN}/sitemap.xml`, { headers: { 'user-agent': USER_AGENT } })
  const xml = await res.text()
  const raw = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  return tally('sitemap', `${ORIGIN}/sitemap.xml`, raw)
}

function collectGsc(): { paths: string[]; stats: SourceStats } {
  if (!existsSync(GSC_PAGES)) {
    return {
      paths: [],
      stats: {
        source: 'searchConsole',
        detail: `${GSC_PAGES} (MISSING)`,
        rawUrls: 0,
        usablePaths: 0,
        excludedTalent: 0,
        excludedOtherHost: 0,
      },
    }
  }
  const parsed = gscPagesSchema.parse(JSON.parse(readFileSync(GSC_PAGES, 'utf-8')))
  return tally('searchConsole', GSC_PAGES, parsed.rows.map((r) => r.keys[0]))
}

/** Ahrefs top-pages and best-by-links exports. Column names differ per report. */
function collectAhrefs(): { paths: string[]; stats: SourceStats } {
  const files = existsSync(AHREFS_DIR)
    ? readdirSync(AHREFS_DIR).filter(
        (f) => /^top-pages-.*\.json$/.test(f) || /^best-by-links.*\.json$/.test(f),
      )
    : []
  const raw: string[] = []
  for (const f of files) {
    const parsed = ahrefsExportSchema.safeParse(JSON.parse(readFileSync(join(AHREFS_DIR, f), 'utf-8')))
    if (!parsed.success) continue
    for (const row of parsed.data.rows) {
      const v = row['url'] ?? row['page url'] ?? row['page']
      if (typeof v === 'string') raw.push(v)
    }
  }
  return tally('ahrefs', `${AHREFS_DIR} (${files.length} exports: ${files.join(', ')})`, raw)
}

/** Redirect SOURCES, so we replay the legacy URLs the app promises to handle. */
function collectRedirects(): { paths: string[]; stats: SourceStats } {
  const files = readdirSync(REDIRECTS_DIR).filter((f) => f.endsWith('.ts'))
  const raw: string[] = []
  for (const f of files) {
    const src = readFileSync(join(REDIRECTS_DIR, f), 'utf-8')
    for (const m of src.matchAll(/"source":\s*"([^"]+)"/g)) raw.push(m[1])
  }
  return tally('redirects', `${REDIRECTS_DIR} (${files.join(', ')})`, raw)
}

function tally(source: SourceName, detail: string, raw: string[]): { paths: string[]; stats: SourceStats } {
  const set = new Set<string>()
  let talent = 0
  let other = 0
  for (const r of raw) {
    const { path, reason } = toPath(r)
    if (path) set.add(path)
    else if (reason === 'talent') talent += 1
    else other += 1
  }
  return {
    paths: [...set].sort(),
    stats: {
      source,
      detail,
      rawUrls: raw.length,
      usablePaths: set.size,
      excludedTalent: talent,
      excludedOtherHost: other,
    },
  }
}

// ------------------------------------------------------------------- per-URL

interface Hop {
  url: string
  status: number
  location: string | null
}

interface HeadingNode {
  level: number
  text: string
}

interface UrlRecord {
  path: string
  requestUrl: string
  sources: SourceName[]
  fetchedAt: string
  responseTimeMs: number
  error: string | null
  status: number
  finalUrl: string
  redirectChain: Hop[]
  hopCount: number
  contentType: string | null
  xRobotsTag: string | null
  metaRobots: string | null
  canonical: string | null
  canonicalSelfReferencing: boolean | null
  title: string | null
  titleLength: number | null
  metaDescription: string | null
  metaDescriptionLength: number | null
  h1s: string[]
  headingOutline: HeadingNode[]
  wordCount: number
  hreflang: Array<{ hreflang: string; href: string }>
  og: { title: string | null; description: string | null; image: string | null }
  jsonLd: Array<{ index: number; parses: boolean; types: string[]; error: string | null }>
  imagesTotal: number
  imagesMissingAlt: number
  imagesMissingAltSrcs: string[]
  internalLinks: string[]
  internalLinkCount: number
}

function absolute(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

function textOf(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function collectJsonLdTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const n of node) collectJsonLdTypes(n, out)
    return
  }
  if (node === null || typeof node !== 'object') return
  const obj = node as Record<string, unknown>
  const t = obj['@type']
  if (typeof t === 'string') out.add(t)
  else if (Array.isArray(t)) for (const x of t) if (typeof x === 'string') out.add(x)
  if (Array.isArray(obj['@graph'])) collectJsonLdTypes(obj['@graph'], out)
}

async function fetchOne(path: string, sources: SourceName[]): Promise<UrlRecord> {
  const requestUrl = ORIGIN + path
  const started = Date.now()

  const base: UrlRecord = {
    path,
    requestUrl,
    sources,
    fetchedAt: new Date().toISOString(),
    responseTimeMs: 0,
    error: null,
    status: 0,
    finalUrl: requestUrl,
    redirectChain: [],
    hopCount: 0,
    contentType: null,
    xRobotsTag: null,
    metaRobots: null,
    canonical: null,
    canonicalSelfReferencing: null,
    title: null,
    titleLength: null,
    metaDescription: null,
    metaDescriptionLength: null,
    h1s: [],
    headingOutline: [],
    wordCount: 0,
    hreflang: [],
    og: { title: null, description: null, image: null },
    jsonLd: [],
    imagesTotal: 0,
    imagesMissingAlt: 0,
    imagesMissingAltSrcs: [],
    internalLinks: [],
    internalLinkCount: 0,
  }

  // Walk the redirect chain by hand so every hop is recorded, not just the end.
  let current = requestUrl
  let res: Response | null = null
  try {
    for (let hop = 0; hop < MAX_HOPS; hop += 1) {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { 'user-agent': USER_AGENT },
      })
      const location = res.headers.get('location')
      base.redirectChain.push({ url: current, status: res.status, location })
      if (res.status >= 300 && res.status < 400 && location) {
        const next = absolute(location, current)
        if (!next) break
        current = next
        continue
      }
      break
    }
  } catch (e) {
    base.responseTimeMs = Date.now() - started
    base.error = (e as Error).message
    return base
  }

  base.responseTimeMs = Date.now() - started
  if (!res) {
    base.error = 'no response'
    return base
  }

  base.status = res.status
  base.finalUrl = current
  base.hopCount = Math.max(0, base.redirectChain.length - 1)
  base.contentType = res.headers.get('content-type')
  base.xRobotsTag = res.headers.get('x-robots-tag')

  if (!base.contentType?.includes('text/html')) return base

  const html = await res.text()
  const $ = cheerio.load(html)

  base.title = $('head title').first().text().trim() || null
  base.titleLength = base.title === null ? null : base.title.length

  base.metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? null
  base.metaDescriptionLength = base.metaDescription === null ? null : base.metaDescription.length

  base.metaRobots = $('meta[name="robots"]').attr('content')?.trim().toLowerCase() ?? null

  const canonicalRaw = $('link[rel="canonical"]').attr('href')?.trim() ?? null
  base.canonical = canonicalRaw ? absolute(canonicalRaw, current) : null
  base.canonicalSelfReferencing =
    base.canonical === null ? null : normaliseForCompare(base.canonical) === normaliseForCompare(current)

  base.og = {
    title: $('meta[property="og:title"]').attr('content')?.trim() ?? null,
    description: $('meta[property="og:description"]').attr('content')?.trim() ?? null,
    image: $('meta[property="og:image"]').attr('content')?.trim() ?? null,
  }

  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const hl = $(el).attr('hreflang')
    const href = $(el).attr('href')
    if (hl && href) base.hreflang.push({ hreflang: hl, href: absolute(href, current) ?? href })
  })

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = (el as { tagName?: string }).tagName ?? ''
    const level = Number(tag.slice(1))
    const text = textOf($(el).text())
    if (!Number.isFinite(level)) return
    base.headingOutline.push({ level, text })
    if (level === 1) base.h1s.push(text)
  })

  $('script[type="application/ld+json"]').each((i, el) => {
    const raw = $(el).contents().text()
    try {
      const parsed: unknown = JSON.parse(raw)
      const types = new Set<string>()
      collectJsonLdTypes(parsed, types)
      base.jsonLd.push({ index: i, parses: true, types: [...types].sort(), error: null })
    } catch (e) {
      base.jsonLd.push({ index: i, parses: false, types: [], error: (e as Error).message })
    }
  })

  const $main = $('main').length > 0 ? $('main') : $('body')
  const $content = $main.clone()
  $content.find('script, style, noscript, svg, nav, header, footer').remove()
  base.wordCount = textOf($content.text()).split(' ').filter(Boolean).length

  $('img').each((_, el) => {
    base.imagesTotal += 1
    const alt = $(el).attr('alt')
    if (alt === undefined || alt.trim() === '') {
      base.imagesMissingAlt += 1
      const src = $(el).attr('src') ?? $(el).attr('data-src') ?? '(no src)'
      base.imagesMissingAltSrcs.push(src)
    }
  })

  const internal = new Set<string>()
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return
    const abs = absolute(href, current)
    if (!abs) return
    const u = new URL(abs)
    if (u.hostname !== HOST && u.hostname !== 'cloudemployee.io') return
    internal.add(normalisePath(u.pathname + u.search))
  })
  base.internalLinks = [...internal].sort()
  base.internalLinkCount = base.internalLinks.length

  return base
}

function normaliseForCompare(u: string): string {
  try {
    const parsed = new URL(u)
    return parsed.origin + normalisePath(parsed.pathname + parsed.search)
  } catch {
    return u
  }
}

// -------------------------------------------------------------- orchestration

function cacheKey(path: string): string {
  return createHash('sha1').update(path).digest('hex')
}

function readCache(path: string): UrlRecord | null {
  const f = join(CACHE_DIR, `${cacheKey(path)}.json`)
  if (!existsSync(f)) return null
  try {
    return JSON.parse(readFileSync(f, 'utf-8')) as UrlRecord
  } catch {
    return null
  }
}

function writeCache(record: UrlRecord): void {
  writeFileSync(join(CACHE_DIR, `${cacheKey(record.path)}.json`), JSON.stringify(record))
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function main(): Promise<void> {
  const fresh = process.argv.includes('--fresh')

  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(CACHE_DIR, { recursive: true })

  console.log('Collecting known URLs from four sources...')
  const sitemap = await collectSitemap()
  const gsc = collectGsc()
  const ahrefs = collectAhrefs()
  const redirects = collectRedirects()
  const collected = [sitemap, gsc, ahrefs, redirects]

  const sourcesByPath = new Map<string, Set<SourceName>>()
  for (const c of collected) {
    for (const p of c.paths) {
      if (!sourcesByPath.has(p)) sourcesByPath.set(p, new Set())
      sourcesByPath.get(p)!.add(c.stats.source)
    }
  }
  const union = [...sourcesByPath.keys()].sort()

  for (const c of collected) {
    console.log(
      `  ${c.stats.source.padEnd(14)} ${String(c.stats.usablePaths).padStart(5)} paths ` +
        `(${c.stats.rawUrls} raw, ${c.stats.excludedTalent} talent-subdomain excluded, ` +
        `${c.stats.excludedOtherHost} other/non-literal excluded)`,
    )
  }
  const totalTalentExcluded = collected.reduce((a, c) => a + c.stats.excludedTalent, 0)
  console.log(`  UNION         ${String(union.length).padStart(5)} unique paths`)
  console.log(`  talent.cloudemployee.io URLs excluded: ${totalTalentExcluded}\n`)

  const records: UrlRecord[] = []
  let fetched = 0
  let resumed = 0

  for (let i = 0; i < union.length; i += CONCURRENCY) {
    const batch = union.slice(i, i + CONCURRENCY)
    const done = await Promise.all(
      batch.map(async (p) => {
        const sources = [...sourcesByPath.get(p)!].sort()
        if (!fresh) {
          const cached = readCache(p)
          if (cached) {
            resumed += 1
            return { ...cached, sources }
          }
        }
        const rec = await fetchOne(p, sources)
        writeCache(rec)
        fetched += 1
        return rec
      }),
    )
    records.push(...done)
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, union.length)}/${union.length}`)
    if (fetched > 0) await sleep(DELAY_MS)
  }
  console.log(`\n  fetched ${fetched}, resumed from cache ${resumed}\n`)

  records.sort((a, b) => a.path.localeCompare(b.path))
  writeFileSync(join(OUT_DIR, 'urls.json'), JSON.stringify(records, null, 2))

  // ------------------------------------------------------------ reconciliation

  const byPath = new Map(records.map((r) => [r.path, r]))
  const sitemapSet = new Set(sitemap.paths)

  const sitemapNot200 = records
    .filter((r) => sitemapSet.has(r.path) && r.status !== 200)
    .map((r) => ({
      path: r.path,
      status: r.status,
      finalUrl: r.finalUrl,
      hopCount: r.hopCount,
      error: r.error,
    }))

  const orphans = records
    .filter((r) => r.status === 200 && !sitemapSet.has(r.path))
    .map((r) => ({ path: r.path, sources: r.sources, title: r.title, wordCount: r.wordCount }))

  const longChains = records
    .filter((r) => r.hopCount > 1)
    .map((r) => ({ path: r.path, hopCount: r.hopCount, chain: r.redirectChain, finalUrl: r.finalUrl }))

  const dupeGroups = (
    key: (r: UrlRecord) => string | null,
  ): Array<{ value: string; count: number; paths: string[] }> => {
    const m = new Map<string, string[]>()
    for (const r of records) {
      if (r.status !== 200) continue
      const v = key(r)
      if (!v) continue
      if (!m.has(v)) m.set(v, [])
      m.get(v)!.push(r.path)
    }
    return [...m.entries()]
      .filter(([, paths]) => paths.length > 1)
      .map(([value, paths]) => ({ value, count: paths.length, paths: paths.sort() }))
      .sort((a, b) => b.count - a.count)
  }

  const duplicateTitles = dupeGroups((r) => r.title)
  const duplicateDescriptions = dupeGroups((r) => r.metaDescription)

  const live200 = records.filter((r) => r.status === 200)
  const h1Issues = live200
    .filter((r) => r.h1s.length !== 1)
    .map((r) => ({ path: r.path, h1Count: r.h1s.length, h1s: r.h1s }))

  const thinPages = live200
    .filter((r) => r.wordCount < THIN_WORDS)
    .map((r) => ({ path: r.path, wordCount: r.wordCount, title: r.title }))
    .sort((a, b) => a.wordCount - b.wordCount)

  // hreflang reciprocity: for every alternate we declare, does the target
  // declare us back?
  const hreflangReport = live200.map((r) => {
    const issues: string[] = []
    const selfDeclared = r.hreflang.some((h) => normaliseForCompare(h.href) === normaliseForCompare(r.finalUrl))
    for (const h of r.hreflang) {
      if (h.hreflang === 'x-default') continue
      const target = byPath.get(normalisePath(new URL(h.href).pathname))
      if (!target) {
        issues.push(`target not crawled: ${h.href}`)
        continue
      }
      if (target.status !== 200) {
        issues.push(`target status ${target.status}: ${h.href}`)
        continue
      }
      const reciprocates = target.hreflang.some(
        (t) => normaliseForCompare(t.href) === normaliseForCompare(r.finalUrl),
      )
      if (!reciprocates) issues.push(`no return tag from ${h.href}`)
    }
    return {
      path: r.path,
      tags: r.hreflang,
      selfDeclared,
      reciprocal: issues.length === 0,
      issues,
    }
  })

  // UK duplication: /uk/X against X, word-level.
  const normaliseWords = (r: UrlRecord): string[] =>
    r.headingOutline
      .map((h) => h.text)
      .concat(r.title ?? '', r.metaDescription ?? '')
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)

  const ukPairs = live200
    .filter((r) => r.path === '/uk' || r.path.startsWith('/uk/'))
    .map((uk) => {
      const usPath = uk.path === '/uk' ? '/' : uk.path.slice(3)
      const us = byPath.get(usPath)
      if (!us || us.status !== 200) {
        return {
          ukPath: uk.path,
          usPath,
          usStatus: us?.status ?? null,
          verdict: 'no-us-counterpart' as const,
          ukWordCount: uk.wordCount,
          usWordCount: us?.wordCount ?? null,
          jaccard: null,
          titleIdentical: null,
          descriptionIdentical: null,
        }
      }
      const a = normaliseWords(uk)
      const b = normaliseWords(us)
      const setA = new Set(a)
      const setB = new Set(b)
      const inter = [...setA].filter((w) => setB.has(w)).length
      const unionSize = new Set([...setA, ...setB]).size
      const jaccard = unionSize === 0 ? 1 : Number((inter / unionSize).toFixed(4))
      const identical = a.join(' ') === b.join(' ') && uk.wordCount === us.wordCount
      return {
        ukPath: uk.path,
        usPath,
        usStatus: us.status,
        verdict: identical ? ('identical' as const) : ('differing' as const),
        ukWordCount: uk.wordCount,
        usWordCount: us.wordCount,
        jaccard,
        titleIdentical: uk.title === us.title,
        descriptionIdentical: uk.metaDescription === us.metaDescription,
      }
    })

  const jsonLdReport = live200.map((r) => ({
    path: r.path,
    blocks: r.jsonLd.length,
    types: [...new Set(r.jsonLd.flatMap((b) => b.types))].sort(),
    invalidBlocks: r.jsonLd.filter((b) => !b.parses),
  }))

  const missingAlt = live200
    .filter((r) => r.imagesMissingAlt > 0)
    .map((r) => ({
      path: r.path,
      imagesTotal: r.imagesTotal,
      imagesMissingAlt: r.imagesMissingAlt,
      srcs: r.imagesMissingAltSrcs,
    }))
    .sort((a, b) => b.imagesMissingAlt - a.imagesMissingAlt)

  const indexability = records.map((r) => ({
    path: r.path,
    status: r.status,
    metaRobots: r.metaRobots,
    xRobotsTag: r.xRobotsTag,
    canonical: r.canonical,
    canonicalSelfReferencing: r.canonicalSelfReferencing,
  }))

  const internalLinkGraph = live200.map((r) => ({ path: r.path, links: r.internalLinks }))

  const sourceInventory = {
    sources: collected.map((c) => c.stats),
    unionPaths: union.length,
    talentUrlsExcluded: totalTalentExcluded,
    perSourcePaths: Object.fromEntries(collected.map((c) => [c.stats.source, c.paths])),
  }

  const performance = records
    .map((r) => ({ path: r.path, responseTimeMs: r.responseTimeMs, status: r.status }))
    .sort((a, b) => b.responseTimeMs - a.responseTimeMs)

  const write = (name: string, data: unknown): void =>
    writeFileSync(join(OUT_DIR, name), JSON.stringify(data, null, 2))

  write('sources.json', sourceInventory)
  write('sitemap-not-200.json', sitemapNot200)
  write('orphans.json', orphans)
  write('redirect-chains.json', longChains)
  write('duplicate-titles.json', duplicateTitles)
  write('duplicate-descriptions.json', duplicateDescriptions)
  write('h1-issues.json', h1Issues)
  write('thin-pages.json', thinPages)
  write('hreflang.json', hreflangReport)
  write('uk-us-pairs.json', ukPairs)
  write('json-ld.json', jsonLdReport)
  write('images-missing-alt.json', missingAlt)
  write('indexability.json', indexability)
  write('internal-links.json', internalLinkGraph)
  write('response-times.json', performance)

  const statusCounts = new Map<number, number>()
  for (const r of records) statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1)

  const identicalUk = ukPairs.filter((p) => p.verdict === 'identical').length
  const differingUk = ukPairs.filter((p) => p.verdict === 'differing').length
  const orphanUk = ukPairs.filter((p) => p.verdict === 'no-us-counterpart').length

  const lines: string[] = [
    '# MANIFEST - full production URL replay (crawl)',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Script: scripts/seo/replay-all-urls.ts`,
    `Target: ${ORIGIN}`,
    `Output: ${OUT_DIR}/`,
    '',
    '## URL sources',
    '',
    '| Source | Detail | Raw URLs | Usable paths | talent.* excluded | Other/non-literal excluded |',
    '|---|---|---|---|---|---|',
    ...collected.map(
      (c) =>
        `| ${c.stats.source} | ${c.stats.detail} | ${c.stats.rawUrls} | ${c.stats.usablePaths} | ${c.stats.excludedTalent} | ${c.stats.excludedOtherHost} |`,
    ),
    '',
    `**Deduplicated union: ${union.length} unique paths.**`,
    `**talent.cloudemployee.io URLs excluded: ${totalTalentExcluded}** (separate Webflow site, not ours).`,
    '',
    '## Response status',
    '',
    '| Status | Count |',
    '|---|---|',
    ...[...statusCounts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([s, n]) => `| ${s === 0 ? 'fetch failed' : s} | ${n} |`),
    '',
    '## Findings',
    '',
    '| File | Rows | What it holds |',
    '|---|---|---|',
    `| urls.json | ${records.length} | Full per-URL record |`,
    `| sources.json | ${collected.length} | Per-source counts plus the path list each contributed |`,
    `| sitemap-not-200.json | ${sitemapNot200.length} | Sitemap URLs that do not return 200 |`,
    `| orphans.json | ${orphans.length} | 200s that are NOT in the sitemap |`,
    `| redirect-chains.json | ${longChains.length} | Chains longer than one hop |`,
    `| duplicate-titles.json | ${duplicateTitles.length} | Title strings shared by more than one 200 |`,
    `| duplicate-descriptions.json | ${duplicateDescriptions.length} | Descriptions shared by more than one 200 |`,
    `| h1-issues.json | ${h1Issues.length} | 200s with zero or multiple H1s |`,
    `| thin-pages.json | ${thinPages.length} | 200s under ${THIN_WORDS} words (flag only, no judgement) |`,
    `| hreflang.json | ${hreflangReport.length} | Tags per page plus reciprocity check |`,
    `| uk-us-pairs.json | ${ukPairs.length} | /uk/ page against its US counterpart |`,
    `| json-ld.json | ${jsonLdReport.length} | Schema types per page and any block that fails to parse |`,
    `| images-missing-alt.json | ${missingAlt.length} | Pages with at least one img lacking alt |`,
    `| indexability.json | ${indexability.length} | robots, X-Robots-Tag, canonical, self-reference |`,
    `| internal-links.json | ${internalLinkGraph.length} | Internal link graph, for the later link job |`,
    `| response-times.json | ${performance.length} | Response time per URL, slowest first |`,
    '',
    '## UK duplication',
    '',
    `- /uk/ pages returning 200: ${ukPairs.length}`,
    `- word-identical to their US pair: ${identicalUk}`,
    `- differing: ${differingUk}`,
    `- no US counterpart returning 200: ${orphanUk}`,
    '',
    'Identity is measured on the heading outline plus title and description, and',
    'requires an equal body word count. Jaccard overlap is recorded per pair in',
    'uk-us-pairs.json for the pairs that differ.',
    '',
    '## Not captured',
    '',
    '- Redirect-table sources containing path-to-regexp params (":slug+" and',
    '  similar) are patterns, not URLs, so they cannot be replayed literally.',
    '  They are counted in the "other/non-literal excluded" column above.',
    '- Word count is server-rendered HTML only. Client-rendered copy is not',
    '  counted, and nav, header and footer are stripped before counting.',
    '- Response time is a single uncached sample from one location, taken under a',
    `  polite ${CONCURRENCY}-way concurrency limit. It is not a performance benchmark.`,
    '',
  ]

  writeFileSync(MANIFEST, lines.join('\n'))

  console.log(`urls.json: ${records.length} records`)
  console.log(`sitemap not 200: ${sitemapNot200.length}`)
  console.log(`orphans (200, not in sitemap): ${orphans.length}`)
  console.log(`redirect chains > 1 hop: ${longChains.length}`)
  console.log(`duplicate titles: ${duplicateTitles.length} groups`)
  console.log(`duplicate descriptions: ${duplicateDescriptions.length} groups`)
  console.log(`h1 issues: ${h1Issues.length}`)
  console.log(`thin (< ${THIN_WORDS} words): ${thinPages.length}`)
  console.log(`uk pairs: ${ukPairs.length} (identical ${identicalUk}, differing ${differingUk})`)
  console.log(`\nManifest: ${MANIFEST}`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
