// TEMPLATE-LOCATION content model.
//
// One template, three region variants (LATAM, Eastern Europe, Philippines),
// each a self-contained LocationContent object. Copy is transcribed VERBATIM
// from the locked reference exports in docs/raw-html/location/*.html (rendered
// and text-extracted), with the matching PNGs as the visual acceptance target.
//
// Region images live under /location/<region>/ (extracted from the reference
// HTML's embedded asset map). Client logos + the calculator are shared with the
// rest of the site. Author-voice rule: no em/en dashes - plain hyphens only.
//
// TODO(wiring): this static content is the fidelity target for the current pass.
// A later pass binds it to Sanity (per-region singleton or the service doc) and
// serves it at /services/<region>-developers instead of the preview route.

export interface Pill {
  value: string
  label: string
}

export interface HeroCard {
  name: string
  role: string
  /** Layout-only in the current hero stack; kept optional for older content. */
  vettedLabel?: string
  skills: string[]
  image: string
  /** Layout-only in the current hero stack; kept optional for older content. */
  rotate?: number
  flag: string
}

// Client logo in the "trusted by" strip. Images arrive as dereferenced URL
// strings from Sanity (or the static fallback paths below).
export interface LocationLogo {
  name: string
  src: string
  width?: number
  height?: number
  invert?: boolean
  displayH?: number
  displayOpacity?: number
}

export interface AdvantageCard {
  eyebrow: string
  title: string
  body: string
  /** Optional icon override; falls back to positional TIMEZONE_ICONS in the template. */
  icon?: 'clock' | 'dollar' | 'bolt' | 'globe' | 'chat' | 'users'
}

export interface HubCard {
  city: string
  note: string
  image: string
}

export interface EngineerProfile {
  name: string
  role: string
  skills: string[]
  years: string
  bio: string
  image: string
  flag: string
}

export interface FaqItem {
  number: string
  question: string
  answer: string
}

export interface StartCard {
  eyebrow: string
  title: string
  body: string
  bullets?: string[]
  cta: string
  ctaHref: string
}

export interface LocationContent {
  region: string
  slug: string
  hero: {
    eyebrow: string
    titleLead: string
    titleConnector: string
    titleAccent: string
    paragraph: string
    ctaPrimary: string
    ctaSecondary: string
    trustPills: string[]
    cards: HeroCard[]
    floatingBadges: string[]
  }
  logosLabel: string
  /** Optional logo-strip label lines. Standard trusted-by copy renders on two lines. */
  logosLabelLines?: string[]
  /** Optional editable logo strip. Falls back to the shared logo set when absent. */
  logos?: LocationLogo[]
  advantage: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    intro: string
    cards: AdvantageCard[]
  }
  video: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    intro: string
    presenter: string
    pullQuote: string
    image: string
    /** Local mp4 path — muted ambient autoplay on load; click restarts with sound. */
    videoSrc?: string
    /** YouTube/Vimeo/Loom link. Used when `videoSrc` is absent. */
    videoUrl?: string
  }
  // Optional across regions: the "four hubs" bulleted+image section (LATAM/EE
  // have it; PH replaces it with the EOR + included sections below).
  onGround?: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    body: string
    bullets: string[]
    image: string
  }
  // PH-only: "How we keep your engineer" - Employer-of-Record commitments as a
  // titled + described checklist.
  eor?: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    /** Optional line above the title (e.g. "Compliantly employed."). */
    subhead?: string
    intro?: string
    items: { title: string; body: string }[]
  }
  // PH-only: "What's included" - a you-direct / we-handle split inside one card.
  included?: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    /** Column label, count included (e.g. "You - 3 things"). */
    youLabel: string
    you: string[]
    /** Optional subhead under the You label. Each sentence renders on its own line. */
    youSubhead?: string
    /** Optional supporting paragraph under the You subhead. */
    youBody?: string
    /** Optional closing line pinned to the bottom of the You column. */
    youFootnote?: string
    /** Column label, count included (e.g. "We - 8 things"). */
    weLabel: string
    we: string[]
    /** Optional subhead under the We label. */
    weSubhead?: string
    /** Optional supporting paragraph under the We subhead. */
    weBody?: string
    /** Optional lime pill beside the We label. */
    wePill?: string
    footnote: string
  }
  // PH-only: three-region strip (Makati / Cebu / Clark) with retention callout.
  regionsStrip?: {
    title: string
    hubs: HubCard[]
    retentionValue: string
    retentionLabel: string
  }
  primaryHub: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    bannerEyebrow: string
    bannerTitle: string
    bannerBody: string
    image: string
    secondaryEyebrow: string
    secondary: HubCard[]
  }
  engineers: {
    titleLead: string
    titleAccent: string
    intro: string
    profiles: EngineerProfile[]
  }
  funFact: {
    eyebrow: string
    body: string
    source: string
  }
  calculator: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    titleSuffix: string
    /** Per-region calculator options + cost multipliers (omit for the LATAM default). */
    calcRegions?: { id: string; label: string; mult: number }[]
    /** Currency symbol for the figures (default '$'). PH uses '£'. */
    currency?: string
    /** Role options in the region's currency (default the $ set). */
    roles?: { id: string; label: string; base: number }[]
    /** Loaded local annual cost as a multiple of the monthly figure (default 2.9). */
    comparisonMultiple?: number
    /** Result-card eyebrow (default 'Estimated monthly cost'). PH: 'Your match would cost'. */
    resultEyebrow?: string
    /** Saving comparison label (default 'vs. hiring in the US'). PH: 'vs. hiring in the UK'. */
    savedPrefix?: string
    /** Seniority options (default Mid/Senior/Lead). PH is senior-focused only. */
    seniorityOptions?: { id: string; label: string; mult: number }[]
    savingsSticker: string
    savingsStickerSub: string
    disclaimer: string
  }
  start: {
    eyebrow: string
    titleLead: string
    titleAccent: string
    cards: StartCard[]
    /** 'quiz' renders LocationStartQuiz instead of the three start cards. */
    variant?: 'cards' | 'quiz'
    quiz?: {
      eyebrow: string
      title: string
      subtitle: string
      stepLabel: string
      prompt: string
      hint: string
      roles: string[]
      cta: string
      ctaHref: string
      selectedPrefix: string
      emptyStatus: string
    }
  }
  faq: {
    eyebrow: string
    title: string
    helpEyebrow: string
    helpBody: string
    helpCta: string
    items: FaqItem[]
  }
}

