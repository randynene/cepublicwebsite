import Link from 'next/link'

import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'

// The topic pills row. Spec §4.
//
// PILLS ARE NAVIGATION, NOT FILTERS. Each one is a real <a> to a real hub, so every
// filtered view is a crawlable URL with its own long-form content and its own
// rankings. A client-side filter would hide six pages' worth of ranking content
// behind JavaScript and collapse seven indexable URLs into one - which is why the
// spec makes this the recommendation rather than an implementation detail.
//
// This is Phase 1 and it is ALREADY the finished behaviour. Phase 2 adds live search;
// it does not change these pills. Nothing here needs re-marking-up later.

export type TopicPill = { label: string; path: string }

// The seven pills, in the order the design draws them. "All Content" first, then the
// six topic hubs.
export const TOPIC_PILLS: TopicPill[] = [
  { label: UI_STRINGS['blog.pillAll'], path: '/blog' },
  { label: UI_STRINGS['blog.pillHiringTips'], path: '/hiring-tips' },
  { label: UI_STRINGS['blog.pillScalingTeams'], path: '/scaling-teams' },
  { label: UI_STRINGS['blog.pillManagingEngineers'], path: '/managing-engineers' },
  { label: UI_STRINGS['blog.pillStaffAugmentation'], path: '/staff-augmentation' },
  { label: UI_STRINGS['blog.pillNearshoring'], path: '/nearshoring-offshoring' },
  { label: UI_STRINGS['blog.pillAi'], path: '/ai-in-software-development' },
]

// An ARIA token, not copy. Hoisted for the same reason as HIDE_BELOW_TABLET above.
const ARIA_CURRENT_PAGE = 'page' as const

export function TopicPills({
  currentPath,
  locale = 'en-US',
}: {
  /** The unprefixed path of the page being rendered, e.g. '/hiring-tips'. */
  currentPath: string
  locale?: Locale
}) {
  return (
    <nav
      aria-label={UI_STRINGS['blog.topicsNavLabel']}
      // Horizontal scroll below 768px rather than wrapping (spec §8). `-mx-` +
      // matching padding lets the strip bleed to the screen edge on mobile so the
      // last pill does not look clipped at the container boundary.
      className="-mx-5 overflow-x-auto px-5 pb-1 md:mx-0 md:overflow-visible md:px-0 md:pb-0"
    >
      <ul className="flex w-max gap-2 md:w-auto md:flex-wrap md:justify-center">
        {TOPIC_PILLS.map((pill) => {
          const isCurrent = pill.path === currentPath
          return (
            <li key={pill.path}>
              <Link
                href={buildLocalePath(pill.path, locale)}
                // aria-current, not just a colour. The active pill is the only thing
                // telling a screen-reader user which topic they are on.
                aria-current={isCurrent ? ARIA_CURRENT_PAGE : undefined}
                className={cn(
                  'inline-flex items-center whitespace-nowrap rounded-pill px-4 py-2 text-[14px] leading-none',
                  'transition-colors duration-200 motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]',
                  isCurrent
                    ? // Solid lime ALWAYS carries dark text (spec §0).
                      'bg-brand-primary font-bold text-text-dark'
                    : 'border border-[#22314D] bg-[#101B30] font-medium text-text-default/70 hover:text-text-default',
                )}
              >
                {pill.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
