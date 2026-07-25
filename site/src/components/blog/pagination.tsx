import Link from 'next/link'

import { cn } from '@/components/ui/_utils/cn'
import { buildPageNumbers, type PaginationState } from '@/lib/hubs/pagination'
import { UI_STRINGS } from '@/lib/ui-strings'

// Numbered pagination. Spec §6.
//
// NUMBERED, not "load more" and not show-all, and the spec gives the reason: every
// page needs a crawlable ?page=n URL. "Load more" hides pages 2 onwards behind a
// button, and a crawler never presses buttons - on /blog that would bury 58 of the
// 70 articles.
//
// 42px tiles, 12px radius, lime active tile with dark text (spec §0: lime always
// carries dark text). Disabled arrows at half opacity.
//
// rel=next/prev are emitted by the page, not here, because they belong in <head>.

const TILE = cn(
  'inline-flex h-[42px] min-w-[42px] items-center justify-center rounded-[12px] px-3',
  'text-[14px] font-semibold tabular-nums',
  'transition-colors duration-200 motion-reduce:transition-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]',
)

const IDLE = 'border border-[#22314D] bg-[#101B30] text-text-default/70 hover:text-text-default'

export function BlogPagination({ pagination }: { pagination: PaginationState }) {
  const { hasPrev, hasNext, prevUrl, nextUrl, currentPage, totalPages, canonicalUrl } = pagination

  // "Show pagination only when > 1 page" (spec §6). A lone "1" tile is not a
  // navigation control, it is a decoration that implies there is somewhere to go.
  if (totalPages <= 1) return null

  const base = canonicalUrl.split('?')[0]
  const pageHref = (n: number) => (n === 1 ? base : `${base}?page=${n}`)
  const numbers = buildPageNumbers(currentPage, totalPages)

  return (
    <nav
      aria-label={UI_STRINGS['hub.paginationLabel']}
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      {/* A disabled arrow is a <span>, not a dimmed <a>. A link that goes nowhere is
          still focusable and still clickable, and it announces itself to a screen
          reader as a link. Half opacity does not make it stop being one. */}
      {hasPrev && prevUrl ? (
        <Link href={prevUrl} rel="prev" aria-label={UI_STRINGS['hub.previousPage']} className={cn(TILE, IDLE)}>
          {UI_STRINGS['blog.pagePrev']}
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(TILE, IDLE, 'opacity-50')}>
          {UI_STRINGS['blog.pagePrev']}
        </span>
      )}

      <ol className="flex flex-wrap items-center gap-2">
        {numbers.map((n, i) =>
          n === null ? (
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-1 text-text-default/40"
            >
              {UI_STRINGS['hub.ellipsis']}
            </li>
          ) : (
            <li key={n}>
              {n === currentPage ? (
                <span
                  aria-current="page"
                  className={cn(TILE, 'bg-brand-primary text-text-dark')}
                >
                  {n}
                </span>
              ) : (
                <Link
                  href={pageHref(n)}
                  aria-label={UI_STRINGS['hub.pageBadge'].replace('{n}', String(n))}
                  className={cn(TILE, IDLE)}
                >
                  {n}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      {hasNext && nextUrl ? (
        <Link href={nextUrl} rel="next" aria-label={UI_STRINGS['hub.nextPage']} className={cn(TILE, IDLE)}>
          {UI_STRINGS['blog.pageNext']}
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(TILE, IDLE, 'opacity-50')}>
          {UI_STRINGS['blog.pageNext']}
        </span>
      )}
    </nav>
  )
}
