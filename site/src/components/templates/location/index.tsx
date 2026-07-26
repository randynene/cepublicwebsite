import { cn } from '@/components/ui/_utils/cn'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'

import type { AdvantageCard, EngineerProfile, HubCard, LocationContent, LocationLogo, StartCard } from './content'
import type { HomeProfile } from '@/components/templates/home/content'
import { HeroCards } from '@/components/templates/home/hero-cards'
import { LocationCalculator } from './calculator'
import { LocationStartQuiz } from './start-quiz'
import { LocationVideo } from './video'
import { Spotlight } from './spotlight'

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

const BAND = 'mx-auto w-full max-w-[1280px] px-6 xl:px-0'
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

// The logo-strip label as separate lines when the doc has none set.
const LOGOS_LABEL_LINES_FALLBACK = ['Trusted by', '300+', 'engineering teams']

// Time-zone stat-card icons: 20x20 lime line-icons (stroke #D4FF3C, no fill) on
// a dark navy #1B2A45 tile (set on the AdvantageTile wrapper).
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
  clock: <svg key="clock" {...iconBase} className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  dollar: <svg key="dollar" {...iconBase} className="h-5 w-5"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  bolt: <svg key="bolt" {...iconBase} className="h-5 w-5"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>,
  globe: <svg key="globe" {...iconBase} className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" /></svg>,
  chat: (
    <svg key="chat" {...iconBase} className="h-5 w-5">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  users: (
    <svg key="users" {...iconBase} className="h-5 w-5">
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

function Eyebrow({ children, className }: { children: string; className?: string }) {
  return <p className={cn(EYEBROW, className)}>{children}</p>
}

function Heading({ lead, accent, size = 'text-[34px] lg:text-[52px]' }: { lead: string; accent: string; size?: string }) {
  return (
    <h2 className={cn(size, 'font-bold leading-[1.05] tracking-[-1.4px] text-white')}>
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
          {hero.titleConnector} <span className={ACCENT}>{hero.titleAccent}</span>
        </h1>
        <p className={cn('mt-6 max-w-[540px] text-[18px] leading-[28px]', BODY)}>{hero.paragraph}</p>
        <div className="mt-8 flex flex-wrap items-center gap-[14px]">
          <MegaMenuPillLabel
            as="a"
            href="/start-hiring"
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
        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
          {hero.trustPills.map((p) => (
            <li key={p} className={cn('flex items-center gap-2 text-[13px]', BODY)}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Right column - reuses the home page photo-card stack (same on all three
          regions for now). Desktop = hover-parallax stack; mobile = single photo. */}
      <div className="relative w-full">
        <div className="hidden lg:block">
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

// ── Logo bar ────────────────────────────────────────────────────────────────
function LogoStrip({ content }: { content: LocationContent }) {
  const logos = content.logos?.length ? content.logos : LOGOS_FALLBACK
  const labelLines =
    content.logosLabelLines?.length
      ? content.logosLabelLines
      : content.logosLabel
        ? [content.logosLabel]
        : LOGOS_LABEL_LINES_FALLBACK
  return (
    <section className={cn(BAND, 'mt-[24px] flex flex-col items-center gap-5 py-[24px] lg:flex-row lg:justify-center lg:gap-8')}>
      <p className="max-w-[140px] text-center text-[11px] font-semibold uppercase leading-[1.5] tracking-[1.4px] text-[#7F8CA0] lg:text-left">
        {labelLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <span aria-hidden="true" className="hidden h-6 w-px bg-[#22314D] lg:block" />
      <ul className="flex flex-nowrap items-center justify-around gap-x-3 overflow-hidden lg:flex-1">
        {logos.map((l, i) => (
          <li key={l.name} className="flex shrink-0 items-center gap-x-3">
            {i > 0 ? <span aria-hidden="true" className="h-6 w-px bg-[#22314D]" /> : null}
            <img
              src={l.src}
              alt={l.name}
              style={{ height: l.displayH ?? 22, opacity: l.displayOpacity ?? 1 }}
              className={cn('w-auto', (l.invert ?? true) && '[filter:brightness(0)_invert(1)]')}
              loading="lazy"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Time-zone advantage ─────────────────────────────────────────────────────
function AdvantageTile({ card, icon }: { card: AdvantageCard; icon: React.ReactNode }) {
  return (
    <li className={cn(CARD, CARD_HOVER, 'flex flex-col gap-2 p-6 text-left')}>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#1B2A45]">
        {icon}
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#6B7589]">{card.eyebrow}</p>
      <h3 className="text-[24px] font-bold text-white">{card.title}</h3>
      <p className={cn('text-[14px] leading-[21px]', BODY)}>{card.body}</p>
    </li>
  )
}

function Advantage({ content }: { content: LocationContent }) {
  const { advantage } = content
  return (
    <section className={cn(BAND, 'py-[80px]')}>
      <Eyebrow>{advantage.eyebrow}</Eyebrow>
      <div className="mt-3 max-w-[720px]">
        <Heading lead={advantage.titleLead} accent={advantage.titleAccent} />
      </div>
      <p className={cn('mt-4 max-w-[700px] text-[16px]', BODY)}>{advantage.intro}</p>
      <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
    <section className={cn(BAND, 'py-[72px] text-center')}>
      <Eyebrow className="text-center">{video.eyebrow}</Eyebrow>
      <div className="mt-3">
        <Heading lead={video.titleLead} accent={video.titleAccent} />
      </div>
      <p className={cn('mx-auto mt-4 max-w-[760px] text-[16px]', BODY)}>{video.intro}</p>
      <div className="mt-10">
        <LocationVideo
          image={video.image}
          presenter={video.presenter}
          pullQuote={video.pullQuote}
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
            <li key={b} className={cn('flex items-start gap-3 text-[15px]', BODY)}>
              <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-[11px] text-brand-primary">
                {GLYPH.check}
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ── EOR / "How we keep your engineer" (PH-only) ─────────────────────────────
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
            {items.slice(0, 3).map((item) => (
              <li key={item.title} className={cn(CARD, CARD_HOVER, 'flex flex-col gap-2 p-6')}>
                <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15 text-[13px] text-brand-primary">
                  {GLYPH.check}
                </span>
                <h3 className="text-[17px] font-semibold text-white">{item.title}</h3>
                <p className={cn('text-[14px] leading-[21px]', BODY)}>{item.body}</p>
              </li>
            ))}
          </ul>
          <ul className="mx-auto grid w-full max-w-[calc((100%-2.5rem)*2/3)] grid-cols-1 gap-5 md:grid-cols-2">
            {items.slice(3).map((item) => (
              <li key={item.title} className={cn(CARD, CARD_HOVER, 'flex flex-col gap-2 p-6')}>
                <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15 text-[13px] text-brand-primary">
                  {GLYPH.check}
                </span>
                <h3 className="text-[17px] font-semibold text-white">{item.title}</h3>
                <p className={cn('text-[14px] leading-[21px]', BODY)}>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.title} className={cn(CARD, CARD_HOVER, 'flex flex-col gap-2 p-6')}>
              <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15 text-[13px] text-brand-primary">
                {GLYPH.check}
              </span>
              <h3 className="text-[17px] font-semibold text-white">{item.title}</h3>
              <p className={cn('text-[14px] leading-[21px]', BODY)}>{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── "What's included" split list (PH-only) ──────────────────────────────────
function Included({ content }: { content: LocationContent }) {
  const { included } = content
  if (!included) return null
  return (
    <section className={cn(BAND, 'py-[72px]')}>
      <Eyebrow>{included.eyebrow}</Eyebrow>
      <div className="mt-3">
        <Heading lead={included.titleLead} accent={included.titleAccent} size="text-[30px] lg:text-[40px]" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cn(CARD, 'p-8')}>
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-brand-primary">{included.youLabel}</p>
          {included.youSubhead ? (
            <p className="mt-3 whitespace-pre-line text-[22px] font-semibold leading-[32px] tracking-[-0.6px] text-white">
              {included.youSubhead.replace(/\. /g, '.\n')}
            </p>
          ) : null}
          <ul className={cn('flex flex-col gap-4', included.youSubhead ? 'mt-7' : 'mt-5')}>
            {included.you.map((b) => (
              <li key={b} className={cn('flex items-start gap-3 text-[16px] font-medium text-white')}>
                <span aria-hidden="true" className="mt-1 text-brand-primary">{GLYPH.arrow}</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[20px] bg-brand-primary p-8 text-[#060F1E]">
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[#060F1E]/70">{included.weLabel}</p>
          {included.weSubhead ? (
            <p className="mt-3 text-[22px] font-semibold leading-[32px] tracking-[-0.6px] text-[#060F1E]">
              {included.weSubhead}
            </p>
          ) : null}
          <ul className={cn('flex flex-col gap-4', included.weSubhead ? 'mt-7' : 'mt-5')}>
            {included.we.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] font-medium">
                <span aria-hidden="true" className="mt-0.5">{GLYPH.check}</span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[18px] font-bold">{included.footnote}</p>
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
      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {strip.hubs.map((hub) => (
          <li key={hub.city} className="relative h-[240px] overflow-hidden rounded-[20px] border border-[#22314D]">
            <img src={hub.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/95 via-[#060F1E]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-left">
              <p className="text-[18px] font-semibold text-white">{hub.city}</p>
              <p className="text-[13px] text-white/70">{hub.note}</p>
            </div>
          </li>
        ))}
      </ul>
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

// ── Sample profiles (full-photo overlay cards) ──────────────────────────────
function ProfileCard({ p }: { p: EngineerProfile }) {
  return (
    <li className="relative h-[540px] overflow-hidden rounded-[20px] border border-[#22314D] bg-[#16223A]">
      <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060F1E]/[0.97] via-[#060F1E]/55 to-[#060F1E]/10" />
      <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-[#0A1628]/80 text-[15px]">
        {p.flag}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-6 text-left">
        <p className="text-[19px] font-semibold text-white">{p.name}</p>
        <p className="text-[13px] text-brand-primary">{p.role}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <li key={s} className="rounded-md bg-brand-primary px-2.5 py-1 text-[12px] font-semibold text-[#060F1E]">
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] font-semibold text-white">{p.years}</p>
        <p className={cn('mt-2 text-[13px] leading-[20px]', BODY)}>{p.bio}</p>
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
          className="mx-auto mt-4 max-w-[980px] text-[28px] font-medium leading-[1.35] tracking-[-0.4px] text-white transition-opacity duration-300 motion-safe:opacity-40 lg:text-[34px] lg:leading-[46px]"
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
        {/* rotated savings sticker overlapping top-right */}
        <span
          className="absolute -top-6 right-4 z-10 flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white text-center text-[#060F1E] shadow-[0_20px_40px_-16px_rgba(0,0,0,.6)]"
          style={{ transform: 'rotate(-12deg)' }}
        >
          <span className="text-[13px] font-extrabold leading-tight">{calculator.savingsSticker}</span>
          <span className="mt-0.5 text-[9px] font-medium text-[#060F1E]/70">{calculator.savingsStickerSub}</span>
        </span>
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
            ctaHref: '/start-hiring',
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
        <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand-primary text-[#060F1E]">
          <span aria-hidden="true">{GLYPH.check}</span>
        </span>
      ) : null}
      <h3 className="text-[20px] font-semibold text-white">{card.title}</h3>
      <p className={cn('text-[14px] leading-[21px]', BODY)}>{card.body}</p>
      {card.bullets ? (
        <ul className="flex flex-col gap-2">
          {card.bullets.map((b) => (
            <li key={b} className={cn('flex items-start gap-2 text-[13px]', BODY)}>
              <span aria-hidden="true" className="mt-0.5 text-brand-primary">{GLYPH.check}</span>
              {b}
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

  if (start.variant === 'quiz' && start.quiz) {
    return (
      <Spotlight className="py-[72px]">
        <div className={BAND}>
          <LocationStartQuiz
            eyebrow={start.quiz.eyebrow || start.eyebrow}
            title={start.titleLead}
            titleAccent={start.titleAccent}
            subtitle={start.quiz.subtitle}
            stepLabel={start.quiz.stepLabel}
            prompt={start.quiz.prompt}
            hint={start.quiz.hint}
            roles={start.quiz.roles}
            cta={start.quiz.cta}
            ctaHref={start.quiz.ctaHref}
            selectedPrefix={start.quiz.selectedPrefix}
            emptyStatus={start.quiz.emptyStatus}
          />
        </div>
      </Spotlight>
    )
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
        <div>
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-[34px] font-bold leading-[1.08] tracking-[-1px] text-white lg:text-[46px]">{faq.title}</h2>
          <div className={cn(CARD, 'mt-8 p-6')}>
            <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#7F8CA0]">{faq.helpEyebrow}</p>
            <p className={cn('mt-2 text-[15px]', BODY)}>{faq.helpBody}</p>
            <a href="#chat" className="mt-4 inline-flex items-center gap-2 rounded-pill bg-brand-primary px-4 py-2 text-[13px] font-bold text-[#060F1E]">
              <span aria-hidden="true">{GLYPH.arrow}</span>
              {faq.helpCta}
            </a>
          </div>
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

export function LocationTemplate({ content }: { content: LocationContent }) {
  const isPh = Boolean(content.eor)
  return (
    <main id="main" className="overflow-x-hidden">
      <Hero content={content} />
      <LogoStrip content={content} />
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
          <PrimaryHub content={content} />
          <Engineers content={content} />
        </>
      )}
      <FunFact content={content} />
      <Calculator content={content} />
      <Start content={content} />
      <Faq content={content} />
    </main>
  )
}
