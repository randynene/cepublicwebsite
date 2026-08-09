import 'dotenv/config'

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// SEO S2 - Item 4 (roadmap W1-06): scripted Sanity Portable Text link rewrite +
// content lint.
//
// WHAT IT FIXES. Four classes of link written into Sanity body copy, all of which
// cost a redirect hop and dilute internal link signal while Google re-evaluates
// the migration:
//   1. ~434 internal links to the APEX host (https://cloudemployee.io/...), which
//      308s to www. Rewrite the host to www and resolve the path.
//   2. ~49 links to the retired price-comparison calculator (/tools/price-comparison-
//      calculator*), which 308s to /pricing.
//   3. ~166 internal links pointing at other redirect targets. Rewrite to the final
//      destination.
//   4. ~27 dead external links. Reported for a human replace/remove decision (and
//      optionally unwrapped with --remove-dead-external); never silently rewritten
//      to a guessed target.
// Counts are from the six-lens analysis (TECH-03, QW-04, QW-09); the definitive
// per-document set is produced by the credentialed --dry-run against production.
//
// HOW DESTINATIONS ARE RE-DERIVED (the S1 dependency - read this before editing).
// Session S1 is collapsing the 28 redirect chains and restructuring the redirect
// layer concurrently, so the "166 destinations" in the analysis are going stale.
// This script therefore NEVER bakes a static destination map. It loads the SHIPPED,
// ASSEMBLED redirect table at run time and follows each redirect to its terminal
// destination, so it always writes the final URL regardless of how many hops S1
// leaves in place. Loader order (first that resolves wins, logged in the report):
//   1. site/src/lib/redirects/index.ts  - S1's single assembled table (preferred).
//   2. site/next.config.ts redirects()  - the exact ordered list production uses,
//      complete in every layout state (includes the lockedRules that predate S1).
//   3. the individual tracked table files - offline last resort.
// Apex->www and http->https host normalisation is applied first; it is a platform
// 308 (documented in CLAUDE.md), not a table row.
//
// MODES.
//   --dry-run   (default) No writes. Produces the plan report. Runs WITHOUT Sanity
//               credentials: with no token it writes the analysis-derived plan plus
//               a live resolver self-check; with a token it adds the definitive
//               per-document findings.
//   --apply     Rewrites the three internal classes in production Sanity. Idempotent
//               (only touches links whose resolved href differs). Logs every
//               document and path. Requires SANITY_MIGRATION_WRITE_TOKEN.
//   --lint      Exits non-zero if any offending link remains. This is the recurrence
//               guard: wire it into CI so customer-2 migrations cannot reintroduce
//               the rot. Requires a token.
// Dead external links are DETECTED and reported with their exact document + path,
// not auto-rewritten: replace-vs-remove is an editorial call (QW-09 says
// "replace/remove"), so it is applied by hand in Studio, never guessed here.
// Flags: --check-external (enable the network liveness check for externals),
//        --report <path>, --limit <n>, --verbose.
//
// Run (this session, no credentials):
//   npx tsx scripts/seo/rewrite-sanity-links.ts --dry-run
// Apply later, locally, AFTER S1 is merged (so the assembled table is complete):
//   npx tsx scripts/seo/rewrite-sanity-links.ts --dry-run   # review the report
//   npx tsx scripts/seo/rewrite-sanity-links.ts --apply
//   npx tsx scripts/seo/rewrite-sanity-links.ts --lint      # expect exit 0

// ---------------------------------------------------------------- constants

const CANONICAL_HOST = 'www.cloudemployee.io'
const CE_HOSTS = new Set(['cloudemployee.io', 'www.cloudemployee.io'])
const APEX_HOST = 'cloudemployee.io'
// The retired calculator, both locales. Any path under here 308s to /pricing.
const CALCULATOR_PREFIXES = [
  '/tools/price-comparison-calculator',
  '/uk/tools/price-comparison-calculator',
]

const REPORT_PATH_DEFAULT =
  'audit-output/seo-intel/2026-08-06/analysis/s2-link-rewrite-plan.md'

const MAX_HOPS = 10
const EXTERNAL_TIMEOUT_MS = 12_000
const EXTERNAL_CONCURRENCY = 6

