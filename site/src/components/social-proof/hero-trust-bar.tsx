import { ChatLink } from '@/components/shared/chat-link'
import { ClientLogoStrip, type ClientLogo } from '@/components/social-proof/client-logo-strip'
import { cn } from '@/components/ui/_utils/cn'
import { CHAT_HREF } from '@/lib/chat'
import type { Locale } from '@/lib/locale-path'

// The standard band that closes every marketing hero:
//
//   TRUSTED BY 300+        [ rotating client logos ]        Ask our AI anything
//   ENGINEERING TEAMS
//
// Every main marketing page gets the same one, so landing on any of them looks
// like landing on Hire Engineers. Detail pages (blog posts, individual reviews)
// deliberately do not.
//
// There is no "See more" affordance by design: the hero and this bar are sized
// to be everything on the first screen at any zoom level, and Jake cut the
// button on the second review pass — the logos ARE the bottom of the hero.
//
// WHY THE STYLING LIVES IN globals.css AND NOT IN TAILWIND CLASSES HERE:
// this component renders inside pages whose scoped stylesheets open with
// `.he, .he * { margin: 0; padding: 0 }` (same for `.fcto`). A single-class
// Tailwind utility like `px-[18px]` has the same specificity as `.he *` and
// loses on source order, so every margin and padding utility inside those pages
// is silently zeroed — which is exactly why the first version of this bar
// rendered with its logos 1px apart and its button with no padding at all.
// The `.hero-trust-bar ...` rules are two-class selectors, so they win
// everywhere. Do not "simplify" these back into utility classes.

const LABEL_LINE_1 = 'TRUSTED BY 300+'
const LABEL_LINE_2 = 'ENGINEERING TEAMS'
const ASK_AI = 'Ask our AI anything'
const ARROW = '\u2192'

export function HeroTrustBar({
  locale = 'en-US',
  logos,
  groundColor,
  /** For Engineers shows the logos but not the AI CTA — that page speaks to
   *  candidates, and the assistant is a buyer-side tool. */
  showAi = true,
  className,
}: {
  locale?: Locale
  logos?: ClientLogo[]
  groundColor?: string
  showAi?: boolean
  className?: string
}) {
  return (
    <div className={cn('hero-trust-bar', className)}>
      <div className="htb-row">
        <p className="htb-label">
          <span>{LABEL_LINE_1}</span>
          <span>{LABEL_LINE_2}</span>
        </p>
        <span aria-hidden className="htb-divider" />

        <ClientLogoStrip logos={logos} groundColor={groundColor} />

        {showAi ? (
          <ChatLink href={CHAT_HREF} locale={locale} className="htb-ai">
            <span aria-hidden className="htb-ai-arrow">
              {ARROW}
            </span>
            {ASK_AI}
          </ChatLink>
        ) : null}
      </div>
    </div>
  )
}
