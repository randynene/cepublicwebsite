import { ArticleCard } from '@/components/blog/article-card'
import { SectionLabel } from '@/components/blog/section-label'
import { type Locale } from '@/lib/locale'
import type { HubChildItem } from '@/lib/sanity/queries/hubs'
import { UI_STRINGS } from '@/lib/ui-strings'

// The featured block. Spec §3.
//
// One large card (left, ~60%) plus a stacked column of four compact cards. Five items.
//
// The auto-fill and suppression LOGIC lives in lib/blog/featured.ts, not here, because
// it decides which articles the grid below may show - the two must agree on the split
// or an article appears twice on one page. This component only draws what it is given.

// Cards 3 and 4 are hidden between 480 and 767px (spec §8). A Tailwind class, not
// user-visible copy - hoisted out of the JSX only because the UI_STRINGS lint rule
// cannot tell a class name from a sentence.
const HIDE_BELOW_TABLET = 'hidden min-[768px]:block'

export function FeaturedBlock({
  items,
  locale = 'en-US',
}: {
  items: HubChildItem[]
  locale?: Locale
}) {
  if (items.length === 0) return null

  const [feature, ...compact] = items

  return (
    <section aria-labelledby="featured-heading" className="mt-16">
      <SectionLabel id="featured-heading">{UI_STRINGS['blog.featured']}</SectionLabel>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <ArticleCard
          item={feature}
          variant="feature"
          priority
          sizes="(min-width: 992px) 58vw, 100vw"
          locale={locale}
        />

        {/* Below 480px the compacts are hidden entirely and only the feature card
            shows; between 480 and 767 only two of them do (spec §8). Done with CSS
            rather than by slicing the array, so the markup a crawler reads is the same
            at every width - hiding content from small screens is a layout decision,
            not a content one. */}
        {compact.length > 0 ? (
          <ul className="hidden flex-col gap-4 min-[480px]:flex">
            {compact.map((item, i) => (
              <li key={item._id} className={i >= 2 ? HIDE_BELOW_TABLET : undefined}>
                <ArticleCard item={item} variant="compact" locale={locale} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
