import type { Metadata } from 'next'
import { generateCanonical, generateHreflang } from '@/lib/locale'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cloud Employee',
    alternates: {
      canonical: generateCanonical('/', 'en-US'),
      languages: generateHreflang('/'),
    },
  }
}

export default function HomePage() {
  // TODO(TEMPLATE-HOME): fetch homePage singleton and render fold sections.
  return (
    <main>
      <h1>Cloud Employee</h1>
      <p>Site scaffold placeholder — TEMPLATE-HOME will render the homePage singleton here.</p>
    </main>
  )
}
