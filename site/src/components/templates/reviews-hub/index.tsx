import { Fragment } from 'react'

import { BlogBand } from '@/components/blog/container'
import { SectionLabel } from '@/components/blog/section-label'
import { GlassdoorBand } from '@/components/social-proof/glassdoor-band'
import { HubHero } from '@/components/social-proof/hub-hero'
import { LogoMarquee } from '@/components/social-proof/logo-marquee'
import { ReviewCard } from '@/components/social-proof/review-card'
import { StoryCard } from '@/components/social-proof/story-card'
import Link from 'next/link'
import { env } from '@/lib/env'
import { buildLocalePath, type Locale } from '@/lib/locale'
import type { ReviewsData } from '@/lib/sanity/queries/social-proof'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'
import { UI_STRINGS } from '@/lib/ui-strings'

// Reviews hub (`/reviews`). Bespoke design (docs/raw-html/review-page.html).
//
// Section order matches the design:
//   1. Hero + trusted-by line
//   2. Trusted-by logo marquee
//   3. Six testimonial cards (grid)
//   4. "In-depth reviews from customers" + "View all stories" + 3 story cards
//   5. "What our engineers say" - Glassdoor band + 4.8/187 badge
//   6. "Read more reviews" - the remaining testimonial cards
//   7. Closing CTA - sitewide footer band, NOT built here.

const GRID_COUNT = 6

export default function ReviewsTemplate({
  data,
  locale = 'en-US',
}: {
  data: ReviewsData
  locale?: Locale
}) {
  const { hero, reviews, stories, glassdoor, marqueeLogos } = data
  const gridReviews = reviews.slice(0, GRID_COUNT)
  const moreReviews = reviews.slice(GRID_COUNT)
  const basePath = buildLocalePath('/reviews', locale)

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
          <HubHero eyebrow={hero.eyebrow} title={hero.title}>
            <p className="text-[16px] text-text-default/70">
              {UI_STRINGS['socialProof.trustedByPrefix']}{' '}
              <span className="font-semibold text-brand-primary">{UI_STRINGS['socialProof.count300']}</span>{' '}
              {UI_STRINGS['socialProof.trustedBySuffix']}
            </p>
          </HubHero>

          <LogoMarquee logos={marqueeLogos} />

          {/* 6 testimonials */}
          {gridReviews.length > 0 ? (
            <ul className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gridReviews.map((r) => (
                <li key={r._id} className="contents">
                  <ReviewCard review={r} locale={locale} />
                </li>
              ))}
            </ul>
          ) : null}

          {/* In-depth reviews (customer stories) */}
          {stories.length > 0 ? (
            <section aria-labelledby="in-depth" className="mt-24">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <SectionLabel id="in-depth">{UI_STRINGS['socialProof.inDepthHeading']}</SectionLabel>
                <Link
                  href={buildLocalePath('/customer-stories', locale)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-[#22314D] bg-[#101B30] px-4 py-2 text-[14px] font-semibold text-text-default hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
                >
                  {UI_STRINGS['socialProof.viewAllStories']}
                  <span aria-hidden="true">{UI_STRINGS['socialProof.arrow']}</span>
                </Link>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stories.map((s) => (
                  <li key={s._id} className="contents">
                    <StoryCard story={s} variant="grid" locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </BlogBand>

        {/* Glassdoor band */}
        <div className="mt-24">
          <BlogBand>
            <GlassdoorBand cards={glassdoor} />
          </BlogBand>
        </div>

        {/* Read more reviews */}
        {moreReviews.length > 0 ? (
          <BlogBand className="mt-24">
            <SectionLabel>{UI_STRINGS['socialProof.moreReviewsHeading']}</SectionLabel>
            <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {moreReviews.map((r) => (
                <li key={r._id} className="contents">
                  <ReviewCard review={r} locale={locale} />
                </li>
              ))}
            </ul>
          </BlogBand>
        ) : null}
      </main>
    </Fragment>
  )
}