// Sample URLs for the resolver self-check in the report. Drawn from the analysis
// so a reader can confirm the loader + chain-follower produce sane destinations
// without any Sanity access.
const SELF_CHECK_SAMPLES = [
  'https://cloudemployee.io/services/philippines-developers',
  'https://cloudemployee.io/compare/toptal-vs-upwork',
  '/tools/price-comparison-calculator',
  '/uk/tools/price-comparison-calculator',
  '/compare/cloud-employee-vs-arc-dev',
  '/customer-stories/salmon-software',
  '/developers/react',
  '/start-hiring/get-started',
  '/services/philippines-developers',
]

// Item 3 (roadmap W1-05) contextual-link plan, derived from the analysis
// (CONT-06 zero-inlink posts; QW-03 / AUTH-03 one-in-content-link pages). This is
// authored guidance for the editorial pass, not something the mechanical rewrite
// applies: choosing the sentence and anchor is an editor's call. See the report
// section it renders into.
const ZERO_INLINK_POSTS: Array<{ page: string; note: string; suggestedSources: string }> = [
  {
    page: '/staff-augmentation/staff-augmentation-vs-outsourcing',
    note: 'New cited.io piece, 0 in-content inlinks.',
    suggestedSources:
      'the staff-augmentation pillar (what-is-staff-augmentation...) and /nearshoring-offshoring/what-is-it-outsourcing-definition-models-when-to-use-it',
  },
  {
    page: '/staff-augmentation/latam-staff-augmentation-trends-2026',
    note: '680 imp, 5 Copilot citations, 0 inlinks.',
    suggestedSources:
      '/services/latam-developers and the LATAM staff-augmentation ranked-list pages',
  },
  {
    page: '/staff-augmentation/staff-augmentation-fintech-security-compliance',
    note: '61 Copilot citations, 0 inlinks - the most-cited of the starved set.',
    suggestedSources:
      'the staff-augmentation pillar and best-staff-augmentation-companies-2026',
  },
  {
    page: '/staff-augmentation/staff-augmentation-myths-debunked',
    note: '0 inlinks.',
    suggestedSources: 'the staff-augmentation pillar and its sibling explainer posts',
  },
  {
    page: '/staff-augmentation/staff-augmentation-pricing-models-in-latam',
    note: '526 imp, 0 inlinks.',
    suggestedSources:
      '/services/latam-developers, the costs post, and the staff-augmentation pillar',
  },
  {
    page: '/staff-augmentation/cloud-employee-pricing (post 1 of 2)',
    note: 'Zero-inlink pricing post (confirm exact slug against the dataset).',
    suggestedSources: '/pricing and the staff-augmentation pillar',
  },
  {
    page: '/staff-augmentation/cloud-employee-pricing (post 2 of 2)',
    note: 'Zero-inlink pricing post (confirm exact slug against the dataset).',
    suggestedSources: '/pricing and the staff-augmentation pillar',
  },
]

const ONE_INLINK_PAGES: Array<{ page: string; signal: string; suggestedSources: string }> = [
  {
    page: '/compare/toptal-vs-upwork',
    signal: '44,019 imp/90d, pos 7.0 - the biggest non-brand impression earner, 0-1 inlink.',
    suggestedSources:
      'ADDRESSED STRUCTURALLY by items 1+2 (now on /alternatives page 1 and linked by the related-comparisons module on sibling compare pages). Add a body link from the staff-augmentation pillar too.',
  },
  {
    page: '/scaling-teams/why-consider-alternatives-to-software-development-outsourcing (arc-dev alternatives guide)',
    signal: '5,286 imp, pos 8.4, 1 inlink.',
    suggestedSources: '/alternatives and the outsourcing definition/explainer posts',
  },
  {
    page: '/services/front-end-developers',
    signal: '3,665 imp, 1 inlink.',
    suggestedSources: 'the front-end / javascript blog posts and /technology/react-developers',
  },
  {
    page: '/services/android-developers',
    signal: '3,067 imp, 1 inlink.',
    suggestedSources: 'the mobile-hiring blog posts and /services (hub prose)',
  },
  {
    page: '/technology/laravel-developers',
    signal: '2,544 imp, 1 inlink.',
    suggestedSources: '/technology/php-developers and the PHP/Laravel blog posts',
  },
  {
    page: '/technology/php-developers',
    signal: '2,511 imp, 1 inlink.',
    suggestedSources: '/technology/laravel-developers and the PHP blog posts',
  },
  {
    page: '/services/cloud-engineers',
    signal: '2,435 imp, 1 inlink.',
    suggestedSources: '/services/devops-engineers and /technology/aws-developers',
  },
  {
    page: '/compare/cloud-employee-vs-andela',
    signal: '2,409 imp, pos 5.7, 1 inlink.',
    suggestedSources:
      'ADDRESSED STRUCTURALLY by items 1+2. Add a body link from the LATAM/Africa staff-augmentation posts.',
  },
  {
    page: '/nearshoring-offshoring/nearshore-vs-offshore-costs-2026-software-development-rates',
    signal: '27,802 imp, pos 7.2, ~4 inlinks - the top non-brand CLICK earner (24 clicks/90d).',
    suggestedSources:
      'the outsourcing/offshoring definition posts and /services/latam-developers, /services/philippines-developers',
  },
]

