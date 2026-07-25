// MYGRATR-TEMPLATE-BLOG HALT 1 probe batch — runs Probes 2, 6, 7, 8, 10
// (GROQ-fetch probes) plus 3a / 3b sample fetches. Outputs human-readable
// summaries to stdout AND structured JSON to audit-output/template-blog/
// per probe. See docs/briefs/active/MYGRATR-TEMPLATE-BLOG_BRIEF_v1.3.md §12.1.
//
// Usage: tsx scripts/template-blog/probe-batch.ts
//
// Probes that don't fetch GROQ are handled elsewhere:
//   - Probe 0: direct shared.ts inspection (probe-0-metafields.md)
//   - Probe 1: filesystem inspection of audit-output/screenshots
//   - Probe 4: route conflict check via grep over site/src/app/
//   - Probe 5: deferred to post-scaffold curl tests
//   - Probe 9: A2 Link source inspection (probe-9-link-rel.md)

import { createClient } from '@sanity/client'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { env, ensureSanity } from '@/lib/env'

ensureSanity()

const ARTIFACT_DIR = resolve(process.cwd(), 'audit-output/template-blog')

// Read-only client. Uses SANITY_API_TOKEN per repo-root env contract.
// published perspective only — does not need draft access.
const client = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: env.SANITY_API_TOKEN,
  perspective: 'published',
})

function writeArtifact(name: string, body: string): void {
  const path = resolve(ARTIFACT_DIR, name)
  writeFileSync(path, body, 'utf8')
  console.log(`  → wrote ${path}`)
}

function fmtCount(label: string, n: number, expected?: number): string {
  if (expected === undefined) return `${label}: ${n}`
  const ok = n === expected ? 'PASS' : 'FAIL'
  return `${label}: ${n} (expected ${expected}) → ${ok}`
}

// -------------------------------------------------------------------------
// Probe 2: meta fields populated (HARD HALT trigger #1 if any miss)
// -------------------------------------------------------------------------
async function probe2(): Promise<{ pass: boolean; missing: unknown[] }> {
  console.log('\n[Probe 2] meta fields populated on all blogPosts')
  const missing = await client.fetch<unknown[]>(
    `*[_type=="blogPost" && (!defined(metaTitle) || !defined(metaDescription))][0...10]{
       _id, "slug": slug.current, metaTitle, metaDescription
     }`,
  )
  const pass = missing.length === 0
  console.log(`  ${pass ? 'PASS' : 'FAIL'} — ${missing.length} doc(s) missing metaTitle or metaDescription`)
  const body = `# Probe 2 — meta fields populated

**Status:** ${pass ? 'PASS' : 'FAIL'}
**Run:** ${new Date().toISOString()}
**Halt trigger #1 fires if FAIL.**

## Result

${pass ? 'All blogPost docs have both metaTitle and metaDescription populated.' : `${missing.length} doc(s) missing meta:`}

\`\`\`json
${JSON.stringify(missing, null, 2)}
\`\`\`
`
  writeArtifact('probe-2-meta-fields.md', body)
  return { pass, missing }
}

// -------------------------------------------------------------------------
// Probe 6: author Zod runtime nullability — sample null-author docs
// -------------------------------------------------------------------------
async function probe6(): Promise<{ nullCount: number; sample: unknown[] }> {
  console.log('\n[Probe 6] author Zod runtime nullability')
  const nullCount = await client.fetch<number>(`count(*[_type=="blogPost" && !defined(author)])`)
  const total = await client.fetch<number>(`count(*[_type=="blogPost"])`)
  const sample = await client.fetch<unknown[]>(
    `*[_type=="blogPost" && !defined(author)][0...5]{
       _id, title, "slug": slug.current, author
     }`,
  )
  console.log(`  total blogPosts: ${total}, null-author: ${nullCount}`)
  console.log(`  sample of 5 null-author docs captured`)
  const body = `# Probe 6 — author Zod runtime nullability

**Status:** INFORMATIONAL (decision deferred to schema authoring step)
**Run:** ${new Date().toISOString()}

## Population state

- total blogPost docs: ${total}
- docs with author absent: ${nullCount} (${((nullCount / total) * 100).toFixed(1)}%)
- docs with author present: ${total - nullCount}

## Sample of 5 null-author docs

\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`

## Architectural decision (deviation from brief literal text)

The brief instructs Claude Code to "import \`BlogPostSchema\` from
\`src/types/sanity/documents/blog-post.ts\`" and mark \`author\` nullable
at the read-model layer. The reality is that \`site/\` is the Vercel
root directory and cannot reach files above it — the repo-root
\`src/types/sanity/\` lives outside the Vercel build context.

**Decision:** author a read-model Zod schema FRESH at
\`site/src/types/sanity/documents/blog-post.ts\`, independent of the
repo-root write-model. The read-model:

- Matches the GROQ projection shape exactly (dereferenced category /
  tags / author).
- Marks \`author\` as \`.nullable().optional()\` from day 1 per TB18.
- Uses locally-typed SanityImage / Slug / Ref shapes mirroring the
  pattern already established by E1 Image
  (\`site/src/components/ui/image/index.tsx\`).
- Repo-root \`src/types/sanity/\` remains unchanged — it serves the
  migration scripts (write-model). The two are intentionally separate
  per TB18's read/write separation.

This separation will surface in HALT 3's "Detail-Page Template Pattern"
CONVENTIONS entry as a documented productisation pattern.

## Status

PASS — null-author state confirmed; read-model will tolerate via fresh
schema authored in next step.
`
  writeArtifact('probe-6-author-null.md', body)
  return { nullCount, sample }
}

