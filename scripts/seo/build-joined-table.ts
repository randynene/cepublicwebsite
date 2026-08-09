/**
 * Build the per-URL joined SEO intel table (step zero).
 *
 * Data assembly only - no ranking, no analysis. Re-runnable.
 *
 * Sources under audit-output/seo-intel/2026-08-06/:
 *   gsc/, crawl/, ahrefs/, ahrefs/site-audit/, bing/, hubspot/
 *
 * Run: npx tsx scripts/seo/build-joined-table.ts
 * Out: audit-output/seo-intel/2026-08-06/joined/{pages.json,pages.csv,MANIFEST-joined.md}
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const BASE = path.join(process.cwd(), 'audit-output', 'seo-intel', '2026-08-06')
const OUT_DIR = path.join(BASE, 'joined')

const TALENT_HOST = 'talent.cloudemployee.io'
const CANON_HOST = 'www.cloudemployee.io'

/** End of the GSC full-history window in this pull (see MANIFEST-gsc.md). */
const GSC_END = '2026-08-07'
const GSC_90D_START = '2026-05-09' // inclusive, 90 days back from GSC_END

type NumOrNull = number | null
type StrOrNull = string | null
type BoolOrNull = boolean | null

export type JoinedPage = {
  url: string
  path: string
  template_type: StrOrNull
  locale: StrOrNull
  status: NumOrNull
  indexable: BoolOrNull
  impressions_90d: NumOrNull
  clicks_90d: NumOrNull
  avg_position: NumOrNull
  top_query: StrOrNull
  word_count: NumOrNull
  internal_links_in: NumOrNull
  backlinks: NumOrNull
  referring_domains: NumOrNull
  organic_keywords: NumOrNull
  lighthouse_score: NumOrNull
  title_length: NumOrNull
  description_length: NumOrNull
  is_uk_clone: BoolOrNull
  duplicate_of: StrOrNull
  leads_12m: NumOrNull
  leads_qualified_12m: NumOrNull
  leads_became_deal_12m: NumOrNull
  copilot_citations: NumOrNull
  missing_alt_images: NumOrNull
  links_to_redirects: NumOrNull
}

type Coverage = Record<keyof JoinedPage, { filled: number; null: number }>

function isTalentUrl(url: string): boolean {
  try {
    return new URL(url).hostname === TALENT_HOST || url.includes(`://${TALENT_HOST}`)
  } catch {
    return url.includes(TALENT_HOST)
  }
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    let input = trimmed
    if (!/^https?:\/\//i.test(input)) input = `https://${input}`
    const u = new URL(input)
    if (u.hostname === TALENT_HOST) return null
    // Collapse apex -> www so sources join.
    if (u.hostname === 'cloudemployee.io') u.hostname = CANON_HOST
    if (u.hostname !== CANON_HOST && !u.hostname.endsWith('.cloudemployee.io')) {
      // Keep other CE subdomains except talent (already excluded). Rare; still joinable.
    }
    u.hash = ''
    u.protocol = 'https:'
    // Drop default ports / tracking noise.
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|gclid|fbclid|msclkid|hsa_)/i.test(key)) u.searchParams.delete(key)
    }
    let out = u.toString()
    if (out.endsWith('/') && u.pathname !== '/') out = out.slice(0, -1)
    return out
  } catch {
    return null
  }
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname || '/'
  } catch {
    return url
  }
}

function detectLocale(p: string): 'uk' | 'us' | 'ph' | 'other' {
  if (p === '/uk' || p.startsWith('/uk/')) return 'uk'
  if (p === '/ph' || p.startsWith('/ph/')) return 'ph'
  return 'us'
}

