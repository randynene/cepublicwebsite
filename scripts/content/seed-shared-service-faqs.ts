import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// MYGRATR Phase 2 - seed the `sharedServiceFaqs` singleton from the LIVE
// cloudemployee.io FAQ copy (captured 21 Jul 2026 from
// /services/full-stack-developers and confirmed identical across service pages;
// /technology/* shows the serviceModel group only).
//
// The live site renders the SAME three-group FAQ block on every service page and
// the first group on every technology page. This singleton holds that copy once;
// every service/technology detail page reads it by default (a page only stops
// reading it if that page's own `faqs` override is filled). See
// site/src/lib/catalogue/content.ts and studio/schemas/singletons/shared-service-faqs.ts.
//
// House style (no em/en dashes, per repo hard rule): the live answers contain a
// few em-dashes; they are pre-normalised in the literals below to ", " and any
// residual is stripped by normalizeDeep at write time, matching seed-pricing-page.ts.
// One live typo ("request.We can") is corrected to "request. We can". No other
// wording is changed - this is verbatim live copy.
//
// Idempotent: fixed _id "sharedServiceFaqs" + createOrReplace. Dry-run by default;
// pass --apply to write.
//
// Run (preview):  npm run content:seed-shared-faqs
// Run (write):    npm run content:seed-shared-faqs -- --apply
// Token: SANITY_MIGRATION_WRITE_TOKEN

interface Faq {
  question: string
  // One entry per paragraph (most answers are a single paragraph).
  answer: string[]
}

// ── Group 1: service model (all service pages + all technology pages) ──────────
const SERVICE_MODEL: Faq[] = [
  {
    question: 'How do you manage time zone differences?',
    answer: [
      'We align our working hours with your time zone, and ensure overlap for real-time collaboration. We also have team members available for critical support outside standard hours.',
    ],
  },
  {
    question: 'How is Cloud Employee different from a recruitment company?',
    answer: [
      "Entirely different: - We don't take any placement fees - You don't pay to interview candidates, only if you hire them - We have technically developed vetting process which is led by our inhouse CTO - This also includes peer reviews with our senior engineers, avoiding any mishires - We don't stop after recruitment - we work with you month on month as a partner and you have a dedicated, UK-Based account manager and CTO - We don't charge a re-hire fee if for any reason your developer doesn't work out - We are invested in working with you over a long period of time - and act accordingly as a partner",
    ],
  },
  {
    question: 'Is there a minimum number of employees I need to hire?',
    answer: [
      'No - you can hire just one employee and receive the same excellent level of service.',
    ],
  },
  {
    question: "What if a developer doesn't perform as expected?",
    answer: [
      'You feed this back to your dedicated UK-Based Account Manager who will then work with you to find solutions. We have a robust HR team physically on-the-ground in our Philippines and Latin America offices, who work with our learning and development. Sometimes peer training with our other developers, or a conversation with our CTO quickly improves any issues. If not, we find you a new hire, free of charge.',
    ],
  },
  {
    question: 'Do I communicate directly with the developer working with me?',
    answer: [
      'Yes absolutely. Developers plug directly into your day-to-day communication channels - company email, Slack channels, Discord, etc. Your developer is fully integrated into your team, even down to updating their LinkedIn with your company as their employer if you would prefer.',
      'In fact, if you hire more than 4 developers, we will also contribute £2,000 toward a trip for your developer to visit you, or for you to visit our beautiful offices in Manilla and/or Latin America to meet and work with your developers at our offices in person once per year.',
    ],
  },
  {
    question: 'How quickly can you scale my team if needed?',
    answer: [
      'We recently scaled a full technical team of 28 developers and technical experts for a UK-Based company in one month. If you provide us all of the information we need, we can move very quickly.',
    ],
  },
  {
    question: 'What level of project management support do you provide?',
    answer: [
      'We implement strict security protocols, including secure communication channels, data encryption, and non-disclosure agreements. We also comply with industry-specific regulations and can provide relevant certifications upon request. We can hire project managers specifically for your project for you. We also advise you on the level of seniority and team mix required for your project and wider company needs - ensuring you have the right people to self-manage.',
    ],
  },
  {
    question: 'What does your discovery call process entail?',
    answer: [
      "Expect to talk through your needs and for us to offer you support and advice. From there, if we're a good fit, we set you up with a CTO and UK-Based Account Manager call to provide feedback and/or develop job descriptions alongside you.",
    ],
  },
  {
    question: 'How is Cloud Employee different from a freelancer platform?',
    answer: [
      'Entirely. Forget one-off jobs, security risks and project to project work. Read more here.',
    ],
  },
  {
    question: 'Can I visit your offices and meet my Cloud Employee/s?',
    answer: [
      "We encourage clients to visit our offices to meet and spend time working with their Cloud Employee team. We've made sure that our offices are well-equipped and always welcoming to our clients.",
      'In fact, if you hire 4 or more Cloud Employees, we will cover your flights and accommodation to visit our offices and work with your team (and escape UK winter!). This is up to £2,000 of value.',
    ],
  },
]