const A = '/location/latam'

function regionalIncluded(region: string): NonNullable<LocationContent['included']> {
  return {
    eyebrow: "What's included",
    titleLead: 'You get the engineer.',
    titleAccent: 'We handle everything else.',
    youLabel: 'You - 3 things',
    youSubhead: 'Run your team. Ship your product.',
    youBody: "The engineer works like any other member of your team. That's the only part you touch.",
    you: [
      "Direct your engineer's work",
      'Bring them into standups and Slack',
      'Treat them like a full-time hire',
    ],
    youFootnote: 'No HR. No payroll. No local entity. No admin.',
    weLabel: 'We - 8 things',
    wePill: 'Included in the fee',
    weSubhead: 'The full operational stack.',
    weBody:
      'Employment, compliance, retention and risk - handled in their country, billed as one line.',
    we: [
      "Source and vet the engineer (free if you don't hire)",
      'Employ them locally with full benefits and private healthcare',
      `Handle payroll, taxes and compliance across ${region}`,
      'Provide a US or UK-based account manager',
      "Replace them at no cost if it isn't working",
      'Support training, performance and retention long-term',
      'Liability insurance on every contract',
      'IP and data protection assigned to you',
    ],
    footnote: 'One monthly fee. No setup. No placement fees. 30 days notice on a rolling contract.',
  }
}

