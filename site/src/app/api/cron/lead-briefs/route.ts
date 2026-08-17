import { NextResponse } from 'next/server'

import { buildBrief, briefFallback, companyFrom, domainOf, type Lead } from '@/lib/leads/brief'
import { enrich } from '@/lib/leads/sales-brain'
import { postLead } from '@/lib/leads/slack'

// The Lead Agent watcher.
//
// WHY THIS EXISTS RATHER THAN NOTIFYING FROM THE ROUTES. Leads arrive five ways
// and our server only sees two of them: the quick hiring form and the pricing
// unlock post to us, while the contact form is a HubSpot-rendered embed, Calendly
// bookings happen entirely on Calendly, and Clara talks to HubSpot directly.
// HubSpot is the only place all five land, so it is the only vantage point from
// which "tell me about every new lead" is answerable.
//
// THE SEVEN MINUTE WINDOW. A lead who fills the hiring form and then books a call
// four minutes later is one person having one thought, and announcing that twice
// teaches people to skim the channel. So a lead is not announced the moment it
// arrives: it is announced seven minutes later, together with everything else
// that person did in the meantime. The escalation becomes the headline rather
// than two disconnected pings. HubSpot structurally cannot do this - its
// workflows fire per event and have no memory of what else the person did.
//
// Seven is Jake's number (17 Aug). It is long enough to catch form-then-book,
// which is the journey worth catching, and short enough that a hot lead is not
// sitting unattended. It is the one number here worth tuning against real data.
//
// IDEMPOTENCY WITHOUT A DATASTORE. Each run claims a one-minute slice of history:
// contacts created between WINDOW and WINDOW+SLICE minutes ago. Because the
// slices are adjacent and non-overlapping, every contact falls in exactly one of
// them, so nobody is announced twice and no state has to be stored anywhere.
//
// The trade-off is honest and worth writing down: if a run is skipped - a deploy
// mid-minute, a cold start over the limit, Vercel dropping a tick - that slice is
// never revisited and those leads are never announced. The alternative is a
// cursor in a datastore, which is more correct and more machinery. Starting
// simple deliberately; if a lead is ever found missing from the channel, this
// comment is the first place to look, and SLICE_MINUTES is the dial.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** How long to wait before announcing, so a journey can complete. */
const WINDOW_MINUTES = 7
/** Width of the slice each run claims. Must be >= the cron interval. */
const SLICE_MINUTES = 1

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? '22809822'

/** Vendor pitches dressed as enquiries. Deliberately narrow - see the note below. */
const VENDOR_PATTERNS =
  /\b(link ?building|guest post|backlink|seo (services|agency|audit)|we (provide|offer) (dedicated|outsourc)|joint venture|our (bpo|agency|team) (can|could))\b/i

interface HsContact {
  id: string
  properties: Record<string, string | null>
}

async function hs(path: string, init?: RequestInit): Promise<unknown | null> {
  if (!HUBSPOT_TOKEN) return null
  try {
    const res = await fetch(`https://api.hubapi.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
    if (!res.ok) {
      console.warn(`[lead-briefs] HubSpot ${path} -> ${res.status}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn(`[lead-briefs] HubSpot ${path} -> ${err instanceof Error ? err.message : 'failed'}`)
    return null
  }
}

/** Contacts created in this run's slice. */
async function contactsInSlice(): Promise<HsContact[]> {
  const now = Date.now()
  const to = new Date(now - WINDOW_MINUTES * 60_000).toISOString()
  const from = new Date(now - (WINDOW_MINUTES + SLICE_MINUTES) * 60_000).toISOString()

  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: 'createdate', operator: 'GTE', value: from },
          { propertyName: 'createdate', operator: 'LT', value: to },
        ],
      },
    ],
    properties: [
      'email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle',
      'mql_tier', 'lifecyclestage', 'createdate', 'ip_country',
      'hs_analytics_source', 'hs_analytics_first_url', 'message',
    ],
    sorts: [{ propertyName: 'createdate', direction: 'ASCENDING' }],
    limit: 50,
  }
  const json = (await hs('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify(body),
  })) as { results?: HsContact[] } | null
  return json?.results ?? []
}

/**
 * Which form did they come through?
 *
 * Read from the submissions API rather than inferred from contact properties,
 * because the properties do not record it and guessing would be wrong often
 * enough to matter - a pricing unlock and a hiring enquiry look identical on the
 * contact record. Each live form is checked for a submission from this email.
 */
