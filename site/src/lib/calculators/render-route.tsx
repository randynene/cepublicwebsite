import 'server-only'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PriceComparisonCalculator } from '@/components/templates/price-comparison-calculator/calculator'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/breadcrumbs'
import { Container } from '@/components/ui/container'
import { FaqList } from '@/components/ui/faq-list'
import { Heading } from '@/components/ui/heading'
import { PortableText } from '@/components/ui/portable-text'
import { Text } from '@/components/ui/text'
import { buildLocalePath, generateCanonical, generateHreflang, type Locale } from '@/lib/locale'
import {
  fetchCalculatorPage,
  type CalculatorPageId,
} from '@/lib/sanity/queries/calculator-page'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { FaqItem } from '@/types/sanity/shared'
import { toPlainText } from '@portabletext/toolkit'

// Shared metadata + render for the calculator pages, so the two locales cannot
// drift apart on canonicals, hreflang or breadcrumbs.

type PortableValue = Parameters<typeof PortableText>[0]['value']

export async function buildCalculatorMetadata(
  id: CalculatorPageId,
  usPath: string,
  locale: Locale,
): Promise<Metadata> {
  const page = await fetchCalculatorPage(id)
  if (!page) return {}

  const title = page.metaTitle ?? page.title
  const description = page.metaDescription ?? undefined
  const canonical = generateCanonical(usPath, locale)

  // Live marks /price-comparison-calculator noindex. That looks like an oversight
  // and is not: the canonical copy of this tool is /tools/price-comparison-calculator,
  // and CE are declining to compete with themselves for it. Mirrored, not "fixed" -
  // deciding on their behalf that they want both copies in the index is not a
  // migration's job.
  const noindex = id === 'priceComparisonCalculatorPage'

  return {
    title,
    ...(description ? { description } : {}),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical, languages: generateHreflang(usPath) },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description ? { description } : {}),
    },
  }
}

export async function renderCalculatorPage(
  id: CalculatorPageId,
  usPath: string,
  locale: Locale,
  breadcrumbName: string,
) {
  const page = await fetchCalculatorPage(id)
  if (!page) notFound()

  const rates = page.rates ?? []
  const faqs = (page.faqs ?? []) as FaqItem[]

  // A calculator with no rate card is not a calculator. Rendering the shell with
  // an empty table would put a broken pricing tool in front of a customer, which is
  // worse than the page not being there: it is confidently wrong, in public, about
  // money.
  if (rates.length === 0) notFound()

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: buildLocalePath('/', locale) },
    { name: breadcrumbName, href: buildLocalePath(usPath, locale) },
  ]

  // The UK page opens on the UK rate card, as the live page does.
  const defaultRegion = locale === 'en-GB' ? 'uk' : 'usa'

  const faqLd =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.slice(0, 10).map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: toPlainText(faq.answer ?? []) },
          })),
        }
      : null

  return (
    <main id="main">
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }}
        />
      ) : null}

      <Container as="div" className="pb-16 pt-8 lg:pb-24 lg:pt-12">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <header className="mb-10 flex flex-col gap-4 lg:mb-12">
          {page.eyebrow ? (
            <Text
              as="p"
              size="small"
              className="uppercase tracking-wider text-brand-primary font-medium"
            >
              {page.eyebrow}
            </Text>
          ) : null}

          <Heading as="h1" size="hero">{page.title}</Heading>

          {page.heroDescription && page.heroDescription.length > 0 ? (
            <div className="max-w-prose text-text-default/80">
              <PortableText value={page.heroDescription as PortableValue} />
            </div>
          ) : null}
        </header>

        <PriceComparisonCalculator rates={rates} defaultRegion={defaultRegion} />

        {page.belowCalculatorContent && page.belowCalculatorContent.length > 0 ? (
          <section className="mt-16 max-w-prose lg:mt-20">
            <PortableText value={page.belowCalculatorContent as PortableValue} />
          </section>
        ) : null}

        {faqs.length > 0 ? (
          <section aria-labelledby="calculator-faqs" className="mt-16 lg:mt-20">
            <Heading id="calculator-faqs" as="h2" className="mb-8">
              {UI_STRINGS['hub.faqHeading']}
            </Heading>
            <FaqList items={faqs} className="max-w-3xl" />
          </section>
        ) : null}
      </Container>
    </main>
  )
}
