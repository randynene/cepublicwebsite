// Restore the live site's <title> and meta description into Sanity.
//
// WHY THIS EXISTS. The content migration captured CE's SEO metadata in April.
// CE kept editing it in Webflow afterwards, and a subset of titles were stored
// truncated (the last word is missing: "… | Staff" where live says
// "… | Staff Augmentation"). The result is that ~45% of the pages that exist on
// both sites would ship a different <title> than the one currently ranking, at
// the same moment the domain moves. If rankings then move you cannot tell which
// change caused it.
//
// This reads the report from `npm run launch:compare-meta` and writes the LIVE
// value back into the matching Sanity document, so the crossover changes the
// platform and nothing else. Titles can be improved deliberately afterwards,
// one at a time, with attribution.
//
//   npm run launch:compare-meta                    # produce the report first
//   npm run launch:backfill-meta                   # DRY RUN - prints every patch
//   npm run launch:backfill-meta -- --apply        # writes (Jake runs this)
//   npm run launch:backfill-meta -- --truncations-only
//
// Only touches metaTitle / metaDescription, only on documents whose page ALREADY
// renders from Sanity, and only where live returned a real 200. Bespoke pages
// that hold their copy in code are reported and skipped: changing those is a
// copy decision, not a data repair.
import { readFileSync } from 'node:fs'

import { createClient } from '@sanity/client'
import 'dotenv/config'

const REPORT_PATH = 'audit-output/launch/meta-parity.json'
const APPLY = process.argv.includes('--apply')
const TRUNCATIONS_ONLY = process.argv.includes('--truncations-only')

type ReportRow = {
  path: string
  truncated: boolean
  live: { title: string | null; description: string | null; status: number }
  target: { title: string | null; description: string | null }
}

type Report = {
  truncations: ReportRow[]
  allComparable: ReportRow[]
}

// Marketing pages, hubs and funnel pages are Sanity SINGLETONS with a fixed _id
// and no slug, so they cannot be found by the slug lookup the collections use.
// They were briefly written off as "held in code"; they are not, and this map is
// what makes them reachable. Left-hand side is the US path.
const SINGLETON_BY_PATH: Record<string, string> = {
  '/': 'homePage',
  '/about-us': 'aboutUsPage',
  '/contact': 'contactPage',
  '/how-it-works': 'howItWorksPage',
  '/our-work': 'ourWorkPage',
  '/pricing': 'pricingPage',
  '/for-developers': 'forDevelopersPage',
  '/referrals': 'referralsPage',
  '/work-with-shawnee': 'workWithShawneePage',
  '/book-a-call': 'bookACallPage',
  '/legals/general-terms': 'generalTermsPage',
  '/legals/privacy-policy': 'privacyPolicyPage',
  // Hubs
  '/blog': 'blogHub',
  '/ai-in-software-development': 'aiInSoftwareDevelopmentHub',
  '/hiring-tips': 'hiringTipsHub',
  '/managing-engineers': 'managingEngineersHub',
  '/nearshoring-offshoring': 'nearshoringOffshoringHub',
  '/scaling-teams': 'scalingTeamsHub',
  '/staff-augmentation': 'staffAugmentationHub',
  '/services': 'servicesHub',
  '/technology': 'technologyHub',
  '/reviews': 'reviewsHub',
  '/customer-stories': 'customerStoriesHub',
  '/videos': 'videosHub',
  '/tools': 'toolsHub',
  '/downloads': 'downloadsHub',
  '/events': 'eventsHub',
  '/alternatives': 'alternativesHub',
  // Bespoke pages that sit on a /services/ URL but do NOT read the service
  // document of the same slug. Mapped explicitly so the slug lookup below never
  // patches the wrong record and leaves the page unchanged.
  '/services/software-engineers': 'hireEngineersPage',
  '/services/fractional-ctos': 'fractionalCtoPage',
  '/services/latam-developers': 'locationPage-latam-developers',
  '/services/philippines-developers': 'locationPage-philippines-developers',
  '/services/eastern-europe-developers': 'locationPage-eastern-europe-developers',
}

// Path prefix -> Sanity document type. Anything not listed here renders its copy
// from a singleton or from code, and is out of scope for a data backfill.
const PREFIX_TO_TYPE: Array<[string, string]> = [
  ['/services/', 'service'],
  ['/technology/', 'technology'],
  ['/videos/', 'video'],
  ['/tools/', 'tool'],
  ['/downloads/', 'download'],
  ['/download/', 'download'],
  ['/customer-story/', 'customerStory'],
  ['/reviews/', 'review'],
  ['/compare/', 'compareBlog'],
  ['/team/', 'teamMember'],
  ['/book-a-call/', 'bookACall'],
]