// ---------------------------------------------------------------- args

interface Args {
  mode: 'dry-run' | 'apply' | 'lint'
  checkExternal: boolean
  reportPath: string
  limit: number | null
  verbose: boolean
}

function parseArgs(argv: string[]): Args {
  const has = (f: string) => argv.includes(f)
  const value = (f: string): string | null => {
    const i = argv.indexOf(f)
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null
  }
  let mode: Args['mode'] = 'dry-run'
  if (has('--apply')) mode = 'apply'
  else if (has('--lint')) mode = 'lint'
  else if (has('--dry-run')) mode = 'dry-run'
  const limitRaw = value('--limit')
  return {
    mode,
    checkExternal: has('--check-external') || has('--apply') || has('--lint'),
    reportPath: value('--report') ?? REPORT_PATH_DEFAULT,
    limit: limitRaw ? Number(limitRaw) : null,
    verbose: has('--verbose'),
  }
}

// ---------------------------------------------------------------- redirect table

type Rule = { source: string; destination: string; permanent?: boolean }
type CompiledRule = Rule & { regex: RegExp; keys: string[] }

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Compile a Next-style redirect source (exact path, or a trailing :name / :name+ /
// :name* catch-all) into a matcher. This mirrors the path-to-regexp forms actually
// present in the tables; it is not a general path-to-regexp implementation.
function compileRule(rule: Rule): CompiledRule {
  const keys: string[] = []
  const tokenRe = /:([A-Za-z0-9_]+)(\+|\*)?/
  let re = ''
  let rest = rule.source
  while (rest.length > 0) {
    const match = rest.match(tokenRe)
    if (!match || match.index === undefined) {
      re += escapeRegex(rest)
      break
    }
    re += escapeRegex(rest.slice(0, match.index))
    const [full, name, mod] = match
    keys.push(name)
    if (mod === '+') {
      if (re.endsWith('/')) re = re.slice(0, -1) + '/(.+)'
      else re += '(.+)'
    } else if (mod === '*') {
      if (re.endsWith('/')) re = re.slice(0, -1) + '(?:/(.*))?'
      else re += '(.*)'
    } else {
      re += '([^/]+)'
    }
    rest = rest.slice(match.index + full.length)
  }
  return { ...rule, regex: new RegExp('^' + re + '$'), keys }
}

function applyDestination(destination: string, params: Record<string, string>): string {
  return destination.replace(/:([A-Za-z0-9_]+)(\+|\*)?/g, (_all, name: string) => params[name] ?? '')
}

async function loadRedirectRules(): Promise<{ rules: CompiledRule[]; source: string }> {
  const findArray = (mod: Record<string, unknown>): Rule[] | null => {
    for (const v of Object.values(mod)) {
      if (Array.isArray(v) && v.every((r) => r && typeof r === 'object' && 'source' in r && 'destination' in r)) {
        return v as Rule[]
      }
    }
    return null
  }

  // 1. S1's assembled table (preferred once PR #93 lands).
  try {
    const mod = (await import(pathToFileURL(resolve('site/src/lib/redirects/index.ts')).href)) as Record<
      string,
      unknown
    >
    const arr = findArray(mod)
    if (arr && arr.length > 0) {
      return { rules: arr.map(compileRule), source: 'site/src/lib/redirects/index.ts (S1 assembled table)' }
    }
  } catch {
    /* not present yet - fall through */
  }

  // 2. The exact ordered list production uses, complete in every layout state.
  try {
    const mod = (await import(pathToFileURL(resolve('site/next.config.ts')).href)) as {
      default?: { redirects?: () => Promise<Rule[]> }
      redirects?: () => Promise<Rule[]>
    }
    const cfg = mod.default ?? mod
    if (cfg.redirects) {
      const rules = await cfg.redirects()
      return { rules: rules.map(compileRule), source: 'site/next.config.ts redirects() (assembled at runtime)' }
    }
  } catch {
    /* fall through */
  }

  // 3. Offline last resort - the individual tracked table files.
  const files = ['generated-redirects', 'regex-redirects', 'webflow-redirects', 'job-role-redirects']
  const collected: Rule[] = []
  for (const f of files) {
    try {
      const mod = (await import(pathToFileURL(resolve(`site/src/lib/redirects/${f}.ts`)).href)) as Record<
        string,
        unknown
      >
      const arr = findArray(mod)
      if (arr) collected.push(...arr)
    } catch {
      /* skip missing file */
    }
  }
  if (collected.length === 0) throw new Error('Could not load any redirect table (index.ts, next.config.ts, or the individual files).')
  return {
    rules: collected.map(compileRule),
    source:
      'individual redirect table files (incomplete: lockedRules from next.config.ts are NOT included - prefer running with S1 merged)',
  }
}

// ---------------------------------------------------------------- resolution

interface Resolution {
  hops: string[] // pathnames (and a terminal absolute URL if a rule redirects offsite)
  finalPath: string
  offsite: string | null // set when a redirect points at another host
}

function resolvePath(startPath: string, rules: CompiledRule[]): Resolution {
  const hops: string[] = [startPath]
  const seen = new Set<string>()
  let current = startPath
  for (let i = 0; i < MAX_HOPS; i++) {
    if (seen.has(current)) break
    seen.add(current)
    const hit = rules.find((r) => r.regex.test(current))
    if (!hit) break
    const match = current.match(hit.regex)
    const params: Record<string, string> = {}
    if (match) hit.keys.forEach((k, j) => (params[k] = match[j + 1] ?? ''))
    const dest = applyDestination(hit.destination, params)
    hops.push(dest)
    if (/^https?:\/\//i.test(dest)) return { hops, finalPath: startPath, offsite: dest }
    current = dest
  }
  return { hops, finalPath: current, offsite: null }
}

type LinkKind = 'apex' | 'calculator' | 'redirect' | 'dead-external' | 'external' | 'internal-ok' | 'offsite-redirect'

interface LinkVerdict {
  href: string
  kind: LinkKind
  newHref: string | null // set for the three internal rewrite classes
  detail: string
  hops?: string[]
}

function splitPath(pathAndRest: string): { path: string; rest: string } {
  const m = pathAndRest.match(/^([^?#]*)(.*)$/)
  return { path: m ? m[1] : pathAndRest, rest: m ? m[2] : '' }
}

function isCalculatorPath(path: string): boolean {
  return CALCULATOR_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path === p + '/')
}

// Classify a single href and, for the three internal classes, compute the rewrite.
// Pure + synchronous: dead-external liveness is decided separately (needs network).
function classifyLink(href: string, rules: CompiledRule[]): LinkVerdict {
  const trimmed = href.trim()
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return { href, kind: 'internal-ok', newHref: null, detail: 'anchor/mailto/tel - skipped' }
  }

  let absolute = false
  let apex = false
  let path: string
  let rest: string

  if (trimmed.startsWith('/')) {
    const s = splitPath(trimmed)
    path = s.path
    rest = s.rest
  } else if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    let url: URL
    try {
      url = new URL(trimmed.startsWith('//') ? 'https:' + trimmed : trimmed)
    } catch {
      return { href, kind: 'external', newHref: null, detail: 'unparseable URL - left as-is' }
    }
    const host = url.hostname.toLowerCase()
    if (!CE_HOSTS.has(host)) {
      // Another host (incl. talent.cloudemployee.io) - external. Liveness handled later.
      return { href, kind: 'external', newHref: null, detail: `external host ${host}` }
    }
    absolute = true
    apex = host === APEX_HOST || url.protocol === 'http:'
    path = url.pathname
    rest = url.search + url.hash
  } else {
    return { href, kind: 'external', newHref: null, detail: 'relative-non-root or scheme-less - left as-is' }
  }

  const resolution = resolvePath(path, rules)

  if (resolution.offsite) {
    // The path itself redirects to another host (e.g. a /live-job-role/* -> talent).
    // Point straight at that host rather than through our 308.
    return {
      href,
      kind: 'offsite-redirect',
      newHref: resolution.offsite + rest,
      detail: `internal path 308s offsite to ${resolution.offsite}`,
      hops: resolution.hops,
    }
  }

  const pathRedirects = resolution.finalPath !== path
  if (!apex && !pathRedirects) {
    return { href, kind: 'internal-ok', newHref: null, detail: 'already the final URL' }
  }

  const finalHref = (absolute ? `https://${CANONICAL_HOST}` : '') + resolution.finalPath + rest

  let kind: LinkKind
  if (isCalculatorPath(path)) kind = 'calculator'
  else if (apex && !pathRedirects) kind = 'apex'
  else if (apex && pathRedirects) kind = 'apex' // host + path both fixed; count under apex
  else kind = 'redirect'

  return {
    href,
    kind,
    newHref: finalHref === href ? null : finalHref,
    detail: apex ? `apex host -> www${pathRedirects ? ' + path redirect' : ''}` : 'internal redirect',
    hops: resolution.hops,
  }
}

// ---------------------------------------------------------------- document walk

interface LinkOccurrence {
  docId: string
  docType: string
  // Sanity JSONMatch path, e.g. content[_key=="a"].markDefs[_key=="b"].href
  patchPath: string
  href: string
}

interface JsonPathSegment {
  kind: 'field' | 'index'
  field?: string
  key?: string | null // _key when present
  index?: number
}

function segmentToString(seg: JsonPathSegment): string {
  if (seg.kind === 'field') return `.${seg.field}`
  if (seg.key != null) return `[_key=="${seg.key}"]`
  return `[${seg.index}]`
}

function pathString(path: JsonPathSegment[]): string {
  return path.map(segmentToString).join('').replace(/^\./, '')
}

// Deep-walk a document collecting every object that carries a string `href` (the
// Portable Text link-annotation field). Query params + hashes are preserved by the
// rewriter, so anything here is a candidate; classification decides what to touch.
function collectLinks(doc: Record<string, unknown>): LinkOccurrence[] {
  const out: LinkOccurrence[] = []
  const docId = String(doc._id ?? '')
  const docType = String(doc._type ?? '')

  const walk = (node: unknown, path: JsonPathSegment[]): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        const key =
          item && typeof item === 'object' && '_key' in item
            ? String((item as Record<string, unknown>)._key)
            : null
        walk(item, [...path, { kind: 'index', key, index }])
      })
      return
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if (typeof obj.href === 'string') {
        out.push({
          docId,
          docType,
          patchPath: pathString([...path, { kind: 'field', field: 'href' }]),
          href: obj.href,
        })
      }
      for (const [field, value] of Object.entries(obj)) {
        if (field.startsWith('_')) continue
        walk(value, [...path, { kind: 'field', field }])
      }
    }
  }

  walk(doc, [])
  return out
}

