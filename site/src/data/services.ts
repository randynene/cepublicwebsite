// Services section data - lifted verbatim from docs/raw-html/raw-html/Services HUB.html
// + Service Detail 2.html. Hardcoded for now; shaped so a Sanity fetch can replace
// the exported getters without touching the components. Author-voice: no em/en dashes.

export interface ServiceCard {
  name: string
  sub: string
  slug: string
}

export interface TechChip {
  name: string
  sub: string
  abbr: string
  slug: string
  /** Real brand mark from Sanity `technology.techLogo`. Absent only where no logo exists. */
  logo?: string
}

export interface HubStory {
  logo: string
  title: string
}

export interface HubQuote {
  text: string
  name: string
  role: string
  initials: string
}

export interface HubFaq {
  q: string
  a: string
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function mk(list: [string, string][]): ServiceCard[] {
  return list.map(([name, sub]) => ({ name, sub, slug: slugify(name) }))
}

// ── Hub content ─────────────────────────────────────────────────────────────
export const SERVICES_HUB = {
  hero: {
    eyebrow: 'Staff Augmentation Services',
    titleLead: 'Full Embedded Tech',
    titleAccent: 'Teams',
    lead: 'Vetted engineers and full teams, embedded on your side - sourced, onboarded, and retained by us.',
    searchPlaceholder: 'Search services…',
  },
  category1Heading: 'Specialist tech talent we hire',
  aiHeading: { lead: 'Stay at the forefront', accent: 'with AI', eyebrow: 'AI Services' },
  buildsHeading: { lead: 'Turning ideas into', accent: 'products', eyebrow: 'Product Build Services' },
  techCoverage: {
    eyebrow: 'Technology coverage',
    titleLead: 'From frontend to backend, we have engineers fluent in',
    titleAccent: 'your tech',
    body: 'Browse by technology to see vetted engineers ready for your stack.',
    seeAll: 'See all 96 technologies',
  },
  promo: {
    eyebrow: 'Promo',
    titleLead: 'Try our Product Scoping service -',
    titleAccent: 'scope, plan, build.',
    body: 'We map your idea to a build plan, timeline, and the exact team you need - before you commit to anything.',
    cta: 'Learn more',
    ctaHref: '/services/product-scoping',
  },
  featured: mk([
    ['Software Engineers', 'Scalable product-builders on demand, embedded on your team.'],
    ['Fractional CTOs', 'Startup-savvy technical leadership, part-time.'],
  ]),
  specialists: mk([
    ['Mobile Developers', 'iOS, Android & cross-platform.'],
    ['QA Analysts & Testers', 'Test coverage & quality control.'],
    ['DevOps Engineers', 'CI/CD, pipelines & deployments.'],
    ['Data Scientists', 'Insights, models & experimentation.'],
    ['No-Code Developers', 'Rapid builds on no-code tools.'],
    ['Full-Stack Developers', 'Front-to-back product delivery.'],
    ['Cloud Engineers', 'AWS, scaling & cloud operations.'],
    ['Front-end Developers', 'Pixel-perfect, responsive interfaces.'],
    ['Back-End Developers', 'APIs, services & systems at scale.'],
    ['iOS Developers', 'Native apps for Apple platforms.'],
    ['Android Developers', 'Robust Android builds, embedded.'],
    ['Web Developers', 'Custom web platforms, end-to-end.'],
  ]),
  ai: mk([
    ['AI Engineers', 'Insight-rich models & experimentation.'],
    ['AI Consulting', 'From idea to AI roadmap.'],
    ['AI Product Builds', 'AI-powered apps, built end-to-end.'],
  ]),
  builds: mk([
    ['MVP Development', 'Fast-track your first product.'],
    ['Mobile Apps', 'Cross-platform apps that scale.'],
    ['Web-Based Apps', 'Custom platforms, built for scale.'],
  ]),
  techChips: (
    [
      ['React', 'Component-driven UIs on demand.'],
      ['Node.js', 'Back-end specialists that ship fast.'],
      ['Python', 'Backend, data & automation.'],
      ['TypeScript', 'Typed safety meets modern JS.'],
      ['AWS', 'Cloud-native engineers, embedded.'],
      ['.NET', 'Scalable .NET talent for the enterprise.'],
      ['Java', 'Robust back-end systems at scale.'],
      ['C#', 'Dependable C# product builds.'],
      ['React Native', 'Cross-platform mobile, one codebase.'],
      ['Flutter', 'One codebase, native-feel apps.'],
    ] as [string, string][]
  ).map(([name, sub]) => ({
    name,
    sub,
    abbr: name.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase(),
    slug: slugify(name),
  })) as TechChip[],
  stories: [
    { logo: 'Salmon', title: 'How Salmon scaled their tech team in 6 weeks' },
    { logo: 'Willo', title: 'How VC-backed Willo grew a dev team offshore' },
    { logo: 'Event Co', title: 'Breaking the UK developer bottleneck' },
  ] as HubStory[],
  quotes: [
    { text: 'It genuinely feels like they sit in our office - same standup, same standards.', name: 'James D.', role: 'CTO, Willo', initials: 'JD' },
    { text: 'We had two strong candidates in a week. Both are still with us two years on.', name: 'Sarah L.', role: 'VP Eng, Salmon', initials: 'SL' },
    { text: 'The vetting is the real thing - our engineer out-shipped hires that cost 3x.', name: 'Marco P.', role: 'Founder, Tidal', initials: 'MP' },
  ] as HubQuote[],
  faqs: [
    { q: 'How do you manage time-zone differences?', a: 'Your engineer works your hours, not theirs - we match from regions that overlap your working day.' },
    { q: 'How is Cloud Employee different from a recruitment company?', a: "We're not a placement agency. We embed one vetted engineer full-time and handle vetting, HR and payroll so you just manage the work." },
    { q: 'Is there a minimum number of employees I need to hire?', a: "No. Start with a single engineer and scale into a full team whenever you're ready." },
    { q: 'What level of project management support do you provide?', a: 'A dedicated account manager runs onboarding, weekly check-ins, and a 30/60/90 review.' },
  ] as HubFaq[],
}

// Every service card, flattened - the canonical slug set for /services/[slug].
export const ALL_SERVICE_CARDS: ServiceCard[] = [
  ...SERVICES_HUB.featured,
  ...SERVICES_HUB.specialists,
  ...SERVICES_HUB.ai,
  ...SERVICES_HUB.builds,
  { name: 'Product Scoping', sub: 'Scope, plan and build with confidence.', slug: 'product-scoping' },
]

export function getAllServiceSlugs(): string[] {
  return ALL_SERVICE_CARDS.map((c) => c.slug)
}

// ── Service detail (per-slug) ───────────────────────────────────────────────
export interface ServiceDetail {
  slug: string
  eyebrow: string
  serviceName: string
  category: string
  tagline: string
  introPara: string
  skillBadges: string[]
  introBullets: string[]
  whyBullets: string[]
  noFeeBullets: string[]
  features: { header: string; desc: string }[]
  techCoverage: { name: string; sub: string; slug: string; logo?: string }[]
  faqs: HubFaq[]
}

// Depth-across-the-stack cards - verbatim from Service Detail 2 (reference).
const DETAIL_FEATURES = [
  { header: 'Front-End', desc: 'React, Angular or Vue - clean, fast, responsive UIs.' },
  { header: 'Back-End', desc: 'Node, .NET, Java or Go - robust APIs and service layers.' },
  { header: 'Full-Stack', desc: 'Independently productive across the full product lifecycle.' },
  { header: 'Legacy Systems', desc: 'Stabilise and modernise aging codebases safely.' },
  { header: 'Dev Practices', desc: 'TDD, Git workflows, pair programming, sprint ownership.' },
  { header: 'Deployment Ready', desc: 'CI/CD, cloud fluency, infra-awareness from the start.' },
]

const DETAIL_TECH_COVERAGE = [
  { name: 'React', sub: 'Component-driven front ends', logo: '/logos/react.svg' },
  { name: 'Angular', sub: 'Enterprise-grade SPAs', logo: '/logos/angular.svg' },
  { name: 'Node.js', sub: 'Fast, scalable back ends', logo: '/logos/nodejs.svg' },
  { name: '.NET', sub: 'Robust enterprise services', logo: '/logos/dotnet.svg' },
  { name: 'Java', sub: 'High-throughput systems', logo: '/logos/java.svg' },
  { name: 'Python', sub: 'APIs, data and automation', logo: '/logos/python.svg' },
  { name: 'AWS', sub: 'Cloud infra and deployment', logo: '/logos/aws.svg' },
  { name: 'Google Cloud', sub: 'Managed, scalable platforms', logo: '/logos/googlecloud.svg' },
].map((t) => ({ ...t, slug: slugify(t.name) }))

const DETAIL_FAQS: HubFaq[] = [
  { q: 'How do you vet your engineers?', a: 'Every engineer passes a live technical assessment and pair-programming session with our senior engineers before they ever reach your shortlist.' },
  { q: 'How is Cloud Employee different from an agency?', a: 'Your engineer works only for you, full-time, embedded in your team - not shared across projects or billed by the ticket.' },
  { q: 'How soon can an engineer start?', a: 'We put two vetted candidates in front of you within 7 working days, and your chosen engineer can usually start within two weeks.' },
  { q: 'What seniority levels can I hire?', a: 'From mid-level through senior and lead engineers. We match experience to the roadmap and team you describe.' },
  { q: "What if the engineer isn't the right fit?", a: 'We replace them at no cost. There are no lock-in contracts, so the relationship lasts because the work is good.' },
  { q: 'Who handles HR, equipment and payroll?', a: 'We do. Local HR, IT, equipment, contracts and compliance are handled in-region, so you manage one relationship: your engineer.' },
]

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

// Resolve any service slug to a populated detail (no 404s). Known cards use their
// name + subtitle; unknown slugs fall back to a humanized name.
export function getServiceDetail(slug: string): ServiceDetail {
  const card = ALL_SERVICE_CARDS.find((c) => c.slug === slug)
  const name = card?.name ?? humanize(slug)
  return {
    slug,
    eyebrow: 'In-house feel, nearshore',
    serviceName: name,
    category: 'Staff Augmentation',
    // Verbatim hero tagline from Service Detail 2 (reference).
    tagline:
      'Vetted engineers who embed in your team and own delivery end to end, from first commit to production. In-house feel, without the hiring grind.',
    introPara: `We place vetted senior ${name.toLowerCase()} inside your team to build, maintain and own delivery. They join your standups, your sprints and your codebase - and they feel like one of your own, because they work like it.`,
    skillBadges: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
    introBullets: [
      'Own delivery end to end, first commit to production',
      'Embedded in your workflow, tools and review process',
      'Nearshore hours that overlap your working day',
    ],
    whyBullets: [
      'Vetted by senior engineers, not recruiters - so quality is real',
      'Embedded full-time in your stack, standups and sprints',
      'They stay: 97% of placements last two years or more',
    ],
    noFeeBullets: [
      'No placement or upfront fees',
      'Rolling 30-day contract, cancel anytime',
      'One monthly rate, everything included',
    ],
    features: DETAIL_FEATURES,
    techCoverage: DETAIL_TECH_COVERAGE,
    faqs: DETAIL_FAQS,
  }
}
