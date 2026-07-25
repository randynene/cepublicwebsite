import { PortableText } from '@/components/ui/portable-text'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { FaqItem } from '@/types/sanity/shared'

// The hub FAQ accordion. Spec §5.
//
// A NEW component rather than the existing ui/faq-list, which is drawn differently:
// that one sits on #101B30 with a 20px radius and a lime circle-plus glyph. The spec
// wants a #0A1628 panel, a 14px radius, a bare lime plus that rotates to an x, and a
// 3px lime rule down the left edge when open. Two components, because they are two
// designs - not one component with a flag, which is how a design system quietly
// becomes a pile of exceptions.
//
// Built on <details>/<summary>, so it opens with JavaScript disabled, it is
// keyboard-operable and screen-reader-announced for free, and it needs no client
// component. The answers are therefore in the HTML at first paint, which is also what
// lets a crawler read them - and reading them is the whole point of the block.
//
// The FAQPage JSON-LD is emitted by the caller, not here: it must appear once per
// page, and a component that emitted it per item would produce four competing
// FAQPage blocks.

type PortableValue = Parameters<typeof PortableText>[0]['value']

export function BlogFaqAccordion({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {items.map((faq, i) => (
        <details
          key={faq._key ?? `faq-${i}`}
          className="group rounded-[14px] border border-[#22314D] border-l-[3px] border-l-transparent bg-[#0A1628] transition-colors duration-200 open:border-l-brand-primary motion-reduce:transition-none"
        >
          <summary
            className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18] [&::-webkit-details-marker]:hidden"
          >
            <span className="text-[16px] font-semibold leading-snug text-text-default">
              {faq.question}
            </span>

            {/* One glyph, rotated. A plus turned 45 degrees IS an x, so the open and
                closed states cannot drift apart or land on different pixel grids, and
                the rotation animates where swapping two icons would jump. */}
            <span
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[20px] font-light leading-none text-brand-primary transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
            >
              {UI_STRINGS['blog.faqToggle']}
            </span>
          </summary>

          <div className="px-5 pb-5 text-[16px] leading-[26px] text-text-default/70">
            <PortableText value={faq.answer as PortableValue} />
          </div>
        </details>
      ))}
    </div>
  )
}