export const LATAM_CONTENT: LocationContent = {
  region: 'Latin America',
  slug: 'latam-developers',
  hero: {
    eyebrow: 'Talent Location · Latin America',
    titleLead: 'Hire senior engineers',
    titleConnector: 'in',
    titleAccent: 'Latin America',
    paragraph:
      'AI, ML, data, and full-stack engineers based in Latin America. Expertly matched. Embedded full-time on rolling contracts.',
    ctaPrimary: 'Meet your engineer in 7 days',
    ctaSecondary: 'See the cost calculator',
    trustPills: ['Senior engineers, US hours', 'Same-day standups', 'Rolling monthly, no lock-ins'],
    cards: [
      {
        name: 'Ana M.',
        role: 'Senior Full-Stack · 6 yrs',
        vettedLabel: 'Vetted by Senior Eng',
        skills: ['React', 'Node.js', 'TypeScript'],
        image: `${A}/eng-ana.jpg`,
        rotate: 3,
        flag: '🇨🇴',
      },
      {
        name: 'Mateus S.',
        role: 'Senior Full Stack · 7 yrs',
        vettedLabel: 'Vetted by Senior Eng',
        skills: ['React', 'Node.js', 'TypeScript'],
        image: `${A}/eng-mateus.jpg`,
        rotate: -2,
        flag: '🇧🇷',
      },
    ],
    floatingBadges: ['Live pair programming', '7-day shortlist'],
  },
  logosLabel: 'Trusted by 300+ engineering teams',
  advantage: {
    eyebrow: 'Time zone advantage',
    titleLead: 'They work',
    titleAccent: 'when you work',
    intro: 'Senior engineers on US business hours. Same Slack, same standups, same day.',
    cards: [
      {
        eyebrow: 'Time zone',
        title: 'Same US office hours',
        body: 'They start when you start. Same Slack, same standups, same day.',
      },
      {
        eyebrow: 'Cost',
        title: '$90k vs $180k+',
        body: 'Loaded annual cost for a senior engineer. Same call as your US hire.',
      },
      {
        eyebrow: 'What they build',
        title: 'AI · ML · Full-Stack',
        body: '5-9 years in production. Most have shipped at US companies before.',
      },
      {
        eyebrow: 'English',
        title: 'Fluent and vetted',
        body: 'Every engineer screened by our senior technical team. Argentina ranks #1 in LATAM EF EPI.',
      },
    ],
  },
  video: {
    eyebrow: 'Why LATAM',
    titleLead: 'Why US companies are hiring in',
    titleAccent: 'Latin America.',
    intro:
      'Seb on the time zone advantage, the seniority bar, and why LATAM has become the default nearshore choice for serious US engineering teams.',
    presenter: 'Seb Hall · Why LATAM',
    pullQuote: 'same seniority, half the cost.',
    // Same Seb Hall explainer as the live CE home page. Hosted as mp4 so
    // muted ambient autoplay works on every domain (Vimeo embeds are
    // privacy-restricted outside cloudemployee.io and look squashed when
    // forced into background mode).
    image: '/design/home/media/seb-hall.jpg',
    videoSrc: '/design/home/media/seb-hall.mp4',
    videoUrl: 'https://player.vimeo.com/video/1131836141?h=765af4f0eb',
  },
  onGround: {
    eyebrow: 'Where we are',
    titleLead: 'On the ground across four',
    titleAccent: 'LATAM hubs.',
    body: 'We hire and embed senior engineers across Mexico, Brazil, Argentina, and Colombia. Local recruiters in each market know the engineering communities from the inside.',
    bullets: [
      'Local recruiters and senior-engineer vetting in each market',
      'HR, payroll, compliance handled locally per country',
      'L&D budget and wellbeing for every placed engineer',
      'Home, coworking, or hybrid - engineers work how they work best',
    ],
    image: `${A}/team.jpg`,
  },
  included: regionalIncluded('Latin America'),
  primaryHub: {
    eyebrow: 'Where we are on the ground',
    titleLead: 'Mexico City is our heart in',
    titleAccent: 'Latin America.',
    bannerEyebrow: 'Our biggest hub · Mexico City',
    bannerTitle: '30-40 engineers and growing. Heavy in fintech.',
    bannerBody:
      'Mexico City is the financial and tech centre of Latin America. Our largest concentration of engineers is here - full-stack, backend, and mobile specialists who ship production code.',
    image: `${A}/hub-mexico.jpg`,
    secondaryEyebrow: 'Also on the ground in',
    secondary: [
      { city: 'Buenos Aires', note: '#1 in LATAM English proficiency', image: `${A}/hub-buenosaires.jpg` },
      { city: 'Bogotá', note: 'fastest-growing talent hub in LATAM', image: `${A}/hub-bogota.jpg` },
    ],
  },
  engineers: {
    titleLead: "Engineers we've placed from",
    titleAccent: 'Latin America.',
    intro: "Three real engineers currently embedded with our clients. Anonymised - you'll meet them on a call.",
    profiles: [
      {
        name: 'Reinaldo A.',
        role: 'Senior Backend Engineer · Mexico City',
        skills: ['Python', 'AWS', 'Go'],
        years: '8 years experience',
        bio: 'Previously at a Mexican AI startup. Placed with a US health-tech company for 14 months. Works US ET.',
        image: `${A}/eng-reinaldo.jpg`,
        flag: '🇲🇽',
      },
      {
        name: 'Ana M.',
        role: 'Full-Stack Engineer · Bogotá',
        skills: ['React', 'Node.js', 'TypeScript'],
        years: '6 years experience',
        bio: 'Previously at a Colombian fintech. Placed with a US SaaS for 2 years. Works US ET.',
        image: `${A}/eng-ana.jpg`,
        flag: '🇨🇴',
      },
      {
        name: 'Mateus S.',
        role: 'Senior Full Stack Engineer · São Paulo',
        skills: ['React', 'Node.js', 'TypeScript'],
        years: '7 years experience',
        bio: 'Previously at a Brazilian unicorn. Placed with a US e-commerce company for 18 months. Works US PT.',
        image: `${A}/eng-mateus.jpg`,
        flag: '🇧🇷',
      },
    ],
  },
  funFact: {
    eyebrow: 'Did you know',
    body: "Mexico City is the same time as Dallas. São Paulo is two hours off New York. Buenos Aires is one hour off. This isn't partial overlap - it's real-time engineering.",
    source: 'Sources: IANA Time Zones, TimeAndDate.com',
  },
  calculator: {
    eyebrow: 'Pricing calculator',
    titleLead: 'What would a',
    titleAccent: 'Latin American',
    titleSuffix: 'engineer cost?',
    savingsSticker: 'Save $85,200/yr',
    savingsStickerSub: 'vs hiring in the US',
    disclaimer: '*Ranges based on actual placements. Final price confirmed after discovery call.',
  },
  start: {
    eyebrow: 'Ready to hire from Latin America?',
    titleLead: 'Three ways to',
    titleAccent: 'start',
    cards: [
      {
        eyebrow: '',
        title: 'Get two LATAM engineers in 7 days.',
        body: 'Tell us what you need. Four quick questions about your stack, team, and budget.',
        bullets: ['Free to interview, no card required', 'No job boards, no CVs, no time wasted'],
        cta: 'Start the brief',
        ctaHref: '/start-hiring',
      },
      {
        eyebrow: 'Want guidance',
        title: 'Talk to a CTO.',
        body: "30-minute call. We'll help you figure out which LATAM country and seniority level fits your team.",
        cta: 'Schedule a call',
        ctaHref: '/schedule-a-call',
      },
      {
        eyebrow: 'Have questions',
        title: 'Chat with our AI.',
        body: "Trained on every sales call we've had. Ask anything about hiring in LATAM.",
        cta: 'Open chat',
        ctaHref: '#chat',
      },
    ],
  },
  faq: {
    eyebrow: 'Latin America · FAQ',
    title: 'Questions US CTOs ask about hiring in Latin America',
    helpEyebrow: "Can't find your question?",
    helpBody: "Ask our AI chatbot - trained on every sales call we've had.",
    helpCta: 'Open chat',
    items: [
      {
        number: '01',
        question: "What's the time zone overlap with US East Coast and West Coast?",
        answer:
          'Most LATAM engineers work full US business hours. Mexico City is on Central Time, Bogotá on Eastern, São Paulo two hours ahead of New York. You get real-time overlap with both coasts, not a few hours at the edges.',
      },
      {
        number: '02',
        question: 'Do your engineers really speak fluent English?',
        answer:
          'Yes. Every engineer is screened for spoken and written English by our senior technical team before you meet them. Argentina and Colombia rank at the top of LATAM for English proficiency.',
      },
      {
        number: '03',
        question: 'How does Cloud Employee handle Latin American employment law and compliance?',
        answer:
          'We handle HR, payroll, taxes, and local compliance in each country, so there is nothing for you to set up. Your engineer is employed and paid locally, fully compliant, on a rolling monthly contract.',
      },
      {
        number: '04',
        question: 'Can I vet our engineers in Latin America?',
        answer:
          'Always. You interview every candidate and make the final call. We shortlist to two vetted engineers per role, typically within 7 working days, and you take it from there.',
      },
      {
        number: '05',
        question: "What's the difference between hiring in Mexico vs. Brazil vs. Argentina vs. Colombia?",
        answer:
          'Mexico City is our largest hub and strongest in fintech and full-stack. Brazil brings deep product and scale experience, Argentina leads on English and data, Colombia is the fastest-growing hub. We match to the fit, not the flag.',
      },
      {
        number: '06',
        question: 'Are LATAM engineers experienced with US companies?',
        answer:
          'Most have already shipped production code at US companies. We place senior engineers with 5-9 years of experience who are used to US tooling, US standups, and US delivery expectations.',
      },
      {
        number: '07',
        question: 'What about IP protection and data privacy?',
        answer:
          'Your IP is yours. Contracts assign all work product to you, engineers sign NDAs, and we support your security and data-privacy requirements per country.',
      },
    ],
  },
}

