import type { Metadata } from 'next'

import { ServicesHubTemplate } from '@/components/templates/services-hub'
import { CatalogueJsonLd } from '@/components/templates/catalogue/json-ld'
import { mapServicesHubData } from '@/lib/catalogue/hub-content'
import { fetchServicesHubData } from '@/lib/sanity/queries/catalogue-hub'
import { generateCanonical, generateHreflang } from '@/lib/locale'

const TITLE = 'Staff Augmentation Services'

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchServicesHubData()
  const content = mapServicesHubData(data)
  return {
    title: data.hub?.metaTitle ? { absolute: data.hub.metaTitle } : TITLE,
    description: data.hub?.metaDescription ?? content.hero.lead,
    alternates: { canonical: generateCanonical('/services', 'en-GB'), languages: generateHreflang('/services') },
  }
}

export default async function ServicesHubUkPage() {
  const content = mapServicesHubData(await fetchServicesHubData())
  return (
    <>
      <CatalogueJsonLd locale="en-GB" path="/services" title={TITLE} description={content.hero.lead} faqs={content.faqs} />
      <ServicesHubTemplate content={content} pathPrefix="/uk" />
    </>
  )
}
