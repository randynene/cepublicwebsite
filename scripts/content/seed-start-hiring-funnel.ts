// Seeds the /start-hiring funnel.
//
// The funnel is not in the Webflow CMS — each step is a static Webflow page with a
// HubSpot form on it — so there is nothing to migrate through the CMS API. The
// copy below was read off the live pages; the form ids were extracted from each
// page's embed script.
//
// THE STEP ORDER IS NOT DECLARED HERE. It is derived, at seed time, by walking
// HubSpot's own post-submit redirects: the form on /contact-info sends you to
// /how-many, the form on /how-many sends you to /how-long, and so on. That chain
// IS the funnel.
//
// It was hardcoded first, and it was wrong. The order looked obvious from the page
// list, so budget was made step 2 — it is step 4. The progress bar told visitors
// they were two questions from the end when they were four. HubSpot's own form
// NAMES are no help either: they still say "Part 5/8" on what is now step 4,
// because a step was removed and nobody renumbered them. The redirects are the
// only thing that cannot be stale, because they are what actually runs.
//
// Run: npm run content:seed-start-hiring
import { ensureSanity } from '@/lib/env'
import { fetchHubSpotForms, orderFunnelSteps } from '@/lib/content/hubspot-forms'
import { recordMigration } from '@/lib/content/migration-tracker'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

ensureSanity()

// Which HubSpot form sits on which page. Read off the live pages, not guessed.
// `thanks` is the confirmation page and carries no form.
//
// get-started is UK-ONLY. /uk/start-hiring/get-started is a real page and the UK
// funnel's first step; /start-hiring/get-started is a redirect into contact-info.
// Its form is the one HubSpot calls "Part 1/8", which looked orphaned precisely
// because it is on no US page.
const UK_ONLY = new Set(['get-started'])

const FORM_ID_BY_SLUG: Record<string, string | null> = {
  'get-started': '05bfad44-0c7c-45f2-a3c4-3eccea71965d',
  'contact-info': '1578f9b5-fb43-4772-83df-79c51c120a92',
  'how-many': '07a77a4d-07ad-4c8a-aef1-c1c2ea8499a8',
  'how-long': '1c6864a5-cfc7-44e5-82cc-652b429fe816',
  budget: 'b51dfb72-7574-4d3f-843a-e3ea1a183e8f',
  'when-needed': 'c5e99e29-8968-4ad8-98c5-496218322b0d',
  technology: '023ae2ad-cebc-4535-bb86-5807a578ffc6',
  'final-details': '2d69a43b-9e1f-405d-b5f6-11e8063d7ba5',
  thanks: null,
}

// Copy captured from https://www.cloudemployee.io/start-hiring/<slug>, 2026-07-13.
const CONTENT: Record<string, { heading: string; lead: string | null; metaTitle: string; metaDescription: string }> = {
  'get-started': {
    heading: "Let's Find Your Developer",
    lead: null,
    metaTitle: 'Get Started - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  'contact-info': {
    heading: 'Contact Information',
    lead: null,
    metaTitle: 'Contact Info - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  'how-many': {
    heading: 'How many tech professionals do you need?',
    lead: null,
    metaTitle: 'How Many - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  'how-long': {
    heading: 'How long do you require your Cloud Employee tech team for?',
    lead: null,
    metaTitle: 'How Long - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  budget: {
    heading: 'Do you have a set monthly budget?',
    lead: null,
    metaTitle: 'Budget - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  'when-needed': {
    heading: 'When is your talent’s ideal start date?',
    lead: null,
    metaTitle: 'When Needed - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  technology: {
    heading: 'What technology expertise do you need?',
    lead: null,
    metaTitle: 'Technology - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  'final-details': {
    heading: 'Thank you, a senior technology specialist will contact you soon.',
    lead: 'If you have time, could you please answer two more questions?',
    metaTitle: 'Final Details - Start Hiring with Cloud Employee',
    metaDescription: 'Contact us and start building your tech team today.',
  },
  thanks: {
    heading: 'Thanks! We’re looking forward to speaking soon.',
    lead: 'Tell us what you need. We’ll have two vetted candidates in front of you within 7 working days - no job boards, no CVs, no time wasted on your end.',
    metaTitle: "We'll Be In Touch - Start Hiring with Cloud Employee",
    metaDescription: 'Contact us and start building your tech team today.',
  },
}

async function main(): Promise<void> {
  const forms = await fetchHubSpotForms()

  // Walk from the UK's entry point: it is the longer funnel, and the US one is
  // that chain minus its UK-only first step.
  const steps = orderFunnelSteps(forms, FORM_ID_BY_SLUG, {
    startSlug: 'get-started',
    pathPrefix: '/start-hiring',
  })

  console.log('Funnel order, derived from HubSpot redirects:\n')
  for (const step of steps) {
    const form = forms.find((f) => f.id === step.formId)
    console.log(
      `  ${step.order}. /start-hiring/${step.slug.padEnd(14)} ` +
        `${step.nextSlug ? `-> ${step.nextSlug}` : '(end)'}` +
        `${form ? `   [${form.name}]` : ''}`,
    )
  }

  const tx = sanityWriteClient.transaction()
  for (const step of steps) {
    const content = CONTENT[step.slug]
    if (!content) throw new Error(`No copy captured for /start-hiring/${step.slug}`)

    tx.createOrReplace({
      _id: `startHiringStep-${step.slug}`,
      _type: 'startHiringStep',
      heading: content.heading,
      slug: { _type: 'slug', current: step.slug },
      order: step.order,
      lead: content.lead,
      hubspotFormId: step.formId,
      ukOnly: UK_ONLY.has(step.slug),
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
    })
  }
  await tx.commit()

  await recordMigration({
    collectionSlug: 'start-hiring-funnel',
    sourceItemCount: steps.length,
    migratedItemCount: steps.length,
    status: 'complete',
    errorLog: [],
  })

  console.log(`\nSeeded ${steps.length} steps.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
