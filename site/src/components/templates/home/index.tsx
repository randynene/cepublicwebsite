import type { ReactNode } from 'react'
import Image from 'next/image'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { Marquee } from '@/components/ui/marquee'
import { cn } from '@/components/ui/_utils/cn'
import { Reveal } from '@/components/motion/reveal'
import { CountUp } from '@/components/motion/count-up'
import { TypewriterText } from '@/components/motion/typewriter-text'
import { Spotlight } from '@/components/motion/spotlight'
import { ChatLink } from '@/components/shared/chat-link'
import { FaqChatCard } from '@/components/shared/faq-chat-card'
import { ClientLogoImage } from '@/components/social-proof/client-logo-strip'
import { HeroTrustBar } from '@/components/social-proof/hero-trust-bar'
import { CHAT_FALLBACK_HREF, CHAT_HREF } from '@/lib/chat'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'

import {
  HERO_PROFILE_CARD_PEOPLE,
  HOME_CONTENT,
  HOME_PROCESS_VIDEO_URL,
  toProfileCardPeople,
  type HomeContent,
  type HomeReason,
} from './content'
import { ProfileCard } from './profile-card'
import { HomeCalculatorCard } from './calculator-card'
import { ClientStorySection } from './client-story'
import { ProcessVideo } from './process-video'
import { WhereWeWork } from './where-we-work'

// TEMPLATE-HOME — faithful reproduction of "Cloud Employee Home DARK V2"
// (docs/raw-html/Home.html + docs/raw-html-pdf/Home Page.pdf). Dark ground
// #070D18, lime accent #D4FF3C, elevated card #101B30 / border #22314D.
// White headings are Inter semibold 600; lime accent word only is Source
// Serif 4 italic. Photos + logos are extracted from the export bundle
// (site/public/design/home/*). All copy comes from HOME_CONTENT (no JSX
// string literals). Interactive-looking widgets are STATIC.

const BAND = 'mx-auto w-full max-w-[1440px] px-[22px] sm:px-[32px] lg:px-[64px]'
/** Hero content grid. Now the same 1440px band as the rest of the page (and as
 *  the service and location pages) — the old 1360px made the hero and the logo
 *  bar sit narrower than everything under them. */
const HERO_BAND = BAND
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const EYEBROW =
  'text-[12px] font-semibold uppercase leading-[18.6px] tracking-[1.68px] text-brand-primary'
const MUTED = 'text-[#7F8CA0]'

// White display headings = Inter semibold. Only lime accent words = font-serif italic.
const H1 =
  'text-[42px] font-semibold leading-[1.05] tracking-[-2px] text-white lg:text-[58px] lg:leading-[62px] lg:tracking-[-2.5px]'
const H2 =
  'text-[34px] font-semibold leading-[1.05] tracking-[-1.3px] text-white lg:text-[56px] lg:tracking-[-1.7px]'
const ACCENT = 'font-serif font-normal italic text-brand-primary'

const GLYPH = {
  arrow: '\u2192',
  check: '\u2713',
  quote: '\u201C',
  play: '\u25B6',
  plus: '+',
  bolt: '\u26A1',
  clock: '\u25F7',
} as const

// "by " prefix before the accent word in the H1 — pulled out to a const
// (rather than a raw JSX string) to satisfy the UI_STRINGS jsx-no-literals
// gate; pre-existing lint error fixed while touching this function.
const BY_PREFIX = 'by '

// Each section receives the resolved content (Sanity-backed, or the static
// HOME_CONTENT fallback) from HomeTemplate. Keeps every string a rendered
// expression (UI_STRINGS gate) while sourcing the data from Sanity.
type SectionProps = { content: HomeContent }

function Eyebrow({ children }: { children: string }) {
  return <p className={EYEBROW}>{children}</p>
}


