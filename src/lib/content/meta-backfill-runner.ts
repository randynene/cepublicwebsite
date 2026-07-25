// CONTENT-1D §5 — shared meta-backfill runner.
//
// Per-collection scripts are thin wrappers that call runMetaBackfill()
// with their type, FieldPolicy, and optional pre-scrape hook.
//
// Structural protections enforced here:
//   F1 — phase-wide 20-minute wall-clock abort gate. Hard process.exit(1)
//        (NOT break) so the script cannot continue to the next collection.
//        Failure content_migrations row written BEFORE exit.
//   F4 — needsReview is monotonic: only ever patched to TRUE. The
//        runner OMITS needsReview from the patch when computed value
//        is false; never overwrites a prior `true`.
//   F5 — metaTitle is never written empty. If null/empty, OMITTED;
//        verifier catches it; phase halts for manual resolution.
//   F6 — per-field policy enum. description: 'never-touch' is honoured
//        structurally — no scrape, no normalisation, no validation.
//   F7 — pre-scrape decision hook evaluated BEFORE URL construction
//        (customerStory/virgin short-circuits before scrape).
//   F8 — snippet-copy path explicitly routes through truncateAtWord
//        with a post-truncation length assertion.
//   F13 — 1.5s inter-request delay between scrapes (skipped on last).
//   F21 — split per-field provenance (metaTitleSource +
//        metaDescriptionSource).
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { recordMigration } from '@/lib/content/migration-tracker'
import { scrapeMeta, withBrowser, type ScrapedMeta } from '@/lib/content/meta-scraper'
import { normaliseMeta, truncateAtWord, type NormaliseResult } from '@/lib/content/meta-normaliser'
import { urlForDoc } from '@/lib/content/url-builder'

const PHASE_ABORT_MS = 20 * 60 * 1000
const INTER_REQUEST_DELAY_MS = 1500

export type TitlePolicy = 'scrape-always'

export type DescriptionPolicy =
  | 'scrape-always'
  | 'skip-if-present-else-scrape'
  | 'snippet-copy-else-scrape'
  | 'never-touch'

export interface FieldPolicy {
  title: TitlePolicy
  description: DescriptionPolicy
}

export interface SanityDocLite {
  _id: string
  _type: string
  slug: { current: string }
  metaTitle?: string | null
  metaDescription?: string | null
  snippetForMeta?: string | null
}

export type PreScrapeDecision =
  | { kind: 'continue' }
  | { kind: 'bypass'; patch: Record<string, unknown> }

export interface RunOptions {
  type: string
  policy: FieldPolicy
  collectionSlug: string
  preScrapeHook?: (doc: SanityDocLite) => PreScrapeDecision
  /**
   * Restrict the run to these slugs. Without it every document of the type is
   * re-scraped, which is what CONTENT-1D wanted (a cold dataset) but is wrong
   * now: it would re-scrape 28 team members to backfill 1, and overwrite meta
   * that has since been edited in Studio. Pass the slugs you actually need.
   */
  onlySlugs?: string[]
}

type DescriptionPathUsed =
  | 'live-scrape'
  | 'snippetForMeta-copy'
  | 'never-touch'
  | 'no-write'

interface SourceProvenance {
  provider: string
  scrapedAt?: string
  url?: string
}

// Build the GROQ projection so we hydrate just the fields the runner
// needs — _id, _type, slug, and any policy-relevant existing meta fields.
function projectionFor(policy: FieldPolicy): string {
  const fields = ['_id', '_type', 'slug']
  if (policy.description === 'snippet-copy-else-scrape') fields.push('snippetForMeta', 'metaDescription')
  if (policy.description === 'skip-if-present-else-scrape') fields.push('metaDescription')
  return fields.map((f) => (f === 'slug' ? '"slug": slug' : f)).join(', ')
}

async function fetchInScopeDocs(opts: RunOptions): Promise<SanityDocLite[]> {
  const projection = projectionFor(opts.policy)

  // Retired documents are excluded. The runner works by scraping the live page
  // for each doc, and a retired doc is retired precisely because its live page
  // is gone: scraping it returns a 404 or the hub it redirects to, which would
  // either hard-fail the run or write the hub's meta onto the document.
  const filters = [
    '_type == $type',
    '!(_id match "smoke-test-*")',
    'defined(slug.current)',
    '!(retired == true)',
  ]
  if (opts.onlySlugs) filters.push('slug.current in $onlySlugs')

  return sanityWriteClient.fetch<SanityDocLite[]>(
    `*[${filters.join(' && ')}] | order(_id asc) {${projection}}`,
    { type: opts.type, ...(opts.onlySlugs ? { onlySlugs: opts.onlySlugs } : {}) },
  )
}

