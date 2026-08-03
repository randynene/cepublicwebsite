import { cn } from '@/components/ui/_utils/cn'
import { HeroTrustBar } from '@/components/social-proof/hero-trust-bar'
import { CLIENT_LOGOS, type ClientLogo } from '@/components/social-proof/client-logo-strip'
import { buildLocalePath, type Locale } from '@/lib/locale-path'
import { TypewriterText } from '@/components/motion/typewriter-text'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'

import type { AdvantageCard, EngineerProfile, HubCard, LocationContent, LocationLogo, StartCard } from './content'
import type { HomeProfile } from '@/components/templates/home/content'
import { HeroCards } from '@/components/templates/home/hero-cards'
import { LocationCalculator } from './calculator'
import { LocationVideo } from './video'
import { Spotlight } from '@/components/motion/spotlight'
import { LeadFormSection } from '@/components/lead-form/section'
import { FaqChatCard } from '@/components/shared/faq-chat-card'
import { HubPanels } from '@/components/shared/hub-panels'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'

// Card hover: lift + lime border glow (homepage data-mo-cardhover equivalent).
const CARD_HOVER =
  'transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-primary/50 hover:shadow-[0_24px_60px_-24px_rgba(212,255,60,0.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0'

// TEMPLATE-LOCATION - faithful port of the locked Location pages
// (docs/raw-html/location/*.html + matching PNGs). One template, three region
// variants driven by LocationContent. Fixed 1280px content column with 320px
// gutters at 1920. Dark/lime system: ground #070D18, lime #D4FF3C, body #B8C2D1,
// card #101B30 on #22314D borders, dark ink #060F1E. Inter + Source Serif 4
// italic accents. Nav, announcement bar, mini-CTA and footer are sitewide chrome
// (not rebuilt here). Every string arrives on the `content` prop.

// Widened from 1280 on the 28 Jul review so the location pages share the same
// content band as home and the two service pages.
const BAND = 'mx-auto w-full max-w-[1440px] px-6 lg:px-[64px]'
const EYEBROW = 'text-[12px] font-semibold uppercase tracking-[1.8px] text-brand-primary'
const ACCENT = 'font-serif font-normal italic text-brand-primary'
const BODY = 'text-[#B8C2D1]'
const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const GLYPH = { arrow: '→', check: '✓', plus: '+', clock: '◷' } as const

// Fallback logo set (used when the Sanity doc has no `logos`). Exact per-logo
// heights + opacities from the master. Travelex ships as a filled mark, so the
// white-invert filter turns it into a solid block - it is rendered as-is (no
// invert) like the home page does. When Sanity provides `content.logos`, those
// win and this is only the safety net.
export const LOGOS_FALLBACK: LocationLogo[] = [
  { name: 'Virgin Experience Days', src: '/design/home/logos/virgin.png', displayH: 29, displayOpacity: 0.95, invert: true },
  { name: 'Salmon', src: '/design/home/logos/salmon.png', displayH: 22, displayOpacity: 0.95, invert: true },
  { name: 'Hotelplan', src: '/design/home/logos/hotelplan.png', displayH: 20, displayOpacity: 0.95, invert: true },
  { name: 'Willo', src: '/design/home/logos/willo.png', displayH: 22, displayOpacity: 0.95, invert: true },
  { name: 'Travelex', src: '/design/home/logos/travelex.png', displayH: 22, displayOpacity: 0.95, invert: false },
  { name: 'Tidal', src: '/design/home/logos/tidal.png', displayH: 22, displayOpacity: 0.95, invert: true },
  { name: 'Scorpion', src: '/design/home/logos/scorpion.png', displayH: 14, displayOpacity: 0.8, invert: true },
]

// The logo-strip label is locked to two lines for the standard trusted-by copy.


// Time-zone stat-card icons: 20x20 lime line-icons (stroke #D4FF3C, no fill) on
// a dark navy #1B2A45 tile (set on the AdvantageTile wrapper).
// Explicit px, not h-5/w-5: tokens.css sets --spacing to 0.5rem, so every
// Tailwind spacing step on this page is double the stock scale (h-5 = 40px).
const ICON_GLYPH = 'h-[20px] w-[20px]'
const iconBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: '#D4FF3C',
  strokeWidth: '1.7',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}
