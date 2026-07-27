import { cn } from '@/components/ui/_utils/cn'
import { ChatPill } from '@/components/shared/chat-link'
import { CHAT_HREF } from '@/lib/chat'
import type { Locale } from '@/lib/locale-path'

// The "Can't find your question? / Open chat" panel that sits beside an FAQ
// section. Every template that has one renders THIS component, so the card, the
// eyebrow and the CTA pill cannot drift apart again: Home, How It Works,
// Pricing, Location, Fractional CTO and the Service/Technology detail pages all
// used to hand-roll it and all six looked different.
//
// The CTA is a ChatPill, not a bare anchor — several of the hand-rolled copies
// pointed at `#` or `#faq`, which does nothing when clicked (see lib/chat.ts).

const CARD = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'
const GLYPH = { arrow: '\u2192' } as const

export interface FaqChatCardProps {
  /** Small uppercase lime label, e.g. "Can't find your question?". */
  label: string
  body: string
  cta: string
  /** `#chat` opens the widget; any other href is a normal link. */
  href?: string
  locale?: Locale
  className?: string
}

export function FaqChatCard({
  label,
  body,
  cta,
  href = CHAT_HREF,
  locale,
  className,
}: FaqChatCardProps) {
  return (
    <div className={cn(CARD, 'flex flex-col items-start gap-[10px] p-[24px]', className)}>
      <p className="text-[12px] font-bold uppercase leading-[16px] tracking-[1.2px] text-brand-primary">
        {label}
      </p>
      <p className="text-[14px] leading-[21px] text-[#B8C2D1]">{body}</p>
      <ChatPill
        href={href}
        locale={locale}
        label={cta}
        variant="pill-green"
        size="cta"
        leadingArrow
        leadingGlyph={GLYPH.arrow}
        className="mt-[6px]"
      />
    </div>
  )
}

export default FaqChatCard
