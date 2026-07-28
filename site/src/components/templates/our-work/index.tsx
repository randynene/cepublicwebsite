import Link from 'next/link'

import { Image } from '@/components/ui/image'
import { cn } from '@/components/ui/_utils/cn'
import { TypewriterText } from '@/components/motion/typewriter-text'
import { CardMarquee } from '@/components/social-proof/card-marquee'
import { LogoMarquee } from '@/components/social-proof/logo-marquee'
import { ReviewCard } from '@/components/social-proof/review-card'
import { StoryCard } from '@/components/social-proof/story-card'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { urlFor } from '@/lib/sanity/image'
import {
  fetchCustomerStoriesData,
  fetchOurWorkBento,
  fetchOurWorkPeoplePhotos,
  fetchReviewsData,
  GLASSDOOR_SUMMARY,
  type BentoTile,
} from '@/lib/sanity/queries/social-proof'
import { BentoVideo } from './bento-video'
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

// Curated white-on-dark logo marks (same assets Home uses). Sanity companyLogo
 // for Travelex is a filled white plate - invert turns it into a blank white
 // box. These files are the readable versions. Waya has no curated file yet.
const BENTO_LOGO_BY_SLUG: Record<
  string,
  { src: string; invert: boolean; width: number; height: number }
> = {
  virgin: { src: '/design/home/logos/virgin.png', invert: true, width: 260, height: 105 },
  travelx: { src: '/design/home/logos/travelex.png', invert: false, width: 260, height: 75 },
  'salmon-software': { src: '/design/home/logos/salmon.png', invert: true, width: 260, height: 80 },
  willo: { src: '/design/home/logos/willo.png', invert: true, width: 260, height: 80 },
  hotelplan: { src: '/design/home/logos/hotelplan.png', invert: true, width: 260, height: 55 },
}

// Shared logo chip for every bento tile - same height so Virgin / Travelex /
 // Salmon / Willo / Waya / Hotelplan read as one set.
function BentoLogoChip({ slug, fallback }: { slug: string; fallback: BentoTile['companyLogo'] }) {
  const curated = BENTO_LOGO_BY_SLUG[slug]
  const src = curated
    ? curated.src
    : fallback?.asset
      ? urlFor(fallback as Record<string, unknown>).height(96).fit('max').auto('format').url()
      : null
  if (!src) return null

  const invert = curated ? curated.invert : true
  return (
    <span className="absolute bottom-4 left-4 z-[1] flex h-[44px] items-center rounded-lg bg-[#060F1E]/85 px-4 backdrop-blur-sm">
      {/* eslint-disable-next-line @next/next/no-img-element -- curated public + Sanity CDN marks */}
      <img
        src={src}
        alt=""
        width={curated?.width ?? 200}
        height={curated?.height ?? 64}
        className={cn(
          'h-[26px] w-auto max-w-[180px] object-contain',
          invert
            ? '[filter:brightness(0)_invert(1)] opacity-100'
            : '[filter:grayscale(1)_brightness(1.8)] opacity-95',
        )}
        loading="lazy"
      />
    </span>
  )
}

function resolvePhotoUrl(imageUrl: string | undefined, fallback: { photo?: unknown } | undefined): string | undefined {
  if (imageUrl) return imageUrl
  if (!fallback?.photo || typeof fallback.photo !== 'object') return undefined
  const photo = fallback.photo as Record<string, unknown>
  if (!('asset' in photo) || !photo.asset) return undefined
  return urlFor(photo).width(900).height(900).fit('crop').auto('format').url()
}

