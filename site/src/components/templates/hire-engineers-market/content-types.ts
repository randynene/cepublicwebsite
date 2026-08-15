// Shared shape for the Hire Engineers MARKET landing pages.
//
// One template (./index.tsx) renders two markets from this interface:
//   content.us.ts -> UHE   -> /services/us-hire-engineers      (en-US)
//   content.uk.ts -> UKHE  -> /uk/services/uk-hire-engineers   (en-GB)
//
// The types live here rather than in either content file so neither market
// imports the other. Adding a field here forces BOTH markets to answer it,
// which is the point: it is how the two pages are kept from drifting apart
// structurally while their copy stays independent.
//
// Author voice: no em/en dashes anywhere in the copy, hyphens only.

/** Which market a content object describes. Drives the `hem--<market>` class. */
export type HireEngineersMarket = 'us' | 'uk'

/** A "REAL PHOTO" slot from the design. `image` empty = the placeholder tile. */
export interface MarketImageSlot {
  /** The photography brief. Disappears once a real image exists. */
  brief: string
  /** Optional overlay label drawn on the tile (stage 02 rail, stage 01 card). */
  label?: string
  /** Optional real photo. */
  image?: string
}

export interface HireEngineersMarketContent {
  /**
   * Selects the `hem--us` / `hem--uk` modifier on the template root. The only
   * thing it currently changes is the hero shortlist card's vertical anchor:
   * the US design hangs it beside the H1 (Figma top 101.86), the UK design
   * raises it to sit beside the eyebrow (Figma top 33).
   */
  market: HireEngineersMarket
  hero: {
    eyebrow: string
    h1Lead: string
    h1Em: string
    sub: string
    ctaPrimary: string
    ctaGhost: string
    ticks: string[]
    card: {
      label: string
      badge: string
      profiles: {
        role: string
        meta: string
        stack: string[]
        salary: string
        salaryNote: string
        photo: MarketImageSlot
      }[]
      foot: string
      /** Amber badge. These are illustrative, not real placements. */
      illustrative: string
    }
  }
  problem: {
    eyebrow: string
    /** Newlines are deliberate line breaks in the headline. */
    h2: string
    stat: string
    body: string
    gridCaption: string
    floatCards: { role: string; note: string }[]
    floatCaption: string
  }
  process: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    stages: {
      n: string
      eyebrow: string
      h3: string
      body: string
      emphasis: string
      /** Lime pill (stage 01) or lime arrow line (stages 02, 03). */
      pill?: string
      arrow?: string
    }[]
    brief: {
      label: string
      role: string
      /** `met` false = neutral circle, true = lime tick. */
      requirements: { text: string; met: boolean }[]
      note: string
      photo: MarketImageSlot
    }
    code: {
      title: string
      live: string
      /** `indent` is the nesting depth; `comment` picks the muted colour. */
      lines: { text: string; indent: number; comment: boolean }[]
      rail: MarketImageSlot[]
    }
    report: {
      role: string
      meta: string
      open: string
      tabs: string[]
      /** `pct` drives the bar width; `tone` picks teal or amber. */
      scores: { label: string; value: string; pct: number; tone: 'teal' | 'amber' }[]
      note: string
      photo: MarketImageSlot
    }
    funnel: {
      label: string
      /** `pct` is the bar width as drawn; the last row is the lime one. */
      rows: { label: string; value: string; pct: number }[]
    }
  }
  derisk: {
    claims: string[]
  }
  differentiators: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    h2Tail: string
    lead: string
    cards: { h3: string; p: string }[]
  }
  intake: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    lead: string
    label: string
    heading: string
    /** Left of the progress rail, e.g. "THE ROLE". */
    stepLabel: string
    /** Right of the progress rail, e.g. "Step 1 of 4". */
    stepCounter: string
    /** Number of segments in the progress rail. */
    stepCount: number
    dropTitle: string
    dropHint: string
    /** The three input-mode pills under the drop zone. */
    pillGuided: string
    pillSay: string
    pillType: string
    /** Shown in place of the drop zone once a file is chosen. */
    fileChosenLabel: string
    fileRemoveLabel: string
    /** Rejected file: wrong extension, or over the size cap. */
    fileTypeError: string
    fileSizeError: string
    jobLabel: string
    jobPlaceholder: string
    helper: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    consentNote: string
    footNote: string
    submit: string
    submitting: string
    /** Client-side validation, worded like the shared lead form's. */
    errorRequired: string
    errorEmail: string
    caption: string
  }
  faq: {
    eyebrow: string
    h2: string
    h2Em: string
    card: { h3: string; p: string; cta: string }
    /**
     * `{ q, a }` because buildFaqPageJsonLd consumes this array directly, so
     * `a` must stay PLAIN TEXT - the JSON-LD answer and the rendered answer
     * have to be the same string or the markup is lying to the crawler.
     *
     * `linkText` is therefore not extra copy: it is a substring of `a` that the
     * template wraps in an anchor at render time. That is how the "do you do
     * this in the other market?" answer becomes a real link to the other page
     * without the JSON-LD and the DOM disagreeing. `linkHref` is an ABSOLUTE
     * site path and is deliberately NOT run through buildLocalePath: it is the
     * one link on the page that is meant to leave the current locale.
     */
    items: { q: string; a: string; linkText?: string; linkHref?: string }[]
  }
  finalCta: {
    h2Lead: string
    h2Em: string
    lead: string
    ctaPrimary: string
    ctaGhost: string
    foot: string
  }
}
