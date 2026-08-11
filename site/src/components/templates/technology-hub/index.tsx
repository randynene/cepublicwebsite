import { cn } from '@/components/ui/_utils/cn'
import { TypewriterText } from '@/components/motion/typewriter-text'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'
import { type Technology } from '@/data/technologies'
import type { TechnologyHubContent } from '@/lib/catalogue/hub-content'
import { CatalogueFaq } from '@/components/templates/catalogue/faq'
import { TechBadge } from '@/components/ui/tech-badge'
import { ACCENT, BAND, BODY, CAT_LABELS, Chevron, Eyebrow, HubQuotes, HubStories } from '@/components/templates/catalogue/shared'
import { LeadFormSection } from '@/components/lead-form/section'

// TEMPLATE-TECHNOLOGY-HUB - /technology index. Approved D3 design, fed by Sanity
// (Phase 2B): the full alphabetical directory + hero lead + FAQs come from Sanity
// via mapTechnologyHubData; stories/quotes carousels stay fixed brand furniture.
// `pathPrefix` carries the locale ('' for US, '/uk' for UK); every card links to a
// real Sanity slug. Header/footer + closing CTA are sitewide chrome.

function TechCard({ t, prefix }: { t: Technology; prefix: string }) {
  return (
    <a
      href={`${prefix}/technology/${t.slug}`}
      className="group flex min-h-[120px] items-center gap-4 rounded-[20px] border border-[#22314D] bg-[#101B30] px-[22px] py-[20px] transition-colors duration-200 hover:bg-[#1B2A45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16.5px] font-semibold text-white">{t.title}</span>
        <span className="mt-1 block truncate text-[13.5px] font-normal text-[#7F8CA0]">{t.subtitle}</span>
      </span>
      <TechBadge slug={t.slug} logo={t.logo} abbr={t.abbr} />
      <Chevron className="h-4 w-4 shrink-0 text-[#7F8CA0] transition-colors group-hover:text-brand-primary" />
    </a>
  )
}

export function TechnologyHubTemplate({ content, pathPrefix = '' }: { content: TechnologyHubContent; pathPrefix?: string }) {
  const h = content
  return (
    // overflow-x-CLIP, not hidden: `hidden` makes this element a scroll
    // container, which silently kills the sticky FAQ intro column inside it.
    <main id="main" className="overflow-x-clip">
      {/* Hero + search */}
      <section className={cn(BAND, 'pb-[24px] pt-[72px] text-center lg:pt-[96px]')}>
        <span className="inline-flex items-center gap-2 rounded-pill border border-brand-primary/30 bg-brand-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[1px] text-brand-primary">
          {h.hero.eyebrow}
        </span>
        <h1 className="mx-auto mt-6 max-w-[900px] text-marketing-hero text-white">
          {h.hero.titleLead} <TypewriterText segments={[{ text: h.hero.titleAccent, className: ACCENT }]} />
        </h1>
        <p className={cn('mx-auto mt-5 max-w-[560px] text-[18px] leading-[28px]', BODY)}>{h.hero.lead}</p>
        <form action={`${pathPrefix}/technology`} className="mx-auto mt-8 flex max-w-[520px] items-center gap-2">
          <input
            type="search"
            name="q"
            placeholder={h.hero.searchPlaceholder}
            aria-label={h.hero.searchPlaceholder}
            className="flex-1 rounded-pill border border-[#22314D] bg-[#101B30] px-5 py-3.5 text-[14px] text-white placeholder:text-[#7F8CA0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button type="submit" className="sf sf-p rounded-pill px-6 py-3.5 text-[14px] font-semibold">
            <span className="c">{CAT_LABELS.search}</span>
          </button>
        </form>
      </section>

      {/* Directory grid */}
      <section className={cn(BAND, 'py-[40px]')}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>{h.gridEyebrow}</Eyebrow>
            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.8px] text-white lg:text-[32px]">{h.gridHeading}</h2>
          </div>
          <p className="text-[13px] text-[#7F8CA0]">{h.countLabel}</p>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {h.technologies.map((t) => (
            <li key={t.slug} className="contents">
              <TechCard t={t} prefix={pathPrefix} />
            </li>
          ))}
        </ul>
      </section>

      <HubStories eyebrow="Real teams, real results" heading="Hear from our customers" stories={h.stories} />
      <HubQuotes eyebrow="In their words" lead="What the difference" accent="feels like" quotes={h.quotes} />

      <LeadFormSection sourcePage={`${pathPrefix}/technology`} />

      {/* FAQ */}
      <section className={cn(BAND, 'py-[64px]')}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className={STICKY_ASIDE}>
            <Eyebrow>{CAT_LABELS.gotQuestions}</Eyebrow>
            <h2 className="mt-3 text-[34px] font-semibold tracking-[-1px] text-white lg:text-[42px]">
              {CAT_LABELS.theQuestionsLead} <span className={ACCENT}>{CAT_LABELS.ctosAskAccent}</span>
            </h2>
          </div>
          <CatalogueFaq items={h.faqs} />
        </div>
      </section>
    </main>
  )
}