function detectTemplate(p: string): string {
  const pathOnly = p.replace(/^\/uk(?=\/|$)/, '') || '/'
  if (pathOnly === '/') return 'home'
  if (pathOnly === '/how-it-works') return 'how_it_works'
  if (pathOnly === '/about-us') return 'about'
  if (pathOnly === '/contact') return 'contact'
  if (pathOnly === '/pricing') return 'pricing'
  if (pathOnly === '/for-developers') return 'for_developers'
  if (pathOnly === '/our-work') return 'our_work'
  if (pathOnly === '/referrals' || pathOnly === '/referral') return 'referral'
  if (pathOnly === '/alternatives') return 'alternatives_hub'
  if (pathOnly === '/blog') return 'blog_hub'
  if (pathOnly.startsWith('/blog/')) return 'blog_post'
  if (
    [
      '/hiring-tips',
      '/managing-engineers',
      '/nearshoring-offshoring',
      '/scaling-teams',
      '/staff-augmentation',
      '/ai-in-software-development',
    ].includes(pathOnly) ||
    [
      '/hiring-tips/',
      '/managing-engineers/',
      '/nearshoring-offshoring/',
      '/scaling-teams/',
      '/staff-augmentation/',
      '/ai-in-software-development/',
    ].some((prefix) => pathOnly.startsWith(prefix) && pathOnly.split('/').length === 2)
  ) {
    // topic hub roots
    if (pathOnly.split('/').filter(Boolean).length === 1) return 'topic_hub'
  }
  if (
    pathOnly.startsWith('/hiring-tips/') ||
    pathOnly.startsWith('/managing-engineers/') ||
    pathOnly.startsWith('/nearshoring-offshoring/') ||
    pathOnly.startsWith('/scaling-teams/') ||
    pathOnly.startsWith('/staff-augmentation/') ||
    pathOnly.startsWith('/ai-in-software-development/')
  ) {
    return 'blog_post'
  }
  if (pathOnly === '/services') return 'services_hub'
  if (pathOnly.startsWith('/services/')) return 'service'
  if (pathOnly === '/technology') return 'technology_hub'
  if (pathOnly.startsWith('/technology/')) return 'technology'
  if (pathOnly === '/reviews') return 'reviews_hub'
  if (pathOnly.startsWith('/reviews/')) return 'review'
  if (pathOnly === '/customer-stories' || pathOnly === '/customer-story') return 'customer_stories_hub'
  if (pathOnly.startsWith('/customer-story/') || pathOnly.startsWith('/customer-stories/')) {
    return 'customer_story'
  }
  if (pathOnly === '/videos') return 'videos_hub'
  if (pathOnly.startsWith('/videos/')) return 'video'
  if (pathOnly === '/downloads') return 'downloads_hub'
  if (pathOnly.startsWith('/downloads/')) return 'download'
  if (pathOnly.startsWith('/download-thank-you/')) return 'download_thank_you'
  if (pathOnly === '/tools') return 'tools_hub'
  if (pathOnly.startsWith('/tools/')) return 'tool'
  if (pathOnly === '/events') return 'events_hub'
  if (pathOnly.startsWith('/events/')) return 'event'
  if (pathOnly === '/team') return 'team_hub'
  if (pathOnly.startsWith('/team/')) return 'team_member'
  if (pathOnly === '/book-a-call') return 'book_a_call_hub'
  if (pathOnly.startsWith('/book-a-call/')) return 'book_a_call'
  if (pathOnly === '/compare') return 'compare_hub'
  if (pathOnly.startsWith('/compare/')) return 'compare'
  if (pathOnly.startsWith('/locations/') || pathOnly.startsWith('/location/')) return 'location'
  if (pathOnly.startsWith('/legals/')) return 'legal'
  if (pathOnly.includes('calculator')) return 'calculator'
  if (pathOnly.startsWith('/thank-you')) return 'thank_you'
  if (pathOnly.startsWith('/start-hiring')) return 'start_hiring_retired'
  return 'other'
}

function emptyPage(url: string): JoinedPage {
  const p = urlPath(url)
  return {
    url,
    path: p,
    template_type: detectTemplate(p),
    locale: detectLocale(p),
    status: null,
    indexable: null,
    impressions_90d: null,
    clicks_90d: null,
    avg_position: null,
    top_query: null,
    word_count: null,
    internal_links_in: null,
    backlinks: null,
    referring_domains: null,
    organic_keywords: null,
    lighthouse_score: null,
    title_length: null,
    description_length: null,
    is_uk_clone: null,
    duplicate_of: null,
    leads_12m: null,
    leads_qualified_12m: null,
    leads_became_deal_12m: null,
    copilot_citations: null,
    missing_alt_images: null,
    links_to_redirects: null,
  }
}

function ensure(map: Map<string, JoinedPage>, url: string): JoinedPage | null {
  const norm = normalizeUrl(url)
  if (!norm) return null
  let row = map.get(norm)
  if (!row) {
    row = emptyPage(norm)
    map.set(norm, row)
  }
  return row
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(path.join(BASE, rel), 'utf8')) as T
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function parseBool(v: unknown): boolean | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase()
  if (s === 'true' || s === 'yes' || s === '1') return true
  if (s === 'false' || s === 'no' || s === '0') return false
  return null
}

