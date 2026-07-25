// Read HubSpot's own form config.
//
// HubSpot is the authority on two things we cannot know any other way:
//
//   1. Whether a form id is real. A wrong id renders nothing — no error, no empty
//      box, no console warning — and every submission to it is lost silently. It
//      cannot be caught by a typecheck, a build, or the parity gate, because the
//      page 200s either way.
//
//   2. What order a multi-step funnel runs in. Each form carries its own
//      post-submit redirect, so the chain of redirects IS the order. Do not infer
//      it from anything else. HubSpot's form NAMES are stale ("Start Hiring (Part
//      5/8)" sits on what is now step 4, because a step was removed and the names
//      were never renumbered), and reading the order off the page layout produced
//      a progress bar that told visitors they were on step 2 when they were on
//      step 4.
import { env } from '@/lib/env'

const API = 'https://api.hubapi.com/marketing/v3/forms'

export type HubSpotForm = {
  id: string
  name: string
  /** Absolute URL the visitor is sent to after submitting, if the form redirects. */
  redirectTo: string | null
}

type RawForm = {
  id: string
  name: string
  configuration?: { postSubmitAction?: { type?: string; value?: string } }
}

export async function fetchHubSpotForms(): Promise<HubSpotForm[]> {
  if (!env.HUBSPOT_ACCESS_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN not configured — set in .env (needs the `forms` scope)')
  }

  const forms: HubSpotForm[] = []
  let after: string | undefined

  for (;;) {
    const url = new URL(API)
    url.searchParams.set('limit', '100')
    if (after) url.searchParams.set('after', after)

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}` },
    })
    if (!res.ok) throw new Error(`HubSpot forms API ${res.status}: ${await res.text()}`)

    const data = (await res.json()) as {
      results: RawForm[]
      paging?: { next?: { after?: string } }
    }

    for (const raw of data.results) {
      const action = raw.configuration?.postSubmitAction
      forms.push({
        id: raw.id,
        name: raw.name,
        redirectTo: action?.type === 'redirect_url' && action.value ? action.value : null,
      })
    }

    after = data.paging?.next?.after
    if (!after) break
  }

  return forms
}

export type FunnelStep = {
  slug: string
  order: number
  formId: string | null
  nextSlug: string | null
}

/**
 * Order a funnel by walking its HubSpot redirect chain.
 *
 * `formIdBySlug` says which form sits on which page — that is read off the live
 * pages, not guessed. HubSpot then says where each form sends you next. Following
 * that from `startSlug` gives the order a visitor actually experiences.
 *
 * Throws on a cycle or an unreachable page rather than returning a plausible-
 * looking wrong order: a funnel whose progress bar lies is worse than one that
 * fails to build.
 */
export function orderFunnelSteps(
  forms: HubSpotForm[],
  formIdBySlug: Record<string, string | null>,
  opts: { startSlug: string; pathPrefix: string },
): FunnelStep[] {
  const byId = new Map(forms.map((f) => [f.id, f]))

  const nextSlugOf = (formId: string | null): string | null => {
    if (!formId) return null
    const form = byId.get(formId)
    if (!form) throw new Error(`Form ${formId} is not in the HubSpot account.`)
    if (!form.redirectTo) return null
    try {
      const path = new URL(form.redirectTo).pathname.replace(/\/$/, '')
      if (!path.startsWith(`${opts.pathPrefix}/`)) return null
      return path.slice(opts.pathPrefix.length + 1)
    } catch {
      return null
    }
  }

  const steps: FunnelStep[] = []
  const seen = new Set<string>()
  let slug: string | null = opts.startSlug

  while (slug) {
    if (seen.has(slug)) throw new Error(`Funnel loops back to /${slug}. Check the HubSpot redirects.`)
    seen.add(slug)

    if (!(slug in formIdBySlug)) {
      throw new Error(
        `HubSpot redirects to /${opts.pathPrefix}/${slug}, but that page is not in the funnel. ` +
          `Either the page is missing or a HubSpot redirect points somewhere unexpected.`,
      )
    }

    const formId = formIdBySlug[slug]
    const nextSlug = nextSlugOf(formId)
    steps.push({ slug, order: steps.length + 1, formId, nextSlug })
    slug = nextSlug
  }

  const unreached = Object.keys(formIdBySlug).filter((s) => !seen.has(s))
  if (unreached.length > 0) {
    throw new Error(
      `These funnel pages are unreachable by following the HubSpot redirects: ${unreached.join(', ')}. ` +
        `A visitor can never get to them.`,
    )
  }

  return steps
}