const LIVE_FORMS: Array<{ id: string; label: string; intent: string }> = [
  { id: '8f974ef4-a3dd-4bba-ad3a-086054ac235b', label: 'Quick hiring form', intent: 'Wants to hire engineers' },
  { id: 'a7a5be39-7014-4ed7-a4b2-75ee5adebd37', label: 'Pricing calculator', intent: 'Unlocked the pricing calculator' },
  { id: '4b883c7d-72c1-4f9c-8196-de68fce303d6', label: 'Contact form', intent: 'Sent a message via the contact form' },
]

async function formUsed(email: string): Promise<{ label: string; intent: string } | null> {
  for (const f of LIVE_FORMS) {
    const json = (await hs(`/form-integrations/v1/submissions/forms/${f.id}?limit=20`)) as
      | { results?: Array<{ values?: Array<{ name: string; value: string }> }> }
      | null
    const hit = (json?.results ?? []).some((s) =>
      (s.values ?? []).some((v) => v.name === 'email' && v.value?.toLowerCase() === email.toLowerCase()),
    )
    if (hit) return { label: f.label, intent: f.intent }
  }
  return null
}

/** Did they book a meeting in the window? That is the escalation worth reporting. */
async function bookedMeeting(contactId: string): Promise<boolean> {
  const json = (await hs(`/crm/v4/objects/contacts/${contactId}/associations/meetings`)) as
    | { results?: unknown[] }
    | null
  return (json?.results?.length ?? 0) > 0
}

function isVendorPitch(c: HsContact): boolean {
  const text = [c.properties.message, c.properties.company, c.properties.jobtitle]
    .filter(Boolean)
    .join(' ')
  return VENDOR_PATTERNS.test(text)
}

/**
 * What they asked for, in as close to their own words as HubSpot holds.
 * Never invented: if there is nothing to say, say that rather than guess.
 */
function inquiryOf(
  c: HsContact,
  booked: boolean,
  form: { label: string; intent: string } | null,
): string {
  const p = c.properties
  const parts: string[] = []
  // Their own words first, when there are any. The form intent is a fallback,
  // not a replacement - what someone typed always beats what we inferred.
  if (p.message) parts.push(p.message.replace(/\s+/g, ' ').slice(0, 160))
  else if (form) parts.push(form.intent)
  // The escalation IS the headline: filling a form and then booking within the
  // window is the strongest buying signal the site produces.
  if (booked) parts.push(parts.length ? 'then booked a call' : 'Booked a call')
  return parts.length ? parts.join(', ') : 'New enquiry via the website'
}

export async function GET(request: Request): Promise<NextResponse> {
  // Vercel signs its cron calls. Anything else is refused: this endpoint reads
  // the CRM and writes to a Slack channel, so it is not one to leave open.
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const contacts = await contactsInSlice()
  if (contacts.length === 0) return NextResponse.json({ ok: true, announced: 0 })

  let announced = 0
  for (const c of contacts) {
    const p = c.properties
    const email = p.email
    if (!email) continue

    const booked = await bookedMeeting(c.id)
    const form = await formUsed(email)
    const junk = isVendorPitch(c)
    const company = companyFrom(email)

    // Enrichment is skipped for junk: no reason to spend a sales-brain call, or
    // your API credits, on somebody trying to sell you something.
    const enrichment = junk
      ? { score: null, verdict: null, summary: null, profileUrl: null }
      : await enrich({
          email,
          name: [p.firstname, p.lastname].filter(Boolean).join(' ') || null,
          companyDomain: company.url ? domainOf(email) : null,
          hubspotId: c.id,
        })

    const lead: Lead = {
      name: [p.firstname, p.lastname].filter(Boolean).join(' ') || null,
      email,
      phone: p.phone,
      inquiry: inquiryOf(c, booked, form),
      source: [form?.label, p.hs_analytics_source].filter(Boolean).join('  ·  ') || 'Website',
      location: p.ip_country,
      hubspotId: c.id,
    }

    const posted = await postLead(
      buildBrief(lead, enrichment),
      briefFallback(lead),
      junk ? 'junk' : 'leads',
    )
    if (posted.ok) announced += 1
  }

  console.log(`[lead-briefs] slice announced ${announced}/${contacts.length} (portal ${PORTAL_ID})`)
  return NextResponse.json({ ok: true, announced, seen: contacts.length })
}