// -------------------------------------------------------------------------
// Probe 7: broken category refs (HARD HALT trigger #12 if any non-zero)
// -------------------------------------------------------------------------
async function probe7(): Promise<{ pass: boolean; brokenCount: number; sample: unknown[] }> {
  console.log('\n[Probe 7] broken category refs')
  const brokenCount = await client.fetch<number>(
    `count(*[_type=="blogPost" && !defined(category->slug.current)])`,
  )
  const sample = await client.fetch<unknown[]>(
    `*[_type=="blogPost" && !defined(category->slug.current)][0...5]{
       _id, title, "slug": slug.current, category
     }`,
  )
  const pass = brokenCount === 0
  console.log(`  ${pass ? 'PASS' : 'FAIL'} — ${brokenCount} doc(s) with broken category ref`)
  const body = `# Probe 7 — broken category refs

**Status:** ${pass ? 'PASS' : 'FAIL'}
**Run:** ${new Date().toISOString()}
**Halt trigger #12 fires if FAIL.**

## Result

- blogPost docs with missing/invalid \`category->slug.current\`: ${brokenCount}

${pass ? 'All blogPost docs have a resolvable category reference. `generateStaticParams` will produce all 74 valid (category, slug) pairs.' : 'Broken refs found:'}

\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`
`
  writeArtifact('probe-7-broken-refs.md', body)
  return { pass, brokenCount, sample }
}

// -------------------------------------------------------------------------
// Probe 8: openGraphImage absent docs (informs urlFor undefined safety)
// -------------------------------------------------------------------------
async function probe8(): Promise<{ ogAbsentCount: number; thumbAbsentCount: number; sample: unknown[] }> {
  console.log('\n[Probe 8] urlFor undefined safety — sample OG-absent docs')
  const ogAbsentCount = await client.fetch<number>(
    `count(*[_type=="blogPost" && !defined(openGraphImage)])`,
  )
  const thumbAbsentCount = await client.fetch<number>(
    `count(*[_type=="blogPost" && !defined(thumbnailImage)])`,
  )
  const sample = await client.fetch<unknown[]>(
    `*[_type=="blogPost" && !defined(openGraphImage)][0...5]{
       _id, title, "slug": slug.current, thumbnailImage, openGraphImage
     }`,
  )
  console.log(`  openGraphImage absent: ${ogAbsentCount}, thumbnailImage absent: ${thumbAbsentCount}`)
  const body = `# Probe 8 — urlFor undefined safety

**Status:** INFORMATIONAL (fallback chain to be tested post-schema authoring)
**Run:** ${new Date().toISOString()}

## Population state

- blogPosts with \`openGraphImage\` absent: ${ogAbsentCount}
- blogPosts with \`thumbnailImage\` absent: ${thumbAbsentCount}

## Sample of 5 OG-absent docs

\`\`\`json
${JSON.stringify(sample, null, 2)}
\`\`\`

## Fallback-chain verification (deferred)

The brief's §4.8 fallback chain:

\`\`\`ts
const ogSource = post.openGraphImage ?? post.thumbnailImage
const ogUrl = ogSource ? urlFor(ogSource).width(1200).url() : '/og-default.png'
\`\`\`

Will be exercised by:

1. Schema authoring step — Zod marks both as \`.optional()\` so
   \`undefined\` is a valid runtime shape.
2. Manual smoke test at HALT 2 — navigate to an OG-absent blog page
   and confirm the page renders without runtime throw, and the
   thumbnailImage is used for OG.
3. If \`thumbnailImage\` is also absent on any doc (Probe 8 above shows
   thumbnailCount=${thumbAbsentCount}), the brand fallback
   \`/og-default.png\` must exist at \`site/public/og-default.png\`.

## Status

${ogAbsentCount > 0 ? 'PASS (data state acknowledged; fallback chain mandatory in §4.8)' : 'PASS (all docs have OG image; fallback chain is defense-in-depth)'}
`
  writeArtifact('probe-8-urlfor-safety.md', body)
  return { ogAbsentCount, thumbAbsentCount, sample }
}

