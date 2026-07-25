import { BlogFaqAccordion } from '@/components/blog/faq-accordion'
import { PortableText } from '@/components/ui/portable-text'
import type { FaqItem } from '@/types/sanity/shared'
import { UI_STRINGS } from '@/lib/ui-strings'

// The long-form + FAQ band. Spec §5.
//
// This is the home for the 700+ words each topic hub actually ranks on, and it is the
// gap the original Blog Index design had nowhere to put. It sits AFTER the grid and
// its pagination, BEFORE the closing CTA (which the footer already renders sitewide -
// it is not built here).
//
// A 720px reading column, not the full 1280px grid width. The grid above stays full
// width and the prose narrows, because a 1280px line of body copy is about 160
// characters and nobody reads it. This is the one place on the page where the measure
// matters more than filling the space.
//
// /blog does not have this band at all - it carries a short hero lead and nothing
// else, which is why `body` arrives empty there and the component returns null.

type PortableValue = Parameters<typeof PortableText>[0]['value']

export function LongFormBand({
  body,
  faqs,
}: {
  body: unknown[]
  faqs: FaqItem[]
}) {
  if (body.length === 0 && faqs.length === 0) return null

  return (
    <section className="mt-20 border-t border-[#22314D] pt-16">
      {/* The reading column. */}
      <div className="mx-auto w-full max-w-[720px]">
        {body.length > 0 ? (
          // Real <h2>/<h3> come out of the Portable Text, so this doubles as the
          // page's crawlable outline (spec §7). The prose classes below only style
          // them; they do not invent them.
          //
          // Inline links are lime and underlined with a 3px offset (spec §5). These
          // are the "View related blog" links threading into individual articles -
          // on a hub page the internal links ARE the SEO value, so they are meant to
          // look like links, not like body text that happens to be clickable.
          <div
            className="
              text-[16px] leading-[28px] text-text-default/70
              [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-[26px] [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:text-text-default
              [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-[20px] [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-text-default
              [&_p]:mb-4
              [&_ul]:mb-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5
              [&_li]:marker:text-brand-primary/60
              [&_a]:text-brand-primary [&_a]:underline [&_a]:underline-offset-[3px]
              [&_a:hover]:text-brand-secondary
              [&_strong]:font-semibold [&_strong]:text-text-default
              [&_*:first-child]:mt-0
            "
          >
            <PortableText value={body as PortableValue} />
          </div>
        ) : null}

        {faqs.length > 0 ? (
          <div className="mt-14">
            <h2 className="mb-6 text-[26px] font-semibold leading-snug text-text-default">
              {UI_STRINGS['hub.faqHeading']}
            </h2>
            <BlogFaqAccordion items={faqs} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
