// For Engineers page (/for-developers) - content object for the rebuilt,
// Sanity-editable page.
//
// HISTORY: the page body used to be a frozen Figma HTML export injected via
// dangerouslySetInnerHTML, with the copy welded in. It is now RE-RENDERED from
// this content object (via the tokenised template in fe2-body.ts + the hydrate
// step in index.tsx), so every visible text node and photo is fed from here and,
// through the forDevelopersPage singleton, from Sanity. Pixel-parity with the
// original export is preserved byte-for-byte (proven at build time).
//
// The values below are the EXACT strings the frozen export rendered - they are
// the defaults / static fallback when the Sanity doc is absent. The "build your
// profile" form (JoinForm) is a live React component; its copy is editable via
// forDevelopersPage.join (JOIN_CONTENT is the static fallback).
//
// Author voice: no em/en dashes - hyphens only.

// title is a plain string so the root layout template ('%s | Cloud Employee')
// appends the brand once (avoids a doubled suffix).
export const FOR_ENGINEERS_META = {
  title: 'For Engineers',
  description:
    'Get matched to the best companies, wherever you are. Real full-time roles, real employment and healthcare, one conversation instead of 500 applications.',
} as const

// Visual punctuation / glyphs - not UI sentences. Kept out of JSX literals.
export const GLYPH = {
  arrow: '→',
  check: '✓',
  dot: '·',
  globe: '🌎',
  pin: '📍',
  back: '←',
  question: '?',
  play: '▶',
} as const

// ── Types (mutable, so the Sanity transform can build one) ───────────────

export interface FeFoot {
  n: string
  l: string
}
export interface FeHeroCard {
  name: string
  role: string
  matched: string
  workLabel: string
  tags: string[]
  foot: FeFoot[]
  image?: string
}
export interface FeHero {
  eyebrow: string
  titleLead: string
  titleAccent: string
  /** Static first line of the subhead ("We match you with companies that fit your"). */
  sub: string
  /** Rotating lime-italic words that sit on the line under `sub` (CE-13). */
  subRotate?: string[]
  ctaPrimary: string
  /** Path or #anchor for the primary CTA. Default #join. */
  ctaPrimaryHref?: string
  ctaGhost: string
  /** Path or #anchor for the secondary CTA. Default /how-it-works. */
  ctaGhostHref?: string
  trust: string[]
  card: FeHeroCard
  /** Label on the scroll-down control under the full-height hero. */
  seeMore: string
}
export interface FeStat {
  num: string
  body: string
}
export interface FeProblem {
  eyebrow: string
  titleLead: string
  titleAccent: string
  leadPre: string
  leadStrong: string
  leadPost: string
  stats: FeStat[]
}
export interface FeStepOne {
  n: string
  h: string
  p: string
  tag: string
  miniLabel: string
  rows: string[]
}
export interface FeStepTwo {
  n: string
  badge: string
  h: string
  p: string
  live: string
  camYou: string
  camEng: string
  camYouImage?: string
  camEngImage?: string
}
export interface FeMsg {
  co: string
  ln: string
  mt: string
}
export interface FeStepThree {
  n: string
  h: string
  p: string
  incomingLabel: string
  msgs: FeMsg[]
}
export interface FeStepFour {
  n: string
  h: string
  p: string
  tag: string
  handleLabel: string
  chips: string[]
}
export interface FeHow {
  eyebrow: string
  titleLead: string
  titleAccent: string
  steps: {
    one: FeStepOne
    two: FeStepTwo
    three: FeStepThree
    four: FeStepFour
  }
}
export interface FeBenefitItem {
  h: string
  p: string
}
export interface FeBenefitPhoto {
  caption: string
  sub: string
  image?: string
}
export interface FeBenefits {
  eyebrow: string
  titleLead: string
  titleAccent: string
  lead: string
  items: FeBenefitItem[]
  photos: FeBenefitPhoto[]
}
export interface FeMission {
  eyebrow: string
  titleLead: string
  titleAccent: string
  p: string
}
export interface FeQuote {
  name: string
  role: string
  quote: string
  image?: string
}
export interface FeTests {
  eyebrow: string
  titleLead: string
  titleAccent: string
  videoPill: string
  videoLabel: string
  videoImage?: string
  /** YouTube / Vimeo / Loom. Empty = decorative poster only. */
  videoUrl?: string
  quotes: FeQuote[]
}
export interface FeFinal {
  titleLead: string
  titleAccent: string
  p: string
  cta: string
  /** Path or #anchor for the final CTA. Default #join. */
  ctaHref?: string
  trust: string[]
}

