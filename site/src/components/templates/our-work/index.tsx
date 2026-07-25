import Link from 'next/link'

import { Image } from '@/components/ui/image'
import { cn } from '@/components/ui/_utils/cn'
import { CardMarquee } from '@/components/social-proof/card-marquee'
import { LogoMarquee } from '@/components/social-proof/logo-marquee'
import { ReviewCard } from '@/components/social-proof/review-card'
import { StoryCard } from '@/components/social-proof/story-card'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchCustomerStoriesData,
  fetchOurWorkBento,
  fetchReviewsData,
  GLASSDOOR_SUMMARY,
  type BentoTile,
} from '@/lib/sanity/queries/social-proof'
import { OUR_WORK_CONTENT, type OurWorkContent, type OwStat } from './content'

// Our Work page (/our-work). 1:1 with docs/raw-html/Our Work.html. Its own
// top-level page, separate from /customer-stories. Header, footer and the closing
// "Ready to hire" CTA come from the shared layout/footer - not built here.
// Every image/logo resolves from its own Sanity document field.

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
const EYEBROW = 'text-[11.5px] font-semibold uppercase tracking-[1.68px] text-brand-primary'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
const BODY = 'text-[#B8C2D1]'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const GLYPH = { star: '★', arrow: '→', play: '▶' } as const
const SIZE_WIDE = '(min-width: 768px) 50vw, 100vw'
const SIZE_NARROW = '(min-width: 768px) 25vw, 100vw'

// Striped "customer photo" placeholder, matching the reference's decorative tiles.
// A real photo (from the ourWorkPage singleton, an optional image slot) replaces the
// stripes once Seb uploads one; empty keeps the placeholder so nothing breaks.
function PhotoTile({ className, imageUrl, alt }: { className?: string; imageUrl?: string; alt?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[20px] border border-[#22314D] bg-[#1B2A45]', className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt ?? ''} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <>
          <span aria-hidden="true" className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 10px)' }} />
          <span className="absolute left-4 top-4 font-mono text-[11px] tracking-wide text-[#7F8CA0]">{OUR_WORK_CONTENT.labels.photoPlaceholder}</span>
        </>
      )}
    </div>
  )
}

// Big-number stat with lime star + caption (lead word in lime).
function StatCard({ stat }: { stat: OwStat }) {
  return (
    <div className={cn(CARD, 'flex flex-col justify-center gap-3 p-7')}>
      <span aria-hidden="true" className="text-[14px] text-brand-primary">{GLYPH.star}</span>
      <span className="whitespace-nowrap text-[34px] font-bold leading-none tracking-[-1.5px] text-white lg:text-[40px]">{stat.value}</span>
      <p className={cn('text-[13px] leading-[19px]', BODY)}>
        <span className="font-semibold text-brand-primary">{stat.lead}</span>
        {stat.rest}
      </p>
    </div>
  )
}

function PrimaryPill({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="sf sf-p inline-flex w-fit items-center gap-2.5 rounded-pill py-[10px] pl-[10px] pr-6 text-[15px] font-bold">
      <span aria-hidden="true" className="ic flex h-8 w-8 items-center justify-center text-[14px]">{GLYPH.arrow}</span>
      <span className="c">{label}</span>
    </Link>
  )
}

