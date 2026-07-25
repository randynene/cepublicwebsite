import type { Metadata } from 'next'

import { generateCanonical, generateHreflang } from '@/lib/locale'
import { sanityFetch } from '@/lib/sanity/live'

// Schema field is `title` (heroFields on defineStaticPage) — not the
// brief's provisional name `heroHeadline`.
const HOME_HERO_QUERY = `*[_type == "homePage"][0]{ title, _id }`

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cloud Employee',
    alternates: {
      canonical: generateCanonical('/', 'en-US'),
      languages: generateHreflang('/'),
    },
  }
}

export default async function HomePage() {
  const { data } = await sanityFetch({ query: HOME_HERO_QUERY })

  // No marketing-copy fallback — empty h1 is preferable to a hardcoded
  // string with no stega payload (false-positive click-to-edit).
  return (
    <main>
      <h1 data-testid="home-hero-title">{data?.title}</h1>
    </main>
  )
}
