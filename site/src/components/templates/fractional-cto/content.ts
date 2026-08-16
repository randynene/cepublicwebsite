// Fractional CTO landing page (/services/fractional-ctos) - static copy.
// 1:1 port of docs/raw-html/Fractional CTO Page (offline).html. Every visible
// string lives here (the react/jsx-no-literals lint rule forbids literal text
// in JSX children); the template references these constants. Author voice: no
// em/en dashes - hyphens only.

export const FRACTIONAL_CTO_META = {
  title: 'Fractional CTO - Cloud Employee',
  description:
    'Match with a proven, US-nearshore fractional CTO who has built products and scaled real engineering teams - vetted by us, matched to you in days.',
} as const

// ── Content shape (mutable, so the Sanity transform can produce it) ──────────
// Layout-only fields (card left/top/rot, status-pill positions, option.wide)
// stay code-driven and are spliced back by the transform; Sanity only carries
// the editable text (+ the optional video URL).
export interface FctoHeroCard {
  left: string
  top: string
  rot: string
  role: string
  days: string
  name: string
  cred: string
  tags: string[]
  /** Optional avatar photo. Empty = the CSS placeholder tile. */
  image?: string
}
export interface FctoStatusPill {
  left: string
  top: string
  icon: string
  label: string
}
/** One priced row inside the hero "Your match" panel. */
export interface FctoMatchRow {
  /** Icon key - see MATCH_ROW_ICONS in index.tsx. */
  icon: 'trend' | 'spark' | 'idea'
  title: string
  meta: string
  /**
   * US price, shown on /services/fractional-ctos. Held as a formatted string,
   * not a number, so the currency symbol and separators stay editable in Studio
   * rather than being guessed at from a locale at render time.
   */
  price: string
  /**
   * UK price, shown on /uk/services/fractional-ctos. CE-68: Seb quoted GBP
   * monthly retainers, and Jake asked for dollars on US and pounds on UK, so
   * both are stored side by side. Nothing here converts currency - if the rate
   * moves, both strings get edited in Studio.
   */
  priceGbp: string
  per: string
}
/** Hero right-hand visual: a single "Your match" shortlist panel. */
export interface FctoHeroMatch {
  label: string
  badge: string
  rows: FctoMatchRow[]
  footnote: string
}
export interface FctoContent {
  hero: {
    eyebrow: string
    h1Lead: string
    h1Em: string
    sub: string
    ctaPrimary: string
    ctaGhost: string
    trust: string[]
    /** Hero visual (current design). */
    match: FctoHeroMatch
    /** @deprecated Superseded by `match`. Retained so the Sanity projection and
     *  the fractionalCtoPage schema keep parsing unchanged; nothing renders it. */
    cards: FctoHeroCard[]
    /** @deprecated Superseded by `match`. See `cards`. */
    statusPills: FctoStatusPill[]
  }
  trusted: { label: string; logos: string[]; aiPill: string }
  video: {
    eyebrow: string
    title: string
    tag: string
    name: string
    role: string
    play: string
    timeStart: string
    timeEnd: string
    stateIdle: string
    statePlaying: string
    /** YouTube/Vimeo/Loom link. When set, the video tile plays a real embed. */
    videoUrl?: string
    /** Thumbnail behind the tile. Empty = auto YouTube thumb (if a YT url) else placeholder. */
    poster?: string
  }
  does: { eyebrow: string; title: string; cards: { h4: string; p: string }[] }
  statement: { eyebrow: string; line1: string; line2: string; sub: string }
  matched: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    topSub: string
    feature: { h3: string; p: string; foot: string; image?: string }
    steps: { h4: string; p: string }[]
  }
  derisk: { eyebrow: string; benefits: string[] }
  selfcheck: { eyebrow: string; h2Lead: string; h2Em: string; items: { n: string; p: string }[] }
  matchform: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    lead: string
    progress: { num: string; lb: string }[]
    options: { label: string; wide: boolean }[]
    back: string
    steps: { title: string; hint: string }[]
    nextDefault: string
    nextStep2: string
    nextStep3: string
    reassureLabel: string
    pillAi: string
    pillBook: string
    trust: string[]
  }
  faq: {
    eyebrow: string
    title: string
    ctaEyebrow: string
    ctaBody: string
    ctaBtn: string
    items: { n: string; q: string; a: string }[]
  }
  final: { h2Lead: string; h2Em: string; p: string; cta: string; metrics: string[] }
}