// ---------------------------------------------------------------- external liveness

async function isExternalDead(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS)
  try {
    let res: Response
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal })
      }
    } catch {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal })
    }
    return res.status >= 400
  } catch {
    return true // DNS failure, timeout, connection refused -> dead
  } finally {
    clearTimeout(timer)
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

// ---------------------------------------------------------------- sanity

interface SanityCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
}

async function makeSanityClient(): Promise<SanityCtx | null> {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  const token = process.env.SANITY_MIGRATION_WRITE_TOKEN
  if (!projectId || !dataset || !token) return null
  const { createClient } = await import('@sanity/client')
  return {
    client: createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token }),
  }
}

const ALL_DOCS_QUERY = /* groq */ `*[!(_id in path("drafts.**"))]`

async function fetchAllDocs(ctx: SanityCtx): Promise<Array<Record<string, unknown>>> {
  return ctx.client.fetch(ALL_DOCS_QUERY)
}

// ---------------------------------------------------------------- report

function fmtCount(n: number): string {
  return n.toLocaleString('en-US')
}

interface Findings {
  loaderSource: string
  rulesCount: number
  scanned: number | null // null when no Sanity access
  byKind: Record<string, LinkOccurrence[]>
  deadExternal: LinkOccurrence[]
  externalChecked: boolean
}

