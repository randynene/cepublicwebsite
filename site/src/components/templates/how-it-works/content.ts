// TEMPLATE-HOW-IT-WORKS content model.
//
// Copy is transcribed VERBATIM from the locked reference
// `docs/raw-html/How It Works.html` (desktop artboard, H1 = 67px) — see
// `docs/raw-html-pdf/How It Works.pdf` and the extracted
// `audit-output/how-it-works/export-spec.json` / `transcript.txt`.
//
// Lives in this typed module (not inline JSX) so the template renders every
// string via an expression — passing the UI_STRINGS jsx-no-literals gate and
// giving a clean 1:1 shape to swap for a future Sanity `howItWorksPage` fetch.
//
// COUNT-UP PLACEHOLDERS (flagged for Jake's review): the export shows the
// funnel rows and the three outcome stats as animation start-states ("0+",
// "~0", "0%", "0.0/5", "+0-60%"). Real target figures are supplied here so the
// CountUp animation has something to land on. Retention 97% matches Home /
// CE's published figure; the funnel counts and 4.9/5 satisfaction are
// realistic placeholders pending confirmed CE numbers.

// Relative, not the `@/` alias: the seed script imports this file from the
// repo root, where `@/` resolves to a different src tree.
import { CHAT_HREF } from '../../../lib/chat'
import { roleWithYears, talentBySlug, talentPhoto } from '../../../lib/talent/roster'

export interface HiwPerson {
  name: string
  role: string
  flag: string
  tags: string[]
  image: string
  imageAlt: string
  /** Resting rotation in degrees; hover drift eases back to this. */
  rotate: number
}

export interface HiwStage {
  stage: string
  title: string
  intro: string
  checks: string[]
  /** Right-column photo for stages 1-3 (stage 4 uses the summary card). */
  image?: string
  imageAlt?: string
}

export interface HiwFaqItem {
  number: string
  question: string
  answer: string
}

export interface HiwTalkCta {
  label: string
  /** `#chat` opens the Clara widget; anything else is an ordinary link. */
  href: string
}

export interface HiwTestimonial {
  quote: string
  name: string
  role: string
  /** 'photo' = full-bleed member photo card; 'quote' = solid quote-only card. */
  variant: 'photo' | 'quote'
  /** Member photo (photo card) or avatar (quote card). Optional for quote cards. */
  image?: string
  imageAlt?: string
}

const HIW_IMG = '/how-it-works'

export const HIW_META = {
  title: 'How It Works | Cloud Employee',
  description:
    'One brief, two matched engineers in 7 days. See exactly how Cloud Employee finds, vets, onboards, and looks after the senior engineers we embed full-time in your team.',
} as const

const HERO_BOTTOM_PILLS = [
  '300+ teams built',
  '97% stay 2+ years',
  '7-day shortlist',
  'No lock-ins',
] as const

// The two faces flanking the hero headline. Real people from the shared roster
// rather than the export's invented "Ana M." and "Reinaldo A." (Jake, 3 Aug).
// One woman, one man, two regions, and one full-stack + one backend so the two
// cards do not read as the same person twice. Name, role, flag and skills come
// from site/src/lib/talent/roster.ts, so they can never drift from the same
// people shown on the home hero, the marquee and the location pages.
const HIW_HERO_CARDS = [
  { slug: 'ivana-m', rotate: 3 },
  { slug: 'stephen-l', rotate: -3 },
] as const

const HIW_HERO_PEOPLE: HiwPerson[] = HIW_HERO_CARDS.map(({ slug, rotate }) => {
  const person = talentBySlug(slug)
  return {
    name: person.name,
    role: roleWithYears(person),
    flag: person.flag,
    tags: [...person.tags],
    // Portrait crop, not the landscape home-hero one: this card is taller than
    // it is wide, and the landscape crop loses the face in it.
    image: talentPhoto(person.slug),
    imageAlt: `${person.name}, a ${person.role.toLowerCase()} vetted by Cloud Employee`,
    rotate,
  }
})