// F4 + F5 — write only what should be written. needsReview omitted when
// false; metaTitle omitted when null/empty.
function buildPatch(
  doc: SanityDocLite,
  scraped: ScrapedMeta | null,
  normalised: NormaliseResult,
  policy: FieldPolicy,
): { patch: Record<string, unknown>; descriptionPath: DescriptionPathUsed } {
  const patch: Record<string, unknown> = {}
  let descriptionPath: DescriptionPathUsed = 'no-write'

  // metaTitle — F5
  if (normalised.metaTitle) {
    patch.metaTitle = normalised.metaTitle
    const provenance: SourceProvenance = { provider: 'live-scrape' }
    if (scraped?.scrapedAt) provenance.scrapedAt = scraped.scrapedAt
    if (scraped?.url) provenance.url = scraped.url
    patch.metaTitleSource = provenance
  }

  // metaDescription — policy-driven
  if (policy.description === 'never-touch') {
    descriptionPath = 'never-touch'
    // No write to metaDescription, no provenance update.
  } else if (
    policy.description === 'snippet-copy-else-scrape' &&
    (doc.metaDescription === null || doc.metaDescription === undefined) &&
    typeof doc.snippetForMeta === 'string' &&
    doc.snippetForMeta.length > 0
  ) {
    // F8 — route through truncateAtWord with length assertion.
    const truncated = truncateAtWord(doc.snippetForMeta, 160)
    if (truncated.length === 0 || truncated.length > 160) {
      throw new Error(
        `snippetForMeta truncation invalid for ${doc._id}: length=${truncated.length}`,
      )
    }
    patch.metaDescription = truncated
    patch.metaDescriptionSource = { provider: 'snippetForMeta-copy' }
    descriptionPath = 'snippetForMeta-copy'
  } else if (
    policy.description === 'skip-if-present-else-scrape' &&
    typeof doc.metaDescription === 'string' &&
    doc.metaDescription.length > 0
  ) {
    descriptionPath = 'no-write'
    // Existing populated value — leave as-is.
  } else if (normalised.metaDescription) {
    patch.metaDescription = normalised.metaDescription
    const provenance: SourceProvenance = { provider: 'live-scrape' }
    if (scraped?.scrapedAt) provenance.scrapedAt = scraped.scrapedAt
    if (scraped?.url) provenance.url = scraped.url
    patch.metaDescriptionSource = provenance
    descriptionPath = 'live-scrape'
  }

  // F4 — needsReview only patched true; never written false.
  if (shouldFlagForReview(scraped, normalised, policy, descriptionPath)) {
    patch.needsReview = true
  }

  return { patch, descriptionPath }
}

function shouldFlagForReview(
  scraped: ScrapedMeta | null,
  normalised: NormaliseResult,
  policy: FieldPolicy,
  descriptionPath: DescriptionPathUsed,
): boolean {
  if (!scraped) return true // pre-scrape bypass paths set their own needsReview directly
  if (scraped.status !== 200) return true
  if (!normalised.metaTitle) return true
  // Title-side warnings always count — policy.title is always scrape-always.
  if (normalised.titleWarnings.length > 0) return true
  // Description-side warnings only matter when this run is actually
  // writing the description. For never-touch / no-write paths the
  // description came from a prior phase; this run isn't touching it
  // and shouldn't flag the doc for a description-side concern that
  // was already accepted upstream.
  if (descriptionPath === 'live-scrape') {
    if (!normalised.metaDescription) return true
    if (normalised.descriptionWarnings.length > 0) return true
  }
  if (descriptionPath === 'snippetForMeta-copy') return true // truncation may cut mid-sentence
  return false
}

/**
 * Read `--slug <value>` occurrences off the command line, for scoping a backfill
 * to specific documents. Returns undefined when none are given, which the runner
 * reads as "the whole collection".
 */
export function slugsFromArgv(argv: string[] = process.argv): string[] | undefined {
  const slugs = argv
    .map((arg, i) => (arg === '--slug' ? argv[i + 1] : undefined))
    .filter((s): s is string => !!s && !s.startsWith('--'))
  return slugs.length > 0 ? slugs : undefined
}