export const FCTO: FctoContent = {
  hero: {
    eyebrow: 'Fractional CTO · US Nearshore',
    h1Lead: 'Your fractional CTO.',
    h1Em: 'Matched in days',
    sub: 'Match with a proven, US-nearshore fractional CTO who has built products and scaled real engineering teams - vetted by us, matched to you in days.',
    ctaPrimary: 'Find your CTO',
    ctaGhost: 'How matching works',
    trust: ['Vetted network', 'Speak before you commit', 'Rolling monthly, no lock-ins'],
    // CE-68 (Aug 2026). Seb re-quoted these as GBP MONTHLY retainers; they were
    // USD day rates. Three things changed together, all on his figures:
    //   - unit:  per day -> per month
    //   - AI transformation: 3 days/week -> 2
    //   - currency: dollars on this page, pounds on the /uk/ mirror
    // The USD column is Jake's call, converted at roughly 1.28 and rounded to
    // marketing numbers rather than left as an exact FX result.
    //
    // This is a large reduction against what the page used to claim (the AI
    // tier was $2,800/day at 3 days/week, about $36k/mo). That was raised with
    // Jake before the change and confirmed as intended.
    //
    // These values are the FALLBACK. Sanity is canonical - see the `match`
    // projection in lib/sanity/queries/fractional-cto-page.ts. Editing here
    // will not change the live page.
    match: {
      label: 'Your match',
      badge: 'Shortlist in 7 days',
      rows: [
        {
          icon: 'trend',
          title: 'Scaling CTO',
          meta: 'Series A · scaled eng team 5+ · 2 days/week',
          price: '$7,000',
          priceGbp: '£5,500',
          per: '/ mo',
        },
        {
          icon: 'spark',
          title: 'AI transformation CTO',
          meta: 'GenAI rollout · B2B SaaS · 2 days/week',
          price: '$9,500',
          priceGbp: '£7,500',
          per: '/ mo',
        },
        {
          icon: 'idea',
          title: 'Seed CTO',
          meta: 'Product roadmap · 1 day/week',
          price: '$4,500',
          priceGbp: '£3,500',
          per: '/ mo',
        },
      ],
      // CE-65: "No bench, no bodies on a list." deleted on Seb's request. Only
      // that sentence goes; the first one is the substantive claim and stays.
      footnote: 'Sourced and vetted against your brief.',
    },
    cards: [
      {
        left: '52px',
        top: '0',
        rot: '-4deg',
        role: 'AI TRANSFORMATION',
        days: '3 days / wk',
        name: 'Ex-CTO, B2B SaaS - led GenAI rollout',
        cred: '12 yrs · Scaled engineering to 40+ · Series C',
        tags: ['AI Strategy', 'Team'],
      },
      {
        left: '-34px',
        top: '150px',
        rot: '3deg',
        role: 'SCALING CTO',
        days: '1 day / wk',
        name: '15 yrs in tech leadership · 2 exits',
        cred: 'Scaled team 8 to 60 · Raised Series B',
        tags: ['Eng leadership', 'Hiring'],
      },
      {
        left: '64px',
        top: '300px',
        rot: '-2.5deg',
        role: 'PE / VC PORTFOLIO',
        days: '2 days / wk',
        name: 'Ex-CTO · 3 successful exits',
        cred: 'Tech diligence + transformation for PE firms',
        tags: ['Diligence', 'M&A'],
      },
    ],
    statusPills: [
      { left: '340px', top: '120px', icon: 'clock', label: 'Matched in 7 days' },
      { left: '20px', top: '390px', icon: 'shieldCheck', label: 'Available now' },
    ],
  },
  trusted: {
    label: 'Trusted by 300+\nengineering teams',
    logos: ['Virgin', 'Salmon', 'Hotelplan', 'Willo', 'Travelex', 'Tidal', 'Scorpion'],
    aiPill: 'Ask our AI anything',
  },
  video: {
    eyebrow: 'Watch Seb explain it · 90 sec',
    title: 'How fractional CTO matching works.',
    tag: 'Seb Hall, CEO · 90-second explainer',
    name: 'Seb Hall',
    role: 'Cloud Employee · CEO & Co-Founder',
    play: 'Watch Seb explain it · 90 sec',
    timeStart: '00:00',
    timeEnd: '01:30',
    stateIdle: 'How we match you with a fractional CTO in days.',
    statePlaying: 'Playing - Seb explains how matching works.',
  },
  does: {
    eyebrow: 'What they do for you',
    title: 'What a fractional CTO actually does',
    cards: [
      { h4: 'Builds your product roadmap.', p: 'Turns business goals into a 6-12 month engineering plan you can ship against.' },
      { h4: 'Advises on your tech stack.', p: "Picks the architecture, tools, and infrastructure decisions you'll live with for years." },
      { h4: 'Hires your engineers.', p: "Writes the JDs, runs the technical interviews, and makes the calls you can't." },
      { h4: 'Talks to your investors.', p: 'Sits in board meetings, answers tech diligence, and validates your roadmap to your cap table.' },
      { h4: 'Plans your AI strategy.', p: "Figures out what's worth building, what to buy off the shelf, and what to ignore." },
      { h4: 'Helps hire your full-time CTO.', p: "Eventually, when you're ready, helps you find them, vet them, and hand over cleanly." },
    ],
  },
  statement: {
    eyebrow: "You can't find the right people. And time is running out.",
    line1: "We've spent a decade building the network",
    line2: "so you don't have to.",
    sub: 'We match you in days.',
  },
  matched: {
    eyebrow: 'From brief to first session',
    h2Lead: 'Matched in',
    h2Em: '7 days.',
    topSub: 'Four steps between your first call and a fractional CTO at your table.',
    feature: {
      h3: 'Tell us what you need.',
      p: '30-minute call with a US-based account manager. We learn your business, your situation, and what "good" looks like.',
      foot: 'Free intro · No commitment',
    },
    steps: [
      { h4: 'We match you.', p: 'We shortlist two leaders from our vetted network based on domain, stage, industry expertise, and working-style / culture fit.' },
      { h4: 'You meet them. You decide.', p: "Speak with both, free. Pick the leader you connect with and that you'd want at your board table. No pressure either way." },
      { h4: 'They start.', p: 'Contracts, IP, onboarding, billing - all handled. Work directly with your fCTO day-to-day. Rolling monthly, no lock-ins.' },
    ],
  },
  derisk: {
    eyebrow: 'Why this is low risk',
    benefits: ['Speak before you proceed', 'Replace at no cost', 'Rolling monthly', 'Employment handled'],
  },
  selfcheck: {
    eyebrow: 'A quick self-check',
    h2Lead: 'Do any of these',
    h2Em: 'sound familiar?',
    // DOM order fills the 2-column grid row-by-row: left col = 01,02,03 / right col = 04,05,06.
    items: [
      { n: '01', p: 'The founding team is non-technical.' },
      { n: '04', p: 'You have already spent hours trying to hire a CTO and not succeeded.' },
      { n: '02', p: "You're managing developers and you can't tell if the work is any good." },
      { n: '05', p: "You're preparing for a fundraise, acquisition, or due diligence." },
      { n: '03', p: "Investors are asking technical questions you can't answer." },
      { n: '06', p: "You need a CTO but can't justify the full-time hire yet." },
    ],
  },
  matchform: {
    // Hidden for now (Jake, 3 Aug) — quiz H2 stands alone. Restore the string
    // to bring the lime eyebrow back.
    eyebrow: '',
    h2Lead: "Tell us where you are. We'll",
    h2Em: 'match you in days',
    lead: 'Four quick questions. A US-based account manager personally matches you within 7 days.',
    progress: [
      { num: '01', lb: 'Where' },
      { num: '02', lb: 'Skills' },
      { num: '03', lb: 'Team size' },
      { num: '04', lb: 'Your match' },
    ],
    // Step-0 option buttons (the only rendered option set - the source keeps
    // these mounted for steps 0-2 and hides them on step 3).
    options: [
      { label: 'Pre-product, no engineers yet', wide: false },
      { label: 'Building an MVP with developers or an agency', wide: false },
      { label: 'Have a team, scaling without senior tech leadership', wide: false },
      { label: 'Have a CTO or tech lead, need support or a second opinion', wide: false },
      { label: 'Established business adopting AI or going through digital transformation', wide: true },
    ],
    back: '← Back',
    steps: [
      { title: 'Where are you?', hint: "Pick the one that's closest. We'll dig into the detail on the intake call." },
      { title: 'What do you need help with?', hint: 'Pick the areas that matter most - your match is chosen around them.' },
      { title: 'How big is your team?', hint: 'Rough is fine. It helps us match the right level of leadership.' },
      { title: "You're all set.", hint: 'A US-based account manager will personally match you within 7 days.' },
    ],
    nextDefault: 'Next',
    nextStep2: 'Match me',
    nextStep3: 'Done',
    reassureLabel: 'Prefer to talk first?',
    pillAi: 'Ask our AI anything',
    pillBook: 'Book a call',
    trust: ['100% free matching', 'US-based network', 'Speak before you commit', 'Rolling monthly, no lock-ins'],
  },
  faq: {
    eyebrow: 'Fractional CTO · FAQ',
    title: 'Questions founders ask.',
    ctaEyebrow: "Can't find your question?",
    ctaBody: "Ask our AI chatbot - trained on every sales call we've had.",
    ctaBtn: 'Open chat',
    items: [
      { n: '01', q: 'What does a fractional CTO cost?', a: 'Most engagements run on a simple monthly rate tied to the days per week you need - typically one to three. No recruiter fee, no equity ask, no long contract. You see the number before you commit.' },
      { n: '02', q: 'How much time will they actually give us?', a: 'You choose the cadence, from a day a week to near full-time. Whatever you pick, you get a named leader who is genuinely engaged - not someone spread thin across ten clients.' },
      { n: '03', q: 'Can we hire them full-time later?', a: "Often, yes. Many founders start fractional and convert once the role is proven. If that's the goal, we'll factor it into the match from day one." },
      { n: '04', q: 'Can my matched CTO also help me hire engineers?', a: 'Absolutely. Writing JDs, running technical interviews, and building out your team is one of the most common things a fractional CTO does for you.' },
      { n: '05', q: "What if it isn't working?", a: "Tell us and we'll replace them at no cost. Engagements are rolling monthly with no lock-ins, so you're never stuck with the wrong fit." },
      { n: '06', q: 'Are they exclusive to us?', a: "During your agreed days they're yours and focused on your business. They may hold other fractional roles on their remaining days, which keeps their perspective sharp." },
      { n: '07', q: 'How is this different from Toptal or TechCXO?', a: "We match, not list. You don't scroll a marketplace - a US-based account manager shortlists two vetted leaders for your specific stage and stack, and you speak to both before deciding." },
      { n: '08', q: 'Do they work in our timezone?', a: 'Yes. Our US-nearshore network overlaps your working hours, so standups, board calls, and Slack all happen in real time.' },
    ],
  },
  final: {
    h2Lead: 'Ready to hire your',
    h2Em: 'next engineer?',
    p: 'Tell us where you are. A US-based account manager matches you within 7 days.',
    cta: 'Find your Fractional CTO',
    metrics: ['300+ teams built', '97% stay 2+ years', 'No lock-ins'],
  },
}