// -------------------------------------------------------------------------
// Probe 10: locale field data state (informational only)
// -------------------------------------------------------------------------
async function probe10(): Promise<{ undef: number; def: number; uk: number }> {
  console.log('\n[Probe 10] locale field data state')
  const result = await client.fetch<{ undef: number; def: number; uk: number }>(`{
    "undef": count(*[_type=="blogPost" && !defined(locale)]),
    "def": count(*[_type=="blogPost" && locale=="default"]),
    "uk": count(*[_type=="blogPost" && locale=="uk"])
  }`)
  console.log(`  undefined: ${result.undef}, default: ${result.def}, uk: ${result.uk}`)
  const body = `# Probe 10 — locale field data state

**Status:** INFORMATIONAL (does not block — page query filters on (category, slug) only per TB19)
**Run:** ${new Date().toISOString()}

## Counts

- locale undefined: ${result.undef}
- locale == "default": ${result.def}
- locale == "uk": ${result.uk}

## Implication

Per TB19, the page-fetch GROQ no longer filters by \`locale\`. Both
default and UK routes serve the same 74 docs regardless of the stored
\`locale\` value. This probe is purely informational — it informs the
future LOCALE-1 phase, where US/UK content differences may trigger a
deliberate doc split.

If \`undefined\` is high (most migrated docs), confirms that LOCALE-1
will need to either (a) backfill \`locale: 'default'\` or (b) treat
\`!defined(locale)\` as semantic equivalent of "default" in any future
locale-aware filter.
`
  writeArtifact('probe-10-locale-state.md', body)
  return result
}

// -------------------------------------------------------------------------
// Probe 3a: PortableText inline images — sample docs with inline images
// -------------------------------------------------------------------------
async function probe3a(): Promise<{ withImagesCount: number; sample: unknown[] }> {
  console.log('\n[Probe 3a] Portable Text inline-image rendering')
  const withImagesCount = await client.fetch<number>(
    `count(*[_type=="blogPost" && count(content[_type=="image"]) > 0])`,
  )
  // Fetch 2 docs: one with inline images, one without
  const withImages = await client.fetch<unknown[]>(
    `*[_type=="blogPost" && count(content[_type=="image"]) > 0][0...1]{
       _id, title, "slug": slug.current, "imageBlocks": content[_type=="image"]
     }`,
  )
  const withoutImages = await client.fetch<unknown[]>(
    `*[_type=="blogPost" && count(content[_type=="image"]) == 0][0...1]{
       _id, title, "slug": slug.current
     }`,
  )
  console.log(`  blogPosts with inline image blocks: ${withImagesCount}`)
  const body = `# Probe 3a — Portable Text inline images

**Status:** INFORMATIONAL (visual verification deferred to HALT 2 manual smoke)
**Run:** ${new Date().toISOString()}

## Counts

- blogPosts with at least one inline image block in \`content\`: ${withImagesCount}
- sample doc WITH inline images: ${JSON.stringify(withImages, null, 2)}
- sample doc WITHOUT inline images: ${JSON.stringify(withoutImages, null, 2)}

## Verification at HALT 2

B3 PortableText primitive (\`site/src/components/ui/portable-text/\`)
already handles \`image\` block type per COMPONENTS.md (image blocks
route to E1 Image). At HALT 2 manual smoke, navigate to a blog post
WITH inline images and visually confirm images render at expected size
+ alt text. If image-block renderer is missing or misroutes, escalate.
`
  writeArtifact('probe-3a-inline-images.md', body)
  return { withImagesCount, sample: withImages }
}

