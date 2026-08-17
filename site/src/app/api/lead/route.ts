// One endpoint for every lead the site captures.
//
// WHY ONE. The site has three front doors (the quick hiring form, the contact
// form, and Ask Clara later) and every one of them wants the same three things to
// happen: write to HubSpot, tell the team, and drop the junk. Building that three
// times means three places to get the spam rules wrong and three places to forget
// a field. So the doors differ, the pipe does not.
//
// WHAT THIS IS NOT. It is NOT the primary Slack notification. HubSpot already has
// 14 enabled workflows posting into Slack, including the ones that announce
// bookings and MQLs (see docs/hubspot-slack-notifications.md). Duplicating those
// would put every lead in the channel twice, and a channel that repeats itself is
// one people stop reading. The Slack post here is the SAFETY NET: if HubSpot
// rejects a submission, HubSpot cannot tell you it rejected it, and this can.
//
// THE ORDER OF FAILURE MATTERS. If HubSpot is down or rejects the payload, the
// visitor still continues to the booking step. Losing the CRM record is bad;
// blocking a buyer from booking a call because of our plumbing is worse, and the
// Slack safety net means the lead is still visible to a human either way.
//
// SPAM. CE's leads channel takes guest-post pitches, backlink offers and agencies
// selling their services. Those are filtered here and routed to a separate webhook
// if one is configured. The filter is deliberately biased toward letting junk
// through rather than hiding a real lead: a pitch in the leads channel is
// annoying, a buyer routed into a channel nobody reads is a lost deal.

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '@/lib/env'

export const runtime = 'nodejs'

/** Created by scripts/hubspot/create-quick-hiring-form.ts. */
const QUICK_HIRING_FORM_GUID =
  process.env.HUBSPOT_QUICK_HIRING_FORM_GUID ?? '8f974ef4-a3dd-4bba-ad3a-086054ac235b'

const SLACK_LEADS_WEBHOOK_URL = process.env.SLACK_LEADS_WEBHOOK_URL
/** Optional. Without it, suspected junk is recorded in HubSpot and not announced. */
const SLACK_JUNK_WEBHOOK_URL = process.env.SLACK_JUNK_WEBHOOK_URL

/**
 * Phrases seen in real junk on this portal, plus the standard outreach openers.
 * Kept short on purpose. Every addition risks a false positive, and a false
 * positive here is a lost customer, so this list grows from observed junk only.
 */
const JUNK_PATTERNS = [
  /guest post/i,
  /back ?link/i,
  /link (exchange|building|insertion)/i,
  /do ?follow/i,
  /write for us/i,
  /sponsored (post|article|content)/i,
  /partnership proposal/i,
  /seo (services|agency|expert|audit)/i,
  /rank (your|higher)/i,
  /increase your (traffic|visibility|sales)/i,
  /(web|website) design services/i,
  /app development services/i,
  /bulk email/i,
  /it equipment/i,
  /rental services/i,
  /lead generation services/i,
]

const schema = z.object({
  gateway: z.enum(['quick_hiring_form', 'contact_form', 'ask_clara']),
  sourcePage: z.string().max(500),
  role: z.string().max(80).optional(),
  skills: z.array(z.string().max(60)).max(20).default([]),
  /** Anything the visitor typed that the taxonomy did not know. */
  customSkills: z.array(z.string().max(60)).max(20).default([]),
  engagementLength: z.string().max(40).optional(),
  commitment: z.string().max(40).optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  message: z.string().max(4000).optional(),
  /** HubSpot's own tracking cookie. Without it every lead looks brand new. */
  hutk: z.string().max(200).optional(),
})

type Lead = z.infer<typeof schema>

function looksLikeJunk(lead: Lead): string | null {
  const haystack = [lead.message, lead.company, lead.skills.join(' '), lead.customSkills.join(' ')]
    .filter(Boolean)
    .join(' \n ')
  const hit = JUNK_PATTERNS.find((re) => re.test(haystack))
  return hit ? hit.source : null
}

/** HubSpot's public submission endpoint. No token: the form GUID is the contract. */
async function submitToHubSpot(lead: Lead): Promise<{ ok: boolean; detail: string }> {
  const portalId = env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID
  if (!portalId) return { ok: false, detail: 'NEXT_PUBLIC_HUBSPOT_PORTAL_ID is not set' }

  const fields: Array<{ name: string; value: string }> = [
    { name: 'firstname', value: lead.firstName },
    { name: 'email', value: lead.email },
    { name: 'ce_lead_gateway', value: lead.gateway },
    { name: 'ce_source_page', value: lead.sourcePage },
  ]
  const optional: Array<[string, string | undefined]> = [
    ['lastname', lead.lastName],
    ['phone', lead.phone],
    ['company', lead.company],
    ['ce_skills_requested', [...lead.skills, ...lead.customSkills].join(', ') || undefined],
    ['ce_engagement_length', lead.engagementLength],
    ['ce_commitment', lead.commitment],
  ]
  for (const [name, value] of optional) {
    if (value && value.length > 0) fields.push({ name, value })
  }

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${QUICK_HIRING_FORM_GUID}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: lead.sourcePage,
          pageName: lead.sourcePage,
          ...(lead.hutk ? { hutk: lead.hutk } : {}),
        },
      }),
    },
  )
  return { ok: res.ok, detail: res.ok ? 'submitted' : `${res.status} ${(await res.text()).slice(0, 300)}` }
}