function buildReport(args: Args, findings: Findings): string {
  const now = 'run locally to stamp a time (Date.* is intentionally not called here)'
  const lines: string[] = []
  const p = (s = '') => lines.push(s)

  p('# S2 - Internal link equity: Sanity link-rewrite plan (roadmap W1-05 + W1-06)')
  p()
  p('> AUTHORED, NOT APPLIED. This report and the script that writes it')
  p('> (`scripts/seo/rewrite-sanity-links.ts`) are complete and reviewable, but no')
  p('> production Sanity write has happened. Applying items 3 and 4 requires a local')
  p('> run with `SANITY_MIGRATION_WRITE_TOKEN` (gitignored, absent from the cloud')
  p('> session that authored this). S2 is not complete until that run lands.')
  p()
  p(`Redirect table loaded from: **${findings.loaderSource}** (${fmtCount(findings.rulesCount)} rules).`)
  p()
  p('Destinations are re-derived at run time by following the assembled redirect')
  p('table to its terminal hop, NOT from any static map or the analysis 166-list, so')
  p('S1\'s concurrent chain-collapse cannot make this script write a stale target.')
  p(`Report generated at: ${now}.`)
  p()

  // ---- Item 4
  p('## Item 4 - scripted link rewrite (W1-06)')
  p()
  p('Four link classes, three of them mechanically rewritten to the final URL, the')
  p('fourth surfaced for an editorial decision. Class counts below are the analysis')
  p('estimates (TECH-03, QW-04, QW-09); the "found" column is populated only when the')
  p('script runs against production with a token.')
  p()
  p('| Class | Rewrite rule | Analysis estimate | Found this run |')
  p('|---|---|---|---|')
  const foundOr = (k: string) => (findings.scanned == null ? 'n/a (no token)' : fmtCount((findings.byKind[k] ?? []).length))
  p(`| Apex-host internal links | host \`cloudemployee.io\` -> \`www\`, then resolve path | ~434 | ${foundOr('apex')} |`)
  p(`| Retired calculator links | \`/tools/price-comparison-calculator*\` -> \`/pricing\` | ~49 | ${foundOr('calculator')} |`)
  p(`| Other internal redirects | follow the table to the final destination | ~166 | ${foundOr('redirect')} |`)
  p(`| Dead external links | reported with location for an editorial replace/remove in Studio | ~27 | ${findings.externalChecked ? fmtCount(findings.deadExternal.length) : 'n/a (needs --check-external)'} |`)
  p()
  p('Also handled: an internal path that 308s **offsite** (e.g. `/live-job-role/*` ->')
  p('`talent.cloudemployee.io`) is rewritten straight to that host, skipping our hop.')
  p()

  // ---- Resolver self-check
  p('### Resolver self-check (no Sanity access needed)')
  p()
  p('Each sample below is classified and resolved by the live loader, proving the')
  p('re-derivation logic end to end. `->` shows every redirect hop the script')
  p('collapses; it always writes the FINAL column.')
  p()
  p('| Input link | Class | Rewrite target | Hops followed |')
  p('|---|---|---|---|')
  for (const sample of SELF_CHECK_SAMPLES) {
    const v = classifyLinkForReport(sample, findings)
    const hopStr = v.hops && v.hops.length > 1 ? v.hops.join(' -> ') : '(none)'
    p(`| \`${sample}\` | ${v.kind} | ${v.newHref ? `\`${v.newHref}\`` : '(no change)'} | ${hopStr} |`)
  }
  p()

  if (findings.scanned != null) {
    p('### Definitive per-document findings')
    p()
    p(`Scanned ${fmtCount(findings.scanned)} published documents.`)
    p()
    for (const kind of ['apex', 'calculator', 'redirect', 'offsite-redirect'] as const) {
      const occ = findings.byKind[kind] ?? []
      if (occ.length === 0) continue
      p(`#### ${kind} (${fmtCount(occ.length)})`)
      p()
      p('| Document | Path | Old href |')
      p('|---|---|---|')
      for (const o of occ.slice(0, 500)) {
        p(`| \`${o.docId}\` (${o.docType}) | \`${o.patchPath}\` | \`${o.href}\` |`)
      }
      if (occ.length > 500) p(`| ... | ... | (+${fmtCount(occ.length - 500)} more) |`)
      p()
    }
    if (findings.deadExternal.length > 0) {
      p(`#### dead external (${fmtCount(findings.deadExternal.length)}) - decide replace vs remove`)
      p()
      p('| Document | Path | Dead URL |')
      p('|---|---|---|')
      for (const o of findings.deadExternal) {
        p(`| \`${o.docId}\` (${o.docType}) | \`${o.patchPath}\` | \`${o.href}\` |`)
      }
      p()
    }
  } else {
    p('### Definitive per-document findings')
    p()
    p('Not available in this credential-free run. Re-run `--dry-run` locally with')
    p('`SANITY_MIGRATION_WRITE_TOKEN` set to list every offending document and path.')
    p()
  }

  // ---- Item 3
  p('## Item 3 - contextual internal links to starved pages (W1-05)')
  p()
  p('These are IN-CONTENT links (not nav / mega-menu). Adding a nav link does not')
  p('satisfy this item. Placement and anchor text are editorial, so this is a plan')
  p('for a human/Studio pass, not a mechanical rewrite - injecting a link into prose')
  p('blind would mangle sentences. The definitive one-in-content-link set lives in the')
  p('crawl CSV `Notice-indexable-Page_has_only_one_dofollow_incoming_internal_link.csv`')
  p('(not on this filesystem); the pages below are the analysis-named priorities.')
  p()
  p('### The 7 zero-inlink new posts (CONT-06)')
  p()
  p('| Starved page | Why it matters | Suggested in-content link sources |')
  p('|---|---|---|')
  for (const r of ZERO_INLINK_POSTS) {
    p(`| \`${r.page}\` | ${r.note} | ${r.suggestedSources} |`)
  }
  p()
  p('### The impression-bearing one-in-content-link pages (QW-03 / AUTH-03)')
  p()
  p('| Starved page | Signal | Suggested in-content link sources |')
  p('|---|---|---|')
  for (const r of ONE_INLINK_PAGES) {
    p(`| \`${r.page}\` | ${r.signal} | ${r.suggestedSources} |`)
  }
  p()
  p('Note the synergy: items 1 (all 27 compare cards on /alternatives page 1) and 2')
  p('(the related-comparisons module) already give the compare pages above their')
  p('lateral in-content links, so the remaining item-3 work is mostly the blog and')
  p('service/technology targets.')
  p()

  // ---- Apply instructions
  p('## How to apply (the exact local commands)')
  p()
  p('Prerequisite: S1 (PR #93) merged, so the assembled redirect table is complete,')
  p('and `SANITY_MIGRATION_WRITE_TOKEN` set in the gitignored root `.env`.')
  p()
  p('```sh')
  p('# 1. Review the definitive per-document plan (writes this report, no mutations):')
  p('npx tsx scripts/seo/rewrite-sanity-links.ts --dry-run --check-external')
  p('')
  p('# 2. Apply the three internal rewrite classes (idempotent, logs every path):')
  p('npx tsx scripts/seo/rewrite-sanity-links.ts --apply')
  p('')
  p('# 3. Item 3 - add the contextual links above by hand in Studio (editorial).')
  p('')
  p('# 4. Guard against recurrence (expect exit 0):')
  p('npx tsx scripts/seo/rewrite-sanity-links.ts --lint')
  p('```')
  p()
  p('Dead external links (class 4) are listed for a replace-or-remove decision, which')
  p('is applied by hand in Studio - the script detects and locates them but never')
  p('rewrites an external link to a guessed target.')
  p()
  return lines.join('\n') + '\n'
}

