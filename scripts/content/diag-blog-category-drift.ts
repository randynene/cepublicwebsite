// Blog posts are routed at /<category>/<slug>, so the category IS part of the
// URL. If Sanity's category disagrees with Webflow's, the post moves: the live
// URL 404s on the new site and a brand-new URL appears that nobody links to.
// That is a lost page dressed up as a working one.
//
// The parity gate caught one instance by accident. This checks all of them, by
// asking the live sitemap where each post actually lives.
//
// Read-only by default; --apply repoints the category reference to match live.
//
//   npm run content:diag-blog-categories
//   npm run content:diag-blog-categories -- --apply
import { ensureSanity } from '@/lib/env'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

ensureSanity()

const LIVE_ORIGIN = 'https://www.cloudemployee.io'
const APPLY = process.argv.includes('--apply')

type Post = { id: string; slug: string; category: string | null }

async function liveCategoryBySlug(): Promise<Map<string, string>> {
  const res = await fetch(`${LIVE_ORIGIN}/sitemap.xml`)
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`)
  const xml = await res.text()

  // Blog URLs are /<category>/<slug>. Two segments, and the first is not one of
  // the known non-blog namespaces. Keep the default locale only; /uk mirrors the
  // same category, so checking it twice adds nothing.
  const NON_BLOG = new Set([
    'services', 'technology', 'team', 'reviews', 'videos', 'tools', 'downloads',
    'download', 'compare', 'customer-story', 'customer-stories', 'book-a-call',
    'events', 'legals', 'uk', 'ph', 'archive', 'live-job-role', 'start-hiring',
    'salesforce', 'ui-ux', 'talents', 'hire', 'media', 'industry-guide', 'resources',
  ])

  const map = new Map<string, string>()
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = new URL(match[1]).pathname.replace(/\/$/, '')
    const parts = path.split('/').filter(Boolean)
    if (parts.length !== 2) continue
    const [category, slug] = parts
    if (NON_BLOG.has(category)) continue
    map.set(slug, category)
  }
  return map
}

async function main(): Promise<void> {
  const live = await liveCategoryBySlug()
  const posts = await sanityWriteClient.fetch<Post[]>(
    `*[_type == "blogPost" && !(retired == true) && defined(slug.current)]{
       "id": _id, "slug": slug.current, "category": category->slug.current
     }`,
  )

  console.log(`${posts.length} routable blog posts in Sanity; ${live.size} blog URLs in the live sitemap.\n`)

  const mismatched: Array<Post & { liveCategory: string }> = []
  const notInSitemap: Post[] = []

  for (const post of posts) {
    const liveCategory = live.get(post.slug)
    if (!liveCategory) {
      notInSitemap.push(post)
      continue
    }
    if (post.category !== liveCategory) {
      mismatched.push({ ...post, liveCategory })
    }
  }

  if (mismatched.length > 0) {
    console.log(`${mismatched.length} post(s) would move to a DIFFERENT URL:\n`)
    for (const m of mismatched) {
      console.log(`  ${m.slug}`)
      console.log(`    live:   /${m.liveCategory}/${m.slug}`)
      console.log(`    sanity: /${m.category}/${m.slug}   <- would 404 the live URL`)
      console.log(`    fix:    set category to "${m.liveCategory}"  (${m.id})`)
    }
    console.log()
  }

  if (notInSitemap.length > 0) {
    console.log(
      `${notInSitemap.length} post(s) are not in the live sitemap (cannot verify category; ` +
        `may be excluded from the sitemap rather than missing):`,
    )
    for (const p of notInSitemap) console.log(`  /${p.category}/${p.slug}`)
    console.log()
  }

  if (mismatched.length === 0) {
    console.log('No category drift. Every routable post keeps its live URL.')
    return
  }

  if (!APPLY) {
    console.log('Dry run. Re-run with --apply to repoint these to the live category.')
    process.exit(1)
  }

  // Resolve the target category documents by slug before writing anything: a
  // category slug with no blogCategory document would otherwise write a dangling
  // reference and 404 the post just as thoroughly as the wrong category did.
  const wanted = [...new Set(mismatched.map((m) => m.liveCategory))]
  const categories = await sanityWriteClient.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type == "blogCategory" && slug.current in $slugs]{ _id, "slug": slug.current }`,
    { slugs: wanted },
  )
  const idBySlug = new Map(categories.map((c) => [c.slug, c._id]))

  const unresolved = wanted.filter((s) => !idBySlug.has(s))
  if (unresolved.length > 0) {
    console.error(`No blogCategory document for: ${unresolved.join(', ')}. Aborting.`)
    process.exit(1)
  }

  const tx = sanityWriteClient.transaction()
  for (const m of mismatched) {
    tx.patch(m.id, (p) =>
      p.set({ category: { _type: 'reference', _ref: idBySlug.get(m.liveCategory) as string } }),
    )
  }
  await tx.commit()

  console.log(`Repointed ${mismatched.length} post(s) to their live category.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