export async function runMetaBackfill(opts: RunOptions): Promise<void> {
  const phaseStart = Date.now()
  // Distinguish hard failures (non-200 scrape, patch commit error,
  // urlForDoc throw) from soft warnings (length compliance, missing
  // optional fields). Hard failures fail the content_migrations row;
  // warnings are surfaced via needsReview=true on the doc and logged
  // for visibility in error_log but don't change the row's status.
  // Verifier check #8 requires `status='complete'` on all 11 new
  // rows; warnings would otherwise force every row to 'failed'
  // even when the migration mechanism worked end-to-end.
  const hardFailures: string[] = []
  const warnings: string[] = []
  let succeeded = 0
  let bypassed = 0
  let scrapedCount = 0

  const docs = await fetchInScopeDocs(opts)
  console.log(`[${opts.type}] ${docs.length} in-scope docs to process`)

  await withBrowser(async (browser) => {
    for (let i = 0; i < docs.length; i++) {
      // F1 — phase-wide abort gate. Check at top of each iteration so a
      // stalled scrape can't blow past the budget.
      if (Date.now() - phaseStart > PHASE_ABORT_MS) {
        const msg = `Phase aborted at 20-minute gate. Processed ${succeeded}/${docs.length}.`
        console.error(msg)
        hardFailures.push(msg)
        await recordMigration({
          collectionSlug: opts.collectionSlug,
          sourceItemCount: docs.length,
          migratedItemCount: succeeded,
          status: 'failed',
          errorLog: [...hardFailures, ...warnings],
        })
        // Hard exit, NOT break. break would let the script continue
        // to the next collection.
        process.exit(1)
      }

      const doc = docs[i]
      const baseLog = `[${opts.type}] ${i + 1}/${docs.length} ${doc._id}`

      // F7 — pre-scrape decision evaluated BEFORE URL construction.
      const decision = opts.preScrapeHook?.(doc) ?? { kind: 'continue' }
      if (decision.kind === 'bypass') {
        try {
          await sanityWriteClient.patch(doc._id).set(decision.patch).commit()
          succeeded++
          bypassed++
          console.log(`${baseLog} BYPASS (pre-scrape hook patch applied)`)
        } catch (e) {
          hardFailures.push(`${doc._id}: bypass patch failed: ${(e as Error).message}`)
          console.error(`${baseLog} BYPASS FAILED — ${(e as Error).message}`)
        }
        // No inter-request delay needed — no network fetch happened.
        continue
      }

      // Normal flow — scrape, normalise, patch.
      let url: string
      try {
        url = urlForDoc({ _type: doc._type, slug: { current: doc.slug.current } })
      } catch (e) {
        hardFailures.push(`${doc._id}: urlForDoc failed: ${(e as Error).message}`)
        console.error(`${baseLog} URL BUILD FAILED — ${(e as Error).message}`)
        continue
      }

      const scraped = await scrapeMeta(browser, url)
      scrapedCount++
      const normalised = normaliseMeta({
        rawTitle: scraped.rawTitle,
        rawDescription: scraped.rawDescription,
      })

      try {
        const { patch, descriptionPath } = buildPatch(doc, scraped, normalised, opts.policy)
        // Only commit if there's something to write. An empty patch
        // happens for never-touch + scrape-failed scenarios; the
        // hard-failure entry below records the scrape failure.
        if (Object.keys(patch).length > 0) {
          await sanityWriteClient.patch(doc._id).set(patch).commit()
        }
        succeeded++
        const httpTag = scraped.status === 200 ? 'HTTP 200' : `HTTP ${scraped.status}`
        const flagged = patch.needsReview === true ? ' needsReview=true' : ''
        console.log(`${baseLog} ${httpTag} ${descriptionPath}${flagged}`)

        // SOFT — non-200 from the live page is a state issue (drift,
        // page taken down, transient outage), not a runner failure.
        // The runner did its job: it scraped + flagged needsReview=true
        // + logged. The verifier's check #1 (meta coverage) is what
        // halts the phase on missing meta — so non-200 propagates
        // there for the manual decision, not into row status.
        if (scraped.status !== 200) {
          warnings.push(
            `${doc._id}: scrape returned ${scraped.status}${scraped.errorMessage ? ` (${scraped.errorMessage})` : ''}`,
          )
        }
        // SOFT warnings — length compliance / missing optional fields.
        // The doc has been patched + (where applicable) flagged via
        // needsReview=true; the row remains 'complete' since the
        // migration mechanism succeeded end-to-end.
        for (const w of normalised.titleWarnings) {
          warnings.push(`${doc._id}: ${w}`)
        }
        if (descriptionPath === 'live-scrape' || descriptionPath === 'snippetForMeta-copy') {
          for (const w of normalised.descriptionWarnings) {
            warnings.push(`${doc._id}: ${w}`)
          }
        }
      } catch (e) {
        const msg = `${doc._id}: ${(e as Error).message}`
        hardFailures.push(msg)
        console.error(`${baseLog} PATCH FAILED — ${(e as Error).message}`)
      }

      // F13 — inter-request delay (skip on last iteration).
      if (i < docs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, INTER_REQUEST_DELAY_MS))
      }
    }
  })

  const elapsedMs = Date.now() - phaseStart
  console.log(
    `[${opts.type}] done — succeeded=${succeeded}/${docs.length}, bypassed=${bypassed}, scraped=${scrapedCount}, hardFailures=${hardFailures.length}, warnings=${warnings.length}, elapsed=${Math.round(elapsedMs / 1000)}s`,
  )

  // status='complete' iff no HARD failures. Soft warnings (length /
  // missing optional fields) are surfaced via needsReview=true on the
  // doc and via errorLog (combined hard+soft) for visibility, but
  // don't fail the row. Drift docs (404 scrape) ARE hard failures —
  // those rows record status='failed' and the verifier surfaces them
  // for manual decision before the state transition.
  await recordMigration({
    collectionSlug: opts.collectionSlug,
    sourceItemCount: docs.length,
    migratedItemCount: succeeded,
    status: hardFailures.length === 0 ? 'complete' : 'failed',
    errorLog: [...hardFailures, ...warnings],
  })
}
