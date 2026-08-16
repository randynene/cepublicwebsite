// The /pricing calculator email gate.
//
// WHY A SEPARATE ROUTE. /api/lead is the three-front-door pipe: it requires a
// first name, runs the junk filter over a message/company/skills payload, and
// carries a `gateway` enum the CRM segments on. This capture has none of that -
// it is an email and a currency - so bending the lead schema around it would
// mean loosening a required field for every other door. Same destination, same
// failure posture, different front.
//
// FAILURE POSTURE (inherited from /api/lead). Always 200 to the visitor once the
// body parses. They are mid-task and the calculator unlocks regardless; the
// client does not even read this response. If HubSpot rejects the write, the
// Slack safety net tells a human, because HubSpot cannot report its own refusal.
//
// NO JUNK FILTER. There is nothing to filter on: the only free-text field is the
// email address, and the patterns in /api/lead all match message/company prose.
// A domain blocklist was considered and rejected - people evaluating vendors use
// personal addresses, and a false positive here silently loses a real buyer.

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '@/lib/env'
import { notifySlack } from '@/lib/leads/notify'

export const runtime = 'nodejs'

/** Reuses the quick-hiring form. The gateway field is what segments this. */
const QUICK_HIRING_FORM_GUID =
  process.env.HUBSPOT_QUICK_HIRING_FORM_GUID ?? '8f974ef4-a3dd-4bba-ad3a-086054ac235b'

const schema = z.object({
  email: z.string().email().max(160),
  /** Currency id from the calculator model (gbp | usd | eur today). */
  currency: z.string().max(20).optional(),
  /** Pathname the gate was unlocked from - /pricing or /uk/pricing. */
  path: z.string().max(500).optional(),
})

type Unlock = z.infer<typeof schema>

async function submitToHubSpot(unlock: Unlock): Promise<{ ok: boolean; detail: string }> {
  const portalId = env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
  if (!portalId) return { ok: false, detail: 'NEXT_PUBLIC_HUBSPOT_PORTAL_ID is not set' }

  const fields = [
    { name: 'email', value: unlock.email },
    { name: 'ce_lead_gateway', value: 'pricing_unlock' },
    { name: 'ce_source_page', value: unlock.path ?? '/pricing' },
  ]

  try {
    const res = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${QUICK_HIRING_FORM_GUID}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          context: { pageUri: unlock.path ?? '/pricing', pageName: 'Pricing calculator unlock' },
        }),
      },
    )
    return { ok: res.ok, detail: res.ok ? 'submitted' : `${res.status} ${(await res.text()).slice(0, 300)}` }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : 'fetch failed' }
  }
}

// Transport lives in @/lib/leads/notify, shared with /api/lead.

export async function POST(request: Request): Promise<NextResponse> {
  let parsed: Unlock
  try {
    parsed = schema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof z.ZodError ? err.issues : 'Invalid request' },
      { status: 400 },
    )
  }

  const hubspot = await submitToHubSpot(parsed)

  if (!hubspot.ok) console.error(`[pricing-unlock] HubSpot submission failed: ${hubspot.detail}`)

  // Announced whether or not HubSpot took it. This form submits to 8f974ef4,
  // which no HubSpot workflow watches, so a successful unlock previously told
  // nobody. Somebody handing over a work email to see prices is a buying
  // signal, and it was going straight into a contact record unseen.
  const outcome = await notifySlack(
    [
      hubspot.ok
        ? ':unlock: *Pricing calculator unlocked*'
        : `:rotating_light: *Pricing calculator unlock - DID NOT REACH HUBSPOT* (${hubspot.detail})`,
      '',
      `*Email* ${parsed.email}`,
      `*Currency* ${parsed.currency ?? 'unset'}`,
      '',
      `_pricing_unlock from ${parsed.path ?? '/pricing'}_`,
    ].join('\n'),
  )
  if (outcome !== 'sent') {
    console.error(`[pricing-unlock] Slack notification ${outcome} for ${parsed.email}`)
  }

  // Which currency a visitor picks is which market is actually pricing us. That
  // is worth knowing even when the CRM write succeeded, so it is logged either way.
  console.log(`[pricing-unlock] currency=${parsed.currency ?? 'unset'} path=${parsed.path ?? '/pricing'}`)

  return NextResponse.json({ ok: true, recorded: hubspot.ok })
}