// One bento tile: image (or placeholder) + logo chip + optional play button, linking
// to the story. `wide` tiles span 2 columns and are the video slots.
function BentoCell({ tile, wide, locale }: { tile: BentoTile | null; wide: boolean; locale: Locale }) {
  const logo = tile?.companyLogo?.asset ? tile.companyLogo : null
  const isVideo = wide && Boolean(tile?.videoUrl)
  const inner = (
    <>
      {tile?.image?.asset ? (
        <Image source={tile.image} alt="" fill sizes={wide ? SIZE_WIDE : SIZE_NARROW} className="h-full w-full object-cover" />
      ) : (
        <>
          <span aria-hidden="true" className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 10px)' }} />
          <span className="absolute left-4 top-4 font-mono text-[11px] tracking-wide text-[#7F8CA0]">{OUR_WORK_CONTENT.labels.photoPlaceholder}</span>
        </>
      )}
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/70 to-transparent" />
      {isVideo ? (
        <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-primary text-[18px] text-[#060F1E]">
          {GLYPH.play}
        </span>
      ) : null}
      {logo ? (
        <span className="absolute bottom-4 left-4 flex h-[24px] items-center rounded-md bg-[#060F1E]/70 px-2.5 backdrop-blur-sm">
          <img src={urlFor(logo as Record<string, unknown>).height(48).fit('max').url()} alt="" className="h-[16px] w-auto object-contain opacity-90 [filter:brightness(0)_invert(1)]" loading="lazy" />
        </span>
      ) : null}
    </>
  )
  const cls = cn('group relative block h-[220px] overflow-hidden rounded-[20px] border border-[#22314D] bg-[#1B2A45] md:h-[300px]', wide && 'md:col-span-2')
  return tile ? (
    <Link href={buildLocalePath(`/customer-stories/${tile.slug}`, locale)} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export async function OurWorkTemplate({
  locale = 'en-US',
  content = OUR_WORK_CONTENT,
}: {
  locale?: Locale
  content?: OurWorkContent
}) {
  const C = content
  const [stories, reviewsData, bento] = await Promise.all([fetchCustomerStoriesData(), fetchReviewsData(), fetchOurWorkBento()])
  const heroCards = [...(stories?.featured ?? []), ...(stories?.grid ?? [])].slice(0, 3)
  const logos = stories?.marqueeLogos ?? []
  const reviews = reviewsData?.reviews ?? []
  const ratingValue = `${GLASSDOOR_SUMMARY.rating}/5`

  // Bento: 2 wide video slots + 4 narrow image slots. Videos flagged by videoUrl,
  // never hardcoded. Fill remaining slots gracefully; never duplicate a doc.
  const vids = bento.filter((t) => t.videoUrl)
  const imgs = bento.filter((t) => !t.videoUrl)
  const wide = [vids[0] ?? null, vids[1] ?? null]
  const narrowPool = [...imgs, ...vids.slice(2)]
  const narrow = [0, 1, 2, 3].map((i) => narrowPool[i] ?? null)
  const bentoSlots: { tile: BentoTile | null; wide: boolean }[] = [
    { tile: narrow[0], wide: false },
    { tile: narrow[1], wide: false },
    { tile: wide[0], wide: true },
    { tile: wide[1], wide: true },
    { tile: narrow[2], wide: false },
    { tile: narrow[3], wide: false },
  ]

  return (
    <main id="main" className="overflow-x-hidden bg-[#070D18]">
      {/* 1. HERO */}
      <section className={cn(BAND, 'pt-[56px] text-center lg:pt-[80px]')}>
        <p className={EYEBROW}>{C.hero.eyebrow}</p>
        <h1 className="mx-auto mt-5 max-w-[820px] text-[38px] font-semibold leading-[1.05] tracking-[-1.6px] text-white lg:text-[58px] lg:leading-[62px] lg:tracking-[-2.2px]">
          {C.hero.titleLead} <span className={ACCENT}>{C.hero.titleAccent}</span> {C.hero.titleRest}
        </h1>
        <p className={cn('mx-auto mt-5 max-w-[620px] text-[16px] leading-[24px]', BODY)}>{C.hero.intro}</p>
        <ul className="mt-12 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          {heroCards.map((s) => (
            <li key={s._id} className="contents">
              <StoryCard story={s} locale={locale} />
            </li>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <PrimaryPill href={buildLocalePath(C.hero.ctaHref, locale)} label={C.hero.cta} />
        </div>
      </section>

      {/* 2. TRUSTED BY */}
      <section className="mt-[64px] py-[36px]">
        <p className={cn(BAND, 'text-center text-[14px] font-medium text-[#7F8CA0]')}>
          {C.trusted.pre} <span className="font-semibold text-brand-primary">{C.trusted.highlight}</span> {C.trusted.post}
        </p>
        <div className="mt-8">
          <LogoMarquee logos={logos} showHeading={false} />
        </div>
      </section>

      {/* 3. STAT STRIP */}
      <section className={cn(BAND, 'py-[40px]')}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard stat={C.statsPrimary[0]} />
          <StatCard stat={C.statsPrimary[1]} />
          <PhotoTile className="min-h-[160px]" imageUrl={C.statsPhoto} />
          <StatCard stat={C.statsPrimary[2]} />
        </div>
      </section>

      {/* 4. CUSTOMER IMPACT - bento video grid */}
      <section className="mt-[24px] bg-gradient-to-b from-[#0A1628] to-[#0b1a30] py-[72px]">
        <div className={BAND}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={EYEBROW}>{C.impact.eyebrow}</p>
              <h2 className="mt-3 max-w-[560px] text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px] lg:leading-[47px] lg:tracking-[-1.5px]">{C.impact.heading}</h2>
            </div>
            <Link href={buildLocalePath(C.impact.ctaHref, locale)} className="inline-flex items-center gap-2 rounded-pill border border-[#32435F] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:border-brand-primary/60">
              <span aria-hidden="true" className="text-brand-primary">{GLYPH.arrow}</span>
              {C.impact.cta}
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-4">
            {bentoSlots.map((slot, i) => (
              <BentoCell key={slot.tile?._id ?? `slot-${i}`} tile={slot.tile} wide={slot.wide} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. IMPACT BEYOND HIRING */}
      <section className={cn(BAND, 'py-[72px]')}>
        <h2 className="mb-10 text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px] lg:leading-[47px] lg:tracking-[-1.5px]">
          {C.beyondHiring.headingLead} <span className={ACCENT}>{C.beyondHiring.headingAccent}</span>
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard stat={C.beyondHiring.stats1525} />
          <PhotoTile className="min-h-[160px]" imageUrl={C.beyondHiring.photo} />
          <StatCard stat={{ value: ratingValue, lead: C.beyondHiring.rating.lead, rest: C.beyondHiring.rating.rest }} />
          <StatCard stat={C.beyondHiring.stats300} />
        </div>
      </section>

      {/* 6. WHAT THE DIFFERENCE FEELS LIKE */}
      <section className="py-[40px]">
        <div className={cn(BAND, 'mb-8')}>
          <p className={EYEBROW}>{C.reviews.eyebrow}</p>
          <h2 className="mt-3 text-[34px] font-semibold tracking-[-1.4px] text-white lg:text-[46px] lg:leading-[52px] lg:tracking-[-1.6px]">
            {C.reviews.headingLead} <span className={ACCENT}>{C.reviews.headingAccent}</span> {C.reviews.headingRest}
          </h2>
        </div>
        {reviews.length ? (
          <CardMarquee items={reviews.map((r) => <ReviewCard key={r._id} review={r} locale={locale} />)} itemClassName="w-[360px]" />
        ) : null}
      </section>

      {/* 7. MID CTA CARD */}
      <section className={cn(BAND, 'py-[40px]')}>
        <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[24px] border border-[#22314D] p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12" style={{ background: 'linear-gradient(115deg, #122444, #16345C)' }}>
          <div>
            <p className={EYEBROW}>{C.midCta.eyebrow}</p>
            <h2 className="mt-4 max-w-[420px] text-[30px] font-semibold leading-[1.15] tracking-[-1.2px] text-white lg:text-[40px] lg:tracking-[-1.4px]">{C.midCta.heading}</h2>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <PrimaryPill href={buildLocalePath(C.midCta.ctaHref, locale)} label={C.midCta.cta} />
              <p className={cn('max-w-[220px] text-[13px] leading-[18px]', BODY)}>{C.midCta.micro}</p>
            </div>
          </div>
          <PhotoTile className="hidden min-h-[240px] lg:block" imageUrl={C.midCta.photo} />
        </div>
      </section>
    </main>
  )
}