/** Read a UTF-8 or UTF-16 (LE) delimited text file into string rows. */
function readDelimitedText(filePath: string): { encoding: string; text: string } {
  const buf = readFileSync(filePath)
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return { encoding: 'utf-16le', text: buf.toString('utf16le') }
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    // Rare BE BOM - decode via utf16le after swap is overkill; Node lacks utf16be.
    // Re-read as utf16le after dropping BOM bytes swapped - for this job Ahrefs uses LE.
    return { encoding: 'utf-16be-as-le-fallback', text: buf.swap16().toString('utf16le') }
  }
  let text = buf.toString('utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  return { encoding: 'utf-8', text }
}

function parseDelimited(filePath: string): { headers: string[]; rows: Record<string, string>[]; encoding: string; delimiter: string } {
  const { encoding, text } = readDelimitedText(filePath)
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [], encoding, delimiter }

  function splitLine(line: string): string[] {
    const out: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          cur += ch
        }
      } else if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        out.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    out.push(cur)
    return out
  }

  const headers = splitLine(lines[0]).map((h) => h.trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i])
    if (cols.every((c) => c === '')) continue
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) row[headers[j]] = cols[j] ?? ''
    rows.push(row)
  }
  return { headers, rows, encoding, delimiter }
}

function weightedPosition(sumPosImp: number, impressions: number): number | null {
  if (impressions <= 0) return null
  return sumPosImp / impressions
}

async function loadGsc90d(map: Map<string, JoinedPage>): Promise<{
  pagesSeen: number
  talentDropped: number
  rowsRead: number
}> {
  const data = readJson<{
    rows: Array<{ keys: string[]; clicks: number; impressions: number; position: number }>
  }>('gsc/full-date-x-page.json')

  type Acc = { clicks: number; impressions: number; sumPosImp: number }
  const acc = new Map<string, Acc>()
  let talentDropped = 0
  let rowsRead = 0

  for (const row of data.rows) {
    rowsRead++
    const [date, page] = row.keys
    if (!page) continue
    if (isTalentUrl(page)) {
      talentDropped++
      continue
    }
    if (date < GSC_90D_START || date > GSC_END) continue
    const norm = normalizeUrl(page)
    if (!norm) {
      talentDropped++
      continue
    }
    const cur = acc.get(norm) ?? { clicks: 0, impressions: 0, sumPosImp: 0 }
    cur.clicks += row.clicks
    cur.impressions += row.impressions
    cur.sumPosImp += row.position * row.impressions
    acc.set(norm, cur)
  }

  for (const [url, a] of acc) {
    const page = ensure(map, url)
    if (!page) continue
    page.clicks_90d = a.clicks
    page.impressions_90d = a.impressions
    page.avg_position = weightedPosition(a.sumPosImp, a.impressions)
  }

  // Also seed any full-page URLs outside the 90d window so they appear with nulls for 90d? No -
  // only URLs with 90d activity get metrics; other sources still add URLs.
  // Count talent in full-page for the drop report.
  const full = readJson<{ rows: Array<{ keys: string[] }> }>('gsc/full-page.json')
  let fullTalent = 0
  for (const row of full.rows) {
    const page = row.keys[0]
    if (page && isTalentUrl(page)) fullTalent++
    else if (page) ensure(map, page)
  }

  return { pagesSeen: acc.size, talentDropped: fullTalent, rowsRead }
}

function loadGscTopQuery(map: Map<string, JoinedPage>): number {
  const data = readJson<{
    rows: Array<{ keys: string[]; clicks: number; impressions: number }>
  }>('gsc/full-query-x-page.json')
  const best = new Map<string, { query: string; clicks: number; impressions: number }>()
  let talentDropped = 0
  for (const row of data.rows) {
    const [query, page] = row.keys
    if (!page || !query) continue
    if (isTalentUrl(page)) {
      talentDropped++
      continue
    }
    const norm = normalizeUrl(page)
    if (!norm) continue
    const prev = best.get(norm)
    if (
      !prev ||
      row.clicks > prev.clicks ||
      (row.clicks === prev.clicks && row.impressions > prev.impressions)
    ) {
      best.set(norm, { query, clicks: row.clicks, impressions: row.impressions })
    }
  }
  for (const [url, b] of best) {
    const page = ensure(map, url)
    if (page) page.top_query = b.query
  }
  return talentDropped
}