// ── Eastern Europe ──────────────────────────────────────────────────────────
const EE = '/location/eastern-europe'

export const EASTERN_EUROPE_CONTENT: LocationContent = {
  region: 'Eastern Europe',
  slug: 'eastern-europe-developers',
  hero: {
    eyebrow: 'Talent Location · Eastern Europe',
    titleLead: 'Hire senior engineers',
    titleConnector: 'in',
    titleAccent: 'Eastern Europe',
    paragraph:
      'Deep-tech, backend, and platform engineers across Eastern Europe. World-class CS education, EU/US overlap. Embedded full-time on rolling contracts.',
    ctaPrimary: 'Meet your engineer in 7 days',
    ctaSecondary: 'See the cost calculator',
    trustPills: ['Elite CS education', 'EU & US-morning overlap', 'Rolling monthly, no lock-ins'],
    // Home-style 3-card stack order: [0] back · [1] middle · [2] front (main).
    cards: [
      {
        name: 'Andriy T.',
        role: 'Senior Data Eng · 10 yrs',
        vettedLabel: 'Vetted by Senior Eng',
        skills: ['Python', 'Spark', 'Airflow'],
        image: `${EE}/eng-3.jpg`,
        rotate: 2.5,
        flag: '🇺🇦',
      },
      {
        name: 'Ivana D.',
        role: 'Senior Backend Eng · 8 yrs',
        vettedLabel: 'Vetted by Senior Eng',
        skills: ['Java', 'Kafka', 'Spring'],
        image: `${EE}/eng-2.jpg`,
        rotate: 3,
        flag: '🇷🇴',
      },
      {
        name: 'Petar K.',
        role: 'Senior Platform Eng · 9 yrs',
        vettedLabel: 'Vetted by Senior Eng',
        skills: ['Go', 'Kubernetes', 'AWS'],
        image: `${EE}/eng-1.jpg`,
        rotate: -3,
        flag: '🇵🇱',
      },
    ],
    // One floating pill keeps the location hero cleaner than the home collage.
    floatingBadges: ['7-day shortlist'],
  },
  logosLabel: 'Trusted by 300+ engineering teams',
  advantage: {
    eyebrow: 'Time zone advantage',
    titleLead: 'A window with',
    titleAccent: 'the US & EU',
    intro:
      'Eastern European engineers overlap your full EU day and your US mornings. Same Slack, same standups, same day.',
    cards: [
      {
        eyebrow: 'Time zone',
        title: 'EU day + US mornings',
        body: 'Full overlap with EU teams, live window with US East Coast every morning.',
      },
      {
        eyebrow: 'Cost',
        title: '$85k vs $180k+',
        body: 'Loaded annual cost for a senior engineer. Roughly half a US hire.',
      },
      {
        eyebrow: 'What they build',
        title: 'Platform · Backend · Data',
        body: '7-10 years in production. Strong systems and deep-tech backgrounds.',
      },
      {
        eyebrow: 'English',
        title: 'Fluent and vetted',
        body: 'Every engineer screened by our senior technical team. Strong professional English across the region.',
      },
    ],
  },
  video: {
    eyebrow: 'Why Eastern Europe',
    titleLead: 'Why US & EU teams hire for',
    titleAccent: 'deep-tech strength.',
    intro:
      'Seb on the engineering-education pipeline, the deep-tech strength, and why Eastern Europe is the benchmark for senior systems talent.',
    presenter: 'Grace Tannor · Why Eastern Europe',
    pullQuote: 'elite engineering, fair rates.',
    image: `${EE}/video-still.jpg`,
  },
  onGround: {
    eyebrow: 'Where we are',
    titleLead: 'On the ground across four',
    titleAccent: 'regional hubs.',
    body: 'We hire and embed senior engineers across Poland, Ukraine, Romania, and Bulgaria. Local recruiters in each market know the engineering communities from the inside.',
    bullets: [
      'Local recruiters and senior-engineer vetting in each market',
      'HR, payroll, compliance handled locally per country',
      'L&D budget and wellbeing for every placed engineer',
      'Home, coworking, or hybrid - engineers work how they work best',
    ],
    image: `${EE}/team.jpg`,
  },
  included: regionalIncluded('Eastern Europe'),
  primaryHub: {
    eyebrow: 'Where we are on the ground',
    titleLead: 'Warsaw is our',
    titleAccent: 'biggest hub.',
    bannerEyebrow: 'Our biggest hub · Warsaw',
    bannerTitle: '40+ engineers and growing. Heavy in platform.',
    bannerBody:
      'Warsaw is a leading tech centre of Eastern Europe. Our largest concentration of engineers is here - platform, backend, and data specialists who ship production code.',
    image: `${EE}/hub-a.jpg`,
    secondaryEyebrow: 'Also on the ground in',
    secondary: [
      { city: 'Kraków', note: 'dense senior engineering pool', image: `${EE}/hub-b.jpg` },
      { city: 'Bucharest', note: 'fastest-growing hub in the region', image: `${EE}/hub-c.jpg` },
    ],
  },
  engineers: {
    titleLead: "Engineers we've placed from",
    titleAccent: 'Eastern Europe.',
    intro: "Three real engineers currently embedded with our clients. Anonymised - you'll meet them on a call.",
    profiles: [
      {
        name: 'Petar K.',
        role: 'Senior Platform Engineer · Warsaw',
        skills: ['Go', 'Kubernetes', 'AWS'],
        years: '9 years experience',
        bio: 'Previously at a Polish scale-up. Placed with a US infrastructure company for 2 years. Overlaps US mornings.',
        image: `${EE}/eng-1.jpg`,
        flag: '🇵🇱',
      },
      {
        name: 'Ivana D.',
        role: 'Senior Backend Engineer · Bucharest',
        skills: ['Java', 'Kafka', 'Spring'],
        years: '8 years experience',
        bio: 'Previously at a Romanian fintech. Placed with a US SaaS for 18 months. Overlaps EU and US mornings.',
        image: `${EE}/eng-2.jpg`,
        flag: '🇷🇴',
      },
      {
        name: 'Andriy T.',
        role: 'Senior Data Engineer · Kyiv',
        skills: ['Python', 'Spark', 'Airflow'],
        years: '10 years experience',
        bio: 'Previously at a global product company. Placed with a US analytics team for 2 years.',
        image: `${EE}/eng-3.jpg`,
        flag: '🇺🇦',
      },
    ],
  },
  funFact: {
    eyebrow: 'Did you know',
    body: "Eastern Europe produces some of the world's highest-ranked competitive programmers, and its working day overlaps both your EU teams and your US mornings.",
    source: 'Sources: IANA Time Zones, ICPC World Finals rankings',
  },
  calculator: {
    eyebrow: 'Pricing calculator',
    titleLead: 'What would an',
    titleAccent: 'Eastern European',
    titleSuffix: 'engineer cost?',
    calcRegions: [
      { id: 'ee', label: 'Eastern Europe', mult: 1.093 },
      { id: 'poland', label: 'Poland', mult: 1.11 },
      { id: 'romania', label: 'Romania', mult: 1.06 },
      { id: 'ukraine', label: 'Ukraine', mult: 1.0 },
      { id: 'bulgaria', label: 'Bulgaria', mult: 1.02 },
    ],
    comparisonMultiple: 2.1013,
    savingsSticker: 'Save $78,001/yr',
    savingsStickerSub: 'vs hiring in the US',
    disclaimer: '*Ranges based on actual placements. Final price confirmed after discovery call.',
  },
  start: {
    eyebrow: 'Ready to hire from Eastern Europe?',
    titleLead: 'Three ways to',
    titleAccent: 'start',
    cards: [
      {
        eyebrow: '',
        title: 'Get two Eastern European engineers in 7 days.',
        body: 'Tell us what you need. Four quick questions about your stack, team, and budget.',
        bullets: ['Free to interview, no card required', 'No job boards, no CVs, no time wasted'],
        cta: 'Start the brief',
        ctaHref: '/start-hiring',
      },
      {
        eyebrow: 'Want guidance',
        title: 'Talk to a CTO.',
        body: "30-minute call. We'll help you figure out which country and seniority level fits your team.",
        cta: 'Schedule a call',
        ctaHref: '/schedule-a-call',
      },
      {
        eyebrow: 'Have questions',
        title: 'Chat with our AI.',
        body: "Trained on every sales call we've had. Ask anything about hiring in Eastern Europe.",
        cta: 'Open chat',
        ctaHref: '#chat',
      },
    ],
  },
  faq: {
    eyebrow: 'Eastern Europe · FAQ',
    title: 'Questions CTOs ask about hiring in Eastern Europe',
    helpEyebrow: "Can't find your question?",
    helpBody: "Ask our AI chatbot - trained on every sales call we've had.",
    helpCta: 'Open chat',
    items: [
      {
        number: '01',
        question: "What's the time zone overlap with the US and EU?",
        answer:
          'Eastern European engineers cover your full EU business day and overlap the US East Coast every morning. You get real-time collaboration with EU teams and a live window with US mornings, not handovers.',
      },
      {
        number: '02',
        question: 'How strong is English fluency?',
        answer:
          'Strong. English is taught throughout schooling and used professionally across the region. Every engineer is screened for spoken and written English by our senior technical team before you meet them.',
      },
      {
        number: '03',
        question: 'How does Cloud Employee handle EU employment law and compliance?',
        answer:
          'We handle HR, payroll, taxes, and local compliance in each country, so there is nothing for you to set up. Your engineer is employed and paid locally, fully compliant, on a rolling monthly contract.',
      },
      {
        number: '04',
        question: 'Can I visit our engineers in Eastern Europe?',
        answer:
          'Yes. Many clients visit their teams or fly engineers out for onboarding. We help arrange it and our local teams host on the ground.',
      },
      {
        number: '05',
        question: "What's the difference between hiring in Poland vs. Romania vs. Ukraine?",
        answer:
          'Poland (Warsaw, Kraków) is our largest hub and strongest in platform and backend. Romania brings deep data and fintech experience, Ukraine leads on systems and product engineering. We match to the fit, not the flag.',
      },
      {
        number: '06',
        question: 'Are Eastern European engineers experienced with US companies?',
        answer:
          'Most have already shipped production code for US or EU companies. We place senior engineers with 7-10 years of experience who are used to Western tooling, standups, and delivery expectations.',
      },
      {
        number: '07',
        question: 'What about IP protection and data privacy?',
        answer:
          'Your IP is yours. Contracts assign all work product to you, engineers sign NDAs, and we support your GDPR and data-privacy requirements per country.',
      },
    ],
  },
}

