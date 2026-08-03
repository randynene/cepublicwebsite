// Role marks, keyed by label rather than by an id.
//
// Moved here from the Hire Engineers template so the quick hiring form and that
// page cannot drift apart. Keying on the LABEL is deliberate: role labels are
// editorial and come from several places (this repo, Sanity, a service name), so
// a shared id would have to be threaded through all of them. A regex on the words
// people actually use survives "Back-End Developers", "backend" and "Backend".
//
// Each mark is a stroked 24x24 glyph. Colour and stroke width come from the
// consumer via `currentColor`, so the same icon reads on a dark tile and on lime.

import type { ReactNode } from 'react'

const ROLE_ICON_RULES: { match: RegExp; icon: ReactNode }[] = [
  {
    // Backend before the generic "engineer" catch-alls.
    match: /back[- ]?end/i,
    icon: (
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
        <rect x="3" y="4" width="18" height="6" rx="1.5" />
        <rect x="3" y="14" width="18" height="6" rx="1.5" />
        <path d="M6.5 7h.01M6.5 17h.01" />
      </svg>
    ),
  },
  {
    match: /front[- ]?end/i,
    icon: (
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M6.5 6.5h.01M9.5 6.5h.01" />
      </svg>
    ),
  },
  {
    // Full-stack and plain "Software Engineers" share the code-brackets mark.
    match: /full[- ]?stack|software/i,
    icon: (
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
        <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
      </svg>
    ),
  },
  {
    match: /dev[- ]?ops|platform|infra|cloud/i,
    icon: (
      // Continuous-delivery loop, which is what DevOps actually means.
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--spin">
        <path d="M3 12a9 9 0 0115.7-6M21 12a9 9 0 01-15.7 6" />
        <path d="M18 3v3h-3M6 21v-3h3" />
      </svg>
    ),
  },
  {
    match: /\bqa\b|test/i,
    icon: (
      <svg viewBox="0 0 24 24">
        <path className="icon-motion icon-motion--draw" d="M9 11l3 3 8-8" pathLength={100} />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
      </svg>
    ),
  },
  {
    match: /mobile|ios|android/i,
    icon: (
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
  {
    match: /\bdata\b/i,
    icon: (
      // Database cylinder, replacing a desktop monitor.
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </svg>
    ),
  },
  {
    match: /\bai\b|machine learning|\bml\b/i,
    icon: (
      // The sparkle is the mark people now read as "AI" - Seb asked for it by
      // name ("should that be the little AI logo?").
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--twinkle">
        <path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z" />
        <path d="M17.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
      </svg>
    ),
  },
  {
    match: /cto|lead|principal|architect/i,
    icon: (
      // Compass: direction and technical strategy, not a gold star.
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z" />
      </svg>
    ),
  },
  {
    match: /security|cyber/i,
    icon: (
      <svg viewBox="0 0 24 24" className="icon-motion icon-motion--bob">
        <path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7z" />
        <path d="M9.5 12l1.8 1.8L15 10" />
      </svg>
    ),
  },
]

/** Neutral catch-all: "Something else" and any role we do not recognise. */
export const ROLE_ICON_FALLBACK: ReactNode = (
  <svg viewBox="0 0 24 24">
    <path className="icon-motion icon-motion--draw" d="M5 12h14M13 6l6 6-6 6" pathLength={100} />
  </svg>
)

export function roleIcon(label: string): ReactNode {
  return ROLE_ICON_RULES.find((r) => r.match.test(label))?.icon ?? ROLE_ICON_FALLBACK
}