function loadCrawl(map: Map<string, JoinedPage>): {
  urls: number
  talentDropped: number
} {
  // 75MB - parse once. Node can handle it.
  const urls = readJson<
    Array<{
      path: string
      requestUrl: string
      status: number | null
      metaRobots: string | null
      canonical: string | null
      titleLength: number | null
      metaDescriptionLength: number | null
      wordCount: number | null
      imagesMissingAlt: number | null
      error: string | null
    }>
  >('crawl/urls.json')

  let talentDropped = 0
  for (const u of urls) {
    if (isTalentUrl(u.requestUrl)) {
      talentDropped++
      continue
    }
    const page = ensure(map, u.requestUrl)
    if (!page) continue
    page.status = u.status
    page.word_count = u.wordCount
    page.title_length = u.titleLength
    page.description_length = u.metaDescriptionLength
    page.missing_alt_images = u.imagesMissingAlt
    if (u.metaRobots) {
      const mr = u.metaRobots.toLowerCase()
      if (mr.includes('noindex')) page.indexable = false
      else if (mr.includes('index')) page.indexable = true
    }
  }

  // Inbound internal links: invert internal-links.json outlink lists.
  const outLinks = readJson<Array<{ path: string; links: string[] }>>('crawl/internal-links.json')
  const inbound = new Map<string, number>()
  for (const src of outLinks) {
    for (const destPath of src.links) {
      const destUrl = normalizeUrl(`https://${CANON_HOST}${destPath.startsWith('/') ? destPath : `/${destPath}`}`)
      if (!destUrl) continue
      inbound.set(destUrl, (inbound.get(destUrl) ?? 0) + 1)
    }
  }
  for (const [url, n] of inbound) {
    const page = ensure(map, url)
    if (page) page.internal_links_in = n
  }
  // Pages present in crawl with zero inbound stay null unless we saw them in the invert.
  // Difference: null = unknown (not in internal-links source); 0 would mean measured zero.
  // internal-links.json only covers 656 HTML pages. For those sources, set 0 when missing.
  for (const src of outLinks) {
    const url = normalizeUrl(`https://${CANON_HOST}${src.path === '/' ? '/' : src.path}`)
    if (!url) continue
    const page = map.get(url)
    if (page && page.internal_links_in === null) page.internal_links_in = inbound.get(url) ?? 0
  }

  // UK clone verdict
  const pairs = readJson<
    Array<{ ukPath: string; usPath: string; verdict: string }>
  >('crawl/uk-us-pairs.json')
  for (const pair of pairs) {
    const ukUrl = normalizeUrl(`https://${CANON_HOST}${pair.ukPath}`)
    if (!ukUrl) continue
    const page = ensure(map, ukUrl)
    if (!page) continue
    // identical / near-identical => clone; differing => not
    if (pair.verdict === 'identical' || pair.verdict === 'near_identical' || pair.verdict === 'near-identical') {
      page.is_uk_clone = true
      page.duplicate_of = normalizeUrl(`https://${CANON_HOST}${pair.usPath}`)
    } else if (pair.verdict === 'differing' || pair.verdict === 'different') {
      page.is_uk_clone = false
    }
  }

  return { urls: urls.length, talentDropped }
}

/** Keep the stronger metric when http/apex/www variants collapse to one URL. */
function keepMax(current: number | null, incoming: number | null): number | null {
  if (incoming === null) return current
  if (current === null) return incoming
  return Math.max(current, incoming)
}

function loadAhrefs(map: Map<string, JoinedPage>): {
  bbl: number
  topPages: number
  talentDropped: number
} {
  let talentDropped = 0
  const bbl = readJson<{
    rows: Array<Record<string, string>>
  }>('ahrefs/best-by-links.export.json')
  for (const row of bbl.rows) {
    const raw = row['page url']
    if (!raw) continue
    if (isTalentUrl(raw)) {
      talentDropped++
      continue
    }
    const page = ensure(map, raw)
    if (!page) continue
    // best-by-links lists http + apex + www as separate rows; after normalize
    // they collide. Last-write-wins would keep the weakest (often http apex).
    page.referring_domains = keepMax(page.referring_domains, parseNum(row['referring domains']))
    page.backlinks = keepMax(page.backlinks, parseNum(row['links to target']))
  }

  const top = readJson<{
    rows: Array<Record<string, string>>
  }>('ahrefs/top-pages-all.export.json')
  for (const row of top.rows) {
    const raw = row.url
    if (!raw) continue
    if (isTalentUrl(raw)) {
      talentDropped++
      continue
    }
    const page = ensure(map, raw)
    if (!page) continue
    page.organic_keywords = keepMax(page.organic_keywords, parseNum(row['current # of keywords']))
    page.referring_domains = keepMax(
      page.referring_domains,
      parseNum(row['current referring domains']),
    )
  }

  return { bbl: bbl.rows.length, topPages: top.rows.length, talentDropped }
}

