// Migrates the Webflow `Legal pages` collection into the two legal singletons.
//
// Both pages were never migrated. /legals/privacy-policy has had a route and a
// singleton since STATIC-1, but the singleton holds only a title — its body was
// never populated, so the route correctly notFound()s and a live 200 page 404s on
// the new site. (Tech Debt #46 blamed a Zod nullability bug for this; that was
// wrong. The Zod schema is fine. There is simply no content.)
//
// /legals/general-terms had neither route nor singleton, and nothing had noticed,
// because it has no backlinks, no rankings and is absent from the sitemap.
//
// Field mapping, per the privacyPolicyPage schema description and §7.14:
//   Webflow `legals-content` (RichText, ~50KB each) -> sections[0].content
//   Webflow `meta-description`                      -> metaDescription
//   Webflow `name`                                  -> title
//
// The body becomes a single richTextSection rather than being split: it is one
// continuous legal document, and inventing section boundaries in a contract is
// not a migration decision to make casually.
//
// Run: npm run content:migrate-legal-pages
import { ensureSanity, ensureWebflow } from '@/lib/env'
import { toPortableText } from '@/lib/content/migration-helpers'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'
import { getLiveCollectionItems } from '@/lib/content/webflow-read-client'

ensureSanity()
ensureWebflow()

const LEGAL_PAGES_COLLECTION_ID = '673b0e5be824148d8429f0f4'

// Webflow slug -> Sanity singleton _id. A slug we do not recognise is a new legal
// page someone added, and it needs a schema + route, so fail loudly rather than
// migrate it into nowhere.
const SINGLETON_BY_SLUG: Record<string, string> = {
  'privacy-policy': 'privacyPolicyPage',
  'general-terms': 'generalTermsPage',
}

async function main(): Promise<void> {
  const items = await getLiveCollectionItems(LEGAL_PAGES_COLLECTION_ID)
  const errors: string[] = []
  let migrated = 0

  const unknown = items
    .map((i) => i.fieldData['slug'])
    .filter((s): s is string => typeof s === 'string' && !(s in SINGLETON_BY_SLUG))
  if (unknown.length > 0) {
    throw new Error(
      `Legal pages collection has slug(s) with no singleton: ${unknown.join(', ')}. ` +
        `Each needs a schema (studio/schemas/singletons/) and a route before it can be migrated.`,
    )
  }

  for (const item of items) {
    const f = item.fieldData
    const slug = f['slug'] as string
    const singletonId = SINGLETON_BY_SLUG[slug]

    try {
      const content = await toPortableText(f['legals-content'])
      if (!Array.isArray(content) || content.length === 0) {
        throw new Error(`legals-content produced no Portable Text blocks`)
      }

      // createIfNotExists + patch, NOT createOrReplace. privacyPolicyPage already
      // exists and may carry hero copy or meta edited in Studio; a legal body
      // migration has no business discarding it. generalTermsPage does not exist
      // at all yet, and patch alone would fail on a missing document.
      await sanityWriteClient
        .transaction()
        .createIfNotExists({ _id: singletonId, _type: singletonId })
        .patch(singletonId, (p) =>
          p.set({
            title: (f['name'] as string) ?? null,
            metaTitle: (f['name'] as string) ?? null,
            metaDescription: (f['meta-description'] as string) ?? null,
            sections: [
              {
                _key: 'legal-body',
                _type: 'richTextSection',
                content,
              },
            ],
          }),
        )
        .commit()

      migrated++
      console.log(`✓ ${singletonId}: ${content.length} block(s) from /legals/${slug}`)
    } catch (err) {
      const msg = `Failed ${singletonId} (/legals/${slug}): ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`✗ ${msg}`)
    }
  }

  await recordMigration({
    collectionSlug: 'legal-pages',
    sourceItemCount: items.length,
    migratedItemCount: migrated,
    status: errors.length === 0 ? 'complete' : 'failed',
    errorLog: errors,
  })

  console.log(`\nLegal pages: ${migrated}/${items.length} migrated. Errors: ${errors.length}`)
  if (errors.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
