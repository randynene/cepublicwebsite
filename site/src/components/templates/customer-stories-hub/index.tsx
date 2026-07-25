import { Fragment } from 'react'

import { BlogBand } from '@/components/blog/container'
import { SectionLabel } from '@/components/blog/section-label'
import { CardMarquee } from '@/components/social-proof/card-marquee'
import { HubHero } from '@/components/social-proof/hub-hero'
import { LogoMarquee } from '@/components/social-proof/logo-marquee'
import { ReviewCard } from '@/components/social-proof/review-card'
import { StoryCard } from '@/components/social-proof/story-card'
import { env } from '@/lib/env'
import { buildLocalePath, type Locale } from '@/lib/locale'
import type { CustomerStoriesData } from '@/lib/sanity/queries/social-proof'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'

// Customer Stories hub (`/customer-stories`). Bespoke design (docs/raw-html/
// customer-stories.html), replacing the generic renderHub.
//
// Section order matches the design:
//   1. Hero (eyebrow + accent H1)
//   2. Two featured story cards (large, side by side)
//   3. Trusted-by logo marquee
//   4. Grid of the remaining real stories
//   5. "What the difference feels like" - testimonial marquee
//   6. Closing CTA - the sitewide footer band, NOT built here.

export default function CustomerStoriesTemplate({
  data,
  locale = 'en-US',
}: {
  data: CustomerStoriesData
  locale?: Locale
}) {
  const { hero, featured, grid, marqueeLogos, testimonials } = data
  const basePath = buildLocalePath('/customer-stories', locale)

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${env.NEXT_PUBLIC_SITE_URL}${basePath}#collectionpage`,
    name: hero.title,
    description: hero.metaDescription,
    url: `${env.NEXT_PUBLIC_SITE_URL}${basePath}`,
  }

  return (
    <Fragment>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionLd) }}
      />

      <main id="main" className="pb-20 lg:pb-28">
        <BlogBand>
          <HubHero eyebrow={hero.eyebrow} title={hero.title} />

          {/* 2 featured */}
          {featured.length > 0 ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {featured.map((story, i) => (
                <li key={story._id} className="contents">
                  <StoryCard story={story} variant="featured" priority={i < 2} locale={locale} />
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-16">
            <LogoMarquee logos={marqueeLogos} />
          </div>

          {/* grid */}
          {grid.length > 0 ? (
            <ul className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {grid.map((story) => (
                <li key={story._id} className="contents">
                  <StoryCard story={story} variant="grid" locale={locale} />
                </li>
              ))}
            </ul>
          ) : null}
        </BlogBand>

        {/* "What the difference feels like" - testimonial marquee. Full-bleed so the
            row can scroll edge to edge; the heading stays in the content band. */}
        {testimonials.length > 0 ? (
          <section aria-labelledby="difference" className="mt-24">
            <BlogBand>
              <SectionLabel id="difference">{UI_STRINGS['socialProof.differenceHeading']}</SectionLabel>
            </BlogBand>
            <div className="mt-8">
              <CardMarquee
                items={testimonials.map((r) => <ReviewCard key={r._id} review={r} locale={locale} />)}
                itemClassName="w-[360px]"
              />
            </div>
          </section>
        ) : null}
      </main>
    </Fragment>
  )
}