function loadSiteAudit(map: Map<string, JoinedPage>): {
  htmlRows: number
  dupRows: number
  missingAltRows: number
  linksToRedirectRows: number
  lighthouseAvailable: boolean
  encodings: Record<string, string>
} {
  const encodings: Record<string, string> = {}
  const htmlPath = path.join(
    BASE,
    'ahrefs/site-audit/cloudemployee_06-aug-2026_internal-html-200-u_2026-08-08_09-40-13.csv',
  )
  const html = parseDelimited(htmlPath)
  encodings['internal-html'] = `${html.encoding}/${html.delimiter === '\t' ? 'tsv' : 'csv'}`
  for (const row of html.rows) {
    const page = ensure(map, row.URL)
    if (!page) continue
    const rd = parseNum(row['No. of referring domains'])
    const bl = parseNum(row['No. of backlinks'])
    const words = parseNum(row['No. of content words'])
    const inlinks = parseNum(row['No. of href inlinks'])
    const indexable = parseBool(row['Is indexable page'])
    if (rd !== null) page.referring_domains = keepMax(page.referring_domains, rd)
    if (bl !== null) page.backlinks = keepMax(page.backlinks, bl)
    if (words !== null && page.word_count === null) page.word_count = words
    if (inlinks !== null) page.internal_links_in = keepMax(page.internal_links_in, inlinks)
    if (indexable !== null && page.indexable === null) page.indexable = indexable
    const tl = parseNum(row['Title length'])
    const dl = parseNum(row['Meta description length'])
    if (tl !== null && page.title_length === null) page.title_length = tl
    if (dl !== null && page.description_length === null) page.description_length = dl
  }

  const dupPath = path.join(
    BASE,
    'ahrefs/site-audit/cloudemployee_06-aug-2026_duplicate-content_2026-08-08_09-41-12.csv',
  )
  const dup = parseDelimited(dupPath)
  encodings['duplicate-content'] = `${dup.encoding}/${dup.delimiter === '\t' ? 'tsv' : 'csv'}`
  // Group by content hash; pick a non-UK canonical as duplicate_of when possible.
  const byHash = new Map<string, string[]>()
  for (const row of dup.rows) {
    const url = normalizeUrl(row.URL)
    if (!url) continue
    const hash = row['Content hash'] || ''
    if (!hash) continue
    const list = byHash.get(hash) ?? []
    list.push(url)
    byHash.set(hash, list)
  }
  for (const urls of byHash.values()) {
    if (urls.length < 2) continue
    const primary =
      urls.find((u) => !urlPath(u).startsWith('/uk')) ?? urls.slice().sort()[0]
    for (const u of urls) {
      if (u === primary) continue
      const page = ensure(map, u)
      if (!page) continue
      if (page.duplicate_of === null) page.duplicate_of = primary
    }
  }

  const altPath = path.join(
    BASE,
    'ahrefs/site-audit/cloudemployee_06-aug-2026_image-references-no_2026-08-08_09-42-03.csv',
  )
  let missingAltRows = 0
  if (existsSync(altPath)) {
    const alt = parseDelimited(altPath)
    encodings['missing-alt'] = `${alt.encoding}/${alt.delimiter === '\t' ? 'tsv' : 'csv'}`
    const counts = new Map<string, number>()
    for (const row of alt.rows) {
      const raw = row['Source URL'] || row.URL || row['Page URL'] || ''
      const url = normalizeUrl(raw)
      if (!url) continue
      counts.set(url, (counts.get(url) ?? 0) + 1)
      missingAltRows++
    }
    for (const [url, n] of counts) {
      const page = ensure(map, url)
      if (page && page.missing_alt_images === null) page.missing_alt_images = n
    }
  }

  const redirPath = path.join(
    BASE,
    'ahrefs/site-audit/cloudemployee_06-aug-2026_links-target-redire_2026-08-08_09-41-44.csv',
  )
  let linksToRedirectRows = 0
  if (existsSync(redirPath)) {
    const redir = parseDelimited(redirPath)
    encodings['links-to-redirect'] = `${redir.encoding}/${redir.delimiter === '\t' ? 'tsv' : 'csv'}`
    const counts = new Map<string, number>()
    for (const row of redir.rows) {
      const url = normalizeUrl(row['Source URL'] || '')
      if (!url) continue
      counts.set(url, (counts.get(url) ?? 0) + 1)
      linksToRedirectRows++
    }
    for (const [url, n] of counts) {
      const page = ensure(map, url)
      if (page) page.links_to_redirects = n
    }
  }

  // Anchor-texts is UTF-16 and huge (~18MB). We do not need it for suggested columns;
  // probe encoding only for the manifest.
  const anchorPath = path.join(
    BASE,
    'ahrefs/site-audit/cloudemployee_06-aug-2026_anchor-texts_2026-08-08_09-42-33.csv',
  )
  if (existsSync(anchorPath)) {
    const head = readFileSync(anchorPath).subarray(0, 4)
    const isUtf16 = head[0] === 0xff && head[1] === 0xfe
    encodings['anchor-texts'] = isUtf16 ? 'utf-16le/tsv (not loaded into table)' : 'utf-8'
  }

  // Lighthouse: not present in this Ahrefs site-audit export.
  return {
    htmlRows: html.rows.length,
    dupRows: dup.rows.length,
    missingAltRows,
    linksToRedirectRows,
    lighthouseAvailable: false,
    encodings,
  }
}

