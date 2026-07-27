import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/components/ui/_utils/cn'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'
import type { HubFaq } from '@/data/services'
import { ACCENT, BAND_1280, BODY, Eyebrow } from './shared'

// Home-style two-column FAQ (technology detail). Reuses the shared Storybook
// Accordion primitive (its trigger indicator is the +/x cross that rotates open).
// Left: eyebrow + heading + "can't find your question" chatbot card. Right:
// numbered accordion with 1px #22314D dividers.

const COPY = {
  eyebrow: 'Got questions?',
  titleLead: 'The questions',
  titleAccent: 'CTOs and founders ask.',
  cardLabel: "Can't find your question?",
  cardBody: "Ask our AI chatbot, trained on every sales call we've had.",
  cardCta: 'Open chat',
} as const

const GLYPH = { arrow: '→' } as const

export function CatalogueFaqPanel({ items, chatHref = '#chat' }: { items: HubFaq[]; chatHref?: string }) {
  return (
    <section className={cn(BAND_1280, 'py-[72px]')}>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.6fr]">
        <div className={STICKY_ASIDE}>
          <Eyebrow>{COPY.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-white lg:text-[46px] lg:leading-[54px]">
            {COPY.titleLead} <span className={ACCENT}>{COPY.titleAccent}</span>
          </h2>
          <div className="mt-7 flex flex-col items-start gap-2.5 rounded-[20px] border border-[#22314D] bg-[#101B30] p-6">
            <span className="text-[13px] font-bold uppercase tracking-[0.9px] text-white">{COPY.cardLabel}</span>
            <p className={cn('text-[14px] leading-[21px]', BODY)}>{COPY.cardBody}</p>
            <a
              href={chatHref}
              className="sf sf-p mt-1 inline-flex items-center gap-2 rounded-pill px-5 py-2.5 text-[14px] font-bold"
            >
              <span className="c inline-flex items-center gap-2">
                <span aria-hidden="true">{GLYPH.arrow}</span>
                {COPY.cardCta}
              </span>
            </a>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((f, i) => {
            const num = String(i + 1).padStart(2, '0')
            return (
              <AccordionItem key={f.q} value={num} className="border-t border-[#22314D] last:border-b last:border-[#22314D]">
                <AccordionTrigger className="gap-5 px-0 py-[26px] text-left hover:no-underline">
                  <span className="shrink-0 text-[13px] font-bold text-brand-primary">{num}</span>
                  <span className="flex-1 text-[16px] font-semibold leading-[24px] text-white transition-colors group-hover:text-brand-primary lg:text-[18px]">
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-5 pt-0">
                  <p className={cn('pl-[34px] text-[15px] leading-[24px]', BODY)}>{f.a}</p>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </section>
  )
}
