// TEMPLATE-HOME content model.
//
// Copy is transcribed VERBATIM from the locked reference
// `docs/raw-html/Home.html` ("Cloud Employee Home DARK V2", a faithful Figma
// reproduction — see docs/raw-html-pdf/Home Page.pdf). Images are the real
// assets extracted from that same bundle. Testimonial stats and FAQ answers
// are real CE figures / authored copy (updated Jul 2026).
//
// It lives in this typed module (not inline JSX) so the template renders every
// string via an expression — which (a) passes the UI_STRINGS jsx-no-literals
// gate and (b) gives a clean 1:1 shape to swap for a Sanity `homePage` fetch
// when the editability wiring lands.

import { CLIENT_LOGOS } from '@/components/social-proof/client-logo-strip'

const IMG = '/design/home'

// Seb Hall 90-second overview video (Vimeo). Used by the Process section: it
// plays muted + looping in the background as soon as the card scrolls into
// view, then plays from the start WITH sound when the visitor clicks play.
// This is the static fallback; a Sanity `homePage.process.video.videoUrl`
// value (when set by an editor) takes precedence.
export const HOME_PROCESS_VIDEO_URL =
  'https://player.vimeo.com/video/1131836141?badge=0&autopause=0&player_id=0&app_id=58479'

export interface HomeStat {
  value: string
  label: string
}

export interface HomeImage {
  src: string
  width: number
  height: number
}

export interface HomeLogo extends HomeImage {
  name: string
  /** See ClientLogo.tone — 'asis' for assets that are already light-on-dark. */
  tone?: 'lineart' | 'asis'
  /** Rendered max-height in px. Defaults to 26 if unset. */
  displayH?: number
  /** Opacity override for display. Defaults to 1 if unset (e.g. 0.85 for Scorpion). */
  displayOpacity?: number
}

export interface HomeProfile {
  name: string
  role: string
  flag: string
  tags: string[]
  image: string
  /** CSS object-position for the hero slideshow crop. */
  objectPosition?: string
}

export interface ProfileCardPerson {
  name: string
  role: string
  flag: string
  chips: readonly string[]
  image: string
  /** CSS object-position for the photo layer's 488x280 crop. */
  pos: string
}

/** Map Sanity/HOME_CONTENT hero.profiles → ProfileCard slideshow shape. */
export function toProfileCardPeople(
  profiles: readonly HomeProfile[] | null | undefined,
): ProfileCardPerson[] | null {
  if (!profiles || profiles.length < 2) return null
  const mapped = profiles
    .filter((p) => Boolean(p?.image && p?.name))
    .map((p) => ({
      name: p.name,
      role: p.role,
      flag: p.flag || '',
      chips: p.tags ?? [],
      image: p.image,
      pos: p.objectPosition?.trim() || 'center',
    }))
  return mapped.length >= 2 ? mapped : null
}

export interface HomeReason {
  title: string
  body: string
  icon: 'spark' | 'user' | 'pin' | 'shield'
  proof?: string
}

export interface HomeStep {
  number: string
  title: string
  body: string
  cta: string
}

export interface HomeFaqItem {
  number: string
  question: string
  answer: string
}

export interface HomeTestimonial {
  quote: string
  name: string
  role: string
  logo: HomeLogo
  image: string
  stats: HomeStat[]
}

export const HOME_META = {
  title: 'Hire Engineers Vetted by Engineers | Cloud Employee',
  description:
    'We embed senior engineers full-time in your team, tools, and timezone in 7 days. Vetted by senior engineers, not recruiters. HR, payroll, and retention handled for one monthly fee.',
} as const

const HERO_BOTTOM_PILLS = [
  '300+ teams built',
  '97% stay 2+ years',
  "Replace if it isn't working",
  'No lock-ins',
] as const

// The 3 proof bullets under the hero CTAs — distinct from HERO_BOTTOM_PILLS
// (which stays reserved for the readyToFind section further down the page).
const HERO_PROOF_BULLETS = ['One monthly fee', 'We handle HR & payroll', '300+ teams built'] as const

