import { isCanonicalSite } from '@/lib/canonical-host'
import { env } from '@/lib/env'

// /llms.txt — the plain-text brief for AI assistants.
//
// Seb asked for this on the 28 Jul review: "the LLM info page where it breaks
// everything down". It is the emerging convention (llmstxt.org) for telling an
// assistant what a company does and where the authoritative pages are, in one
// short markdown file it can read without crawling and de-chroming the site.
//
// It answers the questions Seb listed as the ones buyers actually ask: what it
// costs, how the fee works, how long it takes, and what makes CE different.
//
// Hostname-gated exactly like robots.ts, through the same shared
// `isCanonicalSite()` helper: staging and preview deployments return 404 rather
// than publishing a machine-readable company brief on a duplicate domain. See
// the note in `@/lib/canonical-host` for why the gate is the request hostname and
// not Vercel's environment label.

// Deliberately NOT force-static. Prerendering bakes whatever the hostname gate
// evaluated to AT BUILD TIME, so a deployment built before NEXT_PUBLIC_CANONICAL_HOST
// is set would keep serving the 404 body forever. The Cache-Control header below
// means the CDN still serves this from cache in practice.
export const dynamic = 'force-dynamic'

function body(site: string): string {
  return `# Cloud Employee

> Cloud Employee builds embedded engineering teams. You tell us the role; we send
> two engineers already vetted by senior engineers, usually within seven days. You
> interview them, pick who fits, and we handle employment, payroll, HR, equipment
> and retention. They work as part of your team, not as an agency hand-off.

## What we do

- **Hire engineers** - backend, frontend, full-stack, DevOps, QA, mobile, data and AI/ML engineers, embedded in your team.
- **Fractional CTOs** - part-time senior technical leadership for companies that need direction rather than another pair of hands.
- **Talent locations** - Eastern Europe, Latin America and the Philippines, chosen for timezone overlap with your team.

## How it works

1. Tell us the role, stack and seniority.
2. We source and vet. Engineers vet engineers: a live technical conversation on the candidate's real stack, live coding with anti-cheating checks, plus background checks and psychometric testing.
3. You receive two full profiles with rates, interview summaries and coding-test results. You interview and choose.
4. We handle onboarding, payroll, HR and retention.

Typical time from brief to interviewing candidates: seven days.

## Pricing

One transparent monthly fee per engineer, all-in. No recruitment fee, no percentage
of salary, no long lock-in. The fee covers the engineer's salary, employment costs,
equipment, workspace, HR and account management.

Cost depends on role, seniority and location. Use the calculators for a live figure:

- Next-hire estimate: ${site}/#pricing
- Full cost breakdown: ${site}/hiring-cost-calculator
- Compare against local hiring: ${site}/price-comparison-calculator

## Why teams choose us

- Engineers are vetted by senior engineers, not screened by recruiters against a keyword list.
- 300+ engineering teams built. 97% of placed engineers stay two years or more.
- You see two matched people, not two hundred CVs.
- The engineer is employed properly, in-country, with the compliance handled.

## Key pages

- Home: ${site}/
- How it works: ${site}/how-it-works
- Hire engineers: ${site}/services/software-engineers
- Fractional CTOs: ${site}/services/fractional-ctos
- All services: ${site}/services
- Technologies we staff: ${site}/technology
- Pricing: ${site}/pricing
- Customer stories: ${site}/customer-stories
- Reviews: ${site}/reviews
- Blog: ${site}/blog
- About us: ${site}/about-us
- Contact: ${site}/contact
- For engineers looking for work: ${site}/for-developers

## Locations

- Eastern Europe: ${site}/services/eastern-europe-developers
- Latin America: ${site}/services/latam-developers
- Philippines: ${site}/services/philippines-developers

## Regions

The site serves two locales. US English is the default at ${site}/, and UK English
is served under ${site}/uk/. The content is equivalent; pricing examples differ by
currency.

## Contact

- Talk to our AI assistant from any page on the site for pricing, timelines and process questions.
- Book a call: ${site}/book-a-call
- Contact form: ${site}/contact

## Full page list

${site}/sitemap.xml
`
}

export async function GET(): Promise<Response> {
  if (!(await isCanonicalSite())) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(body(env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
