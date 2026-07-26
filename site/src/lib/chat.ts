// The site-wide "open the AI chat" href token.
//
// Clara (the CE chat widget, loaded on every page by third-party-scripts.tsx)
// has no URL of its own — it opens through `window.ClaraWidget.open()`. So a
// CTA whose job is "open the chat" cannot be written as an ordinary href, and
// several templates ended up pointing theirs at `#` or `#faq`, which does
// nothing when clicked.
//
// The convention: Sanity stores `#chat`, and the ChatLink/ChatPill components
// render CHAT_FALLBACK_HREF in the markup while intercepting the click to open
// the widget. That keeps the CTA a real destination for crawlers, for visitors
// without JavaScript, and for the case where the widget fails to load.

export const CHAT_HREF = '#chat'

/** Where a chat CTA goes when the widget is unavailable. A real page, never `#`. */
export const CHAT_FALLBACK_HREF = '/book-a-call'

export function isChatHref(href: string | null | undefined): boolean {
  return typeof href === 'string' && href.trim().toLowerCase() === CHAT_HREF
}