// Fallback slideshow when Sanity hero.profiles is empty / invalid.
// Canonical editable source is homePage.hero.profiles (seeded from HOME_CONTENT).
export const HERO_PROFILE_CARD_PEOPLE: ProfileCardPerson[] = [
  {
    name: 'Kyla. T',
    role: 'Senior Backend Engineer · 6 yrs | Remote',
    flag: '🇵🇭',
    chips: ['Node.js', 'Python', 'AWS', 'Owns end-to-end'],
    image: `${IMG}/engineers/hero-card/kyla.jpg`,
    pos: 'center',
  },
  {
    name: 'Marcello. P',
    role: 'Senior Data Engineer · 9 yrs | Remote',
    flag: '🇦🇷',
    chips: ['Python', 'Snowflake', 'Airflow', 'Async-first'],
    image: `${IMG}/engineers/hero-card/marcello.jpg`,
    pos: 'center',
  },
  {
    name: 'Petra. K',
    role: 'Senior AI Engineer · 7 yrs | Remote',
    flag: '🇭🇷',
    chips: ['RAG', 'LangChain', 'AWS', 'Product-minded'],
    image: `${IMG}/engineers/hero-card/petra.jpg`,
    pos: 'center',
  },
  {
    name: 'Gabriel. K',
    role: 'Devops Engineer · 10 yrs | Remote',
    flag: '🇧🇷',
    chips: ['Kubernetes', 'Docker', 'AWS', 'Mentors Juniors'],
    image: `${IMG}/engineers/hero-card/gabriel.jpg`,
    pos: 'center',
  },
]

// "Where we work" expanding-hub section (sits just above the FAQ; replaces the
// old Locations marquee). Each hub is one tall image panel that widens on hover
// and links to its region's location page.
export interface WhereWeWorkHub {
  /** City / hub name shown in the caption. */
  name: string
  /** Destination — the hub's location page. */
  href: string
  /**
   * Panel photo. These are Picsum PLACEHOLDERS today. To drop in a real photo
   * later, just replace this string with a portrait image path (e.g.
   * `${IMG}/hubs/sao-paulo.jpg`, roughly 800x1100 or larger, shown object-fit
   * cover). Nothing else needs to change.
   */
  image: string
}

export interface WhereWeWorkContent {
  eyebrow: string
  titleLead: string
  /** Rendered in Source Serif 4 italic lime — the "10 countries." fragment. */
  titleAccent: string
  paragraph: string
  hubs: WhereWeWorkHub[]
}

// Fallback when Sanity whereWeWork is empty. Five hubs, one per city we can
// point at a real location page.
export const WHERE_WE_WORK: WhereWeWorkContent = {
  eyebrow: 'Where we work',
  titleLead: 'Built on the ground in',
  titleAccent: '10 countries.',
  paragraph:
    'Hover a hub to step inside. Every placement is backed by a local team that knows the market, the talent, and the timezone.',
  hubs: [
    {
      name: 'São Paulo',
      href: '/services/latam-developers',
      image: 'https://picsum.photos/seed/saopaulo7/800/1100',
    },
    {
      name: 'Bogotá',
      href: '/services/latam-developers',
      image: 'https://picsum.photos/seed/bogota3/800/1100',
    },
    {
      name: 'Buenos Aires',
      href: '/services/latam-developers',
      image: 'https://picsum.photos/seed/buenosaires9/800/1100',
    },
    {
      name: 'Manila',
      href: '/services/philippines-developers',
      image: 'https://picsum.photos/seed/manila12/800/1100',
    },
    {
      name: 'Zagreb',
      href: '/services/eastern-europe-developers',
      image: 'https://picsum.photos/seed/zagreb5/800/1100',
    },
  ],
}