export const HIW_CONTENT = {
  hero: {
    eyebrow: 'How it works',
    titleLead: 'How Cloud Employee',
    titleAccent: 'actually works',
    paragraph:
      'One brief. Two matched engineers in 7 days. Embedded full-time in your team, your culture, and your time zone.',
    cta: 'Walk me through it',
    ctaHref: '#stages',
    bottomPills: HERO_BOTTOM_PILLS,
    vetted: 'Vetted by senior eng',
    people: HIW_HERO_PEOPLE,
  },
  stages: {
    eyebrow: 'The four stages',
    titleLead: 'How we find, vet, onboard &',
    titleAccent: 'look after your engineer',
    items: [
      {
        stage: 'Stage 1',
        title: 'Tell us what you need.',
        intro:
          "We define the role with you first, then search through trusted local networks, never a job board. Here's how it works:",
        checks: [
          'A US-based CTO learns your stack, team, and hiring bar',
          'Local recruiters search in Croatia, Colombia, Brazil, Argentina, and the Philippines',
          'Existing Cloud Employee engineers help refer proven talent',
        ],
      },
      {
        stage: 'Stage 2',
        title: 'We find and vet them.',
        intro:
          'Our senior engineers do live coding interview sessions with each shortlisted candidate for your actual role, not a generic Q&A.',
        checks: [
          'Custom coding assessment based on your stack',
          'Live pair-programming session with a senior engineer',
          'Cultural-fit interview with our US-based client lead',
          'CTO sign-off before you ever see a profile',
          'Two matched profiles with a written report on why each fits',
        ],
        image: '/design/home/media/coding-interview-v2.jpg',
        imageAlt: 'Cloud Employee engineers running a live pair-programming interview on the candidate stack',
      },
      {
        stage: 'Stage 3',
        title: 'We onboard them into your team.',
        intro:
          'The first 90 days matter, so we help your engineer start with the context, expectations, and support they need.',
        checks: [
          'We build a "How to Work With You" guide before day one',
          'Your engineer reports to you directly, daily, on your timezone (Just like regular FT employees)',
          'We check in after month one, then continue with quarterly reviews',
        ],
        image: `${HIW_IMG}/stage3-onboard.jpg`,
        imageAlt: 'Molly and Daniel on a welcome-to-the-team onboarding call',
      },
      {
        stage: 'Stage 4',
        title: 'We handle everything else.',
        intro:
          'We legally employ your engineer in their country, run all the admin, and keep them growing - so you just direct the work.',
        checks: [
          'Employed through our local entities',
          'Payroll, taxes, healthcare, benefits, and compliance handled in-country',
          'Dedicated development budget, AI training, and peer learning groups',
          'Wellbeing, performance, and retention support from 60+ specialists',
          'Quarterly events in all hubs',
        ],
      },
    ] as HiwStage[],
    // Stage 1 illustrative "Matching Brief" scoping card.
    brief: {
      label: 'Matching Brief',
      status: 'On call · InnovaTech ·',
      timer: '24:08',
      role: 'Senior Full-Stack Engineer',
      scopedBy: 'InnovaTech scoped by Anto (CTO)',
      stackLabel: 'Stack',
      stack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      fields: [
        { label: 'Seniority', value: 'Senior 7+ yrs - mentors juniors' },
        { label: 'Time zone', value: 'EST · 9am - 6pm core hours' },
        { label: 'Team based', value: 'New York · hybrid team of 6' },
        { label: 'Budget', value: '$5,000 - $6,000 / mo all-in' },
        { label: 'Culture', value: 'Fast-moving, low-ego, async-first' },
        { label: 'Past hires', value: 'Last contractor over-promised, under-communicated' },
      ],
      searchingNote: 'Searching trusted networks 100+ candidates',
      resultNote: '2 matches in 7 days',
    },
    // Stage 2 illustrative funnel. `value` is the CountUp target; `barWidth`
    // is the decorative bar-fill proportion (scale-x reveal, no CLS).
    funnel: {
      label: 'The funnel, in numbers',
      rows: [
        { label: 'Initial sourcing pool', value: '120+', barWidth: '100%', highlight: false },
        { label: 'After CV + AI screening', value: '45', barWidth: '68%', highlight: false },
        { label: 'After technical interview', value: '16', barWidth: '44%', highlight: false },
        { label: 'After live pair programming', value: '6', barWidth: '28%', highlight: false },
        { label: 'After cultural fit + final interview', value: '3', barWidth: '18%', highlight: false },
        { label: '2 matched profiles in 7 days', value: '2', barWidth: '12%', highlight: true },
      ],
    },
    // Stage 4 illustrative "Everything, handled" checklist card.
    handled: {
      title: 'Everything, handled',
      status: 'All systems green',
      rows: [
        { title: 'Local employment entity', sub: 'Croatia · Colombia · Brazil · Philippines' },
        { title: 'Payroll, taxes & compliance', sub: 'Run in-country, every month' },
        { title: 'Healthcare & benefits', sub: 'Localised, fully managed' },
        { title: 'Dev budget & AI training', sub: 'Continuous growth, peer groups' },
        { title: 'Wellbeing & retention', sub: 'Backed by 60+ specialists' },
      ],
      footnote: 'You just direct the work.',
      footprint: '60+ specialists · 5 hubs',
    },
    // Outcome stats (CountUp targets — see header note on placeholders).
    stats: [
      { value: '97%', label: 'Engineers stay 2+ years' },
      { value: '4.8/5', label: 'Avg. engineer + client satisfaction' },
      { value: '40-60%', label: 'Est. saving per engineer' },
    ],
  },
  deRisk: {
    eyebrow: 'Built to de-risk your hiring',
    items: ['No upfront fees', 'Replace at no cost', '30 days notice', 'Compliance covered'],
  },
  testimonials: {
    eyebrow: 'Testimonials',
    titleLead: 'Reviews from real',
    titleAccent: 'teams',
    items: [
      {
        quote:
          'Working with cloud employee felt nothing like hiring a contractor. The engineer was on our team from week one, shipping code, joining standups, genuinely invested in what we were building.',
        name: 'Marcus Kilgour',
        role: 'CTO, Salmon Software',
        variant: 'photo',
        image: `${HIW_IMG}/testimonial-marcus.png`,
        imageAlt: 'Marcus Kilgour, CTO at Salmon Software',
      },
      {
        quote:
          "Our new developers were able to hit the ground running, we've worked with them for over two years now, and they are truly part of our team.",
        name: 'Alison Whittle',
        role: 'Product Delivery Manager, BladeFS',
        variant: 'quote',
        image: `${HIW_IMG}/testimonial-alison.png`,
        imageAlt: 'Alison Whittle, Product Delivery Manager at BladeFS',
      },
      {
        quote:
          "We actually hired the whole team remotely, having never met them. And we made a bunch of really good hires. And that's pretty unique to be able to do that without having never met any of them.",
        name: 'Euan Cameron',
        role: 'CEO Willo',
        variant: 'photo',
        image: `${HIW_IMG}/testimonial-euan.png`,
        imageAlt: 'Euan Cameron, CEO at Willo',
      },
      {
        quote:
          'Custom workflows used to take weeks. With Tidal, we built and launched in just 3 days. Super intuitive.',
        name: 'Clara D',
        role: 'Head of CX, NovaPath',
        variant: 'quote',
      },
    ] as HiwTestimonial[],
  },
  // Matcher preview — STUB (static preview card; the interactive multi-step
  // quiz lands in a follow-up session under components/shared/engineer-match-
  // quiz/). Copy verbatim from the export matcher section.
  matcher: {
    eyebrow: 'Ready to find your engineer?',
    titleLead: 'See real engineer profiles, rates & timelines.',
    titleAccent: 'In 90 seconds',
    paragraph: "Four quick questions. See who we'd build your team with.",
    steps: ['Role', 'Skills', 'Team size', 'Your match'],
    question: 'What role are you hiring for?',
    questionSub: "Pick one to start - you'll see matching engineers at the end.",
    roles: ['Backend', 'Frontend', 'Full-Stack', 'AI / ML', 'Data', 'DevOps', 'Mobile', 'Something else'],
    bottomPills: [
      '300+ teams built',
      '97% stay 2+ years',
      "Replace if it isn't working",
      'No lock-ins',
    ],
    nextLabel: 'Next',
    matching: {
      label: 'Matching...',
      unlocks: 'Unlocks at step 4',
      tags: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
      note: 'Answer all 4 questions to reveal full profiles, rates, and availability.',
      stats: [
        { value: '4', label: 'Quick questions' },
        { value: '90s', label: 'To your match' },
        { value: '1:1', label: 'Engineer fit' },
      ],
    },
    talkPrompt: 'Prefer to talk first?',
    talkCtas: [
      { label: 'Ask our AI anything', href: CHAT_HREF },
      { label: 'Book a call', href: '/book-a-call' },
    ] as HiwTalkCta[],
    bookHref: '/book-a-call',
  },
  faq: {
    eyebrow: 'Got questions?',
    titleLead: 'The questions',
    titleAccent: 'CTOs and founders ask.',
    fallbackLabel: "Can't find your question?",
    fallbackBody: "Ask our AI chatbot - trained on every sales call we've had.",
    fallbackCta: 'Open chat',
    fallbackCtaHref: CHAT_HREF,
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
          'One flat monthly fee covers the engineer, local employment, payroll, benefits, and your account manager. There are no placement fees, no setup costs, and no long-term lock-in. Rates vary by role, seniority, and region.',
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
    ] as HiwFaqItem[],
  },
} as const

export type HiwContent = typeof HIW_CONTENT