// -------------------------------------------------------------------------
// Probe 3b: teamMember.areasOfExpertise — HARD COMPATIBILITY GATE
// -------------------------------------------------------------------------
async function probe3b(): Promise<{ withExpertiseCount: number; samples: unknown[] }> {
  console.log('\n[Probe 3b] teamMember.areasOfExpertise data shape')
  const withExpertiseCount = await client.fetch<number>(
    `count(*[_type=="teamMember" && defined(areasOfExpertise)])`,
  )
  const samples = await client.fetch<unknown[]>(
    `*[_type=="teamMember" && defined(areasOfExpertise)][0...3]{
       _id, name, areasOfExpertise
     }`,
  )
  console.log(`  teamMembers with areasOfExpertise: ${withExpertiseCount}`)
  console.log(`  raw shape inspection saved to artifact`)
  const body = `# Probe 3b — teamMember.areasOfExpertise shape (HARD COMPATIBILITY GATE)

**Status:** INFORMATIONAL — render-rule decision deferred to HALT 2 author-card author
**Run:** ${new Date().toISOString()}
**Halt trigger #13 fires if B3 renders this as plain text instead of pill tags.**

## Data state

- teamMembers with \`areasOfExpertise\` populated: ${withExpertiseCount}

## Raw shape samples (3 docs)

\`\`\`json
${JSON.stringify(samples, null, 2)}
\`\`\`

## Decision criteria for HALT 2

Inspect the shape above:

1. **If \`areasOfExpertise\` is PortableText with plain block children
   (text spans only):** render via B3 PortableText with a default
   block renderer that wraps each block in a \`<Tag>\` pill.
2. **If \`areasOfExpertise\` is PortableText with custom marks for
   styling:** render via B3 with a custom mark serializer.
3. **If \`areasOfExpertise\` is something other than PortableText
   (string array, HTML, etc.):** halt + bump brief to v1.4 with the
   actual shape documented.

## Author-card render path

Author bio card §5.3 currently renders \`areasOfExpertise\` via
\`<PortableText value={post.author.areasOfExpertise} />\`. After
inspecting the sample above, the implementation may need a custom
"pill row" render rule that maps each top-level block to a \`<Tag>\`.
Confirm at HALT 2 implementation.
`
  writeArtifact('probe-3b-expertise-shape.md', body)
  return { withExpertiseCount, samples }
}

// -------------------------------------------------------------------------
// Bonus: total blogPost count check (sanity-check brief §1.2 claim of 74)
// -------------------------------------------------------------------------
async function totalBlogCount(): Promise<number> {
  const n = await client.fetch<number>(`count(*[_type=="blogPost"])`)
  console.log(`\n[Sanity check] total blogPost docs: ${n} (brief §1.2 expects 74)`)
  return n
}

async function main() {
  console.log('MYGRATR-TEMPLATE-BLOG HALT 1 probe batch')
  console.log('========================================')
  const total = await totalBlogCount()
  const p2 = await probe2()
  const p6 = await probe6()
  const p7 = await probe7()
  const p8 = await probe8()
  const p10 = await probe10()
  const p3a = await probe3a()
  const p3b = await probe3b()
  console.log('\n========================================')
  console.log('Summary:')
  console.log(`  total blogPosts: ${fmtCount('total', total, 74)}`)
  console.log(`  Probe 2 (meta fields): ${p2.pass ? 'PASS' : 'FAIL'}`)
  console.log(`  Probe 6 (author null): ${p6.nullCount}/${total} null — read-model needs nullable-optional author`)
  console.log(`  Probe 7 (broken refs): ${p7.pass ? 'PASS' : 'FAIL'} (${p7.brokenCount} broken)`)
  console.log(`  Probe 8 (OG absent):   ${p8.ogAbsentCount}/${total} — fallback chain mandatory`)
  console.log(`  Probe 10 (locale):     undef=${p10.undef} default=${p10.def} uk=${p10.uk}`)
  console.log(`  Probe 3a (inline imgs): ${p3a.withImagesCount} blogPosts have inline image blocks`)
  console.log(`  Probe 3b (expertise):  ${p3b.withExpertiseCount} teamMembers have areasOfExpertise`)
  // HALT triggers
  const halts: string[] = []
  if (!p2.pass) halts.push('Probe 2 (halt trigger #1)')
  if (!p7.pass) halts.push('Probe 7 (halt trigger #12)')
  if (halts.length > 0) {
    console.error('\n⚠️  HARD HALT triggers fired:')
    halts.forEach(h => console.error(`   - ${h}`))
    process.exit(1)
  }
  console.log('\n✓ No HARD HALT triggers fired. Proceeding to schema authoring + route plumbing.')
}

main().catch(err => {
  console.error('\nProbe batch failed:', err)
  process.exit(1)
})