// ── Group 2: product builds (service pages) ────────────────────────────────────
const PRODUCT_BUILDS: Faq[] = [
  {
    question: 'What do I get at the end of a product build?',
    answer: [
      "You'll receive a launch-ready product, fully tested, deployed, and handed over with clean documentation, source code, and a clear path for scaling or ongoing support.",
    ],
  },
  {
    question: 'Can I bring my own designs or do you handle design too?',
    answer: [
      'Both work. Bring your own designs, or let our in-house designers handle UX and UI as part of the build.',
    ],
  },
  {
    question: 'What if I already have some code or a prototype?',
    answer: [
      "We can audit your existing work and build on top of it, or help you start fresh if it's faster, safer, or more scalable.",
    ],
  },
  {
    question: 'Do I need to manage the developers during the build?',
    answer: [
      'Nope. We handle day-to-day project management, progress tracking, and delivery, you just stay in the loop and make key decisions.',
    ],
  },
  {
    question: 'How long does it typically take to build a product?',
    answer: [
      "That depends on the scope. We'll define timelines during the scoping phase and keep delivery lean and milestone-driven.",
    ],
  },
  {
    question: 'What happens after the product is launched?',
    answer: [
      'We can support post-launch updates, bug fixes, and new features, or help you build your own embedded team to take it forward.',
    ],
  },
  {
    question: 'Can you build across web, mobile, and backend?',
    answer: [
      'Yes. We deliver full-stack products, front end, back end, mobile apps, and APIs, designed to work together from day one.',
    ],
  },
  {
    question: 'Will the codebase be handed over to me?',
    answer: [
      "Yes. It's your IP. You'll receive full access to the codebase, repos, and all project documentation.",
    ],
  },
  {
    question: 'Do you offer fixed-price product builds?',
    answer: [
      'We offer both fixed-price and flexible engagement models, depending on the scope, complexity, and timeline.',
    ],
  },
  {
    question: 'Can I add more features or change scope mid-build?',
    answer: [
      'We scope tightly up front but remain flexible. If priorities shift, we can adjust your roadmap or re-scope milestones without derailing delivery.',
    ],
  },
]

// ── Group 3: consulting (service pages) ─────────────────────────────────────────
const CONSULTING: Faq[] = [
  {
    question: 'What kind of consulting do you provide?',
    answer: [
      'We offer strategic product and technical consulting, scoping features, planning roadmaps, validating AI use cases, and advising on build decisions.',
    ],
  },
  {
    question: 'How is this different from working with a dev agency?',
    answer: [
      "This isn't just discovery fluff. Our consultants are CTOs, engineers and PMs who know how to ship. You'll leave with actionable output, not just slides.",
    ],
  },
  {
    question: 'Do I need to know exactly what I want to build?',
    answer: [
      "Not at all. We'll help shape your ideas into something buildable, whether it's an MVP, a prototype, or a feature release plan.",
    ],
  },
  {
    question: 'Can you help me choose between different tech options?',
    answer: [
      'Yes. We recommend tech based on your product needs, not on what we happen to know. Stack-agnostic, outcome-first guidance.',
    ],
  },
  {
    question: 'Do I need to commit to a build after consulting?',
    answer: [
      "No. Our scoping and consulting services are standalone. You can take the plan elsewhere, or build with us when you're ready.",
    ],
  },
  {
    question: 'How technical do I need to be to benefit from consulting?',
    answer: [
      'Not at all. We work with both technical founders and non-technical leaders. We translate ideas into build-ready outcomes, no jargon required.',
    ],
  },
  {
    question: 'Can you help scope an MVP?',
    answer: [
      "Absolutely. We'll help define the leanest version of your product that delivers real user value, fast and buildable.",
    ],
  },
  {
    question: 'Do you offer AI-specific consulting?',
    answer: [
      'Yes. We help teams assess AI feasibility, recommend models, and shape realistic delivery plans, without the buzzword noise.',
    ],
  },
  {
    question: 'Can I book just a single session to get advice?',
    answer: [
      'Yes. You can start with a focused engagement to explore ideas or validate direction. No long-term commitment required.',
    ],
  },
]

const STRUCTURAL_KEYS = new Set(['_ref', '_type', '_key', 'asset'])

function normalizeStr(str: string): string {
  return str
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function normalizeDeep<T>(value: T): T {
  if (typeof value === 'string') return normalizeStr(value) as unknown as T
  if (Array.isArray(value)) return value.map((v) => normalizeDeep(v)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = STRUCTURAL_KEYS.has(k) ? v : normalizeDeep(v)
    }
    return out as T
  }
  return value
}

// Build a PortableText array (one `normal` block per paragraph) for a faqItem
// answer. Matches the `portableText` type used by the faqItem.answer field.
function toPortableText(paragraphs: string[]) {
  return paragraphs.map((text) => ({
    _type: 'block',
    _key: randomUUID().slice(0, 12),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: randomUUID().slice(0, 12), text, marks: [] }],
  }))
}

function toFaqItems(faqs: Faq[]) {
  return faqs.map((f, i) => ({
    _type: 'faqItem',
    _key: `faq-${i}`,
    question: f.question,
    answer: toPortableText(f.answer),
  }))
}

function buildDoc() {
  return {
    _id: 'sharedServiceFaqs',
    _type: 'sharedServiceFaqs',
    serviceModel: toFaqItems(SERVICE_MODEL),
    productBuilds: toFaqItems(PRODUCT_BUILDS),
    consulting: toFaqItems(CONSULTING),
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const doc = normalizeDeep(buildDoc())

  console.log(
    `sharedServiceFaqs: serviceModel=${SERVICE_MODEL.length} productBuilds=${PRODUCT_BUILDS.length} consulting=${CONSULTING.length}`,
  )

  if (!apply) {
    console.log('\nDRY RUN (no write). Document preview:\n')
    console.log(JSON.stringify(doc, null, 2))
    console.log('\nRe-run with --apply to write to Sanity.')
    return
  }

  await sanityWriteClient.createOrReplace(doc)
  console.log('\nSeeded sharedServiceFaqs singleton (_id: sharedServiceFaqs).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