// ── The "build your profile" form content (Sanity join + static fallback) ──
// JoinForm reads content.join. Seeded into forDevelopersPage.join; this object
// is the offline / empty-doc fallback. Submit stays a demo done-state (D2).
export const JOIN_CONTENT = {
  eyebrow: 'Build your profile',
  titleLead: 'Two minutes.',
  titleAccent: "Then you're in.",
  lead: "Tell us who you are. Your profile builds as you go - that's what companies see when they're matched to you.",
  continue: 'Continue',
  joinCta: 'Join the network',
  back: 'Back',
  steps: [
    { label: 'Step 1 of 4', q: 'Where are you, and what do you do?' },
    { label: 'Step 2 of 4', q: 'What do you work with?' },
    { label: 'Step 3 of 4', q: 'What do you want to be paid?' },
    { label: 'Step 4 of 4', q: 'Where do we reach you?' },
  ],
  fields: {
    locLabel: "Where you're based",
    locPlaceholder: 'e.g. São Paulo, Brazil',
    roleLabel: 'Your role',
    roleDefault: 'Select a role',
    roles: [
      'Senior Backend Engineer',
      'Senior Frontend Engineer',
      'Senior Full-Stack Engineer',
      'AI / ML Engineer',
      'Data Engineer',
      'DevOps Engineer',
      'Mobile Engineer',
    ],
    yrsLabel: 'Years of experience',
    yrsDefault: 'Select',
    yrs: ['3-5 yrs', '5-8 yrs', '8-12 yrs', '12+ yrs'],
    skillsLabel: 'Pick your main stack',
    skills: ['Go', 'Python', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Kubernetes', 'PyTorch', 'Rust', 'Java', '.NET'],
    skillPlaceholder: 'Type a skill and press Enter',
    // Autocomplete vocabulary. If the typed value matches none of these, whatever
    // the engineer typed is added as a custom skill on Enter.
    skillVocab: [
      'Go', 'Python', 'TypeScript', 'JavaScript', 'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Node.js', 'Deno', 'Bun',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Terraform',
      'PyTorch', 'TensorFlow', 'Rust', 'Java', 'Kotlin', 'Swift', 'C#', '.NET', 'C++', 'Ruby', 'Rails', 'PHP', 'Laravel',
      'Elixir', 'Scala', 'Django', 'FastAPI', 'Spring', 'Flutter', 'React Native', 'GraphQL', 'Kafka', 'Spark',
    ],
    styleLabel: 'How you like to work',
    styles: ['Async-first', 'Pairing', 'Mentors juniors', 'Deep focus', 'Product-minded'],
    rateHelp: 'You set the number. We only introduce you to companies that will pay it - no lowball surprises later.',
    rateLabel: "Monthly rate you're looking for (USD)",
    ratePlaceholder: 'e.g. $6,000 / month',
    availLabel: 'Open to',
    availDefault: 'Select',
    avail: ['Full-time, ready now', 'Full-time, in the next few months', "Just seeing what's out there"],
    nameLabel: 'Your name',
    namePlaceholder: 'Full name',
    emailLabel: 'Email',
    emailPlaceholder: 'you@email.com',
    workLabel: 'Link to your work',
    workHint: '(GitHub, portfolio - optional)',
    workPlaceholder: 'github.com/you',
  },
  done: {
    h: "You're in the network.",
    p: "We'll be in touch to set up your one conversation with an engineer. No applications, no chasing.",
  },
  preview: {
    pl: 'Your profile, so far',
    name: 'Your profile',
    role: 'Add your role to begin',
    tagsEmpty: 'Pick your stack…',
    label: 'How you work',
    rateEmpty: 'Set your rate',
    rateSub: 'We match you only to companies that pay it.',
    foot: [
      { n: '7 days', l: 'to your first match' },
      { n: '1 of 2', l: 'profiles they see' },
    ],
  },
} as const

export type FeJoin = typeof JOIN_CONTENT

export interface ForEngineersContent {
  hero: FeHero
  problem: FeProblem
  how: FeHow
  benefits: FeBenefits
  mission: FeMission
  tests: FeTests
  final: FeFinal
  join: FeJoin
}

// ── Static content (EXACT frozen-export strings = defaults / fallback) ────
// PLACEHOLDER note: the three testimonial quotes below (Kenneth / Jen / Lance)
// are the placeholder quotes that already shipped in the frozen export. They
// are NOT real, verified engineer testimonials. Replace with real, region-
// matched quotes in Studio before a public relaunch. Do not treat them as real.
export const FOR_ENGINEERS_CONTENT: ForEngineersContent = {
  hero: {
    eyebrow: 'FOR ENGINEERS',
    titleLead: 'Get matched to the\nbest companies,\n',
    titleAccent: 'wherever you are',
    sub: 'We match you with companies that fit your',
    subRotate: ['work style', 'values', 'salary', 'mission'],
    ctaPrimary: 'Join the network',
    ctaPrimaryHref: '#join',
    ctaGhost: 'How it works',
    ctaGhostHref: '#fe2-how',
    trust: ['4.8 on Glassdoor · 200+ reviews', 'Real employment + healthcare', '97% stay 2+ years'],
    card: {
      name: 'Your profile',
      role: 'Senior Backend Engineer · 9 yrs | Remote',
      matched: '✓ MATCHED ',
      workLabel: 'HOW YOU WORK',
      tags: ['Go', 'PostgreSQL', 'AWS', 'Async-first'],
      foot: [
        { n: '7 days', l: 'to your first match' },
        { n: '1 of 2', l: 'profiles they see - not 500' },
      ],
      image: '',
    },
    seeMore: 'See more',
  },
  problem: {
    eyebrow: 'WHY THIS EXISTS',
    titleLead: 'Applying is broken.\n',
    titleAccent: "Being matched isn't",
    leadPre: 'Your CV gets read by a machine before a person ever sees it. ',
    leadStrong: 'We do it the other way round',
    leadPost:
      '\nAn engineer looks at your actual work, once, and the right companies come to you.',
    stats: [
      { num: '70%', body: 'of engineering roles are never publicly posted. We put you in front of them.' },
      { num: '2', body: 'profiles per role. One of two people a company sees - not one of 500.' },
      { num: '97%', body: 'stay 2+ years. Real full-time seats - not gig work.' },
      { num: '$ you set it', body: 'You name it. We only introduce companies that will pay it.' },
    ],
  },
  how: {
    eyebrow: 'THE PROCESS',
    titleLead: 'How it works - ',
    titleAccent: 'from your side.',
    steps: {
      one: {
        n: '01',
        h: 'Tell us who you are.',
        p: 'Your stack, how you work, what you need to be paid.',
        tag: 'A few minutes. Not 500 applications.',
        miniLabel: 'YOUR PROFILE',
        rows: ['Senior Full-stack Engineer · 7 yrs', 'Go · PostgreSQL · AWS', 'Async-first · Mentors juniors'],
      },
      two: {
        n: '02',
        badge: "THE PART THAT'S DIFFERENT",
        h: 'One real conversation with an engineer who understands your work.',
        p: "Not a recruiter. Not leetcode. Not a free take-home - a senior engineer, on your stack, talking through what you've actually built.",
        live: 'Live',
        camYou: 'You',
        camEng: 'Senior engineer',
        camYouImage: '',
        camEngImage: '',
      },
      three: {
        n: '03',
        h: 'Companies that fit come to you.',
        p: 'Matched to how you work and what you want to be paid. You stop applying.',
        incomingLabel: 'INCOMING',
        msgs: [
          { co: 'A Series A team wants to talk', ln: 'Same stack. Pays your rate. Your hours.', mt: 'Matched 2 hours ago' },
          { co: 'A fintech scale-up wants to talk', ln: 'Go · remote-first · US hours', mt: 'Matched yesterday' },
        ],
      },
      four: {
        n: '04',
        h: 'You join full-time, and we look after you.',
        p: 'Employed properly, real benefits, treated as a peer. We handle the rest.',
        tag: '97% stay 2+ years.',
        handleLabel: 'WE HANDLE',
        chips: ['Payroll', 'Healthcare', 'Taxes', 'Benefits', 'Compliance', 'L&D budget', 'Community'],
      },
    },
  },
  benefits: {
    eyebrow: 'WHAT YOU GET',
    titleLead: 'A real job. ',
    titleAccent: 'And a team behind you.',
    lead: 'A real, full-time seat - paid properly and reliably. One company, your rate, full benefits and private healthcare.',
    items: [
      { h: '$1,000 a year to grow.', p: 'A yearly learning budget. Spend it on what moves your career.' },
      { h: 'Real paid holiday.', p: 'Paid time off and sick days - the kind a full employee gets, and a contractor never does.' },
      { h: 'A US or UK company that treats you as one of the team.', p: 'Standups, Slack, sprint planning. A full member - not a body shopped by an agency.' },
      { h: 'A community, in person.', p: 'Quarterly events across our hubs. Real gatherings, real places.' },
    ],
    photos: [
      { caption: 'Zagreb team offsite', sub: 'Sub text here', image: '' },
      { caption: 'São Paulo hub', sub: '40+ engineers · fintech & full-stack', image: '' },
      { caption: 'Engineer workshop', sub: 'Sub text here', image: '' },
    ],
  },
  mission: {
    eyebrow: 'THE IDEA',
    titleLead: 'Great engineers exist everywhere. The best companies should be able to ',
    titleAccent: 'find them.',
    p: "Where you live shouldn't decide who you work with. Build a profile once - the right companies come to you.",
  },
  tests: {
    eyebrow: 'FROM ENGINEERS IN THE NETWORK',
    titleLead: 'Not a résumé in a pile. ',
    titleAccent: 'Part of a team.',
    videoPill: 'Snr. Front-End Engineer - Dani',
    videoLabel: 'What Cloud Employee did for me',
    videoImage: '',
    videoUrl: '',
    // PLACEHOLDER quotes - see note above. Do not ship as real testimonials.
    quotes: [
      {
        name: 'Kenneth',
        role: 'Senior Backend Engineer',
        quote: "I'd stopped hearing back from applications entirely. Here I had one real conversation about my work, and three weeks later I was on a US team that actually pays my rate.",
        image: '',
      },
      {
        name: 'Jen',
        role: 'Senior Backend Engineer',
        quote: "Full employment, healthcare, the L&D budget - I was working with a company I'd never have reached from here. Two years in and I'm not going anywhere.",
        image: '',
      },
      {
        name: 'Lance',
        role: 'Full Stack Engineer',
        quote: 'The difference is being judged by someone who understands what I build. No leetcode theatre. It felt like talking to a peer, not being screened.',
        image: '',
      },
    ],
  },
  final: {
    titleLead: 'Stop applying.',
    titleAccent: 'Get matched.',
    p: "Build your profile once. It takes a few minutes, it's free, and there's no obligation.",
    cta: 'Join the network',
    ctaHref: '#join',
    trust: ['300+ teams built', '97% stay 2+ years', 'No lock-ins'],
  },
  join: JOIN_CONTENT,
}