// #5 — ReasonIcon accepts a size prop so the lead card gets a larger tile
// (56×56, 16px radius, 28px glyph) and secondary cards get the tighter tile
// (48×48, 14px radius, 22px glyph). shrink-0 keeps tiles square in flex rows.
function ReasonIcon({
  icon,
  size = 'sm',
}: {
  icon: HomeReason['icon']
  size?: 'lg' | 'sm'
}) {
  const paths: Record<HomeReason['icon'], ReactNode> = {
    spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-5.4 6-10a6 6 0 10-12 0c0 4.6 6 10 6 10z" />
        <circle cx="12" cy="11" r="2.2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  }
  const isLg = size === 'lg'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-brand-primary text-[#060F1E]',
        isLg ? 'h-[56px] w-[56px] rounded-[16px]' : 'h-[48px] w-[48px] rounded-[14px]',
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width={isLg ? 28 : 22}
        height={isLg ? 28 : 22}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {paths[icon]}
      </svg>
    </span>
  )
}

function Hero({ content }: SectionProps) {
  const { hero } = content
  // Prefer Sanity/HOME_CONTENT hero.profiles; fall back to the static slideshow
  // constant when profiles are missing or incomplete (< 2 people).
  const slideshow =
    toProfileCardPeople(hero.profiles) ?? HERO_PROFILE_CARD_PEOPLE
  // The mobile single-photo fallback shows the same lead person as the
  // desktop auto-cycling card — see profile-card.tsx.
  const mainProfile = slideshow[0]
  return (
    // Top 120px matches the reference; bottom stays tighter so the logo bar
    // sits cleanly under the card stack (py-120 on both sides left a dead gap).
    //
    // `home-hero` (globals.css) makes the section fill exactly the first screen
    // on desktop and steps the headline and card down on short viewports, which
    // is what zooming in produces. Seb's requirement from the 28 Jul review:
    // whatever the zoom level, the first screen is the headline and the photo.
    <section className="home-hero bg-[#070D18] pb-[72px] pt-[88px] lg:pb-[80px] lg:pt-[120px]">
      <div className={cn(HERO_BAND, 'grid items-center gap-[64px] lg:grid-cols-[1.05fr_1fr]')}>
        {/* Left: text stack */}
        <div>
          {/* Eyebrow: lime semi-transparent bg + border, glowing dot */}
          <span
            className="inline-flex items-center gap-[8px] rounded-full border px-[20px] py-[7px] text-[11.5px] font-bold uppercase leading-none tracking-[0.92px] text-brand-primary"
            style={{
              background: 'rgba(212,255,60,0.12)',
              borderColor: 'rgba(212,255,60,0.24)',
            }}
          >
            <span
              aria-hidden
              className="h-[6px] w-[6px] rounded-full bg-brand-primary"
              style={{ boxShadow: '0 0 8px #D4FF3C' }}
            />
            {hero.eyebrow}
          </span>
          {/* C — "by engineers" on its own line via explicit <br/>; the
              typewriter runs only on the final accent word "engineers". */}
          <h1 className={cn('mt-[22px]', H1)}>
            {hero.titleLead}
            <br />
            {BY_PREFIX}
            <TypewriterText segments={[{ text: hero.titleAccent, className: ACCENT }]} />
          </h1>
          {/* Paragraph: 19px/28.5px, #B8C2D1, max-w 560px. Renders however many
           * lines paragraphLines holds — hard <br/> only between multiple lines,
           * so a single-sentence value (the current copy) just wraps naturally. */}
          <p className="mt-[22px] max-w-[480px] text-[17px] font-normal leading-[26px] tracking-[-0.08px] text-[#B8C2D1] lg:max-w-[560px] lg:text-[19px] lg:leading-[28.5px]">
            {hero.paragraphLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          {/* #1 — CTAs 48px tall via className overrides; size="cta" base kept
           * so other pages don't regress. Both buttons equal height on one row. */}
          <div className="mt-[30px] flex flex-wrap items-center gap-[14px]">
            <MegaMenuPillLabel
              as="a"
              href="#pricing"
              variant="pill-green"
              size="cta"
              leadingArrow
              leadingGlyph={GLYPH.arrow}
              label={hero.primaryCta}
              className="!h-[48px] !py-0 !pr-[24px] !text-[15px]"
            />
            <MegaMenuPillLabel
              as="a"
              href="/how-it-works"
              variant="pill-outline-dark"
              size="cta"
              label={hero.secondaryCta}
              className="!h-[48px] !px-[26px] !text-[15px]"
            />
          </div>
          <div className="mt-[26px] flex flex-wrap gap-x-[20px] gap-y-[10px]">
            {hero.bottomPills.map((pill) => (
              <span
                key={pill}
                className="flex items-center gap-[7px] text-[13.5px] font-medium text-[#B8C2D1]"
              >
                <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-brand-primary" />
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Right: auto-cycling profile card (client component). Right-aligned in
         * its grid column so the card's right edge sits on the same content-band
         * edge as the trusted-by logo row (aligns with the SCORPION logo). */}
        <div className="hero-visual hidden lg:flex lg:justify-end">
          <ProfileCard profiles={slideshow} />
        </div>
        {/* Mobile fallback — simple single photo, no card stack */}
        <div
          className="relative h-[360px] overflow-hidden rounded-[24px] lg:hidden"
          style={{ boxShadow: 'inset 0 0 0 10px #22314D' }}
        >
          <Image
            src={mainProfile.image}
            alt={mainProfile.name}
            fill
            sizes="90vw"
            className="object-cover"
            style={{ objectPosition: mainProfile.pos }}
            priority
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(0deg, rgba(6,15,30,.98) 0%, rgba(6,15,30,.6) 22%, rgba(6,15,30,0) 60%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 p-[18px]">
            <div className="text-[17px] font-semibold text-white">{mainProfile.name}</div>
            <div className="mt-[2px] text-[12px] text-white/70">{mainProfile.role}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Two-line label: "TRUSTED BY 300+" / "ENGINEERING TEAMS". Per-logo max-heights
// from displayH in content.ts (Virgin 29, Salmon 22, Hotelplan 20, Willo 22,
// Travelex 22, Tidal 22, Scorpion 14 at 0.8 opacity).
// The shared hero trust bar, same as every other marketing page. Home keeps
// passing its own (Sanity-overridable) logo list; the label, the AI CTA and the
// "See more" button all come from the shared component.
function TrustedBy({ content }: SectionProps) {
  const { trustedBy } = content
  return (
    <section className="bg-[#070D18] pb-[72px] pt-[40px]">
      <Reveal className={HERO_BAND}>
        <HeroTrustBar logos={trustedBy.logos} />
      </Reveal>
    </section>
  )
}

// #13 — grid changed to 1.15fr 1fr; lead card p-[40px]; secondary p-[32px];
// header paragraph max-w widened to 380px.
// #5 — lead card uses ReasonIcon size="lg"; secondary cards use size="sm".
function WhyDifferent({ content }: SectionProps) {
  const { whyDifferent } = content
  return (
    <section className="bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={BAND}>
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-[40px]">
          <div className="max-w-[620px]">
            <Eyebrow>{whyDifferent.eyebrow}</Eyebrow>
            <h2 className={cn('mt-[16px]', H2)}>
              {whyDifferent.titleLead} <span className={ACCENT}>{whyDifferent.titleAccent}</span>
            </h2>
          </div>
          <p className="mt-[20px] max-w-[500px] text-[18px] font-normal leading-[27px] tracking-[-0.08px] text-text-secondary lg:mb-[8px] lg:text-right">
            {whyDifferent.paragraph}
          </p>
        </div>

        <div className="mt-[40px] grid gap-[20px] lg:grid-cols-[1.15fr_1fr]">
          <Reveal className={cn(CARD, 'hover-lift-accent flex flex-col p-[40px]')}>
            <ReasonIcon icon={whyDifferent.lead.icon} size="lg" />
            <h3 className="mt-[24px] text-[26px] font-semibold leading-[32px] tracking-[-0.6px] text-white lg:text-[30px]">
              {whyDifferent.lead.title}
            </h3>
            <p
              className={cn(
                'mt-[14px] max-w-[440px] text-[14.5px] font-normal leading-[22.48px] tracking-[-0.08px]',
                MUTED,
              )}
            >
              {whyDifferent.lead.body}
            </p>
            <div className="mt-[24px] overflow-hidden rounded-[14px] border border-[#22314D]">
              <Image
                src={whyDifferent.leadImage.src}
                alt={whyDifferent.lead.title}
                width={whyDifferent.leadImage.width}
                height={whyDifferent.leadImage.height}
                sizes="(max-width: 1024px) 90vw, 580px"
                className="h-auto w-full object-cover"
              />
            </div>
            {whyDifferent.lead.proof ? (
              <p
                className={cn(
                  'mt-[24px] text-[11px] font-semibold uppercase tracking-[1.4px]',
                  MUTED,
                )}
              >
                {whyDifferent.lead.proof}
              </p>
            ) : null}
          </Reveal>

          <div className="flex flex-col gap-[20px]">
            {whyDifferent.reasons.map((reason, i) => (
              <Reveal
                key={reason.title}
                delay={80 + i * 80}
                className={cn(CARD, 'hover-lift-accent flex flex-1 items-center gap-[18px] p-[32px]')}
              >
                <ReasonIcon icon={reason.icon} size="sm" />
                <div>
                  <h3 className="text-[22px] font-semibold leading-[28px] tracking-[-0.4px] text-white">
                    {reason.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-[10px] text-[14.5px] font-normal leading-[22.48px] tracking-[-0.08px]',
                      MUTED,
                    )}
                  >
                    {reason.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// #6 — video card: (a) scrim changed to bottom-up only so Seb's photo
// shows clearly. (b) min-h raised to 720px. (c) outer <a> gets a 16px
// bezel frame; inner rounded container holds poster + overlay.
// #15 — video top margin mt-[52px].
function Process({ content }: SectionProps) {
  const { process } = content
  // Prefer the editor-set Sanity URL; fall back to the canonical Seb overview.
  const resolvedVideoUrl = process.video.videoUrl?.trim() || HOME_PROCESS_VIDEO_URL
  return (
    <section id="process" className="scroll-mt-[96px] bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={BAND}>
        <Eyebrow>{process.eyebrow}</Eyebrow>
        <h2 className={cn('mt-[16px]', H2)}>
          {process.titleLead} <span className={ACCENT}>{process.titleAccent}</span>
        </h2>

        <div className="mt-[44px] grid gap-x-[24px] gap-y-[36px] sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 70} className="flex flex-col">
              <span className="font-serif text-[44px] font-normal italic leading-[1] text-brand-primary lg:text-[48px]">
                {step.number}
              </span>
              <h3 className="mt-[16px] text-[21px] font-semibold leading-[26px] tracking-[-0.3px] text-white">
                {step.title}
              </h3>
              <p className="mt-[10px] text-[14.5px] font-normal leading-[22.48px] text-text-secondary">
                {step.body}
              </p>
              <p className="mt-[16px] text-[14.5px] font-normal leading-[22.48px] text-text-secondary">
                <span aria-hidden className="text-brand-primary">
                  {GLYPH.arrow}{' '}
                </span>
                {step.cta}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Outer frame: CARD + 16px padding creates the dark bezel border.
         * The card is no longer a link — ProcessVideo autoplays a muted
         * background loop on scroll and plays from the start with sound on
         * click. */}
        <Reveal
          variant="scale"
          scaleFrom={0.98}
          className={cn(
            CARD,
            'group relative mt-[52px] block overflow-visible p-[16px] shadow-[0_30px_50px_rgba(0,0,0,.35)]',
          )}
        >
          <ProcessVideo video={process.video} videoUrl={resolvedVideoUrl} />
        </Reveal>
      </div>
    </section>
  )
}

// Testimonials — reference rebuild. No outer section frame. Each card is its
// own 540px row: full-height photo panel (41% Willo left / 43% Salmon right)
// via absolute positioning so the photo fills edge-to-edge. Quote body is
// upright Inter (not serif-italic). Thick 12px #22314D border + 24px radius.
function Testimonials({ content }: SectionProps) {
  const { testimonials } = content
  return (
    <section className="bg-[#070D18] py-[120px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[60px] px-[22px] sm:px-[32px] lg:px-[64px]">
        <div className="flex flex-col gap-[16px]">
          <p className="text-[12px] font-bold uppercase leading-[18.6px] tracking-[1.68px] text-[#D4FF3C]">
            {testimonials.eyebrow}
          </p>
          <h2 className="font-serif font-normal italic text-[34px] leading-[1.1] tracking-[-1.3px] text-white lg:text-[58px] lg:leading-[64px] lg:tracking-[-1.7px]">
            {testimonials.title}
          </h2>
        </div>

        <div className="flex flex-col gap-[32px]">
          {testimonials.items.map((item, idx) => {
            const photoRight = idx % 2 === 1
            const quoteMaxW = idx === 0 ? 616 : 622
            const logoH = idx === 0 ? 35 : 33

            // Photo panel: plain CSS background-image inside the 540px flex card.
            // h-full gives it height; the background paints independent of Next's
            // image pipeline (which was silently failing with <Image fill>).
            const photoPanel = (
              <div
                className="relative h-full shrink-0"
                style={{
                  width: idx === 0 ? '41%' : '43%',
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 20%',
                  backgroundRepeat: 'no-repeat',
                }}
                role="img"
                aria-label={item.name}
              >
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(0deg, rgba(6,15,30,.82), rgba(6,15,30,0) 58%)',
                  }}
                />
              </div>
            )

            const textPanel = (
              <div className="flex flex-1 flex-col px-[44px] py-[40px]">
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                  <ClientLogoImage
                    logo={item.logo}
                    className="shrink-0"
                    style={{ maxHeight: `${logoH}px` }}
                  />
                  <div className="flex gap-[28px]">
                    {item.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="border-l border-[rgba(212,255,60,0.24)] px-[14px]"
                      >
                        <div className="text-[28px] font-extrabold leading-none tracking-[-0.8px] text-[#D4FF3C]">
                          <CountUp value={stat.value} />
                        </div>
                        <div className="mt-[6px] max-w-[140px] text-[12.5px] font-normal leading-[16px] text-white">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-[44px] flex flex-col gap-[12px]">
                  <span
                    aria-hidden
                    className="block text-[56px] font-extrabold leading-none tracking-[-2px] text-[#D4FF3C]"
                  >
                    {GLYPH.quote}
                  </span>
                  <p
                    className="m-0 font-sans text-[20px] font-normal not-italic leading-[30px] tracking-[-0.3px] text-white"
                    style={{ maxWidth: `${quoteMaxW}px` }}
                  >
                    {item.quote}
                  </p>
                </div>

                <div className="mt-[28px]">
                  <div className="text-[19px] font-semibold leading-[29.45px] tracking-[-0.38px] text-white">
                    {item.name}
                  </div>
                  <div className="text-[12.5px] font-normal leading-[19.38px] text-[#7F8CA0]">
                    {item.role}
                  </div>
                </div>
              </div>
            )

            return (
              <Reveal
                key={item.name}
                delay={idx * 100}
                className="hover-lift flex h-[540px] overflow-hidden rounded-[24px] bg-[#101B30] shadow-[0_4px_4px_rgba(0,0,0,.25)]"
                style={{ border: '12px solid #22314D' }}
              >
                {photoRight ? (
                  <>
                    {textPanel}
                    {photoPanel}
                  </>
                ) : (
                  <>
                    {photoPanel}
                    {textPanel}
                  </>
                )}
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// The "You" / "Us" column labels. Seb asked for these bigger than the 12px
// eyebrow they shared with every other section label: they are the comparison
// itself, not a section tag. Tracking drops as the size goes up, because 1.68px
// letter-spacing reads as a gap once the type is this large.
const INCLUDED_COLUMN_LABEL =
  'text-[22px] font-bold uppercase leading-none tracking-[1px] text-brand-primary lg:text-[28px]'

function Included({ content }: SectionProps) {
  const { included } = content
  return (
    <section className="bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={BAND}>
        <Eyebrow>{included.eyebrow}</Eyebrow>
        {/* Plain accent, no reveal effect: the typewriter is reserved for page
            heroes, and two competing text effects on one page read as noise. */}
        <h2 className={cn('mt-[16px]', H2)}>
          {included.titleLead} <span className={ACCENT}>{included.titleAccent}</span>
        </h2>

        <div className="mt-[40px] grid gap-[20px] lg:grid-cols-[0.8fr_1.6fr]">
          <Reveal className={cn(CARD, 'p-[32px]')}>
            <span className={INCLUDED_COLUMN_LABEL}>{included.you.label}</span>
            <h3 className="mt-[14px] whitespace-pre-line text-[24px] font-semibold leading-[32px] tracking-[-0.5px] text-white lg:text-[27px] lg:leading-[35px]">
              {included.you.heading}
            </h3>
            <ul className="mt-[22px] flex flex-col gap-[14px]">
              {included.you.items.map((item, i) => (
                <Reveal as="li" key={item} delay={i * 50} className="flex items-start gap-[10px]">
                  <span aria-hidden className="mt-[2px] text-[14px] font-bold text-brand-primary">
                    {GLYPH.arrow}
                  </span>
                  <span className="text-[14.5px] font-normal leading-[22.48px] text-text-secondary">
                    {item}
                  </span>
                </Reveal>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80} className={cn(CARD, 'p-[32px]')}>
            <span className={INCLUDED_COLUMN_LABEL}>{included.us.label}</span>
            <h3 className="mt-[14px] text-[24px] font-semibold leading-[32px] tracking-[-0.5px] text-white lg:text-[27px] lg:leading-[35px]">
              {included.us.heading}
            </h3>
            <ul className="mt-[22px] flex flex-col gap-[14px]">
              {included.us.items.map((item, i) => (
                <Reveal as="li" key={item} delay={i * 50} className="flex items-start gap-[10px]">
                  <span aria-hidden className="mt-[2px] text-[14px] font-bold text-brand-primary">
                    {GLYPH.check}
                  </span>
                  <span className="text-[14.5px] font-normal leading-[22.48px] text-text-secondary">
                    {item}
                  </span>
                </Reveal>
              ))}
            </ul>
          </Reveal>
        </div>

        <p className={cn('mt-[24px] text-[13px] leading-[20.15px] tracking-[-0.08px]', MUTED)}>
          {included.footnote}
        </p>
      </div>
    </section>
  )
}

// #4 — Calculator: rounded-[32px] card; field labels float ABOVE the select
// box. The card itself is a client component (HomeCalculatorCard) because the
// three dropdowns are real, working <select>s wired to the shared next-hire
// rate engine. #5 — Save badge tilted 6deg lives inside that component.
function Calculator({ content }: SectionProps) {
  const { calculator } = content
  return (
    <section id="pricing" className="scroll-mt-[96px] bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={BAND}>
        <Eyebrow>{calculator.eyebrow}</Eyebrow>
        <h2 className={cn('mt-[16px]', H2)}>
          {calculator.titleLead} <span className={ACCENT}>{calculator.titleAccent}</span>
        </h2>

        <HomeCalculatorCard calculator={calculator} />

        <p className={cn('mt-[16px] text-[13px] leading-[20.15px] tracking-[-0.08px]', MUTED)}>
          {calculator.footnote}
        </p>
      </div>
    </section>
  )
}

// #6 — Profiles duplicated inline ([...profiles, ...profiles]) so the marquee
// renders at least 6 cards per set, guaranteeing track > 2× viewport width
// for a seamless gap-free loop on any screen size.
function RealEngineers({ content }: SectionProps) {
  const { realEngineers } = content
  const loopedProfiles = [...realEngineers.profiles, ...realEngineers.profiles]
  return (
    <section className="bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={BAND}>
        <Eyebrow>{realEngineers.eyebrow}</Eyebrow>
        <h2 className={cn('mt-[16px]', H2)}>
          {realEngineers.titleLead} <span className={ACCENT}>{realEngineers.titleAccent}</span>
        </h2>
      </div>
      <Marquee speed="slow" pauseOnHover className="mt-[40px] pb-[8px]">
        {loopedProfiles.map((profile, idx) => (
          <div
            key={`${profile.name}-${idx}`}
            className="hover-lift relative mr-[20px] h-[420px] w-[340px] shrink-0 overflow-hidden rounded-[24px]"
            style={{ boxShadow: 'inset 0 0 0 8px #22314D' }}
          >
            <Image
              src={profile.image}
              alt={profile.name}
              fill
              sizes="340px"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(0deg, rgba(6,15,30,.98) 0%, rgba(6,15,30,.7) 22%, rgba(6,15,30,0) 55%)',
              }}
            />
            <span className="absolute right-[14px] top-[14px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-black/45 text-[14px] backdrop-blur-sm">
              {profile.flag}
            </span>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[9px] p-[18px]">
              <div className="flex items-center gap-[5px] self-start rounded-full bg-black/55 px-[10px] py-[6px] text-[11px] font-bold uppercase tracking-[0.6px] text-white backdrop-blur-sm">
                <span className="text-brand-primary">{GLYPH.check}</span>
                <span>{realEngineers.badge}</span>
              </div>
              <div className="flex flex-wrap gap-[6px]">
                {profile.tags.map((tag, i) => (
                  <span
                    key={tag}
                    className={cn(
                      'rounded-full px-[10px] py-[5px] text-[12px] font-bold',
                      i === 0
                        ? 'bg-brand-primary text-[#060F1E]'
                        : 'bg-black/55 text-white backdrop-blur-sm',
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-[17px] font-semibold text-white">{profile.name}</div>
              <div className="text-[12px] text-white/70">{profile.role}</div>
            </div>
          </div>
        ))}
      </Marquee>
    </section>
  )
}

function ReadyToFind({ content }: SectionProps) {
  const { readyToFind } = content
  return (
    // Cursor spotlight, same treatment as the location pages' "Three ways to
    // start". Only the heading block carries data-spot-item, so the quiz card
    // below stays full-bright and fully usable.
    <Spotlight className="py-[72px] lg:py-[104px]">
      <div className={BAND}>
        <div data-spot-item className="transition-opacity duration-300 motion-safe:opacity-50">
          <Eyebrow>{readyToFind.eyebrow}</Eyebrow>
          {/* H — force accent phrase onto its own unbroken line */}
          <h2 className={cn('mt-[16px]', H2)}>
            {readyToFind.titleLead}
            <br />
            <span className={cn(ACCENT, 'whitespace-nowrap')}>{readyToFind.titleAccent}</span>
          </h2>
          <p className="mt-[18px] max-w-[560px] text-[16px] font-normal leading-[24px] tracking-[-0.08px] text-text-secondary">
            {readyToFind.paragraph}
          </p>
        </div>

        <Reveal
          className={cn(
            CARD,
            'mt-[40px] grid gap-[28px] p-[28px] lg:grid-cols-[1.5fr_1fr] lg:p-[36px]',
          )}
        >
          <div>
            <div className="flex flex-wrap gap-x-[36px] gap-y-[12px]">
              {readyToFind.steps.map((step, i) => (
                <span key={step} className="flex items-center gap-[8px] text-[14px] font-semibold text-white">
                  <span
                    className={cn(
                      'flex h-[24px] w-[24px] items-center justify-center rounded-full text-[11px] font-bold',
                      i === 0
                        ? 'bg-brand-primary text-[#060F1E]'
                        : 'bg-[#16233B] text-text-secondary',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={cn(i === 0 ? 'text-white' : 'text-text-secondary')}>
                    {step}
                  </span>
                </span>
              ))}
            </div>
            <h3 className="mt-[28px] text-[24px] font-semibold leading-[30px] tracking-[-0.5px] text-white">
              {readyToFind.question}
            </h3>
            <p className={cn('mt-[6px] text-[13px]', MUTED)}>{readyToFind.questionSub}</p>
            <div className="mt-[20px] grid gap-[14px] sm:grid-cols-2">
              {readyToFind.roles.map((role, i) => (
                <div
                  key={role}
                  className={cn(
                    'flex items-center gap-[12px] rounded-[12px] border bg-[#16233B] px-[16px] py-[14px]',
                    i === 0 ? 'border-brand-primary' : 'border-[#22314D]',
                  )}
                >
                  <span
                    aria-hidden
                    className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-[#0A1120] text-[12px] text-brand-primary"
                  >
                    {GLYPH.arrow}
                  </span>
                  <span className="text-[15px] font-semibold text-white">{role}</span>
                </div>
              ))}
            </div>
            <div className="mt-[24px] flex flex-wrap items-center justify-between gap-[16px]">
              <div className="flex flex-wrap gap-x-[16px] gap-y-[8px]">
                {readyToFind.bottomPills.map((pill) => (
                  <span
                    key={pill}
                    className="flex items-center gap-[6px] text-[12px] font-normal text-text-secondary"
                  >
                    <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-brand-primary" />
                    {pill}
                  </span>
                ))}
              </div>
              <MegaMenuPillLabel
                as="a"
                href="#pricing"
                variant="pill-green"
                size="cta"
                leadingArrow
                leadingGlyph={GLYPH.arrow}
                label={readyToFind.nextLabel}
              />
            </div>
          </div>

          <div className="rounded-[16px] border border-[#22314D] bg-[#0A1120] p-[24px]">
            <div className="flex items-center gap-[8px]">
              <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-brand-primary" />
              <span className="text-[12px] font-bold uppercase tracking-[0.9px] text-white">
                {readyToFind.matching.label}
              </span>
            </div>
            {/* Decorative progress fills — variant="scale-x" scales the bar's
             * OWN box from the left edge; the box keeps its final 70%/45%
             * width at all times, so nothing here can cause CLS. */}
            <Reveal variant="scale-x" className="mt-[40px] h-[10px] w-[70%] rounded-full bg-[#1B2942]" />
            <Reveal
              variant="scale-x"
              delay={150}
              className="mt-[10px] h-[10px] w-[45%] rounded-full bg-[#1B2942]"
            />
            <p className={cn('mt-[14px] text-[13px]', MUTED)}>{readyToFind.matching.unlocks}</p>
            <div className="mt-[20px] flex flex-wrap gap-[8px]">
              {readyToFind.matching.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#16233B] px-[10px] py-[5px] text-[12px] font-semibold text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className={cn('mt-[16px] text-[13px] leading-[20px]', MUTED)}>
              {readyToFind.matching.note}
            </p>
            <div className="mt-[20px] flex gap-[28px]">
              {readyToFind.matching.stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-[22px] font-extrabold leading-none text-brand-primary">
                    {stat.value}
                  </div>
                  <div className={cn('mt-[6px] text-[12px]', MUTED)}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* These were non-clickable <span>s: the page invited you to "Ask our AI
            anything" and then did nothing when you did. First CTA opens the chat
            widget, the rest are ordinary links. */}
        <div className="mt-[24px] flex flex-wrap items-center justify-center gap-[14px]">
          <span className={cn('text-[14px]', MUTED)}>{readyToFind.talkPrompt}</span>
          {readyToFind.talkCtas.map((cta, i) => (
            <ChatLink
              key={cta}
              href={i === 0 ? CHAT_HREF : CHAT_FALLBACK_HREF}
              className="rounded-full bg-[#16233B] px-[16px] py-[8px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1E2E4A]"
            >
              {cta}
            </ChatLink>
          ))}
        </div>
      </div>
    </Spotlight>
  )
}

// #8 — FAQ replaced with real Accordion (Radix-backed, keyboard-accessible).
// type="single" collapsible: one item open at a time, re-click closes it.
// Lime number + 18px question in the trigger; answer in AccordionContent.
// The accordion primitive is 'use client'; it works inside this server template.
function Faq({ content }: SectionProps) {
  const { faq } = content
  return (
    <section id="faq" className="scroll-mt-[96px] bg-[#070D18] py-[72px] lg:py-[104px]">
      <div className={cn(BAND, 'grid gap-[40px] lg:grid-cols-[0.9fr_1.6fr]')}>
        <div className={STICKY_ASIDE}>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2 className={cn('mt-[16px]', H2)}>
            {faq.titleLead} <span className={ACCENT}>{faq.titleAccent}</span>
          </h2>
          <FaqChatCard
            className="mt-[28px]"
            label={faq.fallbackLabel}
            body={faq.fallbackBody}
            cta={faq.fallbackCta}
          />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faq.items.map((item, i) => (
            // Reveal renders AS the AccordionItem itself (via the `as` prop)
            // rather than wrapping it in an extra div — a wrapper would break
            // `last:border-b`, since each item would then be the only/last
            // child of its own wrapper.
            <Reveal
              as={AccordionItem}
              key={item.number}
              value={item.number}
              delay={i * 60}
              className="border-t border-[#22314D] last:border-b last:border-[#22314D]"
            >
              <AccordionTrigger className="gap-[20px] px-0 py-[24px] text-left hover:no-underline">
                <span className="shrink-0 text-[13px] font-bold text-brand-primary">
                  {item.number}
                </span>
                <span className="flex-1 text-[16px] font-semibold leading-[24px] text-white transition-colors group-hover:text-brand-primary lg:text-[18px]">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-[20px] pt-0">
                <p className={cn('pl-[34px] text-[15px] leading-[24px]', MUTED)}>
                  {item.answer}
                </p>
              </AccordionContent>
            </Reveal>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export function HomeTemplate({ content = HOME_CONTENT }: { content?: HomeContent }) {
  return (
    <main id="main" className="bg-[#070D18]">
      {/* Hero + trust bar claim the first screen together. */}
      <div className="hero-screen">
        <Hero content={content} />
        <TrustedBy content={content} />
      </div>
      <ClientStorySection content={content} />
      <WhyDifferent content={content} />
      <Process content={content} />
      <Testimonials content={content} />
      <Included content={content} />
      <Calculator content={content} />
      <RealEngineers content={content} />
      <ReadyToFind content={content} />
      <WhereWeWork content={content.whereWeWork} />
      <Faq content={content} />
    </main>
  )
}

export default HomeTemplate