// ── Philippines ─────────────────────────────────────────────────────────────
// Structurally the richest variant: UK/AU framing, GBP calculator, Employer-of-
// Record + "What's included" sections instead of the LATAM/EE four-hubs block.
const PH = '/location/philippines'

export const PHILIPPINES_CONTENT: LocationContent = {
  region: 'Philippines',
  slug: 'philippines-developers',
  hero: {
    eyebrow: 'Talent Location · Philippines',
    titleLead: 'Hire senior engineers',
    titleConnector: 'in the',
    titleAccent: 'Philippines.',
    paragraph:
      'AI, ML, data, and full-stack engineers based in the Philippines. Working your time zone. Embedded full-time on rolling contracts.',
    ctaPrimary: 'Meet your engineer in 7 days',
    ctaSecondary: 'See the cost calculator',
    trustPills: ['Works your exact hours', 'English official language', '20+ years tech delivery'],
    cards: [
      {
        name: 'Aileen R.',
        role: 'Senior Mobile · 6 yrs',
        vettedLabel: 'Vetted by Senior Eng',
        skills: ['React Native', 'Swift'],
        image: `${PH}/eng-1.jpg`,
        rotate: 3,
        flag: '🇵🇭',
      },
      {
        name: 'Jericho S.',
        role: 'Senior Backend · 9 yrs',
        vettedLabel: 'Vetted by Senior Eng',
        skills: ['.NET', 'Azure', 'SQL'],
        image: `${PH}/eng-2.jpg`,
        rotate: -2,
        flag: '🇵🇭',
      },
    ],
    floatingBadges: ['Your exact hours', '7-day shortlist'],
  },
  logosLabel: 'Trusted by 300+ engineering teams',
  advantage: {
    eyebrow: 'Built for UK & AU teams',
    titleLead: 'Built for UK and Australian',
    titleAccent: 'teams.',
    intro: 'Engineers who work your day, speak your language, and stay for the long run.',
    cards: [
      {
        eyebrow: 'Your working hours',
        title: 'UK or AU day shifts',
        body: 'UK daytime or AU daytime schedules, every day. Standups, sprints, real-time - not overlap, not handovers.',
        icon: 'clock',
      },
      {
        eyebrow: 'English speaking',
        title: 'Native level',
        body: 'Official language, taught from primary school, used in business by default. #2 in Asia, EF EPI.',
        icon: 'chat',
      },
      {
        eyebrow: 'Seniority',
        title: '5+ years min',
        body: "We don't place juniors. Every engineer has shipped production at scale, with senior interviews on your stack.",
        icon: 'bolt',
      },
      {
        eyebrow: 'Retention',
        title: '97% stay 2+ yrs',
        body: "We're built to keep them, not churn them - so you're not re-hiring every six months.",
        icon: 'users',
      },
    ],
  },
  video: {
    eyebrow: 'Customer story · 90 sec',
    titleLead: '"They feel like part of our team."',
    titleAccent: '',
    intro:
      'Marcus Kilgour, CTO at Salmon Software, on hiring engineers via Cloud Employee - and why the model has worked.',
    presenter: 'Marcus Kilgour · CTO, Salmon Software',
    pullQuote: 'Watch · 90 sec',
    image: `${PH}/video-still.jpg`,
  },
  regionsStrip: {
    title: 'Built on the ground in three regions.',
    hubs: [
      { city: 'Makati', note: 'Financial district · Largest concentration', image: `${PH}/hub-a.jpg` },
      { city: 'Cebu', note: 'Second-largest tech ecosystem', image: `${PH}/hub-b.jpg` },
      { city: 'Clark', note: 'Government-incentivised tech zone', image: `${PH}/hub-c.jpg` },
    ],
    retentionValue: '97% retention',
    retentionLabel: 'Engineers stay 2+ years',
  },
  eor: {
    eyebrow: 'How we keep your engineer',
    titleLead: 'Yours, for the',
    titleAccent: 'long run.',
    subhead: 'Compliantly employed.',
    intro:
      'The hidden cost of cheap Philippine outsourcing is the churn. We employ engineers compliantly, pay them well, train them, and support them - so they stay with you for years, not months.',
    items: [
      {
        title: 'Employer of Record in the Philippines',
        body: "We're the legal employer. Local contracts, tax, SSS, PhilHealth, Pag-IBIG, 13th month pay - handled.",
      },
      {
        title: 'L&D budget for every placed engineer',
        body: 'Conferences, certifications, courses. We invest in them because you do.',
      },
      {
        title: 'Health insurance + wellbeing',
        body: 'Above-market HMO coverage. Mental health support. Annual leave that matches your team.',
      },
      {
        title: '24/7 office access in each region',
        body: 'For engineers who prefer to work from an office. Power, WiFi, security, coffee - covered.',
      },
      {
        title: 'Local team support',
        body: 'HR, payroll, and engineering managers on the ground. Not a hotline from another country.',
      },
    ],
  },
  included: {
    eyebrow: "What's included",
    titleLead: 'You get the engineer.',
    titleAccent: 'We handle everything else.',
    youLabel: 'You - 3 things',
    youSubhead: 'Run your team. Ship your product.',
    youBody: "The engineer works like any other member of your team. That's the only part you touch.",
    you: [
      "Direct your engineer's work",
      'Bring them into standups and Slack',
      'Treat them like a full-time hire',
    ],
    youFootnote: 'No HR. No payroll. No local entity. No admin.',
    weLabel: 'We - 8 things',
    wePill: 'Included in the fee',
    weSubhead: 'The full operational stack.',
    weBody:
      'Employment, compliance, retention and risk - handled in their country, billed as one line.',
    we: [
      "Source and vet the engineer (free if you don't hire)",
      'Employ them locally with full benefits and private healthcare',
      'Handle payroll, taxes and compliance in the Philippines',
      'Provide a US or UK-based account manager',
      "Replace them at no cost if it isn't working",
      'Support training, performance and retention long-term',
      'Liability insurance on every contract',
      'IP and data protection assigned to you',
    ],
    footnote: 'One monthly fee. No setup. No placement fees. 30 days notice on a rolling contract.',
  },
  primaryHub: {
    eyebrow: 'Where we are on the ground',
    titleLead: 'Makati is our heart in the',
    titleAccent: 'Philippines.',
    bannerEyebrow: 'Our biggest region · Makati',
    bannerTitle: 'Our largest team. Heavy in full-stack, backend, and fintech.',
    bannerBody:
      'Makati is the financial and tech centre of the Philippines. Our largest concentration of engineers is here - full-stack, backend, .NET, fintech, and mobile specialisms run deep.',
    image: `${PH}/hub-a.jpg`,
    secondaryEyebrow: 'Also on the ground in',
    secondary: [
      { city: 'Cebu', note: 'Second-largest tech ecosystem · mobile and SaaS', image: `${PH}/hub-b.jpg` },
      { city: 'Clark', note: 'Modern tech zone with government incentives', image: `${PH}/hub-c.jpg` },
    ],
  },
  engineers: {
    titleLead: 'Engineers working via Cloud Employee in the',
    titleAccent: 'Philippines.',
    intro: "Three real engineers currently embedded with our clients. Anonymised - you'll meet them on a call.",
    profiles: [
      {
        name: 'Mark Anthony L.',
        role: 'Senior Full Stack Engineer · Makati',
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        years: '8 years experience',
        bio: 'Previously at a Philippine fintech (GCash-adjacent). Placed with a UK SaaS for 2 years. Works UK hours.',
        image: `${PH}/eng-3.jpg`,
        flag: '🇵🇭',
      },
      {
        name: 'Aileen R.',
        role: 'Senior Mobile Engineer · Cebu',
        skills: ['React Native', 'Swift', 'Kotlin', 'Firebase'],
        years: '6 years experience',
        bio: 'Previously at a Singapore mobile gaming startup. Placed with an Australian fintech for 18 months. Works Sydney hours.',
        image: `${PH}/eng-1.jpg`,
        flag: '🇵🇭',
      },
      {
        name: 'Jericho S.',
        role: 'Senior Backend Engineer · Makati',
        skills: ['.NET', 'C#', 'Azure', 'SQL Server'],
        years: '9 years experience',
        bio: 'Previously at a UK enterprise software vendor. Placed with a UK insurance company for 2.5 years. Works UK hours.',
        image: `${PH}/eng-2.jpg`,
        flag: '🇵🇭',
      },
    ],
  },
  funFact: {
    eyebrow: 'Did you know',
    body: 'English is one of the official languages of the Philippines - used in school, business, and government. Filipino engineers grow up consuming Western media, working with Western teams, and writing in English by default.',
    source: 'Sources: Philippine Constitution 1987 · EF English Proficiency Index 2025 · IBPAP industry data',
  },
  calculator: {
    eyebrow: 'Pricing calculator',
    titleLead: 'What would a',
    titleAccent: 'Philippines',
    titleSuffix: 'engineer cost?',
    currency: '£',
    comparisonMultiple: 3.1842,
    resultEyebrow: 'Your match would cost',
    savedPrefix: 'vs. hiring in the UK',
    roles: [
      { id: 'fullstack', label: 'Senior Full Stack Engineer', base: 3800 },
      { id: 'backend', label: 'Senior Backend Engineer', base: 3900 },
      { id: 'mobile', label: 'Senior Mobile Engineer', base: 3700 },
      { id: 'frontend', label: 'Frontend Engineer', base: 3500 },
      { id: 'data', label: 'Data Engineer', base: 4000 },
    ],
    seniorityOptions: [
      { id: 'senior', label: 'Senior (5-8 years)', mult: 1 },
      { id: 'lead', label: 'Lead / Staff (8+ years)', mult: 1.28 },
    ],
    calcRegions: [{ id: 'ph', label: 'Philippines (UK/AU hours)', mult: 1 }],
    savingsSticker: 'Save £99,600/yr',
    savingsStickerSub: 'vs a UK hire',
    disclaimer: 'Ranges based on actual placements. Final price confirmed after discovery call.',
  },
  start: {
    variant: 'quiz',
    eyebrow: 'Ready to find your engineer?',
    titleLead: 'See real engineer profiles, rates, and timelines.',
    titleAccent: 'In 90 seconds.',
    cards: [
      {
        eyebrow: '',
        title: 'Get two Philippine engineers in 7 days.',
        body: 'Tell us what you need. Four quick questions about your stack, team, and budget.',
        bullets: ['Free to interview, no card required', 'No job boards, no CVs, no time wasted'],
        cta: 'Start the brief',
        ctaHref: '/start-hiring',
      },
      {
        eyebrow: 'Want guidance',
        title: 'Talk to a CTO.',
        body: "30-minute call. We'll help you figure out the seniority and stack that fit your team.",
        cta: 'Schedule a call',
        ctaHref: '/schedule-a-call',
      },
      {
        eyebrow: 'Have questions',
        title: 'Chat with our AI.',
        body: "Trained on every sales call we've had. Ask anything about hiring in the Philippines.",
        cta: 'Open chat',
        ctaHref: '#chat',
      },
    ],
    quiz: {
      eyebrow: 'Ready to find your engineer?',
      title: 'See real engineer profiles, rates, and timelines.',
      subtitle: "Four quick questions. See who we'd build your team with.",
      stepLabel: 'Step 1 of 4 · Takes 90 seconds',
      prompt: 'What role are you hiring for?',
      hint: "Pick one to start - you'll see matching engineers at the end.",
      roles: ['Backend', 'Frontend', 'Full-Stack', 'AI / ML', 'Data', 'DevOps', 'Mobile', 'Something else'],
      cta: 'Next',
      ctaHref: '/start-hiring',
      selectedPrefix: 'Selected: ',
      emptyStatus: 'Select a role to continue',
    },
  },
  faq: {
    eyebrow: 'Philippines · FAQ',
    title: 'Questions UK and Australian CTOs ask about hiring in the Philippines.',
    helpEyebrow: "Can't find your question?",
    helpBody: "Ask our AI chatbot - trained on every sales call we've had.",
    helpCta: 'Open chat',
    items: [
      {
        number: '01',
        question: "Will they really work UK hours? Won't they burn out on night shift?",
        answer:
          'Our engineers are hired specifically for UK and Australian schedules and paid a premium for it. Shift patterns are built into their contracts, and we monitor workload and wellbeing so this is sustainable for years, not weeks.',
      },
      {
        number: '02',
        question: 'How good is their English really?',
        answer:
          'English is an official language of the Philippines and the default language of business and higher education. Every engineer is interviewed for written and spoken fluency before we ever put them in front of you.',
      },
      {
        number: '03',
        question: 'How does Cloud Employee handle Filipino employment law and compliance?',
        answer:
          'We are the legal Employer of Record. Local contracts, tax, SSS, PhilHealth, Pag-IBIG, and 13th month pay are all handled by our in-country team - you get a single monthly invoice.',
      },
      {
        number: '04',
        question: "Aren't most Filipino developers junior or BPO-trained?",
        answer:
          "We don't place juniors or generalist BPO staff. Every engineer has 5+ years shipping production software at scale and passes a senior technical interview on your stack.",
      },
      {
        number: '05',
        question: 'Can I visit our engineers in the Philippines?',
        answer:
          'Yes. We have offices in Makati, Cebu, and Clark, and we regularly host clients on-site to meet their teams in person.',
      },
      {
        number: '06',
        question: 'What about typhoons, power outages, or infrastructure?',
        answer:
          "Our offices run on backup power and redundant fibre, and engineers can switch to office or co-working space at any time. Continuity is part of what you're paying for.",
      },
      {
        number: '07',
        question: 'What about IP protection and data privacy?',
        answer:
          'Your IP is yours. Contracts assign all work product to you, engineers sign NDAs, and every contract carries liability insurance plus IP and data protection.',
      },
    ],
  },
}
