import type { Metadata } from 'next'
import { generateCanonical, generateHreflang } from '@/lib/locale'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cloud Employee — UK',
    alternates: {
      canonical: generateCanonical('/', 'en-GB'),
      languages: generateHreflang('/'),
    },
  }
}

export default function UkHomePage() {
  // TODO(TEMPLATE-HOME): fetch homePage singleton (en-GB locale) and render.
  return (
    <main>
      <h1>Cloud Employee — UK</h1>
      <p>Site scaffold placeholder — UK locale mirror of the homePage singleton.</p>
    </main>
  )
}