// Blog articles live under a topic segment: /nearshoring-offshoring/{slug}.
// Listed explicitly so a two-segment marketing URL is never mistaken for one.
const BLOG_CATEGORIES = new Set([
  'ai-in-software-development',
  'hiring-tips',
  'managing-engineers',
  'nearshoring-offshoring',
  'scaling-teams',
  'staff-augmentation',
])

type Resolved = { type: string; slug: string } | { id: string }

function resolve(path: string): Resolved | null {
  // A /uk page and its US twin are the same document; patch it once.
  const p = path.startsWith('/uk/') ? path.slice(3) : path === '/uk' ? '/' : path

  const singleton = SINGLETON_BY_PATH[p]
  if (singleton) return { id: singleton }

  for (const [prefix, type] of PREFIX_TO_TYPE) {
    if (p.startsWith(prefix)) {
      const slug = p.slice(prefix.length)
      if (!slug || slug.includes('/')) return null
      return { type, slug }
    }
  }

  const segments = p.split('/').filter(Boolean)
  if (segments.length === 2 && BLOG_CATEGORIES.has(segments[0])) {
    return { type: 'blogPost', slug: segments[1] }
  }

  return null
}

type Doc = { _id: string; metaTitle?: string; metaDescription?: string }

function client() {
  const token = process.env.SANITY_MIGRATION_WRITE_TOKEN
  if (APPLY && !token) {
    throw new Error('SANITY_MIGRATION_WRITE_TOKEN is required with --apply')
  }
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID ?? 'lzbhll1u',
    dataset: process.env.SANITY_DATASET ?? 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    ...(token ? { token } : {}),
  })
}

async function main(): Promise<void> {
  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf-8')) as Report

  const rows = TRUNCATIONS_ONLY ? report.truncations : report.allComparable

  // One document per slug, even though US and UK both report it.
  const byDoc = new Map<string, { resolved: Resolved; paths: string[]; row: ReportRow }>()
  const skipped: string[] = []

  for (const row of rows) {
    if (row.live.status !== 200 || !row.live.title) continue
    const resolved = resolve(row.path)
    if (!resolved) {
      skipped.push(row.path)
      continue
    }
    const key = 'id' in resolved ? resolved.id : `${resolved.type}:${resolved.slug}`
    const existing = byDoc.get(key)
    if (existing) existing.paths.push(row.path)
    else byDoc.set(key, { resolved, paths: [row.path], row })
  }

  const sanity = client()

  const patches: Array<{ id: string; label: string; set: Record<string, string> }> = []
  const notFound: string[] = []

  for (const [key, entry] of byDoc) {
    const doc =
      'id' in entry.resolved
        ? await sanity.fetch<Doc | null>(`*[_id == $id][0]{_id, metaTitle, metaDescription}`, {
            id: entry.resolved.id,
          })
        : await sanity.fetch<Doc | null>(
            `*[_type == $type && slug.current == $slug][0]{_id, metaTitle, metaDescription}`,
            { type: entry.resolved.type, slug: entry.resolved.slug },
          )
    if (!doc) {
      notFound.push(key)
      continue
    }

    const set: Record<string, string> = {}
    // The stored value is now the WHOLE rendered title (see page-title.ts), so
    // "equal to what live serves" is the exact test, with no suffix arithmetic.
    if (entry.row.live.title && doc.metaTitle !== entry.row.live.title) {
      set.metaTitle = entry.row.live.title
    }
    if (entry.row.live.description && doc.metaDescription !== entry.row.live.description) {
      set.metaDescription = entry.row.live.description
    }
    if (Object.keys(set).length === 0) continue

    patches.push({ id: doc._id, label: key, set })
  }

  console.log(`Report rows considered:  ${rows.length}`)
  console.log(`Resolved to a document:  ${byDoc.size}`)
  console.log(`Documents needing a fix: ${patches.length}`)
  console.log(`Not a Sanity-driven doc: ${skipped.length} (copy decision, see list below)`)
  if (notFound.length) console.log(`Slug not found in Sanity: ${notFound.length}`)
  console.log()

  for (const p of patches) {
    console.log(`${p.label}  (${p.id})`)
    for (const [field, value] of Object.entries(p.set)) {
      console.log(`  ${field}: ${value}`)
    }
  }

  if (skipped.length) {
    console.log('\nNOT RESOLVED TO A DOCUMENT - check these by hand:')
    for (const s of [...new Set(skipped.map((p) => (p.startsWith('/uk/') ? p.slice(3) : p)))].sort()) {
      console.log(`  ${s}`)
    }
  }

  if (!APPLY) {
    console.log(`\nDRY RUN. Nothing was written. Re-run with --apply to patch ${patches.length} document(s).`)
    return
  }

  let tx = sanity.transaction()
  for (const p of patches) tx = tx.patch(p.id, (patch) => patch.set(p.set))
  await tx.commit()
  console.log(`\nWrote ${patches.length} document(s).`)
}

void main()
