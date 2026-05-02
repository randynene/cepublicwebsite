// One-shot diagnostic — enumerates every smoke-test doc + checks for
// production "Scaling Teams" tag/blogCategory. Read-only; no writes.
//
// Used by CONTENT-1D Step 7 manual decision flow when the brief's
// 3-doc-deletion assumption hits an unexpected reference graph or
// missing production analog.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

async function main(): Promise<void> {
  console.log('=== Smoke-test inventory ===\n')
  const allSmoke = await sanityWriteClient.fetch<
    Array<{ _id: string; _type: string; name?: string; slug?: { current?: string } }>
  >(
    `*[_id match "smoke-test-*"]{_id, _type, name, "slug": slug, "title": coalesce(name, customerStoryTitle, technologyName, nameClient, firstName, "(no label)")} | order(_type asc, _id asc)`,
  )
  for (const d of allSmoke) {
    console.log(`  ${d._id.padEnd(50)} _type=${(d._type ?? '').padEnd(16)} name=${d.name ?? '(none)'}`)
  }
  console.log(`\n  total: ${allSmoke.length} smoke-test docs\n`)

  console.log('=== smoke-test-blog-post field inspection ===\n')
  const sbp = await sanityWriteClient.fetch<unknown>(`*[_id == "smoke-test-blog-post"][0]`)
  console.log(JSON.stringify(sbp, null, 2))
  console.log('')

  console.log('=== Reference graph for the 3 in-scope smoke-test docs ===\n')
  const idsInScope = await sanityWriteClient.fetch<Array<{ _id: string }>>(
    `*[name == "scaling-teams (SMOKE TEST)" && _type == "tag"]{_id}`,
  )
  const tagId = idsInScope[0]?._id ?? '(not found)'
  console.log(`smoke-test tag _id resolved: ${tagId}`)
  for (const id of [tagId, 'smoke-test-blog-category-scaling-teams', 'smoke-test-team-member']) {
    const refs = await sanityWriteClient.fetch<
      Array<{ _id: string; _type: string }>
    >(`*[references($id)]{_id, _type}`, { id })
    console.log(`  ${id} ← referenced by: ${refs.length === 0 ? '(none)' : refs.map((r) => `${r._id}(${r._type})`).join(', ')}`)
  }
  console.log('')

  console.log('=== Production "Scaling Teams" candidates ===\n')
  const prodTagBySlug = await sanityWriteClient.fetch<
    Array<{ _id: string; name?: string; slug?: { current?: string } }>
  >(`*[_type == "tag" && slug.current == "scaling-teams"]{_id, name, slug}`)
  console.log(`tag with slug.current=="scaling-teams":`)
  for (const t of prodTagBySlug) console.log(`    ${t._id} name=${t.name}`)
  if (prodTagBySlug.length === 0) console.log('    (none)')

  const prodCategoryBySlug = await sanityWriteClient.fetch<
    Array<{ _id: string; name?: string; slug?: { current?: string } }>
  >(`*[_type == "blogCategory" && slug.current == "scaling-teams"]{_id, name, slug}`)
  console.log(`\nblogCategory with slug.current=="scaling-teams":`)
  for (const c of prodCategoryBySlug) console.log(`    ${c._id} name=${c.name}`)
  if (prodCategoryBySlug.length === 0) console.log('    (none)')

  const allBlogCategories = await sanityWriteClient.fetch<
    Array<{ _id: string; name?: string; slug?: { current?: string } }>
  >(`*[_type == "blogCategory" && !(_id match "smoke-test-*")]{_id, name, slug} | order(name asc)`)
  console.log(`\nAll real blogCategory docs (smoke-test excluded):`)
  for (const c of allBlogCategories) {
    console.log(`    ${c._id.padEnd(40)} name=${c.name?.padEnd(30) ?? ''} slug=${c.slug?.current ?? ''}`)
  }

  const allTags = await sanityWriteClient.fetch<
    Array<{ _id: string; name?: string; slug?: { current?: string }; category?: string }>
  >(`*[_type == "tag" && !(_id match "smoke-test-*") && (name match "*caling*" || slug.current match "*caling*")]{_id, name, slug, category}`)
  console.log(`\nReal tag docs matching *caling*:`)
  for (const t of allTags) {
    console.log(`    ${t._id.padEnd(40)} name=${t.name} slug=${t.slug?.current} category=${t.category}`)
  }
  if (allTags.length === 0) console.log('    (none)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
