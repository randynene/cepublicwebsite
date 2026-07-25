'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/components/ui/_utils/cn'
import type { TocEntry } from '@/lib/blog/toc'
import { UI_STRINGS } from '@/lib/ui-strings'

// The article's table of contents. Spec §7.3 / D24.
//
// Sticky rail on desktop; a <details> accordion above the body under 900px, where a
// 300px rail has nowhere to go.
//
// The scroll listener is the only reason this is a client component. Everything else -
// the headings, their ids, the links - is server-rendered, so the TOC is in the HTML at
// first paint and a crawler reads it as a normal list of in-page links.

// The site header is a 126px STICKY bar (94px nav + 32px announcement). Both of these
// must account for it, or the TOC misbehaves in ways that look like bugs:
//   - a clicked heading lands UNDER the header unless we scroll an extra ~142px
//   - the active heading is decided at a line just BELOW the header, where the reader's
//     eye actually is, not at the top of the viewport behind the header
const SCROLL_OFFSET = 142
const ACTIVE_LINE = 150

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null)
  const ticking = useRef(false)
  const navRef = useRef<HTMLElement>(null)

  // Keep the active entry inside the rail's own scroll area.
  //
  // H2-only keeps most articles to ~8 entries that fit and float in full. But the
  // longest posts have 13 H2s, which overflow a short viewport - and without this, once
  // you read past the entries that happen to fit, the active highlight is off-screen in
  // the rail and the reader has no idea where they are. This nudges the rail's OWN
  // scroll (never the page) so the active item stays visible. When the list fits, this
  // does nothing and the label stays put.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !activeId) return
    if (nav.scrollHeight <= nav.clientHeight) return // fits; leave it alone

    const link = nav.querySelector<HTMLElement>(`a[href="#${activeId}"]`)
    if (!link) return

    const navRect = nav.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    if (linkRect.top < navRect.top) {
      nav.scrollTop -= navRect.top - linkRect.top + 12
    } else if (linkRect.bottom > navRect.bottom) {
      nav.scrollTop += linkRect.bottom - navRect.bottom + 12
    }
  }, [activeId])

  useEffect(() => {
    if (entries.length === 0) return

    const update = () => {
      ticking.current = false

      // The LAST heading whose top has passed the line - i.e. the section you are
      // actually reading, not the next one coming up. Walking backwards means the first
      // match is the answer and there is nothing to compare.
      let current = entries[0]?.id ?? null
      for (let i = entries.length - 1; i >= 0; i--) {
        const el = document.getElementById(entries[i].id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= ACTIVE_LINE) {
          current = entries[i].id
          break
        }
      }
      setActiveId(current)
    }

    // Throttled to one update per frame. A scroll event can fire dozens of times per
    // frame, and each one here does a getBoundingClientRect per heading - which forces
    // a layout. Unthrottled, a long article janks on every scroll.
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [entries])

  if (entries.length === 0) return null

  // Smooth-scroll, but only if the reader has not asked us not to.
  //
  // The default click would work on its own - the headings carry scroll-margin-top, so
  // the browser lands in the right place unaided. This only adds the easing, which is
  // why preventDefault is conditional: if we cannot do it smoothly we let the browser
  // do it instantly rather than doing nothing.
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const el = document.getElementById(id)
    if (!el) return

    e.preventDefault()
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
    // Keep the URL shareable. replaceState, not the default hash jump, so the back
    // button is not filled with one entry per heading the reader glanced at.
    window.history.replaceState(null, '', `#${id}`)
    setActiveId(id)
  }

  const list = (
    <ul className="flex flex-col gap-1">
      {entries.map((entry) => {
        const isActive = entry.id === activeId
        return (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              onClick={(e) => onClick(e, entry.id)}
              aria-current={isActive ? ARIA_TRUE : undefined}
              className={cn(
                'block border-l-2 py-[6px] pl-4 text-[14px] leading-snug transition-colors duration-150 motion-reduce:transition-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#070D18]',
                isActive
                  ? 'border-l-brand-primary font-semibold text-brand-primary'
                  : 'border-l-[#22314D] text-text-default/55 hover:text-text-default',
              )}
            >
              {entry.text}
            </a>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {/* Desktop: the sticky rail. It shows the FULL contents and floats at all times
          (Jake) - which is now possible precisely because the list is H2-only. With H2s
          and H3s it ran to 40-plus entries, taller than the screen, and a sticky element
          taller than the viewport is not sticky at all: it pins its top and hides its
          own bottom forever. H2-only is ~10 entries and fits.

          The max-height + overflow is kept as a backstop for an unusually long post (one
          with 20+ H2s), so the last entry is always reachable; `overscroll-contain`
          stops a scroll that reaches the end of the rail from carrying on to the article
          behind it. In the normal case the list fits and nothing scrolls. */}
      <nav
        ref={navRef}
        aria-label={UI_STRINGS['blogPost.tocHeading']}
        // top clears the sticky header, or the "TABLE OF CONTENTS" label and the first
        // item disappear behind it on scroll - which is exactly what happened. Bound to
        // the header's own CSS variables (94px + 32px + 16px gap = 142px), so it stays
        // aligned if the chrome ever changes height.
        className="sticky top-[calc(var(--header-height)+var(--announcement-bar-height)+16px)] hidden max-h-[calc(100vh-var(--header-height)-var(--announcement-bar-height)-40px)] self-start overflow-y-auto overscroll-contain pr-2 min-[900px]:block"
      >
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[1.6px] text-brand-primary">
          {UI_STRINGS['blogPost.tocHeading']}
        </p>
        {list}
      </nav>

      {/* Under 900px: an accordion above the body. Collapsed by default - a 20-item
          list unfurled above the article would push the first paragraph off the screen
          on a phone, which is the opposite of what a contents list is for. */}
      <details className="mb-8 rounded-[14px] border border-[#22314D] bg-[#101B30] min-[900px]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-[14px] font-semibold text-text-default [&::-webkit-details-marker]:hidden">
          {UI_STRINGS['blogPost.tocHeading']}
          <span aria-hidden="true" className="text-brand-primary">
            {UI_STRINGS['blog.faqToggle']}
          </span>
        </summary>
        <div className="px-4 pb-4">{list}</div>
      </details>
    </>
  )
}

// An ARIA token, not copy.
const ARIA_TRUE = 'true' as const
