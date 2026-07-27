import Link from 'next/link'

import { Spotlight } from '@/components/motion/spotlight'
import { CardMarquee } from '@/components/social-proof/card-marquee'
import { LogoMarquee } from '@/components/social-proof/logo-marquee'
import { ReviewCard } from '@/components/social-proof/review-card'
import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale'
import {
  fetchAboutUsTeam,
  fetchAboutUsValues,
  type AboutUsTeamCard,
  type AboutUsValueCard,
} from '@/lib/sanity/queries/about-us-page'
import { fetchCustomerStoriesData, fetchReviewsData } from '@/lib/sanity/queries/social-proof'

import { ABOUT_US_CONTENT, type AboutUsContent, type AuStat } from './content'

// About Us (/about-us) — D3 live structure on the dark/lime design system.
// Page chrome from aboutUsPage (passed in); team / values / reviews / logos from docs.

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
const EYEBROW = 'text-[11.5px] font-semibold uppercase tracking-[1.68px] text-brand-primary'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
const BODY = 'text-[#B8C2D1]'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const GLYPH = { arrow: '→' } as const

function PrimaryPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="sf sf-p inline-flex w-fit items-center gap-2.5 rounded-pill py-[10px] pl-[10px] pr-6 text-[15px] font-bold"
    >
      <span aria-hidden="true" className="ic flex h-8 w-8 items-center justify-center text-[14px]">
        {GLYPH.arrow}
      </span>
      <span className="c">{label}</span>
    </Link>
  )
}

function StatCard({ stat }: { stat: AuStat }) {
  return (
    <div className={cn(CARD, 'flex flex-col justify-center gap-2 p-7')}>
      <span className="text-[34px] font-bold leading-none tracking-[-1.5px] text-white lg:text-[40px]">
        {stat.value}
      </span>
      <p className={cn('text-[13px] leading-[19px]', BODY)}>{stat.label}</p>
    </div>
  )
}

function TeamCard({ member, locale }: { member: AboutUsTeamCard; locale: Locale }) {
  const href = member.slug ? buildLocalePath(`/team/${member.slug}`, locale) : undefined
  const inner = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-[#1B2A45]">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.image} alt={member.name ?? ''} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 10px)' }}
          />
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-[17px] font-semibold text-white">{member.name}</h3>
        {member.position ? <p className={cn('mt-1 text-[13px] leading-[18px]', BODY)}>{member.position}</p> : null}
        {member.timeAtCloudEmployee ? (
          <p className="mt-2 text-[12px] font-medium text-brand-primary">{member.timeAtCloudEmployee}</p>
        ) : null}
      </div>
    </>
  )
  if (!href) return <div className="block">{inner}</div>
  return (
    <Link href={href} className="group block transition-opacity hover:opacity-90">
      {inner}
    </Link>
  )
}

function ValueCard({ value }: { value: AboutUsValueCard }) {
  return (
    <div className={cn(CARD, 'flex flex-col gap-4 p-7')}>
      {value.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.image} alt="" className="h-12 w-12 object-contain" loading="lazy" />
      ) : (
        <span aria-hidden className="h-3 w-3 rounded-full bg-brand-primary" />
      )}
      <h3 className="text-[18px] font-semibold text-white">{value.name}</h3>
      {value.paragraph ? <p className={cn('text-[14px] leading-[22px]', BODY)}>{value.paragraph}</p> : null}
    </div>
  )
}