function slackText(lead: Lead, note: string): string {
  const lines = [
    note,
    '',
    `*Name* ${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ''}`,
    `*Email* ${lead.email}`,
  ]
  if (lead.company) lines.push(`*Company* ${lead.company}`)
  if (lead.phone) lines.push(`*Phone* ${lead.phone}`)
  if (lead.role) lines.push(`*Looking for* ${lead.role}`)
  const skills = [...lead.skills, ...lead.customSkills]
  if (skills.length > 0) lines.push(`*Stack* ${skills.join(', ')}`)
  if (lead.engagementLength) lines.push(`*Length* ${lead.engagementLength}`)
  if (lead.commitment) lines.push(`*Commitment* ${lead.commitment}`)
  if (lead.message) lines.push('', `> ${lead.message.slice(0, 800)}`)
  lines.push('', `_${lead.gateway} from ${lead.sourcePage}_`)
  return lines.join('\n')
}

async function postToSlack(url: string | undefined, text: string): Promise<boolean> {
  if (!url) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    return res.ok
  } catch {
    // A Slack outage must never fail a lead. It is the backup, not the record.
    return false
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let parsed: Lead
  try {
    parsed = schema.parse(await request.json())
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof z.ZodError ? err.issues : 'Invalid request' },
      { status: 400 },
    )
  }

  const junkReason = looksLikeJunk(parsed)

  // HubSpot gets it either way. A misjudged spam call must not destroy the record,
  // because the only way to discover the filter was wrong is to still have the lead.
  const hubspot = await submitToHubSpot(parsed)

  // ---- Lead Agent brief -------------------------------------------------
  // The consolidated notification a human actually reads. Kept separate from
  // the webhook alarms below, which are failure alerts and stay as they are.
  //
  // This is the fix for the gap that made every earlier Slack module dead code:
  // the routes only ever spoke to Slack when HubSpot REJECTED a submission, on
  // the assumption a HubSpot workflow announced the happy path. For form
  // 8f974ef4 nothing does, so a successful lead was announced to nobody.
  //
  // Deliberately NOT awaited into the response path beyond this point, and every
  // failure inside is swallowed: the visitor is mid-funnel and heading for the
  // booking step, and a Slack outage must never cost us the redirect.
  // Route-level briefs are OFF by default, and this flag is the whole reason.
  //
  // Two things can announce a lead: this route, instantly, and the watcher cron
  // seven minutes later. Running both means every lead is announced twice AND
  // the instant one fires before the journey has finished, so it says "empty
  // record" about somebody who is at that moment typing their way into a
  // booking. The seven-minute wait is the entire point of the design; announcing
  // at zero minutes defeats it.
  //
  // Kept rather than deleted because instant notification is genuinely better IF
  // the watcher ever proves too slow for hot leads - at which point this becomes
  // the fast path and the watcher needs a dedup guard. Until then: off.
  if (process.env.LEAD_BRIEF_FROM_ROUTES === '1') {
    try {
      const [{ buildBrief, briefFallback }, { postLead }, { enrich }] = await Promise.all([
        import('@/lib/leads/brief'),
        import('@/lib/leads/slack'),
        import('@/lib/leads/sales-brain'),
      ])
      const name = [parsed.firstName, parsed.lastName].filter(Boolean).join(' ')
      const wanted = [...parsed.skills, ...parsed.customSkills].join(', ')
      const lead = {
        name,
        email: parsed.email,
        phone: parsed.phone ?? null,
        inquiry: wanted
          ? `Wants ${wanted}${parsed.commitment ? `, ${parsed.commitment.replace(/_/g, ' ')}` : ''}`
          : 'Enquiry via the hiring form',
        source: `Quick hiring form  ·  ${parsed.sourcePage}`,
        // Vercel resolves this at the edge on every request. HubSpot's own
        // ip_country was populated on 1 of the 12 most recent contacts, so this
        // header is the more reliable source by a wide margin.
        location: request.headers.get('x-vercel-ip-country'),
        hubspotId: null,
      }
      const enrichment = junkReason
        ? { score: null, verdict: null, summary: null, profileUrl: null }
        : await enrich({ email: parsed.email, name, companyDomain: parsed.company ?? null })
      await postLead(
        buildBrief(lead, enrichment),
        briefFallback(lead),
        junkReason ? 'junk' : 'leads',
      )
    } catch (err) {
      console.warn(`[lead] brief failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  if (junkReason) {
    await postToSlack(
      SLACK_JUNK_WEBHOOK_URL,
      slackText(parsed, `:wastebasket: Filtered as junk (matched \`${junkReason}\`)`),
    )
  } else if (!hubspot.ok) {
    // The one case the safety net exists for: HubSpot did not take it, so HubSpot's
    // own workflows will never announce it, and without this nobody would know.
    await postToSlack(
      SLACK_LEADS_WEBHOOK_URL,
      slackText(parsed, `:rotating_light: *Lead did NOT reach HubSpot* (${hubspot.detail})`),
    )
  }

  if (parsed.customSkills.length > 0) {
    // Demand for something CE has no page for. Logged rather than dropped so the
    // taxonomy and the service catalogue can grow from what buyers actually ask.
    console.log(`[lead] skills not in taxonomy: ${parsed.customSkills.join(', ')}`)
  }

  if (!hubspot.ok) console.error(`[lead] HubSpot submission failed: ${hubspot.detail}`)

  // Always 200 to the visitor. They continue to the booking step regardless: our
  // CRM problem is not their problem, and the Slack alert above means a human sees
  // the lead even when the write failed.
  return NextResponse.json({ ok: true, recorded: hubspot.ok, filtered: Boolean(junkReason) })
}