function loadBing(map: Map<string, JoinedPage>): { rows: number; talentDropped: number } {
  const file = path.join(BASE, 'bing/cloudemployee.io_AIPageStatsReport_8_7_2026.csv')
  const parsed = parseDelimited(file)
  let talentDropped = 0
  let rows = 0
  for (const row of parsed.rows) {
    const raw = row.Page || row.page || ''
    if (!raw) continue
    if (isTalentUrl(raw)) {
      talentDropped++
      continue
    }
    const page = ensure(map, raw)
    if (!page) continue
    page.copilot_citations = parseNum(row.Citations ?? row.citations)
    rows++
  }
  return { rows, talentDropped }
}

function loadHubspot(map: Map<string, JoinedPage>): {
  bailed: boolean
  reason: string
} {
  const bailPath = path.join(BASE, 'hubspot/quality-bailout.json')
  if (!existsSync(bailPath)) {
    return {
      bailed: true,
      reason: 'hubspot/quality-bailout.json missing - Job 1 not run or failed.',
    }
  }
  const bail = JSON.parse(readFileSync(bailPath, 'utf8')) as {
    bailed: boolean
    reason: string
    leads_12m_for_joined_table: null
  }
  // Per Job 1 bail-out + Job 2 brief: leave leads_* null throughout.
  // Still seed URLs from by-page-url so the universe knows those pages exist,
  // but do NOT copy raw counts into leads_12m.
  const byPagePath = path.join(BASE, 'hubspot/by-page-url.json')
  if (existsSync(byPagePath)) {
    const rows = JSON.parse(readFileSync(byPagePath, 'utf8')) as Array<{ url: string }>
    for (const r of rows) {
      if (!r.url || r.url === '(no pageUrl)') continue
      if (isTalentUrl(r.url)) continue
      ensure(map, r.url)
    }
  }
  return { bailed: bail.bailed !== false, reason: bail.reason }
}

function coverageOf(pages: JoinedPage[]): Coverage {
  const keys = Object.keys(pages[0] ?? emptyPage('https://www.cloudemployee.io/')) as Array<
    keyof JoinedPage
  >
  const cov = {} as Coverage
  for (const k of keys) cov[k] = { filled: 0, null: 0 }
  for (const p of pages) {
    for (const k of keys) {
      if (p[k] === null || p[k] === undefined) cov[k].null++
      else cov[k].filled++
    }
  }
  return cov
}

function toCsv(pages: JoinedPage[]): string {
  if (pages.length === 0) return ''
  const keys = Object.keys(pages[0]) as Array<keyof JoinedPage>
  const lines = [keys.join(',')]
  for (const p of pages) {
    lines.push(
      keys
        .map((k) => {
          const v = p[k]
          if (v === null || v === undefined) return ''
          if (typeof v === 'string') {
            if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
            return v
          }
          if (typeof v === 'boolean') return v ? 'true' : 'false'
          return String(v)
        })
        .join(','),
    )
  }
  return lines.join('\n') + '\n'
}

