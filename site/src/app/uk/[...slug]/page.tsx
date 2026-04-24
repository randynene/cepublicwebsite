import { notFound } from 'next/navigation'

// Scaffold placeholder for UK CMS routes. TEMPLATE-* phases replace this
// with explicit dynamic segments (/uk/[category]/[slug], /uk/services/[slug],
// etc.) that resolve docs from Sanity. Until then, all unmatched UK paths
// 404 — known UK static pages still resolve via their explicit page files.
export default async function UkCatchAll({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  await params
  notFound()
}
