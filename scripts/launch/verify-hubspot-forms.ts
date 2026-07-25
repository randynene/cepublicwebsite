// Every HubSpot form id the site uses, checked against HubSpot.
//
// A wrong HubSpot form id is the quietest failure on the site. The page renders,
// the layout is right, nothing 404s, no error appears anywhere — the form simply
// is not there, and every enquiry submitted to it is lost. You find out weeks
// later, from an absence of leads. A typecheck cannot catch it, a build cannot
// catch it, and the parity gate cannot catch it, because the page 200s either way.
// It needs its own check.
//
// Three real failures this found:
//
//   1. NEXT_PUBLIC_HUBSPOT_PORTAL_ID was never set for the Next.js app. The portal
//      id sat in the root .env and was never exposed to site/. Without it
//      HubSpotFormEmbed cannot call hbspt.forms.create at all, so EVERY form on
//      the site was dead — the footer newsletter and all seven funnel steps.
//
//   2. The footer newsletter's id was not a HubSpot form id. The live Webflow site
//      posts that form through hubspotonwebflow.com, a third-party bridge, and the
//      GUID belonged to the bridge. HubSpot 404'd it. Fixed to the real form.
//
//   3. The funnel's step ORDER was wrong. It was inferred from the page list and
//      hardcoded; HubSpot's redirects say otherwise. The progress bar told
//      visitors they were on step 2 when they were on step 4.
//
// Run: npm run launch:verify-hubspot-forms
import { readFileSync } from 'node:fs'

import { ensureSanity } from '@/lib/env'
import { fetchHubSpotForms, orderFunnelSteps } from '@/lib/content/hubspot-forms'
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

ensureSanity()

const PORTAL_ID = '22809822'

async function resolvesOnHubSpot(id: string): Promise<boolean> {
  const res = await fetch(`https://forms.hsforms.com/embed/v3/form/${PORTAL_ID}/${id}/json`)
  return res.status === 200
}

// The portal id being in the root .env is not enough — the BROWSER needs it, so it
// has to be NEXT_PUBLIC_* and present in site/.env.local (and in Vercel).
function portalIdIsExposedToTheApp(): boolean {
  try {
    return readFileSync('site/.env.local', 'utf-8').includes('NEXT_PUBLIC_HUBSPOT_PORTAL_ID')
  } catch {
    return false
  }
}

type Used = { id: string; where: string }

// Every form id the site actually renders, read from where it is rendered from
// rather than from a list someone maintains by hand.
async function collectUsedForms(): Promise<Used[]> {
  const used: Used[] = []

  const steps = await sanityWriteClient.fetch<Array<{ slug: string; formId: string | null }>>(
    `*[_type == "startHiringStep" && defined(hubspotFormId)] | order(order asc){
       "slug": slug.current, "formId": hubspotFormId
     }`,
  )
  for (const step of steps) {
    if (step.formId) used.push({ id: step.formId, where: `/start-hiring/${step.slug}` })
  }

  const newsletter = await sanityWriteClient.fetch<string | null>(
    `*[_type == "footer"][0].subscribe.formId`,
  )
  if (newsletter) used.push({ id: newsletter, where: 'footer newsletter' })

  return used
}

async function main(): Promise<void> {
  if (!portalIdIsExposedToTheApp()) {
    console.error('NEXT_PUBLIC_HUBSPOT_PORTAL_ID is not set in site/.env.local.')
    console.error('Without it hbspt.forms.create is never called, and EVERY form on the')
    console.error('site silently renders nothing. It must also be set in Vercel.')
    process.exit(1)
  }
  console.log('NEXT_PUBLIC_HUBSPOT_PORTAL_ID is exposed to the app.\n')

  const forms = await fetchHubSpotForms()
  const byId = new Map(forms.map((f) => [f.id, f]))
  const used = await collectUsedForms()

  let failed = 0
  console.log(`${used.length} form(s) in use:\n`)
  for (const form of used) {
    const ok = await resolvesOnHubSpot(form.id)
    if (!ok) failed++
    const name = byId.get(form.id)?.name ?? '(not in this HubSpot account)'
    console.log(`  ${ok ? 'OK  ' : 'DEAD'}  ${form.where.padEnd(28)} ${name}`)
  }

  // The funnel order must match HubSpot's redirect chain. If someone reorders the
  // funnel in HubSpot and not in Sanity, the progress bar lies and the steps run
  // out of sequence — with nothing else to notice it.
  const sanitySteps = await sanityWriteClient.fetch<
    Array<{ slug: string; order: number; formId: string | null; ukOnly: boolean | null }>
  >(
    `*[_type == "startHiringStep"] | order(order asc){
       "slug": slug.current, order, "formId": hubspotFormId, ukOnly
     }`,
  )
  const formIdBySlug = Object.fromEntries(sanitySteps.map((s) => [s.slug, s.formId]))

  // Walk from get-started: it is the UK funnel's first step, and the US funnel is
  // the same chain minus that page. Starting from contact-info would report
  // get-started as unreachable, which it is — in the US locale only.
  const expected = orderFunnelSteps(forms, formIdBySlug, {
    startSlug: 'get-started',
    pathPrefix: '/start-hiring',
  })

  const drift = expected.filter((e, i) => sanitySteps[i]?.slug !== e.slug)
  const ukCount = sanitySteps.length
  const usCount = sanitySteps.filter((s) => s.ukOnly !== true).length

  console.log('\nFunnel order vs HubSpot redirects:')
  if (drift.length === 0) {
    console.log(`  OK    ${expected.map((e) => e.slug).join(' -> ')}`)
    console.log(`        UK ${ukCount} steps, US ${usCount} (get-started is UK-only)`)
  } else {
    failed++
    console.log(`  DRIFT sanity:  ${sanitySteps.map((s) => s.slug).join(' -> ')}`)
    console.log(`        hubspot: ${expected.map((e) => e.slug).join(' -> ')}`)
    console.log('        Re-run npm run content:seed-start-hiring.')
  }

  if (failed > 0) {
    console.error('\nA dead form id loses every enquiry submitted to it, silently.')
    process.exit(1)
  }
  console.log('\nAll forms resolve and the funnel order matches HubSpot.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
