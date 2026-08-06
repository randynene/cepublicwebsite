/**
 * CE-33 - "Delete ship your product", and clear the stale-draft landmine behind it.
 *
 * Seb deleted the second line of the `included.you` heading in Studio and could not
 * publish, because `drafts.homePage` carried one validation error: a 180-character
 * meta description against a hard 140-160 rule. Sanity blocks publish on ANY error
 * in the document, so a length rule held an unrelated copy edit hostage. The rule is
 * now a warning (studio/schemas/_shared.ts).
 *
 * The draft could not simply be published. It was last touched 3 Aug 17:18; the
 * published document was patched by our own scripts on 4 Aug 06:35, so the draft is
 * 13 hours STALE and publishing it would have silently reverted three shipped fixes:
 *   - the whole hero profile roster (29 paths - Gabriel K. / Brazil back to Grace O.)
 *   - realEngineers.profiles[3].flag, undoing patch-home-grace-colombia.ts
 *   - trustedBy.logos[7], DELETING the Vector logo added by patch-add-vector-logo.ts
 *
 * So we apply Seb's one intended edit directly to the published document, then reset
 * the draft to published state carrying only his other deliberate change (the meta
 * description rewrite) so it is his to accept or discard, and can no longer destroy
 * anything.
 */
import { createClient } from '@sanity/client'
import { config } from 'dotenv'

config()

const client = createClient({
  projectId: 'lzbhll1u',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_MIGRATION_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const EXPECTED = 'Run your team.\nShip your product.'
const INTENDED = 'Run your team.'

async function main() {
  const published = await client.getDocument('homePage')
  if (!published) throw new Error('homePage not found')

  const current = (published as Record<string, any>).included?.you?.heading
  if (current === INTENDED) {
    console.log('Already applied - included.you.heading is already the intended value.')
  } else if (current !== EXPECTED) {
    throw new Error(
      `Refusing to patch: included.you.heading is ${JSON.stringify(current)}, expected ${JSON.stringify(EXPECTED)}`,
    )
  } else {
    await client.patch('homePage').set({ 'included.you.heading': INTENDED }).commit()
    console.log(`Patched published homePage: included.you.heading -> ${JSON.stringify(INTENDED)}`)
  }

  const draft = await client.getDocument('drafts.homePage')
  if (!draft) {
    console.log('No draft present - nothing to reset.')
    return
  }

  const sebMetaDescription = (draft as Record<string, any>).metaDescription
  const fresh = await client.getDocument('homePage')
  const rebuilt: Record<string, any> = {
    ...(fresh as Record<string, any>),
    _id: 'drafts.homePage',
    metaDescription: sebMetaDescription,
  }
  delete rebuilt._rev
  delete rebuilt._updatedAt
  delete rebuilt._createdAt
  delete rebuilt._system

  await client.createOrReplace(rebuilt as never)
  console.log("Draft reset to published state, retaining only Seb's meta description rewrite.")
  console.log(`  metaDescription (${sebMetaDescription?.length} chars): ${sebMetaDescription}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
