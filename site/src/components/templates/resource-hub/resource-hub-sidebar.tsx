import Link from 'next/link'

import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { type HubType } from '@/lib/sanity/queries/hubs'
import { UI_STRINGS, type UIStringKey } from '@/lib/ui-strings'

// The resource-hub left sidebar nav. Brief MYGRATR-HUB-RESOURCE D1.
//
// The four resource hubs cross-link each other, mirroring the live "Topics:"
// sidebar. NAV ITEMS ARE REAL LINKS, NOT FILTERS: each is an <a> to a real hub
// URL, so every hub stays crawlable and keeps its own rankings.
//
// Desktop (>=1024px): a sticky vertical column. Below 1024px: a horizontal
// scroll strip above the content, same markup, responsive classes only - the
// same pattern the blog TopicPills uses.

type ResourceNavItem = { hubType: HubType; labelKey: UIStringKey; path: string }

// Order matches the live sidebar: Downloads, Tools, Videos, Events.
const RESOURCE_NAV: ResourceNavItem[] = [
  { hubType: 'downloadsHub', labelKey: 'resourceHub.navDownloads', path: '/downloads' },
  { hubType: 'toolsHub', labelKey: 'resourceHub.navTools', path: '/tools' },
  { hubType: 'videosHub', labelKey: 'resourceHub.navVideos', path: '/videos' },
  { hubType: 'eventsHub', labelKey: 'resourceHub.navEvents', path: '/events' },
]

const ARIA_CURRENT_PAGE = 'page' as const

export function ResourceHubSidebar({
  currentHubType,
  locale = 'en-US',
}: {
  currentHubType: HubType
  locale?: Locale
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-3 hidden text-[12px] font-semibold uppercase leading-none tracking-[1.6px] text-brand-primary lg:block">
        {UI_STRINGS['resourceHub.topicsLabel']}
      </p>
      <nav
        aria-label={UI_STRINGS['resourceHub.navAriaLabel']}
        className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        <ul className="flex w-max gap-2 lg:w-auto lg:flex-col">
          {RESOURCE_NAV.map((item) => {
            const isCurrent = item.hubType === currentHubType
            return (
              <li key={item.hubType}>
                <Link
                  href={buildLocalePath(item.path, locale)}
                  aria-current={isCurrent ? ARIA_CURRENT_PAGE : undefined}
                  className={cn(
                    'inline-flex w-full items-center whitespace-nowrap rounded-pill px-4 py-2.5 text-[14px] leading-none',
                    'transition-colors duration-200 motion-reduce:transition-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]',
                    isCurrent
                      ? // Solid lime ALWAYS carries dark text (VISUAL_LANGUAGE_SPEC).
                        'bg-brand-primary font-bold text-text-dark'
                      : 'border border-[#22314D] bg-[#101B30] font-medium text-text-default/70 hover:text-text-default',
                  )}
                >
                  {UI_STRINGS[item.labelKey]}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default ResourceHubSidebar
