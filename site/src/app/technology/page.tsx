import type { Metadata } from 'next'

import { TechnologyHubTemplate } from '@/components/templates/technology-hub'
import { CatalogueJsonLd } from '@/components/templates/catalogue/json-ld'
import { mapTechnologyHubData } from '@/lib/catalogue/hub-content'
import { fetchTechnologyHubData } from '@/lib/sanity/queries/catalogue-hub'
import { generateCanonical, generateHreflang } from '@/lib/locale'

const TITLE = 'Technologies we build with'

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchTechnologyHubData()
  const content = mapTechnologyHubData(data)
  return {
    title: data.hub?.metaTitle ? { absolute: data.hub.metaTitle } : TITLE,
    description: data.hub?.metaDescription ?? content.hero.lead,
    alternates: { canonical: generateCanonical('/technology', 'en-US'), languages: generateHreflang('/technology') },
  }
}

export default async function TechnologyHubPage() {
  const content = mapTechnologyHubData(await fetchTechnologyHubData())
  return (
    <>
      <CatalogueJsonLd locale="en-US" path="/technology" title={TITLE} description={content.hero.lead} faqs={content.faqs} />
      <TechnologyHubTemplate content={content} />
    </>
  )
}