function writeManifest(args: {
  pages: JoinedPage[]
  cov: Coverage
  talentDropped: {
    gscFullPage: number
    gscQueryPage: number
    crawl: number
    ahrefs: number
    bing: number
  }
  hubspot: { bailed: boolean; reason: string }
  siteAudit: ReturnType<typeof loadSiteAudit>
  notes: string[]
}): void {
  const { pages, cov, talentDropped, hubspot, siteAudit, notes } = args
  const totalTalent =
    talentDropped.gscFullPage +
    talentDropped.crawl +
    talentDropped.ahrefs +
    talentDropped.bing

  const md: string[] = []
  md.push('# MANIFEST - Joined per-URL table')
  md.push('')
  md.push(`Generated: ${new Date().toISOString()}`)
  md.push('Script: `scripts/seo/build-joined-table.ts`')
  md.push('Output: `audit-output/seo-intel/2026-08-06/joined/`')
  md.push('')
  md.push('## Summary')
  md.push('')
  md.push(`| Metric | Value |`)
  md.push(`|---|---|`)
  md.push(`| Rows (pages) | ${pages.length} |`)
  md.push(`| Columns | ${Object.keys(pages[0] ?? {}).length} |`)
  md.push(
    `| talent.cloudemployee.io rows dropped | GSC full-page ${talentDropped.gscFullPage}; crawl ${talentDropped.crawl}; ahrefs ${talentDropped.ahrefs}; bing ${talentDropped.bing}; query-x-page talent refs ${talentDropped.gscQueryPage} (not additive) |`,
  )
  md.push(`| HubSpot leads | ${hubspot.bailed ? 'NULL throughout (Job 1 quality bail-out)' : 'populated'} |`)
  md.push(`| Lighthouse | null throughout (not in Ahrefs site-audit export) |`)
  md.push('')
  md.push('## HubSpot')
  md.push('')
  md.push(hubspot.bailed ? `**Bailed.** ${hubspot.reason}` : 'Lead columns populated from Job 1.')
  md.push('')
  md.push('`leads_12m`, `leads_qualified_12m`, `leads_became_deal_12m` are null on every row.')
  md.push('')
  md.push('## Column sources + coverage')
  md.push('')
  md.push('| Column | Source | Filled | Null |')
  md.push('|---|---|---|---|')
  const sourceOf: Record<keyof JoinedPage, string> = {
    url: 'union of all sources (normalized to https://www.cloudemployee.io)',
    path: 'derived from url',
    template_type: 'derived from path',
    locale: 'derived from path (/uk, /ph, else us)',
    status: 'crawl/urls.json',
    indexable: 'crawl metaRobots + ahrefs site-audit Is indexable page',
    impressions_90d: `gsc/full-date-x-page.json aggregated ${GSC_90D_START}..${GSC_END}`,
    clicks_90d: `gsc/full-date-x-page.json aggregated ${GSC_90D_START}..${GSC_END}`,
    avg_position: 'impression-weighted mean of GSC position over same 90d window',
    top_query: 'gsc/full-query-x-page.json (full window; highest clicks)',
    word_count: 'crawl/urls.json (fallback site-audit content words)',
    internal_links_in: 'inverted crawl/internal-links.json (fallback site-audit href inlinks)',
    backlinks: 'ahrefs/best-by-links.export.json links to target (fallback site-audit)',
    referring_domains: 'ahrefs/best-by-links.export.json (fallback top-pages / site-audit)',
    organic_keywords: 'ahrefs/top-pages-all.export.json current # of keywords',
    lighthouse_score: 'NOT IN SOURCE DATA - always null',
    title_length: 'crawl/urls.json',
    description_length: 'crawl/urls.json',
    is_uk_clone: 'crawl/uk-us-pairs.json verdict',
    duplicate_of: 'uk-us-pairs US twin and/or site-audit duplicate-content hash group',
    leads_12m: 'hubspot Job 1 - null (quality bail-out)',
    leads_qualified_12m: 'hubspot Job 1 - null',
    leads_became_deal_12m: 'hubspot Job 1 - null',
    copilot_citations: 'bing/cloudemployee.io_AIPageStatsReport_8_7_2026.csv',
    missing_alt_images: 'crawl imagesMissingAlt + site-audit image-references-no counts',
    links_to_redirects: 'site-audit links-target-redire CSV (count of outbound links to redirects)',
  }
  for (const [k, src] of Object.entries(sourceOf) as Array<[keyof JoinedPage, string]>) {
    const c = cov[k]
    md.push(`| \`${k}\` | ${src} | ${c.filled} | ${c.null} |`)
  }
  md.push('')
  md.push('## Encoding notes')
  md.push('')
  for (const [name, enc] of Object.entries(siteAudit.encodings)) {
    md.push(`- \`${name}\`: ${enc}`)
  }
  md.push('')
  md.push('## Large-file handling')
  md.push('')
  md.push('- `gsc/full-date-x-page.json` (~14MB): loaded and aggregated for 90d window.')
  md.push('- `crawl/urls.json` (~75MB): loaded once (needed whole for status/word counts).')
  md.push(
    '- `ahrefs/content-gap-us.export.json` (~108MB): **not used** for this table (competitor gap, not per-URL of ours).',
  )
  md.push('- `ahrefs/site-audit` anchor-texts UTF-16 TSV (~18MB): encoding probed only; not loaded into columns.')
  md.push('')
  md.push('## Null vs zero')
  md.push('')
  md.push(
    '- Ahrefs best-by-links lists http/apex/www as separate rows; after URL normalize they collide. Join keeps MAX(referring_domains/backlinks) so a weak http-apex row cannot overwrite https-www.',
  )
  md.push('')
  md.push('## Notes')
  md.push('')
  for (const n of notes) md.push(`- ${n}`)
  md.push('')

  writeFileSync(path.join(OUT_DIR, 'MANIFEST-joined.md'), md.join('\n'))
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true })
  const map = new Map<string, JoinedPage>()
  const notes: string[] = []

  console.log('1. GSC 90d + seed full-page (drop talent)...')
  const gsc = await loadGsc90d(map)
  console.log(`   90d pages ${gsc.pagesSeen}; talent dropped from full-page ${gsc.talentDropped}`)

  console.log('2. GSC top query...')
  const gscQTalent = loadGscTopQuery(map)
  console.log(`   talent query-page refs skipped ${gscQTalent}`)

  console.log('3. Crawl...')
  const crawl = loadCrawl(map)
  console.log(`   crawl urls ${crawl.urls}; talent ${crawl.talentDropped}`)

  console.log('4. Ahrefs backlinks / keywords...')
  const ahrefs = loadAhrefs(map)
  console.log(`   bbl ${ahrefs.bbl}; top-pages ${ahrefs.topPages}; talent ${ahrefs.talentDropped}`)

  console.log('5. Ahrefs site-audit...')
  const siteAudit = loadSiteAudit(map)
  console.log(
    `   html ${siteAudit.htmlRows}; dup ${siteAudit.dupRows}; lighthouse=${siteAudit.lighthouseAvailable}`,
  )
  if (!siteAudit.lighthouseAvailable) {
    notes.push('Lighthouse score absent from Ahrefs site-audit CSVs; lighthouse_score is null on every row.')
  }

  console.log('6. Bing Copilot citations...')
  const bing = loadBing(map)
  console.log(`   bing rows ${bing.rows}; talent ${bing.talentDropped}`)

  console.log('7. HubSpot (Job 1)...')
  const hubspot = loadHubspot(map)
  console.log(`   bailed=${hubspot.bailed}`)
  notes.push(
    hubspot.bailed
      ? 'Job 1 quality bail-out: leads_* columns left null. Raw HubSpot by-page counts exist under hubspot/ but are not trusted for ranking.'
      : 'Job 1 quality signals populated leads_* columns.',
  )
  notes.push(
    'Only since 3 Aug 2026 is this Next.js codebase; earlier GSC/Ahrefs/HubSpot history is the Webflow site on the same URLs.',
  )

  const pages = [...map.values()].sort((a, b) => a.url.localeCompare(b.url))
  const cov = coverageOf(pages)

  writeFileSync(path.join(OUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2))
  writeFileSync(path.join(OUT_DIR, 'pages.csv'), toCsv(pages))
  writeManifest({
    pages,
    cov,
    talentDropped: {
      gscFullPage: gsc.talentDropped,
      gscQueryPage: gscQTalent,
      crawl: crawl.talentDropped,
      ahrefs: ahrefs.talentDropped,
      bing: bing.talentDropped,
    },
    hubspot,
    siteAudit,
    notes,
  })

  console.log(`\nDone. ${pages.length} rows -> ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err)
  process.exit(1)
})
