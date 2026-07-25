import type { Metadata } from 'next'

import { HiringCostCalculator } from '@/components/templates/hiring-cost-calculator/calculator'
import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { generateCanonical, generateHreflang } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'

// /hiring-cost-calculator
//
// The widget /pricing embeds. On the live site it is a bare page with no header and
// no footer, because it is loaded into an iframe - so it has no H1 either, and it is
// thin on its own.
//
// Rebuilt as a real component rather than an iframe target. When /pricing is
// redesigned it should render <HiringCostCalculator /> directly: an iframe pointing
// at our own site, to load our own component, would be a page inside a page for no
// reason. This route exists because the URL is live and in the corpus, and dropping
// a live URL is the one thing the migration must not do.
//
// The model is verified against CE's live widget on every run of
// `npm run verify:hiring-cost`: 900 figures across 4 company regions, 3 talent
// regions, 5 currencies and 5 headcounts, including the 50-developer clamp.

export async function generateMetadata(): Promise<Metadata> {
  const title = UI_STRINGS['hiringCost.pageTitle']
  const description = UI_STRINGS['hiringCost.pageDescription']
  return {
    title,
    description,
    alternates: {
      canonical: generateCanonical('/hiring-cost-calculator', 'en-US'),
      languages: generateHreflang('/hiring-cost-calculator'),
    },
  }
}

export default function HiringCostCalculatorPage() {
  return (
    <main id="main">
      <Container as="div" className="pb-16 pt-8 lg:pb-24 lg:pt-12">
        <Heading as="h1" className="mb-8">
          {UI_STRINGS['hiringCost.pageTitle']}
        </Heading>
        <HiringCostCalculator />
      </Container>
    </main>
  )
}
