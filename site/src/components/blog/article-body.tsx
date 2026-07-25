import { PortableText } from '@/components/ui/portable-text'
import { headingIdFor } from '@/lib/blog/toc'

// The article body: anchored headings + a deliberate reading typography. Spec §7.3.
//
// Two jobs here.
//
// 1. TYPOGRAPHY. The default renderer set body copy at 13px with no space between
//    paragraphs, which read as cramped and is the main reason the page "felt off". This
//    sets a real reading scale - 18px / 29px line-height / 20px between paragraphs,
//    matching the reference Jake shared - as prose utilities on the wrapper, so every
//    block (paragraphs, lists, quotes, links) picks it up uniformly.
//
//    Every spacing value is in explicit px. This project sets `--spacing: 0.5rem`, so
//    the Tailwind scale is 8px-based: `mb-5` is 40px here, not 20, and `mt-12` is 96px.
//    That 8px trap is exactly what produced the 96px gaps above headings. px removes the
//    guesswork - the number in the class is the number on the screen.
//
// 2. ANCHORS. Every H2 gets an id from the same function the rail uses for its hrefs, so
//    the two cannot disagree. scroll-mt is 142px, not the old 96: a clicked heading has
//    to clear the 126px STICKY site header (94px nav + 32px announcement bar) or it
//    lands underneath it, which reads as a broken jump.

type PortableValue = Parameters<typeof PortableText>[0]['value']

// Clears the sticky header (94px nav + 32px announcement) + breathing room, bound to
// the same CSS variables the header uses, so a clicked heading lands just below it even
// if the chrome changes height or the announcement bar is absent.
const SCROLL_MARGIN =
  'scroll-mt-[calc(var(--header-height)+var(--announcement-bar-height)+16px)]'

export function ArticleBody({ body }: { body: unknown[] }) {
  return (
    <div
      // The font-size is set PER-ELEMENT ([&_p], [&_li]), not just on the wrapper. The
      // default PortableText paragraph renders with its own `text-body` (13px) class, and
      // an inherited font-size loses to an explicit class on the element - which is why
      // the body stayed 13px on the first attempt. A descendant selector like `& p` wins.
      // PortableText wraps every block in a `flex flex-col gap-4` (32px). Margins do NOT
      // collapse in a flex container, so paragraph-margin + heading-margin would STACK on
      // that gap and give the uneven spacing that felt off. So the base rhythm comes from
      // a single overridden gap (20px between every block), and only HEADINGS add a
      // margin-top for extra separation. One source of spacing, no stacking.
      className="
        text-[18px] leading-[29px] text-text-default/85
        [&>div]:gap-[20px]
        [&_p]:text-[18px] [&_p]:leading-[29px] [&_p]:text-text-default/85
        [&_ul]:my-0 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-[10px] [&_ul]:pl-[24px]
        [&_ol]:my-0 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-[10px] [&_ol]:pl-[24px]
        [&_li]:my-0 [&_li]:text-[18px] [&_li]:leading-[29px] [&_li]:text-text-default/85 [&_li]:marker:text-brand-primary/60
        [&_a]:text-brand-primary [&_a]:underline [&_a]:underline-offset-[3px] hover:[&_a]:text-brand-secondary
        [&_strong]:font-semibold [&_strong]:text-text-default
        [&_blockquote]:my-0 [&_blockquote]:border-l-[3px] [&_blockquote]:border-l-brand-primary [&_blockquote]:pl-[20px] [&_blockquote]:text-text-default/70
      "
    >
      <PortableText
        value={body as PortableValue}
        components={{
          block: {
            // margin-TOP only. It adds to the 20px base gap: h2 sits 20+28 = 48px below
            // the previous block and 20px above the next. No margin-bottom, or it would
            // stack with the gap again.
            h2: ({ children, value }) => (
              <h2
                id={headingIdFor(body, value)}
                className={`${SCROLL_MARGIN} mt-[28px] text-[30px] font-semibold leading-snug text-text-default`}
              >
                {children}
              </h2>
            ),
            h3: ({ children, value }) => (
              <h3
                id={headingIdFor(body, value)}
                className={`${SCROLL_MARGIN} mt-[12px] text-[22px] font-semibold leading-snug text-text-default`}
              >
                {children}
              </h3>
            ),
          },
        }}
      />
    </div>
  )
}