// Striped "customer photo" placeholder, matching the reference's decorative tiles.
// A real photo (ourWorkPage slot, else a customer-story people shot) replaces the
// stripes once resolved; empty keeps the placeholder so nothing breaks.
function PhotoTile({ className, imageUrl, alt }: { className?: string; imageUrl?: string; alt?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[20px] border border-[#22314D] bg-[#101B30]', className)}>
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

// One bento tile: image (or ambient video) + logo chip, linking to the story.
// `wide` tiles span 2 columns and are the video slots (top-right + bottom-left).
function BentoCell({ tile, wide, locale }: { tile: BentoTile | null; wide: boolean; locale: Locale }) {
  const isVideo = wide && Boolean(tile?.videoUrl)
  const posterUrl = tile?.image?.asset
    ? urlFor(tile.image as Record<string, unknown>).width(1200).height(800).fit('crop').format('jpg').url()
    : undefined
  const inner = (
    <>
      {isVideo && tile?.videoUrl ? (
        <BentoVideo
          videoUrl={tile.videoUrl}
          posterUrl={posterUrl}
          title={tile.title ?? tile.companyName ?? OUR_WORK_CONTENT.impact.heading}
        />
      ) : tile?.image?.asset ? (
        <Image source={tile.image} alt="" fill sizes={wide ? SIZE_WIDE : SIZE_NARROW} className="h-full w-full object-cover" />
      ) : (
        <>
          <span aria-hidden="true" className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 10px)' }} />
          <span className="absolute left-4 top-4 font-mono text-[11px] tracking-wide text-[#7F8CA0]">{OUR_WORK_CONTENT.labels.photoPlaceholder}</span>
        </>
      )}
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/70 to-transparent" />
      {isVideo ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-[1] flex h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-primary/90 text-[18px] text-[#060F1E] shadow-[0_0_0_10px_rgba(212,255,60,0.12)]"
        >
          {GLYPH.play}
        </span>
      ) : null}
      {tile ? <BentoLogoChip slug={tile.slug} fallback={tile.companyLogo} /> : null}
    </>
  )
  const cls = cn(
    'group relative block h-[260px] overflow-hidden rounded-[20px] border border-[#22314D] bg-[#101B30] md:h-[380px]',
    wide && 'md:col-span-2',
  )
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
  const [stories, reviewsData, bento, peoplePhotos] = await Promise.all([
    fetchCustomerStoriesData(),
    fetchReviewsData(),
    fetchOurWorkBento(),
    fetchOurWorkPeoplePhotos(),
  ])
  // The hero card design overlays the company logo on the photo, so a story with no
  // logo renders as a bare name chip. Travel Tech Client is an anonymised customer
  // with no logo to show (Tech Debt #16), which is why live skips it here and runs
  // Salmon / Willo / Event Connections. /customer-stories still lists it - only this
  // logo-on-photo row requires a logo.
  const heroCards = [...(stories?.featured ?? []), ...(stories?.grid ?? [])]
    .filter((s) => s.companyLogo?.asset)
    .slice(0, 3)
  const logos = stories?.marqueeLogos ?? []
  const reviews = reviewsData?.reviews ?? []
  const ratingValue = `${GLASSDOOR_SUMMARY.rating}/5`

  // Decorative photo tiles: Studio override on ourWorkPage wins; otherwise pull
  // real customer people shots from the dataset (Willo / Salmon / …).
  const statsPhotoUrl = resolvePhotoUrl(C.statsPhoto, peoplePhotos[0])
  const beyondPhotoUrl = resolvePhotoUrl(C.beyondHiring.photo, peoplePhotos[1] ?? peoplePhotos[0])
  const beyondPhotoAlt = peoplePhotos[1]?.companyName ?? peoplePhotos[0]?.companyName ?? undefined
  const statsPhotoAlt = peoplePhotos[0]?.companyName ?? undefined

  // Bento locked to live layout (Virgin | Travelex | Salmon-video /
  // Willo-video | Waya | Hotelplan). fetchOurWorkBento returns that order.
  const bentoSlots: { tile: BentoTile | null; wide: boolean }[] = [
    { tile: bento[0] ?? null, wide: false }, // virgin
    { tile: bento[1] ?? null, wide: false }, // travelx (Travelex)
    { tile: bento[2] ?? null, wide: true }, // salmon video
    { tile: bento[3] ?? null, wide: true }, // willo video
    { tile: bento[4] ?? null, wide: false }, // waya
    { tile: bento[5] ?? null, wide: false }, // hotelplan
  ]

  return (
    <main id="main" className="overflow-x-hidden bg-[#070D18]">
      {/* 1. HERO */}
      <section className={cn(BAND, 'pt-[56px] text-center lg:pt-[80px]')}>
        <p className={EYEBROW}>{C.hero.eyebrow}</p>
        <h1 className="mx-auto mt-5 max-w-[820px] text-[38px] font-semibold leading-[1.05] tracking-[-1.6px] text-white lg:text-[58px] lg:leading-[62px] lg:tracking-[-2.2px]">
          {C.hero.titleLead} <TypewriterText segments={[{ text: C.hero.titleAccent, className: ACCENT }]} />{' '}
          {C.hero.titleRest}
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
      <section className="mt-[64px] bg-[#070D18] py-[36px]">
        <p className={cn(BAND, 'text-center text-[14px] font-medium text-[#7F8CA0]')}>
          {C.trusted.pre} <span className="font-semibold text-brand-primary">{C.trusted.highlight}</span> {C.trusted.post}
        </p>
        <div className="mt-8">
          <LogoMarquee logos={logos} showHeading={false} tone="onDark" />
        </div>
      </section>

      {/* 3. STAT STRIP */}
      <section className={cn(BAND, 'bg-[#070D18] py-[40px]')}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard stat={C.statsPrimary[0]} />
          <StatCard stat={C.statsPrimary[1]} />
          <PhotoTile className="min-h-[160px]" imageUrl={statsPhotoUrl} alt={statsPhotoAlt} />
          <StatCard stat={C.statsPrimary[2]} />
        </div>
      </section>

      {/* 4. CUSTOMER IMPACT - bento video grid (taller; videos autoplay TR + BL) */}
      <section className="mt-[24px] bg-[#070D18] py-[96px]">
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
      <section className={cn(BAND, 'bg-[#070D18] py-[72px]')}>
        <h2 className="mb-10 text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px] lg:leading-[47px] lg:tracking-[-1.5px]">
          {C.beyondHiring.headingLead} <span className={ACCENT}>{C.beyondHiring.headingAccent}</span>
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard stat={C.beyondHiring.stats1525} />
          <PhotoTile className="min-h-[160px]" imageUrl={beyondPhotoUrl} alt={beyondPhotoAlt} />
          <StatCard stat={{ value: ratingValue, lead: C.beyondHiring.rating.lead, rest: C.beyondHiring.rating.rest }} />
          <StatCard stat={C.beyondHiring.stats300} />
        </div>
      </section>

      {/* 6. WHAT THE DIFFERENCE FEELS LIKE */}
      <section className="bg-[#070D18] py-[40px]">
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

      {/* Mid CTA ("Scalable tech talent…") intentionally removed - the sitewide
          footer "They're ready to hire your next engineer" band covers the ask. */}
    </main>
  )
}
