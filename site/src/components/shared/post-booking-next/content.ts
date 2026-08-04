// Copy for the post-booking "what next" block (CE-41).
//
// Held here rather than inline in JSX because the UI_STRINGS lint rule bans
// string literals in JSX. The headline and supporting line on the page itself
// ARE Sanity-editable (bookACallThankYouPage.title / heroDescription); these are
// the section furniture around the auto-pulled cards.
//
// Author-voice rule: no em/en dashes, plain hyphens only.

export const POST_BOOKING = {
  chat: {
    eyebrow: 'While you wait',
    titleLead: 'Ask our AI',
    titleAccent: 'anything',
    body: 'Rates, timezones, how vetting works, what your first two weeks look like. Clara answers instantly, no waiting for the call.',
    cta: 'Ask our AI anything',
    /**
     * Explicit horizontal arrow. Without it the pill falls back to the leading
     * circle's default glyph, which carries `-rotate-45` and renders as a
     * diagonal tick - the same divergence already corrected on the header CTA
     * (Tech Debt #56).
     */
    ctaGlyph: '→',
  },
  stories: {
    title: 'See what we have built for others',
    cta: 'View all case studies',
  },
} as const