export const HOME_CONTENT = {
  hero: {
    eyebrow: 'Embedded engineers for US tech companies',
    titleLead: 'Hire engineers vetted',
    titleAccent: 'engineers',
    paragraphLines: [
      'Not recruiters guessing. We embed senior engineers full-time in your team, your tools, and your timezone - in 7 days',
    ] as const,
    primaryCta: 'Talk to a CTO',
    secondaryCta: 'See how it works',
    bottomPills: HERO_PROOF_BULLETS,
    floatingPills: ['Live pair programming', '7-day shortlist'],
    // Hero slideshow order (desktop auto-cycle + mobile lead photo = [0]).
    // Dedicated 488×280 crops under engineers/hero-card/.
    profiles: [
      {
        name: 'Kyla. T',
        role: 'Senior Backend Engineer · 6 yrs | Remote',
        flag: '🇵🇭',
        tags: ['Node.js', 'Python', 'AWS', 'Owns end-to-end'],
        image: `${IMG}/engineers/hero-card/kyla.jpg`,
        objectPosition: 'center',
      },
      {
        name: 'Marcello. P',
        role: 'Senior Data Engineer · 9 yrs | Remote',
        flag: '🇦🇷',
        tags: ['Python', 'Snowflake', 'Airflow', 'Async-first'],
        image: `${IMG}/engineers/hero-card/marcello.jpg`,
        objectPosition: 'center',
      },
      {
        name: 'Petra. K',
        role: 'Senior AI Engineer · 7 yrs | Remote',
        flag: '🇭🇷',
        tags: ['RAG', 'LangChain', 'AWS', 'Product-minded'],
        image: `${IMG}/engineers/hero-card/petra.jpg`,
        objectPosition: 'center',
      },
      {
        name: 'Gabriel. K',
        role: 'Devops Engineer · 10 yrs | Remote',
        flag: '🇧🇷',
        tags: ['Kubernetes', 'Docker', 'AWS', 'Mentors Juniors'],
        image: `${IMG}/engineers/hero-card/gabriel.jpg`,
        objectPosition: 'center',
      },
    ] as HomeProfile[],
  },
  whereWeWork: WHERE_WE_WORK,
  trustedBy: {
    label: 'Trusted by 300+ engineering teams',
    labelLine1: 'TRUSTED BY 300+',
    labelLine2: 'ENGINEERING TEAMS',
    // Single source for the seven client logos — Fractional CTO and Hire
    // Engineers render the same strip, and they used to drift.
    logos: CLIENT_LOGOS as HomeLogo[],
  },
  clientStory: {
    eyebrow: "Jobs boards don't work anymore",
    quoteLines: [
      "Cloud Employee didn't send us 100s of CVs.",
      'Their engineers did the screening and handed us',
      "two profiles in a week - both we'd have hired.",
    ] as const,
    name: 'Marcus Kilgour',
    role: 'CTO, Salmon Software',
    avatar: `${IMG}/people/marcus-avatar.jpg`,
    logo: { name: 'Salmon', src: `${IMG}/logos/salmon.png`, width: 260, height: 63 } as HomeLogo,
  },
  whyDifferent: {
    eyebrow: "Why we're different",
    titleLead: 'Staff augmentation,',
    titleAccent: 'embedded',
    paragraph:
      'Four reasons teams choose to embed rather than outsource, and stay for years, not months.',
    lead: {
      title: 'Engineers vet engineers.',
      body: 'Senior engineers run the live pair-programming sessions, not recruiters guessing. We send two profiles in 7 days, with notes on exactly why each one fits your stack and culture.',
      icon: 'spark',
      proof: 'The proof: 97% retention at 2+ years',
    } as HomeReason,
    leadImage: { src: `${IMG}/media/coding-interview-v2.jpg`, width: 523, height: 284 } as HomeImage,
    reasons: [
      {
        title: 'Full-time. Only for you.',
        body: 'Your engineer works your hours, on your team, with no other clients on the side. They join your standups, your Slack, your sprint planning.',
        icon: 'user',
      },
      {
        title: 'Pick your region.',
        body: 'LATAM for US time zones. Europe for senior specialists. The Philippines for UK and APAC hours, 10 hubs across 3 continents.',
        icon: 'pin',
      },
      {
        title: 'De-risked from day one.',
        body: 'One monthly fee. No setup. No placement fees. Free to interview. Rolling contract, 30 days notice. If they don\u2019t work out, we replace them at no cost.',
        icon: 'shield',
      },
    ] as HomeReason[],
  },
  process: {
    eyebrow: 'The process',
    titleLead: 'How it',
    titleAccent: 'works',
    steps: [
      {
        number: '01',
        title: 'You tell us what you need.',
        body: 'Your stack, your culture, your region — the more specific, the better we match.',
        cta: 'Quick form or talk to a CTO.',
      },
      {
        number: '02',
        title: 'Interviewed by Engineers',
        body: 'Live coding on your stack. Cultural fit, psychometric testing, background checks, KYC.',
        cta: '100+ screened to find your shortlist.',
      },
      {
        number: '03',
        title: 'You pick. They start.',
        body: '2 profiles in 7 days. Interview both free. The one you pick joins your team full-time.',
        cta: 'Embedded from day one. No side gigs.',
      },
      {
        number: '04',
        title: 'We handle the rest.',
        body: "HR, payroll, healthcare, L&D, retention. If it isn't working, we replace at no cost.",
        cta: 'You direct. 97% stay 2+ years.',
      },
    ] as HomeStep[],
    video: {
      name: 'Seb Hall',
      roleLine: 'Cloud Employee CEO & Co-Founder',
      caption: 'Seb Hall, CEO · 90-second explainer of how the model works',
      subtitle: 'one week and at half the cost.',
      cta: 'Watch the 90-second overview',
      poster: { src: `${IMG}/media/seb-hall.jpg`, width: 1400, height: 787 } as HomeImage,
      // Hosted video URL (YouTube/Vimeo/Loom). Drives the scroll-triggered
      // muted background loop + click-to-play-with-sound behaviour.
      videoUrl: HOME_PROCESS_VIDEO_URL,
    },
  },
  testimonials: {
    eyebrow: 'Testimonials',
    title: 'What Our Clients Say',
    items: [
      {
        quote:
          "We actually hired the whole team remotely, having never met them. And we made a bunch of really good hires. And that's pretty unique to be able to do that without having never met any of them.",
        name: 'Euan Cameron',
        role: 'CEO, Willo',
        logo: { name: 'Willo', src: `${IMG}/logos/willo.png`, width: 260, height: 84 },
        image: `${IMG}/people/euan.jpg`,
        stats: [
          { value: '$8M', label: 'Raised in Series A funding' },
          { value: '8', label: 'Engineers hired through CE' },
        ],
      },
      {
        quote:
          'Working with cloud employee felt nothing like hiring a contractor. The engineer was on our team from week one, shipping code, joining standups, genuinely invested in what we were building.',
        name: 'Marcus Kilgour',
        role: 'CTO, Salmon Software',
        logo: { name: 'Salmon', src: `${IMG}/logos/salmon.png`, width: 260, height: 63 },
        image: `${IMG}/people/marcus.jpg`,
        stats: [
          { value: '5', label: 'Engineers scaled to in 6 months' },
          { value: '40%', label: 'Faster sprint delivery' },
        ],
      },
    ] as HomeTestimonial[],
  },
  included: {
    eyebrow: "What's included",
    titleLead: 'You get the engineer.',
    titleAccent: 'We handle everything else',
    you: {
      label: 'You',
      heading: 'Run your team.\nShip your product.',
      items: [
        "Direct your engineer's work",
        'Bring them into your standups & Slack',
        'Treat them like a full-time hire',
      ],
    },
    us: {
      label: 'Us',
      heading: 'The full operational stack.',
      items: [
        "Source and vet the engineer (free if you don't hire)",
        'Employ them locally with full benefits and private healthcare',
        'Handle payroll, taxes, and compliance in their country',
        'Provide a US or UK-based account manager',
        "Replace them at no cost if it isn't working",
        'Support their training, performance, and retention long-term',
        'Liability insurance + IP/data protection on every contract',
      ],
    },
    footnote:
      'One monthly fee. No setup. No placement fees. 30 days notice on a rolling contract.',
  },
  calculator: {
    eyebrow: 'Pricing calculator',
    titleLead: 'Calculate your',
    titleAccent: "next hire's cost",
    fields: [
      { label: 'Role', value: 'Senior Backend Engineer' },
      { label: 'Region', value: 'Latin America' },
      { label: 'Seniority', value: 'Senior level' },
    ],
    resultLabel: 'Estimated monthly cost',
    price: '$5,400',
    priceSuffix: '/mo, all-in',
    comparison: 'vs. hiring in the US',
    saving: '$85,200/yr saved',
    badgeSave: 'Save $85,200/yr',
    badgeSub: 'vs hiring in the US',
    cta: 'Ask our AI',
    footnote:
      '*Ranges based on actual placements. Final price confirmed after discovery call.',
  },
  realEngineers: {
    eyebrow: 'Real engineers, real backgrounds',
    titleLead: 'Hired from top companies.',
    titleAccent: 'Vetted by us',
    badge: 'Vetted by senior eng',
    profiles: [
      {
        name: 'Petar K.',
        role: 'Senior Data Eng · 9 yrs',
        flag: '🇭🇷',
        tags: ['Python', 'Spark', 'GCP'],
        image: `${IMG}/engineers/petar-k.jpg`,
      },
      {
        name: 'Kyla T.',
        role: 'Senior Full-Stack · 6 yrs',
        flag: '🇨🇴',
        tags: ['React', 'Node.js', 'TypeScript'],
        image: `${IMG}/engineers/kyla.jpg`,
      },
      {
        name: 'Marcelo D.',
        role: 'Full-stack Engineer · 8 yrs',
        flag: '🇲🇽',
        tags: ['K8s', 'Terraform', 'AWS'],
        image: `${IMG}/engineers/marcelo.jpg`,
      },
    ] as HomeProfile[],
  },
  readyToFind: {
    eyebrow: 'Ready to find your engineer?',
    titleLead: 'See real engineer profiles, rates, and timelines.',
    titleAccent: 'In 90 seconds',
    paragraph: "Four quick questions. See who we'd build your team with.",
    steps: ['Role', 'Skills', 'Team size', 'Your match'],
    question: 'What role are you hiring for?',
    questionSub: "Pick one to start — you'll see matching engineers at the end.",
    roles: ['Backend', 'Frontend', 'Full-Stack', 'AI / ML', 'Data', 'DevOps', 'Mobile', 'Something else'],
    bottomPills: HERO_BOTTOM_PILLS,
    nextLabel: 'Next',
    matching: {
      label: 'Matching...',
      unlocks: 'Unlocks at step 4',
      tags: ['React', 'PostgreSQL', 'AWS'],
      note: 'Answer all 4 questions to reveal full profiles, rates, and availability.',
      stats: [
        { value: '90s', label: 'To your match' },
        { value: '1:1', label: 'Engineer fit' },
      ] as HomeStat[],
    },
    talkPrompt: 'Prefer to talk first?',
    talkCtas: ['Ask our AI anything', 'Book a call'],
  },
  locations: {
    eyebrow: 'Where we work',
    titleLead: 'Built on the ground in',
    titleAccent: '10 countries.',
    placeholder: 'location photo',
    cards: ['Bogotá team', 'Tidal summit', 'São Paulo hub', 'Manila hub'],
  },
  faq: {
    eyebrow: 'Got questions?',
    titleLead: 'The questions',
    titleAccent: 'CTOs and founders ask.',
    fallbackLabel: "Can't find your question?",
    fallbackBody: 'Ask our AI chatbot - trained on every sales call we\u2019ve had.',
    fallbackCta: 'Open chat',
    items: [
      {
        number: '01',
        question: "What if the engineer doesn't work out?",
        answer:
          "We replace them at no cost, no questions asked. If the match isn't right in the first 90 days, we immediately start a new search and hand you a replacement shortlist within 7 days. There's no penalty and no extra fee.",
      },
      {
        number: '02',
        question: 'How do time zones really work?',
        answer:
          "Your engineer works your hours — full overlap with your team, not a 2-hour window at the end of the day. LATAM engineers align with US East/West; European hubs align with UK and CET; Manila aligns with APAC and UK. You pick the region that fits your standup time.",
      },
      {
        number: '03',
        question: 'Who owns the IP?',
        answer:
          'You own everything, always. Every engagement is covered by a full IP assignment and confidentiality agreement. The engineer signs it before day one. No ambiguity, no carve-outs.',
      },
      {
        number: '04',
        question: 'How are you different from Toptal, Deel, or Upwork?',
        answer:
          "Toptal, Deel, and Upwork are marketplaces — you search, vet, and manage HR yourself. We are a managed service: we source, vet with live senior-engineer coding sessions, employ the engineer locally, and handle all payroll, compliance, and retention. You direct the work; we handle everything else.",
      },
      {
        number: '05',
        question: 'What does it cost?',
        answer:
          'One flat monthly fee covers the engineer, local employment, payroll, benefits, and your account manager. There are no placement fees, no setup costs, and no long-term lock-in. Rates vary by role, seniority, and region — use the calculator above for a live estimate.',
      },
      {
        number: '06',
        question: 'How do you stop candidates faking interviews or using AI?',
        answer:
          'Every candidate goes through a live pair-programming session run by one of our senior engineers — on your actual stack, not a toy problem. We also run KYC, background checks, and psychometric assessments. There is no way to fake a 60-minute live coding interview with someone who knows the codebase.',
      },
      {
        number: '07',
        question: 'What happens in the first 90 days?',
        answer:
          "Week one: your engineer joins your Slack, attends your standup, and starts shipping small tickets. Weeks 2-4: your dedicated account manager runs a structured onboarding check-in to catch any friction early. By day 90, most teams say the engineer feels like a full-time hire they've had for six months.",
      },
      {
        number: '08',
        question: 'Can I hire the engineer directly later?',
        answer:
          'Yes. A direct-hire conversion path is available in every contract. After 12 months of embedding, you can bring them on as a permanent employee for a pre-agreed conversion fee — far lower than a traditional agency placement. Many teams exercise this option.',
      },
    ] as HomeFaqItem[],
  },
} as const

export type HomeContent = typeof HOME_CONTENT
