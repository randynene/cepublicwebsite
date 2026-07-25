// Technology section data - lifted verbatim from docs/raw-html/raw-html/Technology HUB.html
// + Technology Detail 2.html. Hardcoded for now; Sanity-swappable getters.
// Author-voice: no em/en dashes.

import type { HubFaq, HubQuote, HubStory } from './services'
import { SERVICES_HUB } from './services'

export interface Technology {
  title: string
  subtitle: string
  abbr: string
  slug: string
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const TECH_DATA: [string, string][] = [
  ['Airtable', 'Low-code data ops, wired to your stack.'],
  ['Android', 'Native Android engineers, embedded.'],
  ['Angular', 'Enterprise-grade Angular front-ends.'],
  ['Ansible', 'Infrastructure automation, done right.'],
  ['AWS', 'Cloud-native engineers, certified.'],
  ['Azure', 'Microsoft cloud specialists on demand.'],
  ['BigQuery', 'Warehouse-scale analytics engineering.'],
  ['BrowserStack', 'Cross-browser QA at scale.'],
  ['Bubble', 'No-code product builders, fast.'],
  ['C#', 'Robust C# talent for .NET builds.'],
  ['CloudFormation', 'Infra-as-code on AWS, embedded.'],
  ['Combine', 'Reactive Swift with Combine.'],
  ['Compose', 'Modern Android UI in Compose.'],
  ['CoreData', 'Local persistence for Apple apps.'],
  ['CSS3', 'Pixel-precise, responsive styling.'],
  ['Cypress', 'End-to-end testing that holds up.'],
  ['Dagger', 'Fast, portable CI pipelines.'],
  ['DBT', 'Analytics engineering in your warehouse.'],
  ['Docker', 'Containerised delivery, standardised.'],
  ['Express', 'Lean Node.js APIs that ship fast.'],
  ['FastAPI', 'High-performance Python APIs.'],
  ['Fastlane', 'Automated mobile release pipelines.'],
  ['Figma', 'Design-to-code, handoff ready.'],
  ['Firebase', 'Realtime backends without the ops.'],
  ['Flutter', 'One codebase, native-feel apps.'],
  ['GitHub Actions', 'CI/CD wired into your repo.'],
  ['GitLab CI', 'Pipelines that scale with you.'],
  ['Glide', 'No-code apps from your data.'],
  ['Google Cloud', 'GCP-certified cloud engineers.'],
  ['GraphQL', 'Typed, efficient API layers.'],
  ['HuggingFace', 'Applied ML with open models.'],
  ['JAX', 'High-performance numerical ML.'],
  ['Ionic', 'Hybrid mobile from web skills.'],
  ['iOS', 'Native iOS engineers, embedded.'],
  ['Java', 'Robust back-end systems at scale.'],
  ['Java (Android)', 'Battle-tested Android in Java.'],
  ['Jest', 'Confident unit testing for JS.'],
  ['Jetpack', 'Modern Android with Jetpack.'],
  ['Jira', 'Delivery workflows that stick.'],
  ['Jupyter', 'Reproducible data-science notebooks.'],
  ['Kotlin', 'Concise, safe Android & back-end.'],
  ['Kubeflow', 'ML pipelines on Kubernetes.'],
  ['Kubernetes', 'Container orchestration & platform ops.'],
  ['LangChain', 'LLM apps, wired end-to-end.'],
  ['Laravel', 'Elegant PHP product builds.'],
  ['LlamaIndex', 'RAG pipelines over your data.'],
  ['Make', 'Automated workflows without code.'],
  ['MLflow', 'Track, package and ship models.'],
  ['MLOps', 'Production ML, operationalised.'],
  ['MongoDB', 'Flexible document data at scale.'],
  ['MVVM', 'Clean, testable app architecture.'],
  ['n8n', 'Self-hosted workflow automation.'],
  ['NestJS', 'Structured, scalable Node.js.'],
  ['Next.js', 'Full-stack React, production-ready.'],
  ['Node.js', 'Back-end specialists on one stack.'],
  ['NumPy', 'Numerical Python, done fast.'],
  ['OpenAI', 'GenAI features, built responsibly.'],
  ['Pandas', 'Data wrangling and pipelines.'],
  ['PHP', 'Dependable web back-ends.'],
  ['Pinecone', 'Vector search for AI apps.'],
  ['Playwright', 'Reliable cross-browser E2E tests.'],
  ['PostHog', 'Product analytics, self-served.'],
  ['Postgres', 'Reliable, performant relational data.'],
  ['Prometheus', 'Metrics and alerting that scale.'],
  ['Python', 'Backend, data & automation specialists.'],
  ['PyTorch', 'Deep learning, research to prod.'],
  ['Qase', 'Structured test management.'],
  ['React', 'Component-driven UIs that scale.'],
  ['React Native', 'Cross-platform mobile, one codebase.'],
  ['Redis', 'Low-latency caching and queues.'],
  ['Ruby', 'Productive, readable back-ends.'],
  ['Rust', 'Memory-safe systems performance.'],
  ['scikit-learn', 'Classic ML that ships.'],
  ['Selenium', 'Automated browser testing.'],
  ['Solr', 'Search that scales with content.'],
  ['Storybook', 'Documented, testable UI components.'],
  ['Supabase', 'Postgres backends, batteries included.'],
  ['Swift', 'Modern, safe Apple development.'],
  ['SwiftUI', 'Declarative Apple interfaces.'],
  ['Tailwind', 'Utility-first, consistent styling.'],
  ['TensorFlow', 'Production deep learning.'],
  ['Terraform', 'Infrastructure as code, anywhere.'],
  ['TestRail', 'Test-case management at scale.'],
  ['TypeScript', 'Typed safety meets modern JS.'],
  ['UIKit', 'Battle-tested iOS interfaces.'],
  ['Unity', 'Real-time 3D and game builds.'],
  ['Vector DB', 'Embeddings storage for AI.'],
  ['Vercel', 'Front-end delivery, globally fast.'],
  ['Vertex AI', 'Managed ML on Google Cloud.'],
  ['Weaviate', 'Open-source vector search.'],
  ['Workflow', 'Automations glued to your tools.'],
  ['Xamarin', 'Cross-platform .NET mobile.'],
  ['Xano', 'No-code scalable backends.'],
  ['Xcode', 'Apple toolchain expertise.'],
  ['Zapier', 'Connect your stack, no code.'],
]

export const TECHNOLOGIES: Technology[] = TECH_DATA.map(([title, subtitle]) => ({
  title,
  subtitle,
  abbr: title.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase(),
  slug: slugify(title),
}))

export const TECHNOLOGY_HUB = {
  hero: {
    eyebrow: 'Technology',
    titleLead: 'Your tech-stack, our',
    titleAccent: 'expertise',
    lead: 'The languages, frameworks, and platforms our engineers ship in - vetted talent for whatever your stack runs on.',
    searchPlaceholder: 'Search technologies…',
  },
  gridEyebrow: 'All technologies',
  gridHeading: 'Every stack our engineers ship in',
  countLabel: `${TECHNOLOGIES.length} technologies · sorted A-Z`,
  stories: SERVICES_HUB.stories as HubStory[],
  quotes: SERVICES_HUB.quotes as HubQuote[],
  faqs: [
    { q: "Can I hire for a technology that isn't listed?", a: "Yes. The directory covers our most-requested stacks, but we source for any technology - tell us your stack on the call and we'll match to it." },
    { q: 'How quickly can an engineer start?', a: 'Most clients see two vetted candidates within 7 working days, with the engineer embedded and shipping shortly after.' },
    { q: 'Are engineers vetted on the specific technology?', a: 'Every engineer goes through live pair-programming with a senior engineer in their core stack - not just a CV screen.' },
    { q: 'What if I need more than one technology?', a: 'We build cross-functional teams. Mix front-end, back-end, data and DevOps in a single embedded pod.' },
  ] as HubFaq[],
}

export function getAllTechnologySlugs(): string[] {
  return TECHNOLOGIES.map((t) => t.slug)
}

// ── Technology detail (per-slug) ────────────────────────────────────────────
export interface TechnologyDetail {
  slug: string
  eyebrow: string
  technologyName: string
  category: string
  tagline: string
  introPara: string
  skillBadges: string[]
  introBullets: string[]
  whyBullets: string[]
  noFeeBullets: string[]
  features: { header: string; desc: string }[]
  techCoverage: { name: string; sub: string; slug: string }[]
  faqs: HubFaq[]
}

const T_TECH_COVERAGE = [
  { name: 'React', sub: 'Component-driven front ends' },
  { name: 'Node.js', sub: 'Fast, scalable back ends' },
  { name: 'TypeScript', sub: 'Typed safety, modern JS' },
  { name: 'Python', sub: 'APIs, data and automation' },
  { name: 'AWS', sub: 'Cloud infra and deployment' },
  { name: '.NET', sub: 'Robust enterprise services' },
  { name: 'React Native', sub: 'Cross-platform mobile' },
  { name: 'PostgreSQL', sub: 'Reliable relational data' },
].map((t) => ({ ...t, slug: t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))

const T_FEATURES = [
  { header: 'Production-grade delivery', desc: 'Clean, tested code shipped on your stack, your standards.' },
  { header: 'Owns the full lifecycle', desc: 'From first commit to production and maintenance.' },
  { header: 'Fluent in your tooling', desc: 'Your component library, review process and CI.' },
  { header: 'API & data integration', desc: 'Wires cleanly into services, data and third parties.' },
  { header: 'Testing & QA built in', desc: 'TDD, Git workflows, pair programming, sprint ownership.' },
  { header: 'Cloud & infra aware', desc: 'CI/CD, cloud fluency, infra-awareness from the start.' },
]

const T_FAQS: HubFaq[] = [
  { q: 'How do you vet your engineers?', a: 'Every engineer passes a live technical assessment and pair-programming session in their core stack before they ever reach your shortlist.' },
  { q: 'How is Cloud Employee different from an agency?', a: 'Your engineer works only for you, full-time, embedded in your team - not shared across projects or billed by the ticket.' },
  { q: 'How soon can an engineer start?', a: 'We put two vetted candidates in front of you within 7 working days, and your chosen engineer can usually start within two weeks.' },
  { q: 'What seniority levels can I hire?', a: 'From mid-level through senior and lead engineers. We match experience to the roadmap and team you describe.' },
  { q: "What if the engineer isn't the right fit?", a: 'We replace them at no cost. There are no lock-in contracts, so the relationship lasts because the work is good.' },
  { q: 'Who handles HR, equipment and payroll?', a: 'We do. Local HR, IT, equipment, contracts and compliance are handled in-region, so you manage one relationship.' },
]

function humanize(slug: string): string {
  return slug
    .replace(/-developers?$/, '')
    .split('-')
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

// Resolve any technology slug to a populated detail. Accepts BOTH the hub form
// (`react`) and the nav/footer/Sanity form (`react-developers`) so neither 404s.
export function getTechnologyDetail(slug: string): TechnologyDetail {
  const normalized = slug.replace(/-developers?$/, '')
  const tech = TECHNOLOGIES.find((t) => t.slug === slug || t.slug === normalized)
  const base = tech?.title ?? humanize(slug)
  const name = `${base} Developers`
  return {
    slug,
    eyebrow: 'In-house feel, nearshore',
    technologyName: name,
    category: 'Technology',
    tagline: `Embedded ${base} engineers who own your build end to end - from first commit to production. They join your team, not just your project.`,
    introPara: `We place a senior ${base} engineer inside your team to build, maintain and own delivery. They join your standups, your sprints and your codebase - and they feel like one of your own, because they work like it.`,
    skillBadges: ['Git', 'CI/CD', 'Testing', 'APIs', 'Cloud'],
    introBullets: [
      `Own the ${base} build end to end, commit to production`,
      'Fluent in your component library and review process',
      'Nearshore hours that overlap your working day',
    ],
    whyBullets: [
      `Senior ${base} engineers, vetted by engineers - not recruiters`,
      'Embedded in your stack, standups and sprints from day one',
      'No lock-in contracts - stay because the work is good',
      'Replaced at no cost if the fit is ever wrong',
    ],
    noFeeBullets: [
      'No placement or upfront fees',
      'Rolling 30-day contract, cancel anytime',
      'One monthly rate, everything included',
    ],
    features: T_FEATURES,
    techCoverage: T_TECH_COVERAGE,
    faqs: T_FAQS,
  }
}