const TIMEZONE_ICON_MAP: Record<NonNullable<AdvantageCard['icon']>, React.ReactNode> = {
  clock: <svg key="clock" {...iconBase} className={ICON_GLYPH}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  dollar: <svg key="dollar" {...iconBase} className={ICON_GLYPH}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  bolt: <svg key="bolt" {...iconBase} className={ICON_GLYPH}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>,
  globe: <svg key="globe" {...iconBase} className={ICON_GLYPH}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" /></svg>,
  chat: (
    <svg key="chat" {...iconBase} className={ICON_GLYPH}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  users: (
    <svg key="users" {...iconBase} className={ICON_GLYPH}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
}

// Positional fallback for regions that do not set card.icon.
const TIMEZONE_ICONS: React.ReactNode[] = [
  TIMEZONE_ICON_MAP.clock,
  TIMEZONE_ICON_MAP.dollar,
  TIMEZONE_ICON_MAP.bolt,
  TIMEZONE_ICON_MAP.globe,
]

// Shared icon tile — the square used by every card on the page. 40x40, 10px
// radius, dark navy fill, 20x20 lime line-icon centred inside it. Previously
// each section invented its own (round lime-tinted circles with a tick glyph),
// which is why the EOR + "three ways" tiles read as a different design.
const ICON_TILE =
  'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[#1B2A45]'

// "How we keep your engineer" tiles. Each EOR commitment gets its own icon
// instead of five identical ticks. Matched on the item title so the mapping
// survives a copy edit in Studio, with a positional fallback.
const EOR_ICONS = {
  shield: (
    <svg {...iconBase} className={ICON_GLYPH}>
      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  cap: (
    <svg {...iconBase} className={ICON_GLYPH}>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
    </svg>
  ),
  heart: (
    <svg {...iconBase} className={ICON_GLYPH}>
      <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-.6 1-1.5 2-2.5 3" />
      <path d="M3 12h4l2-3 3 6 2-3h4" />
    </svg>
  ),
  building: (
    <svg {...iconBase} className={ICON_GLYPH}>
      <path d="M4 21V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15" />
      <path d="M14 10h5a1 1 0 0 1 1 1v10M2 21h20" />
      <path d="M7 9h4M7 13h4M7 17h4M17 14h1M17 18h1" />
    </svg>
  ),
  support: (
    <svg {...iconBase} className={ICON_GLYPH}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
} as const

type EorIconKey = keyof typeof EOR_ICONS

const EOR_ICON_ORDER: EorIconKey[] = ['shield', 'cap', 'heart', 'building', 'support']

/** Keyword -> icon. First match wins; falls back to slot order. */
const EOR_ICON_RULES: [RegExp, EorIconKey][] = [
  [/employer of record|legal|complian|contract|payroll tax/i, 'shield'],
  [/l&d|learn|train|certif|budget|develop/i, 'cap'],
  [/health|insur|wellbeing|medical|leave/i, 'heart'],
  [/office|workspace|desk|region/i, 'building'],
  [/support|team|hr|manager|people/i, 'support'],
]

function eorIcon(title: string, index: number): React.ReactNode {
  const hit = EOR_ICON_RULES.find(([re]) => re.test(title))
  const key = hit?.[1] ?? EOR_ICON_ORDER[index % EOR_ICON_ORDER.length]
  return EOR_ICONS[key]
}

/** Drawn tick, replacing the ✓ text glyph. A glyph inherits the font's own
 *  optical centring, which is what made the old list markers sit off-baseline;
 *  a fixed 14x14 SVG in a fixed-size box aligns to the first text line every
 *  time. `tone` picks the stroke for dark vs lime surfaces. */
const CHECK_STROKE = { lime: '#D4FF3C', ink: '#060F1E' } as const

function CheckMark({ tone = 'lime' }: { tone?: keyof typeof CHECK_STROKE }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={CHECK_STROKE[tone]}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[13px] w-[13px]"
    >
      <path d="m5 13 5 5L20 6" />
    </svg>
  )
}

function Eyebrow({ children, className }: { children: string; className?: string }) {
  return <p className={cn(EYEBROW, className)}>{children}</p>
}

function Heading({
  lead,
  accent,
  size = 'text-[34px] lg:text-[52px]',
  id,
}: {
  lead: string
  accent: string
  size?: string
  id?: string
}) {
  return (
    <h2 id={id} className={cn(size, 'font-bold leading-[1.05] tracking-[-1.4px] text-white')}>
      {lead}
      {accent ? (
        <>
          {' '}
          <span className={ACCENT}>{accent}</span>
        </>
      ) : null}
    </h2>
  )
}

// ── Hero ────────────────────────────────────────────────────────────────────
// Left column is region-specific copy; the right column is the polished photo-
// card stack (HeroCards), now fed from this region's own editable hero.cards
// (photo, name, role, flag, skills) so Seb can edit each region in Studio. The
// visual layout is fixed by HeroCards; only the card content is data-driven.
function Hero({ content }: { content: LocationContent }) {
  const { hero } = content
  const heroProfiles: HomeProfile[] = (hero.cards ?? []).map((c) => ({
    name: c.name,
    role: c.role,
    flag: c.flag,
    tags: c.skills,
    image: c.image,
  }))
  const heroPills = hero.floatingBadges
  const heroMain = heroProfiles[heroProfiles.length - 1] ?? heroProfiles[0]
  return (
    <section className={cn(BAND, 'grid grid-cols-1 items-center gap-[56px] py-[64px] lg:grid-cols-[600px_1fr] lg:py-[88px]')}>
      <div>
        <span className="inline-flex items-center gap-2 rounded-pill border border-brand-primary/30 bg-brand-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[1px] text-brand-primary">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_#D4FF3C]" />
          {hero.eyebrow}
        </span>
        <h1 className="mt-6 text-[38px] font-extrabold leading-[1.06] tracking-[-1.4px] text-white lg:text-[46px] lg:leading-[52px] lg:tracking-[-1.6px]">
          {hero.titleLead}
          <br />
          {hero.titleConnector} <TypewriterText segments={[{ text: hero.titleAccent, className: ACCENT }]} />
        </h1>
        <p className={cn('mt-6 max-w-[540px] text-[18px] leading-[28px]', BODY)}>{hero.paragraph}</p>
        <div className="mt-8 flex flex-wrap items-center gap-[14px]">
          <MegaMenuPillLabel
            as="a"
            href="/book-a-call"
            variant="pill-green"
            size="cta"
            leadingArrow
            leadingGlyph={GLYPH.arrow}
            label={hero.ctaPrimary}
            className="!h-[48px] !py-0 !pr-[24px] !text-[15px]"
          />
          <MegaMenuPillLabel
            as="a"
            href="#calculator"
            variant="pill-outline-dark"
            size="cta"
            label={hero.ctaSecondary}
            className="!h-[48px] !px-[26px] !text-[15px]"
          />
        </div>
        <ul className="mt-7 grid grid-cols-1 gap-x-[18px] gap-y-2 sm:grid-cols-3">
          {hero.trustPills.map((p) => (
            <li key={p} className={cn('flex items-center gap-2 whitespace-nowrap text-[13px]', BODY)}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Right column - reuses the home page photo-card stack (same on all three
          regions for now). Desktop = hover-parallax stack; mobile = single photo. */}
      <div className="relative w-full">
        <div className="hero-visual hidden lg:block">
          <HeroCards profiles={heroProfiles} pills={heroPills} />
        </div>
        {heroMain ? (
          <div
            className="relative h-[360px] overflow-hidden rounded-[24px] lg:hidden"
            style={{ boxShadow: 'inset 0 0 0 10px #22314D' }}
          >
            <img src={heroMain.image} alt={heroMain.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: 'linear-gradient(0deg, rgba(6,15,30,.92) 0%, rgba(6,15,30,.4) 45%, transparent 70%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[18px] font-semibold text-white">{heroMain.name}</p>
              <p className="text-[13px] text-white/80">{heroMain.role}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

// ── Hero trust bar ────────────────────────────────────────────
// The location pages used to render their own static logo row. They now use the
// shared bar, so all three regions close their hero exactly like Hire Engineers.
/**
 * Sanity's location logos carry optional dimensions and a boolean `invert`,
 * where the shared strip wants required dimensions and a `tone`. Cast-free
 * adapter: real dimensions come from the canonical list when the asset is one
 * of the seven we ship, so a Sanity entry that omits them cannot cause a
 * layout shift.
 */
function toClientLogos(logos: LocationLogo[]): ClientLogo[] {
  return logos.map((l) => {
    const known = CLIENT_LOGOS.find((c) => c.src === l.src)
    return {
      name: l.name,
      src: l.src,
      width: l.width ?? known?.width ?? 260,
      height: l.height ?? known?.height ?? 80,
      tone: l.invert === false ? ('asis' as const) : known?.tone,
      displayH: l.displayH ?? known?.displayH,
      displayOpacity: l.displayOpacity ?? known?.displayOpacity,
    }
  })
}

function LogoStrip({ content, locale }: { content: LocationContent; locale: Locale }) {
  const logos = content.logos?.length ? toClientLogos(content.logos) : CLIENT_LOGOS
  return (
    <section className={cn(BAND, 'pb-[48px] pt-[24px]')}>
      <HeroTrustBar locale={locale} logos={logos} />
    </section>
  )
}

// ── Time-zone advantage ─────────────────────────────────────────────────────
// Every spacing value here is explicit px. The page's Tailwind steps are on a
// doubled scale (--spacing: 0.5rem), which is what inflated these cards to
// 290x423 with an 80px icon tile. Fixed geometry keeps all four cards - and the
// same row on all three region pages - identical: 24px padding, 40px tile,
// 8px stack gap. The floor is the tallest natural card across the three regions
// (PH/EE run to a fourth body line), so LATAM's shorter cards match them rather
// than sitting 20px shorter.
const ADVANTAGE_CARD_MIN_H = 'min-h-[254px]'

function AdvantageTile({ card, icon }: { card: AdvantageCard; icon: React.ReactNode }) {
  return (
    <li className={cn(CARD, CARD_HOVER, ADVANTAGE_CARD_MIN_H, 'flex flex-col gap-[8px] p-[24px] text-left')}>
      <span className={cn(ICON_TILE, 'mb-[10px]')}>{icon}</span>
      <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#6B7589]">{card.eyebrow}</p>
      <h3 className="text-[22px] font-bold leading-[28px] text-white">{card.title}</h3>
      <p className={cn('text-[14px] leading-[21px]', BODY)}>{card.body}</p>
    </li>
  )
}

function Advantage({ content }: { content: LocationContent }) {
  const { advantage } = content
  return (
    <section id="advantage" className={cn(BAND, 'scroll-mt-[96px] py-[80px]')}>
      <Eyebrow>{advantage.eyebrow}</Eyebrow>
      <div className="mt-3 max-w-[720px]">
        <Heading lead={advantage.titleLead} accent={advantage.titleAccent} />
      </div>
      <p className={cn('mt-4 max-w-[700px] text-[16px]', BODY)}>{advantage.intro}</p>
      <ul className="mt-[40px] grid grid-cols-1 items-stretch gap-[20px] sm:grid-cols-2 lg:grid-cols-4">
        {advantage.cards.map((c, i) => (
          <AdvantageTile
            key={c.title}
            card={c}
            icon={(c.icon ? TIMEZONE_ICON_MAP[c.icon] : null) ?? TIMEZONE_ICONS[i] ?? TIMEZONE_ICONS[0]}
          />
        ))}
      </ul>
    </section>
  )
}

// ── Video feature ───────────────────────────────────────────────────────────
function VideoFeature({ content }: { content: LocationContent }) {
  const { video } = content
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-[72px] text-center sm:px-6 xl:px-0">
      <Eyebrow className="text-center">{video.eyebrow}</Eyebrow>
      <div className="mt-3">
        <Heading lead={video.titleLead} accent={video.titleAccent} />
      </div>
      <p className={cn('mx-auto mt-4 max-w-[760px] text-[16px]', BODY)}>{video.intro}</p>
      {/* Full content-band width, matching the home page's process video card
          (which spans its own 1440px band). The old 920px cap made the same
          asset read as a much smaller player on the location pages. */}
      <div className="mx-auto mt-10 w-full">
        <LocationVideo
          image={video.image}
          presenter={video.presenter}
          pullQuote={video.pullQuote}
          videoSrc={video.videoSrc}
          videoUrl={video.videoUrl}
          title={`${video.titleLead} ${video.titleAccent}`}
        />
      </div>
    </section>
  )
}

// ── Where we are ────────────────────────────────────────────────────────────
function OnGround({ content }: { content: LocationContent }) {
  const { onGround } = content
  if (!onGround) return null
  return (
    <section className={cn(BAND, 'grid grid-cols-1 items-center gap-[56px] py-[72px] lg:grid-cols-[560px_1fr]')}>
      <div className="h-[460px] overflow-hidden rounded-[20px] border border-[#22314D]">
        <img src={onGround.image} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div>
        <Eyebrow>{onGround.eyebrow}</Eyebrow>
        <div className="mt-3">
          <Heading lead={onGround.titleLead} accent={onGround.titleAccent} size="text-[30px] lg:text-[36px]" />
        </div>
        <p className={cn('mt-4 text-[16px] leading-[25px]', BODY)}>{onGround.body}</p>
        <ul className="mt-6 flex flex-col gap-3">
          {onGround.bullets.map((b) => (
            <li key={b} className={cn('grid grid-cols-[26px_1fr] items-start gap-x-[14px] text-[15px] leading-[24px]', BODY)}>
              <span
                aria-hidden="true"
                className="mt-[3px] grid h-[26px] w-[26px] place-items-center rounded-full bg-brand-primary/15"
              >
                <CheckMark />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ── EOR / "How we keep your engineer" (PH-only) ─────────────────────────────
function EorTile({ item, index }: { item: { title: string; body: string }; index: number }) {
  return (
    <li className={cn(CARD, CARD_HOVER, 'flex flex-col gap-2 p-6')}>
      <span className={cn(ICON_TILE, 'mb-3')}>{eorIcon(item.title, index)}</span>
      <h3 className="text-[17px] font-semibold leading-[24px] text-white">{item.title}</h3>
      <p className={cn('text-[14px] leading-[21px]', BODY)}>{item.body}</p>
    </li>
  )
}

function Eor({ content }: { content: LocationContent }) {
  const { eor } = content
  if (!eor) return null
  const items = eor.items
  // Five items: first row of 3, second row of 2 centered (no empty grid hole).
  const useBalancedFive = items.length === 5
  return (
    <section className={cn(BAND, 'py-[72px]')}>
      <Eyebrow>{eor.eyebrow}</Eyebrow>
      <div className="mt-3">
        {eor.subhead ? (
          <h2 className="text-[30px] font-bold leading-[1.05] tracking-[-1px] text-white lg:text-[40px]">
            {eor.subhead}
            <br />
            <span className={ACCENT}>
              {eor.titleLead} {eor.titleAccent}
            </span>
          </h2>
        ) : (
          <Heading lead={eor.titleLead} accent={eor.titleAccent} size="text-[30px] lg:text-[40px]" />
        )}
      </div>
      {eor.intro ? <p className={cn('mt-4 max-w-[720px] text-[17px] leading-[27px]', BODY)}>{eor.intro}</p> : null}
      {useBalancedFive ? (
        <div className="mt-10 flex flex-col gap-5">
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {items.slice(0, 3).map((item, i) => (
              <EorTile key={item.title} item={item} index={i} />
            ))}
          </ul>
          <ul className="mx-auto grid w-full max-w-[calc((100%-2.5rem)*2/3)] grid-cols-1 gap-5 md:grid-cols-2">
            {items.slice(3).map((item, i) => (
              <EorTile key={item.title} item={item} index={i + 3} />
            ))}
          </ul>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((item, i) => (
            <EorTile key={item.title} item={item} index={i} />
          ))}
        </ul>
      )}
    </section>
  )
}

// ── "What's included" split list (PH-only) ──────────────────────────────────
// One bordered card holds both columns, so they share a height and the
// comparison reads as a comparison. Lime is an accent only (label, pill, ticks)
// - the previous full-lime "We" slab outshouted the page's own CTA. The "We"
// list runs two-up on wide screens, which is what stops the shorter "You"
// column leaving dead space beneath it.
function Included({ content }: { content: LocationContent }) {
  const { included } = content
  if (!included) return null
  // Fee bar: the opening sentence is bold, the rest is body weight, so the bar
  // reads as one line rather than two blocks.
  const footMatch = included.footnote.match(/^([^.]*\.)\s*(.*)$/)
  const footLead = footMatch?.[1] ?? included.footnote
  const footRest = footMatch?.[2] ?? ''
  const COL_PAD = 'px-[22px] py-[28px] min-[901px]:px-[40px] min-[901px]:py-[44px]'
  const COL_TITLE =
    'mt-[18px] text-[21px] font-semibold leading-[27px] tracking-[-0.7px] text-white min-[901px]:text-[26px] min-[901px]:leading-[32px]'
  const ITEM = 'flex gap-[12px] rounded-[12px] bg-[#101B30] px-[16px] py-[15px]'
  const ITEM_TEXT = 'text-[14.5px] font-medium leading-[20px] text-[#DCE3EC]'
  return (
    <section className={cn(BAND, 'py-[72px]')} aria-labelledby="whats-included">
      <Eyebrow>{included.eyebrow}</Eyebrow>
      <div className="mt-3">
        <Heading
          id="whats-included"
          lead={included.titleLead}
          accent={included.titleAccent}
          size="text-[30px] lg:text-[40px]"
        />
      </div>
      <div className="mt-10 overflow-hidden rounded-[24px] border border-[#22314D] bg-[#0B1424]">
        <div className="grid grid-cols-1 min-[901px]:grid-cols-[340px_1fr] min-[1181px]:grid-cols-[400px_1fr]">
          {/* YOU */}
          <div
            className={cn(
              COL_PAD,
              'flex flex-col border-b border-[#22314D] min-[901px]:border-b-0 min-[901px]:border-r',
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[1.6px] text-[#7F8CA0]">
              {included.youLabel}
            </p>
            {included.youSubhead ? (
              <h3 className={cn(COL_TITLE, 'whitespace-pre-line')}>
                {included.youSubhead.replace(/\. /g, '.\n')}
              </h3>
            ) : null}
            {included.youBody ? (
              <p className="mt-[14px] text-[14.5px] leading-[22px] text-[#7F8CA0]">{included.youBody}</p>
            ) : null}
            <ul className="mt-[30px] flex flex-col gap-[10px]">
              {included.you.map((b) => (
                <li key={b} className={cn(ITEM, 'items-center border border-[#1E2C46]')}>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[13px] font-bold leading-none text-brand-primary"
                  >
                    {GLYPH.arrow}
                  </span>
                  <span className={ITEM_TEXT}>{b}</span>
                </li>
              ))}
            </ul>
            {included.youFootnote ? (
              <p className="mt-auto pt-[22px] text-[13.5px] leading-[20px] text-[#5C6A80] min-[901px]:pt-[34px]">
                {included.youFootnote}
              </p>
            ) : null}
          </div>

          {/* WE */}
          <div
            className={cn(
              COL_PAD,
              'bg-[linear-gradient(180deg,rgba(212,255,60,0.05),rgba(212,255,60,0)_320px)]',
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-[16px]">
              <p className="text-[11px] font-bold uppercase tracking-[1.6px] text-brand-primary">
                {included.weLabel}
              </p>
              {included.wePill ? (
                <span className="whitespace-nowrap rounded-full bg-brand-primary px-[14px] py-[7px] text-[12px] font-semibold leading-none text-[#060F1E]">
                  {included.wePill}
                </span>
              ) : null}
            </div>
            {included.weSubhead ? <h3 className={COL_TITLE}>{included.weSubhead}</h3> : null}
            {included.weBody ? (
              <p className="mt-[14px] max-w-[520px] text-[14.5px] leading-[22px] text-[#8B96A8]">
                {included.weBody}
              </p>
            ) : null}
            <ul className="mt-[30px] grid grid-cols-1 gap-[10px] min-[1181px]:grid-cols-2">
              {included.we.map((b) => (
                <li key={b} className={cn(ITEM, 'items-start border border-[#22314D]')}>
                  <span
                    aria-hidden="true"
                    className="mt-[1px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-brand-primary"
                  >
                    <CheckMark tone="ink" />
                  </span>
                  <span className={ITEM_TEXT}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FEE BAR */}
        <div className="border-t border-[#22314D] bg-[#101B30] px-[22px] py-[20px] min-[901px]:px-[40px] min-[901px]:py-[22px]">
          <p className="text-[15px] leading-[22px] text-[#8B96A8]">
            <strong className="font-semibold text-white">{footLead}</strong>{' '}
            {footRest}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Regions strip (PH-only: Makati / Cebu / Clark + retention) ───────────────
function RegionsStrip({ content }: { content: LocationContent }) {
  const strip = content.regionsStrip
  if (!strip) return null
  const accentMatch = strip.title.match(/^(.*?)\s+(three regions\.)$/i)
  const titleLead = accentMatch?.[1] ?? strip.title
  const titleAccent = accentMatch?.[2] ?? ''
  return (
    <section className={cn(BAND, 'py-[72px] text-center')}>
      <div className="mt-3">
        <Heading lead={titleLead} accent={titleAccent} size="text-[30px] lg:text-[44px]" />
      </div>
      <div className="mt-10 text-left">
        <HubPanels panels={strip.hubs.map((hub) => ({ name: hub.city, note: hub.note, image: hub.image }))} />
      </div>
      <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#22314D] bg-[#101B30] px-5 py-3">
        <span className="text-[17px] font-bold text-white">{strip.retentionValue}</span>
        <span className="text-[12.5px] text-[#B8C2D1]">{strip.retentionLabel}</span>
      </div>
    </section>
  )
}

// ── Location banner + secondary hubs ────────────────────────────────────────
function SecondaryHub({ hub }: { hub: HubCard }) {
  return (
    <div className="relative h-[200px] overflow-hidden rounded-[20px] border border-[#22314D]">
      <img src={hub.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/95 via-[#060F1E]/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[18px] font-semibold text-white">{hub.city}</p>
        <p className="text-[13px] text-white/70">{hub.note}</p>
      </div>
    </div>
  )
}

function PrimaryHub({ content }: { content: LocationContent }) {
  const { primaryHub } = content
  return (
    <section className={cn(BAND, 'py-[72px] text-center')}>
      <Eyebrow className="text-center">{primaryHub.eyebrow}</Eyebrow>
      <div className="mt-3">
        <Heading lead={primaryHub.titleLead} accent={primaryHub.titleAccent} />
      </div>
      <div className="relative mt-10 h-[480px] overflow-hidden rounded-[24px] border border-[#22314D]">
        <img src={primaryHub.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/96 via-[#060F1E]/40 to-transparent" />
        <span className="absolute left-8 top-8 rounded-pill bg-[#060F1E]/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-brand-primary">
          {primaryHub.bannerEyebrow}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-8 text-left lg:p-12">
          <p className="max-w-[640px] text-[28px] font-bold leading-[1.15] tracking-[-0.6px] text-white lg:text-[34px]">{primaryHub.bannerTitle}</p>
          <p className={cn('mt-3 max-w-[640px] text-[15px] leading-[23px]', BODY)}>{primaryHub.bannerBody}</p>
        </div>
      </div>
      <p className="mt-8 text-left text-[10px] font-semibold uppercase tracking-[1.4px] text-[#7F8CA0]">{primaryHub.secondaryEyebrow}</p>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {primaryHub.secondary.map((h) => (
          <SecondaryHub key={h.city} hub={h} />
        ))}
      </div>
    </section>
  )
}

// ── Sample profiles ─────────────────────────────────────────────────────────
// Reference layout (docs sample-profiles PNG): identity sits at the TOP of the
// card over the photo, the flag is a prominent chip top-right, the portrait
// fills the frame, and the credentials block (skill chips, years, bio) sits at
// the bottom on solid card ground rather than floating over the picture. The
// previous version stacked everything at the bottom over a heavy scrim, which
// buried the name and washed the face out.
function ProfileCard({ p }: { p: EngineerProfile }) {
  return (
    <li
      className={cn(
        'flex flex-col overflow-hidden rounded-[20px] border border-[#22314D] bg-[#0C1729] text-left',
        CARD_HOVER,
      )}
    >
      <div className="relative h-[330px]">
        {/* object-top keeps faces framed; cover prevents stretch/squash on mobile */}
        <img
          src={p.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          loading="lazy"
        />
        {/* Top scrim for the name; bottom scrim melts the photo into the card. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[130px] bg-gradient-to-b from-[#060F1E]/90 via-[#060F1E]/45 to-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-[#0C1729] via-[#0C1729]/75 to-transparent"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-[19px] font-semibold leading-[24px] text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.85)]">
              {p.name}
            </p>
            <p className="mt-[3px] text-[12.5px] leading-[17px] text-white/85 drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)]">
              {p.role}
            </p>
          </div>
          {/* Flag chip: passport-shaped, ringed and shadowed so it reads as a
              deliberate badge instead of a small emoji lost on the photo. */}
          {p.flag ? (
            <span className="flex h-[34px] w-[46px] shrink-0 items-center justify-center rounded-[9px] bg-[#0A1628]/85 text-[24px] leading-none shadow-[0_2px_10px_rgba(0,0,0,0.45)] ring-1 ring-white/40 backdrop-blur-sm">
              {p.flag}
            </span>
          ) : null}
        </div>

        {p.skills.length ? (
          <ul className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 px-5 pb-4">
            {p.skills.map((s) => (
              <li
                key={s}
                className="rounded-pill border border-white/12 bg-[#060F1E]/85 px-[11px] py-[5px] text-[12px] font-semibold text-white backdrop-blur-sm"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 px-5 pb-6 pt-1">
        <p className="text-[13.5px] font-semibold text-white">{p.years}</p>
        <p className={cn('text-[13px] leading-[20px]', BODY)}>{p.bio}</p>
      </div>
    </li>
  )
}

function Engineers({ content }: { content: LocationContent }) {
  const { engineers } = content
  return (
    <section className={cn(BAND, 'py-[72px] text-center')}>
      <Heading lead={engineers.titleLead} accent={engineers.titleAccent} size="text-[32px] lg:text-[44px]" />
      <p className={cn('mx-auto mt-4 max-w-[640px] text-[16px]', BODY)}>{engineers.intro}</p>
      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {engineers.profiles.map((p) => (
          <ProfileCard key={p.name} p={p} />
        ))}
      </ul>
    </section>
  )
}

// ── Fun fact ────────────────────────────────────────────────────────────────
function FunFact({ content }: { content: LocationContent }) {
  const { funFact } = content
  return (
    <Spotlight className="py-[72px]">
      <div className={cn(BAND, 'text-center')}>
        <Eyebrow className="text-center">{funFact.eyebrow}</Eyebrow>
        <p
          data-spot-item
          className="mx-auto mt-4 max-w-[980px] text-[28px] font-medium leading-[1.35] tracking-[-0.4px] text-white transition-opacity duration-300 motion-safe:opacity-80 lg:text-[34px] lg:leading-[46px]"
        >
          {funFact.body}
        </p>
        <p className="mt-6 text-[12px] text-[#6B7589]">{funFact.source}</p>
      </div>
    </Spotlight>
  )
}

// ── Calculator ──────────────────────────────────────────────────────────────
function Calculator({ content }: { content: LocationContent }) {
  const { calculator } = content
  return (
    <section id="calculator" className={cn(BAND, 'py-[72px]')}>
      <Eyebrow>{calculator.eyebrow}</Eyebrow>
      <h2 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-1.4px] text-white lg:text-[52px]">
        {calculator.titleLead} <span className={ACCENT}>{calculator.titleAccent}</span> {calculator.titleSuffix}
      </h2>
      <div className="relative mt-8">
        {/* Savings sticker is rendered inside LocationCalculator so it always
            matches the live computed annual figure (no $78,000 vs $78,001 drift). */}
        <LocationCalculator
          regions={calculator.calcRegions}
          roles={calculator.roles}
          seniorityOptions={calculator.seniorityOptions}
          currency={calculator.currency}
          comparisonMultiple={calculator.comparisonMultiple}
          labels={{
            roleLabel: 'Role',
            regionLabel: 'Region',
            seniorityLabel: 'Seniority',
            regionValue: content.region,
            monthlyEyebrow: calculator.resultEyebrow ?? 'Estimated monthly cost',
            monthlySuffix: '/mo, all-in',
            savedPrefix: calculator.savedPrefix ?? 'vs. hiring in the US',
            savedSuffix: '/yr saved',
            cta: 'Get matched at this rate',
            ctaHref: '/book-a-call',
          }}
        />
      </div>
      <p className="mt-4 text-[12px] text-[#6B7589]">{calculator.disclaimer}</p>
    </section>
  )
}

// ── Three ways to start ─────────────────────────────────────────────────────
function StartTile({ card, featured }: { card: StartCard; featured?: boolean }) {
  return (
    <li className={cn(CARD, CARD_HOVER, 'flex flex-col gap-3 p-6', featured && 'h-full')}>
      {card.eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-brand-primary">{card.eyebrow}</p> : null}
      {featured ? (
        <span className={cn(ICON_TILE, 'mb-1 bg-brand-primary')}>
          {/* Lime tile, so the line-icon inverts to dark ink rather than lime. */}
          <svg {...iconBase} stroke="#060F1E" className={ICON_GLYPH}>
            <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
          </svg>
        </span>
      ) : null}
      <h3 className="text-[20px] font-semibold text-white">{card.title}</h3>
      <p className={cn('text-[14px] leading-[21px]', BODY)}>{card.body}</p>
      {card.bullets ? (
        <ul className="flex flex-col gap-3">
          {card.bullets.map((b) => (
            <li
              key={b}
              className={cn('grid grid-cols-[22px_1fr] items-start gap-x-[10px] text-[13.5px] leading-[20px]', BODY)}
            >
              <span
                aria-hidden="true"
                className="mt-[3px] grid h-[22px] w-[22px] place-items-center rounded-full bg-brand-primary/12"
              >
                <CheckMark />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {featured ? (
        <a
          href={card.ctaHref}
          className="sf sf-p mt-auto inline-flex w-fit items-center gap-2 rounded-full px-6 py-[14px] text-[15px] font-semibold"
        >
          <span className="c inline-flex items-center gap-2">
            {card.cta}
            <span aria-hidden="true" className="text-[15px] font-bold">{GLYPH.arrow}</span>
          </span>
        </a>
      ) : (
        <a
          href={card.ctaHref}
          className="sf sf-link -mx-1.5 -my-0.5 mt-auto inline-flex items-center gap-2 rounded-md px-1.5 py-0.5 text-[14px] font-semibold"
        >
          <span className="c inline-flex items-center gap-2">
            {card.cta}
            <span aria-hidden="true">{GLYPH.arrow}</span>
          </span>
        </a>
      )}
    </li>
  )
}

function Start({ content }: { content: LocationContent }) {
  const { start } = content

  // Quiz / none: the quick hiring form (LeadFormSection below) replaced the
  // old STEP-1-OF-4 role picker. Skip this whole block so the page only shows
  // one conversion path. 'quiz' stays as a Sanity-compat value for the PH doc.
  if (start.variant === 'quiz' || start.variant === 'none') {
    return null
  }

  const [first, ...rest] = start.cards
  return (
    <Spotlight className="py-[72px]">
      <div className={BAND}>
        {/* Only the eyebrow + heading dim under the spotlight; the cards + CTAs
            below stay full-bright. */}
        <div data-spot-item className="transition-opacity duration-300 motion-safe:opacity-50">
          <Eyebrow>{start.eyebrow}</Eyebrow>
          <div className="mt-3">
            <Heading lead={start.titleLead} accent={start.titleAccent} />
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StartTile card={first} featured />
          <ul className="flex flex-col gap-6">
            {rest.map((c) => (
              <StartTile key={c.title} card={c} />
            ))}
          </ul>
        </div>
      </div>
    </Spotlight>
  )
}

// ── FAQ ─────────────────────────────────────────────────────────────────────
function Faq({ content }: { content: LocationContent }) {
  const { faq } = content
  return (
    <section className={cn(BAND, 'pb-[112px] pt-[72px]')}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_1fr]">
        <div className={STICKY_ASIDE}>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-[34px] font-bold leading-[1.08] tracking-[-1px] text-white lg:text-[46px]">{faq.title}</h2>
          <FaqChatCard
            className="mt-8"
            label={faq.helpEyebrow}
            body={faq.helpBody}
            cta={faq.helpCta}
          />
        </div>
        <div className="flex flex-col">
          {faq.items.map((item, i) => (
            <details key={item.number ?? `faq-${i}`} className="group border-b border-[#22314D]">
              <summary className="flex cursor-pointer list-none items-center gap-4 py-5 [&::-webkit-details-marker]:hidden">
                <span className="shrink-0 text-[14px] font-semibold tabular-nums text-brand-primary">{item.number}</span>
                <span className="flex-1 text-[16px] font-semibold leading-snug text-white">{item.question}</span>
                <span aria-hidden="true" className="shrink-0 text-[20px] leading-none text-brand-primary transition-transform duration-200 group-open:rotate-45">
                  {GLYPH.plus}
                </span>
              </summary>
              <p className={cn('pb-5 pl-[30px] text-[15px] leading-[24px]', BODY)}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LocationTemplate({
  content,
  locale = 'en-US',
}: {
  content: LocationContent
  locale?: Locale
}) {
  const isPh = Boolean(content.eor)
  return (
    // overflow-x-CLIP, not hidden: `hidden` makes this element a scroll
    // container, which silently kills the sticky FAQ intro column inside it.
    <main id="main" className="overflow-x-clip">
      {/* Hero + trust bar claim the first screen together. */}
      <div className="hero-screen">
        <Hero content={content} />
        <LogoStrip content={content} locale={locale} />
      </div>
      <Advantage content={content} />
      <VideoFeature content={content} />
      {isPh ? (
        <>
          <RegionsStrip content={content} />
          <Eor content={content} />
          <Included content={content} />
          <Engineers content={content} />
          <PrimaryHub content={content} />
        </>
      ) : (
        <>
          <OnGround content={content} />
          <Included content={content} />
          <PrimaryHub content={content} />
          <Engineers content={content} />
        </>
      )}
      <FunFact content={content} />
      <Calculator content={content} />
      <Start content={content} />
      {/* Above the FAQ, same position as the services and technology detail
          pages. No role prefill: a location page answers WHERE, not which role,
          so preselecting one would be a guess. `content.slug` is the page's own
          slug, so the lead records which region it came from. */}
      <LeadFormSection sourcePage={buildLocalePath(`/services/${content.slug}`, locale)} />
      <Faq content={content} />
    </main>
  )
}
