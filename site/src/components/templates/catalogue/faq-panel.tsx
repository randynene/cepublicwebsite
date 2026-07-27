import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/components/ui/_utils/cn'
import { FaqChatCard } from '@/components/shared/faq-chat-card'
import { STICKY_ASIDE } from '@/components/layout/sticky-aside'
import { CHAT_HREF } from '@/lib/chat'
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

export function CatalogueFaqPanel({ items, chatHref = CHAT_HREF }: { items: HubFaq[]; chatHref?: string }) {
  return (
    <section className={cn(BAND_1280, 'py-[72px]')}>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.6fr]">
        <div className={STICKY_ASIDE}>
          <Eyebrow>{COPY.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-white lg:text-[46px] lg:leading-[54px]">
            {COPY.titleLead} <span className={ACCENT}>{COPY.titleAccent}</span>
          </h2>
          <FaqChatCard
            className="mt-7"
            label={COPY.cardLabel}
            body={COPY.cardBody}
            cta={COPY.cardCta}
            href={chatHref}
          />
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