export async function AboutUsTemplate({
  locale = 'en-US',
  content = ABOUT_US_CONTENT,
}: {
  locale?: Locale
  content?: AboutUsContent
}) {
  const [team, values, reviewsData, stories] = await Promise.all([
    fetchAboutUsTeam(locale),
    fetchAboutUsValues(),
    fetchReviewsData(),
    fetchCustomerStoriesData(),
  ])
  const C = content
  const reviews = reviewsData?.reviews ?? []
  const logos = stories?.marqueeLogos ?? []

  return (
    <main id="main" className="overflow-x-hidden bg-[#070D18]">
      <section className={cn(BAND, 'pt-[56px] text-center lg:pt-[80px]')}>
        <p className={EYEBROW}>{C.hero.eyebrow}</p>
        <h1 className="mx-auto mt-5 max-w-[860px] text-[38px] font-semibold leading-[1.05] tracking-[-1.6px] text-white lg:text-[58px] lg:leading-[62px] lg:tracking-[-2.2px]">
          {C.hero.titleLead} <span className={ACCENT}>{C.hero.titleAccent}</span>
        </h1>
        <p className={cn('mx-auto mt-5 max-w-[640px] text-[16px] leading-[24px]', BODY)}>{C.hero.intro}</p>
        <div className="mt-10 flex justify-center">
          <PrimaryPill href={buildLocalePath(C.hero.ctaHref, locale)} label={C.hero.cta} />
        </div>
      </section>

      <section className="mt-[64px] py-[36px]">
        <p className={cn(BAND, 'text-center text-[14px] font-medium text-[#7F8CA0]')}>
          {C.trusted.pre} <span className="font-semibold text-brand-primary">{C.trusted.highlight}</span>{' '}
          {C.trusted.post}
        </p>
        {logos.length ? (
          <div className="mt-8">
            <LogoMarquee logos={logos} showHeading={false} />
          </div>
        ) : null}
      </section>

      <section className={cn(BAND, 'py-[40px]')}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {C.stats.map((stat) => (
            <StatCard key={`${stat.value}-${stat.label}`} stat={stat} />
          ))}
        </div>
      </section>

      {/* Cursor spotlight on the narrative, not the portrait - dimming a photo
          reads as a loading state rather than an effect. */}
      <Spotlight className="py-[72px]">
        <div className={cn(BAND, 'grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]')}>
          <div data-spot-item className="transition-opacity duration-300 motion-safe:opacity-55">
            <p className={EYEBROW}>{C.story.eyebrow}</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px] lg:leading-[47px]">
              {C.story.titleLead} <span className={ACCENT}>{C.story.titleAccent}</span>
            </h2>
            <p className={cn('mt-5 max-w-[560px] text-[16px] leading-[26px]', BODY)}>{C.story.body}</p>
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-[20px] border border-[#22314D] bg-[#1B2A45]">
            {C.founderImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={C.founderImage} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <span
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, #22314D 0 2px, transparent 2px 10px)' }}
              />
            )}
          </div>
        </div>
      </Spotlight>

      <section id="team" className="bg-gradient-to-b from-[#0A1628] to-[#0b1a30] py-[72px]">
        <div className={BAND}>
          <p className={EYEBROW}>{C.team.eyebrow}</p>
          <h2 className="mt-3 max-w-[720px] text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px]">
            {C.team.titleLead} <span className={ACCENT}>{C.team.titleAccent}</span>
          </h2>
          <p className={cn('mt-4 max-w-[620px] text-[16px] leading-[24px]', BODY)}>{C.team.intro}</p>
          {team.length ? (
            <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {team.map((m) => (
                <li key={m._id}>
                  <TeamCard member={m} locale={locale} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className={cn(BAND, 'py-[72px]')}>
        <p className={EYEBROW}>{C.values.eyebrow}</p>
        <h2 className="mt-3 max-w-[720px] text-[32px] font-semibold leading-[1.1] tracking-[-1.2px] text-white lg:text-[42px]">
          {C.values.titleLead} <span className={ACCENT}>{C.values.titleAccent}</span>
        </h2>
        <p className={cn('mt-4 max-w-[620px] text-[16px] leading-[24px]', BODY)}>{C.values.intro}</p>
        {values.length ? (
          <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <li key={v._id}>
                <ValueCard value={v} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="py-[40px]">
        <div className={cn(BAND, 'mb-8')}>
          <p className={EYEBROW}>{C.reviews.eyebrow}</p>
          <h2 className="mt-3 text-[34px] font-semibold tracking-[-1.4px] text-white lg:text-[46px] lg:leading-[52px]">
            {C.reviews.titleLead} <span className={ACCENT}>{C.reviews.titleAccent}</span>
          </h2>
        </div>
        {reviews.length ? (
          <CardMarquee
            items={reviews.map((r) => <ReviewCard key={r._id} review={r} locale={locale} />)}
            itemClassName="w-[360px]"
          />
        ) : null}
      </section>

      <section className={cn(BAND, 'py-[40px] pb-[80px]')}>
        <div
          className="overflow-hidden rounded-[24px] border border-[#22314D] p-8 lg:p-12"
          style={{ background: 'linear-gradient(115deg, #122444, #16345C)' }}
        >
          <p className={EYEBROW}>{C.midCta.eyebrow}</p>
          <h2 className="mt-4 max-w-[520px] text-[30px] font-semibold leading-[1.15] tracking-[-1.2px] text-white lg:text-[40px]">
            {C.midCta.heading}
          </h2>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <PrimaryPill href={buildLocalePath(C.midCta.ctaHref, locale)} label={C.midCta.cta} />
            <p className={cn('max-w-[260px] text-[13px] leading-[18px]', BODY)}>{C.midCta.micro}</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AboutUsTemplate
