// Pre-flight verifier for MYGRATR-CONTENT-1D (Step 0.2 — HARD GATE).
//
// Runs every check the brief requires before any meta backfill / image
// carryover / smoke-test cleanup script may touch Sanity. Exits non-zero
// on any failure with a complete punch list — never short-circuits.
//
// Brief checks 1–7 + Step 0a.2 supplementary checks (schema/Zod field
// presence) + F14 forbidden-import grep (ESLint-equivalent — see brief
// §"Path Alias Discipline" for rationale).
//
// Usage: npm run content:verify-1d-prereqs
//
// HARD GATE: do not run this script until SANITY_MIGRATION_WRITE_TOKEN is
// set in .env. See CONTENT-1D brief Step 0.1.

import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'

import { env } from '@/lib/env'
import { createServerClient } from '@/lib/supabase'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'
// All scripts are invoked via `npm run` from repo root.
const REPO_ROOT = process.cwd()

// In-scope types and expected counts (brief §3.1).
const EXPECTED_COUNTS = {
  technology: 101,
  service: 23,
  customerStory: 18,
  teamMember: 28,
  review: 26,
  bookACall: 6,
} as const
type InScopeType = keyof typeof EXPECTED_COUNTS

// 6 in-scope route prefixes for the URL overlap check.
const IN_SCOPE_ROUTE_PREFIXES = [
  '/technology/',
  '/services/',
  '/customer-story/',
  '/team/',
  '/reviews/',
  '/book-a-call/',
]

// 3 specific smoke-test doc _ids in CONTENT-1D scope (brief §7).
const SMOKE_TEST_IDS_IN_SCOPE = [
  // The smoke-test tag — discovered at runtime; confirmed-existence check
  // happens after lookup. Placeholder here; resolved in checkSmokeTestDocs.
  '__SMOKE_TEST_TAG__',
  'smoke-test-blog-category-scaling-teams',
  'smoke-test-team-member',
] as const

type CheckResult = { name: string; ok: boolean; detail: string; hard: boolean }
const results: CheckResult[] = []

function record(name: string, ok: boolean, detail: string, hard = true): void {
  results.push({ name, ok, detail, hard })
  console.log(`${ok ? '✅' : hard ? '❌' : '⚠️ '} ${name} — ${detail}`)
}

// ---------- Check 7: tokens ----------
function checkTokens(): void {
  // env.ts already validated shape; confirm presence/absence per F3 + F14.
  if (env.SANITY_MIGRATION_WRITE_TOKEN) {
    record('Token: SANITY_MIGRATION_WRITE_TOKEN set', true, 'present')
  } else {
    record(
      'Token: SANITY_MIGRATION_WRITE_TOKEN set',
      false,
      'MISSING — create least-privilege token in Sanity manage console; add to .env',
    )
  }
  if (!env.SANITY_API_READ_TOKEN) {
    record('Token: SANITY_API_READ_TOKEN absent (F14)', true, 'absent (correct)')
  } else {
    record(
      'Token: SANITY_API_READ_TOKEN absent (F14)',
      false,
      'PRESENT — read token belongs in site/.env.local only; remove from .env',
    )
  }
}

// ---------- Check 1: migration state ----------
async function checkMigrationState(): Promise<void> {
  const client = createServerClient()
  const { data, error } = await client
    .from('migrations')
    .select('status, current_phase')
    .eq('org_id', ORG_ID)
    .eq('id', MIGRATION_ID)
    .single()
  if (error) {
    record('Migration state: row fetch', false, `Supabase error: ${error.message}`)
    return
  }
  if (!data) {
    record('Migration state: row fetch', false, 'CE migrations row missing')
    return
  }
  const ok = data.status === 'content_running' && data.current_phase === 'content_running'
  record(
    'Migration state: status & current_phase = content_running',
    ok,
    `status=${data.status} current_phase=${data.current_phase}`,
  )
}