// classifyLink wrapper for the report self-check that also carries hops.
function classifyLinkForReport(href: string, findings: Findings): LinkVerdict {
  return reportRules ? classifyLink(href, reportRules) : { href, kind: 'internal-ok', newHref: null, detail: 'no rules' }
}
let reportRules: CompiledRule[] | null = null

// ---------------------------------------------------------------- apply

async function applyRewrites(ctx: SanityCtx, byKind: Record<string, LinkOccurrence[]>, verbose: boolean): Promise<number> {
  const rewrites = [
    ...(byKind.apex ?? []),
    ...(byKind.calculator ?? []),
    ...(byKind.redirect ?? []),
    ...(byKind['offsite-redirect'] ?? []),
  ]
  // Group by document so each doc is one transaction.
  const byDoc = new Map<string, LinkOccurrence[]>()
  for (const o of rewrites) {
    if (!byDoc.has(o.docId)) byDoc.set(o.docId, [])
    byDoc.get(o.docId)!.push(o)
  }

  let patched = 0
  for (const [docId, occ] of byDoc) {
    let patch = ctx.client.patch(docId)
    for (const o of occ) {
      if (!o.newHref) continue
      patch = patch.set({ [o.patchPath]: o.newHref })
      console.log(`[apply] ${docId}  ${o.patchPath}  ${o.href}  ->  ${o.newHref}`)
      patched++
    }
    await patch.commit({ autoGenerateArrayKeys: false })
    if (verbose) console.log(`[apply] committed ${docId} (${occ.length} links)`)
  }
  return patched
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const { rules, source: loaderSource } = await loadRedirectRules()
  reportRules = rules
  console.log(`[redirects] ${rules.length} rules from ${loaderSource}`)

  const ctx = await makeSanityClient()
  const findings: Findings = {
    loaderSource,
    rulesCount: rules.length,
    scanned: null,
    byKind: {},
    deadExternal: [],
    externalChecked: false,
  }

  if (ctx) {
    let docs = await fetchAllDocs(ctx)
    if (args.limit) docs = docs.slice(0, args.limit)
    findings.scanned = docs.length
    const externalCandidates: LinkOccurrence[] = []

    for (const doc of docs) {
      for (const occ of collectLinks(doc)) {
        const verdict = classifyLink(occ.href, rules)
        if (verdict.kind === 'external') {
          externalCandidates.push(occ)
          continue
        }
        if (verdict.newHref) {
          ;(findings.byKind[verdict.kind] ??= []).push(occ)
        }
      }
    }

    if (args.checkExternal && externalCandidates.length > 0) {
      findings.externalChecked = true
      const uniqueUrls = [...new Set(externalCandidates.map((o) => o.href))]
      const deadSet = new Set<string>()
      const results = await mapWithConcurrency(uniqueUrls, EXTERNAL_CONCURRENCY, async (u) => ({ u, dead: await isExternalDead(u) }))
      for (const r of results) if (r.dead) deadSet.add(r.u)
      findings.deadExternal = externalCandidates.filter((o) => deadSet.has(o.href))
    }

    const totalInternal =
      (findings.byKind.apex?.length ?? 0) +
      (findings.byKind.calculator?.length ?? 0) +
      (findings.byKind.redirect?.length ?? 0) +
      (findings.byKind['offsite-redirect']?.length ?? 0)

    if (args.mode === 'lint') {
      const problems = totalInternal + findings.deadExternal.length
      console.log(
        `[lint] apex=${findings.byKind.apex?.length ?? 0} calculator=${findings.byKind.calculator?.length ?? 0} ` +
          `redirect=${findings.byKind.redirect?.length ?? 0} offsite=${findings.byKind['offsite-redirect']?.length ?? 0} ` +
          `deadExternal=${findings.deadExternal.length}`,
      )
      if (problems > 0) {
        console.error(`[lint] FAIL - ${problems} offending link(s) remain. See classes above.`)
        writeReport(args, findings)
        process.exit(1)
      }
      console.log('[lint] PASS - no rewriteable links remain.')
      writeReport(args, findings)
      return
    }

    if (args.mode === 'apply') {
      const patched = await applyRewrites(ctx, findings.byKind, args.verbose)
      console.log(`[apply] done - ${patched} link(s) rewritten across ${findings.scanned} documents.`)
      if (findings.deadExternal.length > 0) {
        console.log(`[apply] ${findings.deadExternal.length} dead external link(s) left in place - see report, decide replace vs remove in Studio.`)
      }
      writeReport(args, findings)
      return
    }
  } else {
    if (args.mode !== 'dry-run') {
      console.error(
        `[error] --${args.mode} needs SANITY_PROJECT_ID + SANITY_DATASET + SANITY_MIGRATION_WRITE_TOKEN. ` +
          'None found. Only --dry-run runs without credentials.',
      )
      process.exit(2)
    }
    console.log('[dry-run] no Sanity credentials - writing the analysis-derived plan + resolver self-check only.')
  }

  writeReport(args, findings)
}

function writeReport(args: Args, findings: Findings): void {
  const report = buildReport(args, findings)
  const abs = resolve(args.reportPath)
  if (!existsSync(dirname(abs))) mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, report)
  console.log(`[report] wrote ${args.reportPath}`)
}

main().catch((err) => {
  console.error('[rewrite-sanity-links] failed:', err)
  process.exit(1)
})