// ---------- Check 2: doc counts (smoke-test excluded) ----------
async function checkDocCounts(): Promise<void> {
  for (const [type, expected] of Object.entries(EXPECTED_COUNTS) as Array<[InScopeType, number]>) {
    try {
      const actual = await sanityWriteClient.fetch<number>(
        `count(*[_type == $type && !(_id match "smoke-test-*")])`,
        { type },
      )
      record(
        `Doc count: ${type}`,
        actual === expected,
        `expected=${expected}, actual=${actual}`,
      )
    } catch (err) {
      record(
        `Doc count: ${type}`,
        false,
        `Sanity fetch error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
}

// ---------- Check 3: scrape scope ----------
type ScrapeScopeRow = {
  type: InScopeType
  needsTitle: number
  needsDescription: number
}

async function buildScrapeScope(): Promise<ScrapeScopeRow[]> {
  // For each in-scope type, count docs missing metaTitle and missing
  // metaDescription. Smoke-test docs excluded everywhere (F9).
  const scope: ScrapeScopeRow[] = []
  for (const type of Object.keys(EXPECTED_COUNTS) as InScopeType[]) {
    const needsTitle = await sanityWriteClient.fetch<number>(
      `count(*[_type == $type && !(_id match "smoke-test-*") && !defined(metaTitle)])`,
      { type },
    )
    const needsDescription = await sanityWriteClient.fetch<number>(
      `count(*[_type == $type && !(_id match "smoke-test-*") && !defined(metaDescription)])`,
      { type },
    )
    scope.push({ type, needsTitle, needsDescription })
  }
  return scope
}

function reportScrapeScope(scope: ScrapeScopeRow[]): void {
  console.log('\nScrape scope (docs needing meta backfill):')
  let totalTitle = 0
  let totalDesc = 0
  for (const row of scope) {
    console.log(
      `  ${row.type.padEnd(16)} needsTitle=${String(row.needsTitle).padStart(3)} needsDescription=${String(row.needsDescription).padStart(3)}`,
    )
    totalTitle += row.needsTitle
    totalDesc += row.needsDescription
  }
  console.log(`  ${'TOTAL'.padEnd(16)} needsTitle=${String(totalTitle).padStart(3)} needsDescription=${String(totalDesc).padStart(3)}`)
  // Sanity: bookACall.metaDescription is `never-touch` policy and must be
  // populated already (CONTENT-1B). If it shows up needing description,
  // that's a violation of the IMMUTABLE policy header in the bookACall
  // migrator — flag, do not halt (verifier check #5 covers post-1D).
  const bac = scope.find((s) => s.type === 'bookACall')
  if (bac && bac.needsDescription > 0) {
    record(
      'Scope sanity: bookACall.metaDescription pre-populated',
      false,
      `${bac.needsDescription} bookACall docs missing metaDescription — CONTENT-1B carryover broken`,
    )
  } else {
    record('Scope sanity: bookACall.metaDescription pre-populated', true, '6/6 already have metaDescription (CONTENT-1B)')
  }
  // Anomaly guard — if total scrape work is zero, the phase is vacuously
  // done and shouldn't run; if it's wildly higher than expected, halt.
  const expected = totalTitle + totalDesc
  const ok = expected > 50 && expected < 500
  record(
    'Scope sanity: total field writes plausible',
    ok,
    `total=${expected} (expected ~200-280)`,
  )
}

// ---------- Check 4: UNKNOWN URL overlap ----------
function checkUnknownUrlOverlap(): void {
  type CanonicalUrlsFile = {
    canonicalUrls: Array<{ url: string; path: string; status: string | number }>
    anomalies?: Array<{ affectedUrl: string }>
  }
  const file = path.join(REPO_ROOT, 'audit-output', 'ce-canonical-urls.json')
  if (!fs.existsSync(file)) {
    record('UNKNOWN URL overlap', false, `audit-output missing: ${file}`)
    return
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as CanonicalUrlsFile
  // "UNKNOWN" canonical URLs per Tech Debt #9 — interpreted as the
  // anomalies array (orphan URLs absent from sitemap + Firecrawl) plus
  // canonical URLs whose status is not 200/301/302/308.
  const anomaly = (data.anomalies ?? []).map((a) => a.affectedUrl)
  const errored = data.canonicalUrls
    .filter((u) => {
      const code = String(u.status)
      return !['200', '301', '302', '308'].includes(code)
    })
    .map((u) => u.url)
  const suspect = [...new Set([...anomaly, ...errored])]
  const overlap = suspect.filter((url) => {
    try {
      const u = new URL(url)
      return IN_SCOPE_ROUTE_PREFIXES.some((p) => u.pathname.startsWith(p))
    } catch {
      return false
    }
  })
  record(
    'UNKNOWN URL overlap with in-scope routes',
    overlap.length === 0,
    overlap.length === 0
      ? `${suspect.length} suspect URLs checked, 0 overlap`
      : `OVERLAP: ${overlap.join(', ')} — halt and re-scope`,
  )
}

// ---------- Check 5: smoke-test docs exist + zero refs ----------
async function checkSmokeTestDocs(): Promise<void> {
  // Resolve the smoke-test tag _id by name.
  const tagMatches = await sanityWriteClient.fetch<Array<{ _id: string; name: string }>>(
    `*[_type == "tag" && name == $name]{_id, name}`,
    { name: 'scaling-teams (SMOKE TEST)' },
  )
  if (tagMatches.length !== 1) {
    record(
      'Smoke-test tag discovery',
      false,
      `expected exactly 1 match for name="scaling-teams (SMOKE TEST)"; got ${tagMatches.length}`,
    )
    return
  }
  const smokeTestTagId = tagMatches[0]._id
  record('Smoke-test tag discovery', true, `tag _id=${smokeTestTagId}`)

  const idsToCheck = [
    smokeTestTagId,
    'smoke-test-blog-category-scaling-teams',
    'smoke-test-team-member',
  ]

  for (const id of idsToCheck) {
    const exists = await sanityWriteClient.fetch<{ _id: string; _type: string } | null>(
      `*[_id == $id][0]{_id, _type}`,
      { id },
    )
    if (!exists) {
      record(`Smoke-test doc exists: ${id}`, false, 'not found in Sanity')
      continue
    }
    record(`Smoke-test doc exists: ${id}`, true, `_type=${exists._type}`)
    const refs = await sanityWriteClient.fetch<Array<{ _id: string; _type: string }>>(
      `*[references($id)]{_id, _type}`,
      { id },
    )
    const ok = refs.length === 0
    record(
      `Smoke-test doc inbound refs: ${id}`,
      ok,
      ok ? '0 inbound refs (safe to delete)' : `${refs.length} refs: ${refs.map((r) => r._id).join(', ')}`,
    )
  }

  // Sanity check the production tag exists too — proves we're deleting only
  // the SMOKE TEST variant, not the production category tag.
  const productionTag = await sanityWriteClient.fetch<{ _id: string } | null>(
    `*[_type == "tag" && slug.current == "scaling-teams" && name == "Scaling Teams"][0]{_id}`,
  )
  record(
    'Production "Scaling Teams" tag exists',
    !!productionTag,
    productionTag ? `_id=${productionTag._id}` : 'NOT FOUND — would delete production tag if smoke-test cleanup ran',
  )
}

// ---------- Check 6: Playwright installed ----------
function checkPlaywright(): void {
  try {
    const out = execSync('npx playwright --version', { cwd: REPO_ROOT, encoding: 'utf-8' }).trim()
    record('Playwright installed', true, out)
  } catch (err) {
    record(
      'Playwright installed',
      false,
      `npx playwright failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}

// ---------- Check 8: forbidden import grep (F14 ESLint-equivalent) ----------
function listTsFiles(dir: string): string[] {
  const files: string[] = []
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      files.push(...listTsFiles(full))
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

function checkForbiddenImports(): void {
  // F14: scripts/** and src/lib/content/** must not import from
  // site/src/lib/sanity/* or @/lib/sanity/*. Runtime assertion in the
  // write client is the load-bearing guard; this is the static-analysis
  // equivalent of the ESLint no-restricted-imports rule.
  const targets = [
    path.join(REPO_ROOT, 'scripts'),
    path.join(REPO_ROOT, 'src', 'lib', 'content'),
  ]
  const forbidden = [
    /from\s+['"]@\/lib\/sanity\/[^'"]+['"]/,
    /from\s+['"]site\/src\/lib\/sanity\/[^'"]+['"]/,
    /from\s+['"]\.\.\/.*\/site\/src\/lib\/sanity\/[^'"]+['"]/,
  ]
  const offenders: Array<{ file: string; match: string }> = []
  for (const root of targets) {
    for (const file of listTsFiles(root)) {
      const text = fs.readFileSync(file, 'utf-8')
      for (const pat of forbidden) {
        const m = text.match(pat)
        if (m) offenders.push({ file: path.relative(REPO_ROOT, file), match: m[0] })
      }
    }
  }
  record(
    'Forbidden imports (F14)',
    offenders.length === 0,
    offenders.length === 0
      ? `${targets.length} dirs scanned, 0 violations`
      : offenders.map((o) => `${o.file}: ${o.match}`).join('; '),
  )
}

// ---------- Step 0a.2 supplementary: schema + Zod field presence ----------
function checkStep0aFields(): void {
  // The fields land via shared helper invocations
  // (sourceTrackingFieldsCarryover, metaSourceFields, MetaSourceFieldsSchema,
  // SourceTrackingFieldsCarryoverSchema). Each consumer file is wired up
  // when it (a) imports the helper and (b) invokes it / merges it. We
  // accept either direct field declaration OR helper usage as wired.
  // Informational — flagged non-hard so this verifier is meaningful both
  // before AND after Step 0a runs.
  const studioFiles = [
    'studio/schemas/documents/customer-story.ts',
    'studio/schemas/documents/team-member.ts',
    'studio/schemas/documents/review.ts',
    'studio/schemas/documents/book-a-call.ts',
  ]
  const provenanceStudioFiles = [
    ...studioFiles,
    'studio/schemas/documents/technology.ts',
    'studio/schemas/documents/service.ts',
  ]
  const zodFiles = [
    'src/types/sanity/documents/customer-story.ts',
    'src/types/sanity/documents/team-member.ts',
    'src/types/sanity/documents/review.ts',
    'src/types/sanity/documents/book-a-call.ts',
    'src/types/sanity/documents/technology.ts',
    'src/types/sanity/documents/service.ts',
  ]

  // Confirm shared helpers exist with the expected names. If they're
  // missing, the per-file checks below would be meaningless.
  const studioShared = fs.readFileSync(
    path.join(REPO_ROOT, 'studio/schemas/_shared.ts'),
    'utf-8',
  )
  const helpersPresent =
    /sourceTrackingFieldsCarryover/.test(studioShared) &&
    /metaSourceFields/.test(studioShared)
  record(
    'Step 0a: studio shared helpers defined',
    helpersPresent,
    helpersPresent
      ? 'sourceTrackingFieldsCarryover + metaSourceFields exist in _shared.ts'
      : 'helpers missing in studio/schemas/_shared.ts',
    false,
  )

  const zodShared = fs.readFileSync(path.join(REPO_ROOT, 'src/types/sanity/shared.ts'), 'utf-8')
  const zodHelpersPresent =
    /MetaSourceFieldsSchema/.test(zodShared) &&
    /SourceTrackingFieldsCarryoverSchema/.test(zodShared)
  record(
    'Step 0a: Zod shared schemas defined',
    zodHelpersPresent,
    zodHelpersPresent
      ? 'MetaSourceFieldsSchema + SourceTrackingFieldsCarryoverSchema exist in shared.ts'
      : 'shared zod schemas missing',
    false,
  )

  // needsReview is added to the 4 carryover types via
  // sourceTrackingFieldsCarryover(). Accept either the helper invocation
  // or a literal `needsReview` declaration.
  const missingNeedsReview: string[] = []
  for (const rel of studioFiles) {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8')
    const wired =
      /sourceTrackingFieldsCarryover\s*\(/.test(text) || /name:\s*['"]needsReview['"]/.test(text)
    if (!wired) missingNeedsReview.push(rel)
  }
  record(
    'Step 0a: needsReview wired in 4 carryover schemas',
    missingNeedsReview.length === 0,
    missingNeedsReview.length === 0
      ? '4/4 schemas wire sourceTrackingFieldsCarryover() (or declare needsReview directly)'
      : `MISSING in: ${missingNeedsReview.join(', ')}`,
    false,
  )

  // Provenance fields land via metaSourceFields() helper invocation. Accept
  // either the helper or a literal metaTitleSource/metaDescriptionSource.
  const missingProvenance: string[] = []
  for (const rel of provenanceStudioFiles) {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8')
    const wired =
      /metaSourceFields\s*\(/.test(text) ||
      (/name:\s*['"]metaTitleSource['"]/.test(text) &&
        /name:\s*['"]metaDescriptionSource['"]/.test(text))
    if (!wired) missingProvenance.push(rel)
  }
  record(
    'Step 0a: split provenance fields wired in 6 schemas',
    missingProvenance.length === 0,
    missingProvenance.length === 0
      ? '6/6 schemas wire metaSourceFields() (or declare both fields directly)'
      : `MISSING in: ${missingProvenance.join(', ')}`,
    false,
  )

  // Zod twins import + merge MetaSourceFieldsSchema. Accept either the
  // merge or a direct field declaration.
  const missingZod: string[] = []
  for (const rel of zodFiles) {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8')
    const wired =
      /MetaSourceFieldsSchema/.test(text) ||
      (/metaTitleSource/.test(text) && /metaDescriptionSource/.test(text))
    if (!wired) missingZod.push(rel)
  }
  record(
    'Step 0a: Zod twins extended with provenance fields',
    missingZod.length === 0,
    missingZod.length === 0
      ? '6/6 Zod twins merge MetaSourceFieldsSchema (or declare fields directly)'
      : `MISSING in: ${missingZod.join(', ')}`,
    false,
  )

  // Carryover Zod twins — 4 types should additionally merge
  // SourceTrackingFieldsCarryoverSchema for the §7.2 triplet.
  const carryoverZodFiles = [
    'src/types/sanity/documents/customer-story.ts',
    'src/types/sanity/documents/team-member.ts',
    'src/types/sanity/documents/review.ts',
    'src/types/sanity/documents/book-a-call.ts',
  ]
  const missingCarryover: string[] = []
  for (const rel of carryoverZodFiles) {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8')
    if (!/SourceTrackingFieldsCarryoverSchema/.test(text)) missingCarryover.push(rel)
  }
  record(
    'Step 0a: Zod carryover twins merge SourceTrackingFieldsCarryoverSchema',
    missingCarryover.length === 0,
    missingCarryover.length === 0
      ? '4/4 carryover Zod twins extended'
      : `MISSING in: ${missingCarryover.join(', ')}`,
    false,
  )
}

// ---------- main ----------
async function main(): Promise<void> {
  console.log('=== MYGRATR-CONTENT-1D pre-flight verifier ===\n')

  // Token check FIRST — informational; sanityWriteClient import already
  // asserted at module load. This is for explicit visibility.
  checkTokens()
  console.log('')

  await checkMigrationState()
  console.log('')

  await checkDocCounts()
  console.log('')

  const scope = await buildScrapeScope()
  reportScrapeScope(scope)
  console.log('')

  checkUnknownUrlOverlap()
  console.log('')

  await checkSmokeTestDocs()
  console.log('')

  checkPlaywright()
  console.log('')

  checkForbiddenImports()
  console.log('')

  checkStep0aFields()
  console.log('')

  // Summary
  const hardFailures = results.filter((r) => !r.ok && r.hard)
  const softFailures = results.filter((r) => !r.ok && !r.hard)
  console.log('=== SUMMARY ===')
  console.log(`  passed:        ${results.filter((r) => r.ok).length}`)
  console.log(`  hard failures: ${hardFailures.length}`)
  console.log(`  soft warnings: ${softFailures.length}`)
  console.log('')

  if (hardFailures.length > 0) {
    console.error('=== PRE-FLIGHT FAILED ===')
    for (const f of hardFailures) console.error(`  • ${f.name}: ${f.detail}`)
    process.exit(1)
  }
  if (softFailures.length > 0) {
    console.warn('=== PRE-FLIGHT PASSED (with warnings) ===')
    for (const f of softFailures) console.warn(`  • ${f.name}: ${f.detail}`)
    console.warn('Soft warnings are typically expected before Step 0a runs.')
  } else {
    console.log('=== PRE-FLIGHT PASSED ===')
  }
}

main().catch((err) => {
  console.error('Verifier crashed:')
  console.error(err)
  process.exit(1)
})
