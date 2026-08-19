import { NextResponse } from 'next/server'

import {
  buildBrief,
  briefFallback,
  companyFrom,
  domainOf,
  isTestLead,
  type Lead,
} from '@/lib/leads/brief'
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

/**
 * People selling TO Cloud Employee, dressed as enquiries.
 *
 * BUILT FROM THE REAL CORPUS, 19 Aug. Every contact-form submission of the last
 * 90 days was read: 24 in total, of which 5 were our own tests and ONE was a
 * genuine buyer. The rest were agency and vendor cold outreach. The old filter
 * caught 1 of 18; this catches 15.
 *
 * The tell is DIRECTION, not vocabulary. These people write "we help
 * businesses", "we built", "I see your company provides" - the grammar of
 * somebody offering a service. A buyer writes about their own problem. No
 * keyword list of "seo" and "backlink" finds them, because the good ones never
 * use those words.
 *
 * DELIBERATELY EXCLUDED: "I'm reaching out". It catches two more, and it would
 * also catch "I'm reaching out because we need three React engineers". Losing
 * one real buyer costs more than reading fifteen pitches.
 *
 * Junk is ROUTED, never dropped: it goes to the junk channel where a human can
 * see it and disagree. That is what makes an aggressive filter safe - a wrong
 * call is visible and recoverable, not silent.
 *
 * Also catches job seekers, who are real people but not sales leads and belong
 * nowhere near this channel.
 */
const VENDOR_PATTERNS =
  /\b(we help (businesses|companies|teams|brands)|we built|we handle|we provide|we offer|partnership proposal|i see (that )?your company|i see [A-Z][a-z]+ is a|are you still (focused|looking)|verified (visitors?|attendee) list|we'?ve (successfully )?compiled|our upcoming (issue|edition|feature|magazine)|founder of [A-Z]|we special[is]?[sz]e|link ?building|guest post|backlink|seo (services|agency|audit)|call cent(re|er) outsourcing|redesign your website|looking for new opportunities|my (cv|resume))\b/i

/**
 * HubSpot's analytics source, in words a salesperson can act on.
 *
 * The raw values are HubSpot's internal enum and they leak badly: a brief that
 * reads "Clara chat  ·  OFFLINE" tells a reader that something is broken. It is
 * not - OFFLINE simply means HubSpot never saw a web session for this contact,
 * which is normal and expected for a chat lead or a Calendly booking, because
 * neither goes through a tracked page view.
 *
 * Unknown values fall through unchanged rather than being hidden, so a new
 * HubSpot enum shows up as itself instead of silently disappearing.
 */
const SOURCE_LABELS: Record<string, string> = {
  ORGANIC_SEARCH: 'Found us on Google',
  PAID_SEARCH: 'Paid search',
  PAID_SOCIAL: 'Paid social',
  SOCIAL_MEDIA: 'Social media',
  DIRECT_TRAFFIC: 'Came direct',
  REFERRALS: 'Referred from another site',
  EMAIL_MARKETING: 'From an email campaign',
  OTHER_CAMPAIGNS: 'Campaign',
  // Not a failure. It means no web session was attributed, which is the normal
  // state for a chat lead or a booking made straight from a Calendly link.
  OFFLINE: 'No web session tracked',
}

function sourceLabel(raw: string | null | undefined): string | null {
  if (!raw) return null
  return SOURCE_LABELS[raw.toUpperCase()] ?? raw
}

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

/**
 * Contacts TOUCHED in this run's slice.
 *
 * Deliberately `lastmodifieddate` rather than `createdate`. Watching creations
 * only announces people HubSpot has never seen, which silently drops the single
 * most valuable case: somebody who spoke to Clara last month, thought about it,
 * and has come back to unlock pricing. They are not a new contact, so a
 * creation-based watcher says nothing about them - and they are further down the
 * funnel than anyone arriving for the first time.
 *
 * The cost is noise: a rep editing a contact by hand also bumps the modified
 * date. That is filtered downstream by requiring a real website interaction - a
 * form submission or a meeting inside the window - before anything is announced.
 */
async function contactsInSlice(): Promise<HsContact[]> {
  const now = Date.now()
  const to = new Date(now - WINDOW_MINUTES * 60_000).toISOString()
  const from = new Date(now - (WINDOW_MINUTES + SLICE_MINUTES) * 60_000).toISOString()

  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: 'lastmodifieddate', operator: 'GTE', value: from },
          { propertyName: 'lastmodifieddate', operator: 'LT', value: to },
        ],
      },
    ],
    properties: [
      'email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle',
      'mql_tier', 'lifecyclestage', 'createdate', 'ip_country',
      'hs_analytics_source', 'hs_analytics_first_url', 'message',
      // Clara leaves no form submission and often no meeting, so without a
      // source signal its leads fail the interaction gate and are never
      // announced. These are the properties that betray a chatbot origin.
      'hs_object_source_label', 'hs_latest_source', 'recent_conversion_event_name',
      // Clara writes these directly onto the contact. clara_chat_summary is the
      // visitor's intent in their own words, which is the single most useful
      // thing on a brief - "needs 2 senior PHP developers for a SQL Server to
      // PostgreSQL migration" beats anything that can be inferred from a form.
      // Note the name: it is clara_chat_summary, NOT clara_chatbot_summary,
      // which is a different property that nothing has ever written to.
      // clara_icp_score / clara_icp_reason are NOT read: confirmed 17 Aug that no
      // code in the Clara repo ever writes them, so they are permanently empty.
      'clara_chat_summary', 'clara_session_url',
      // What they actually told the multi-step form. Without these the brief
      // says "wants to hire engineers" while HubSpot holds "React and Node,
      // full time, 2-5 people, 10k-50k a month, needed immediately" - which is
      // the entire content of the enquiry and the reason a rep opens it.
      'ce_skills_requested', 'ce_engagement_length', 'ce_commitment',
      'how_many_needed_', 'how_long_needed_', 'monthly_budget',
      'when_talent_is_needed', 'technology_expertise_needed',
    ],
    sorts: [{ propertyName: 'lastmodifieddate', direction: 'ASCENDING' }],
    limit: 50,
  }
  const json = (await hs('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify(body),
  })) as { results?: HsContact[] } | null
  return json?.results ?? []
}

/**
 * Recent submissions across every live form, as one email -> form map.
 *
 * Built once per run rather than per contact. The naive version asked "did this
 * email submit this form?" for each contact and each form, which is 3 calls per
 * contact; this is 3 calls total regardless of how many leads are in the slice.
 *
 * It does double duty. It says WHICH form they used - a pricing unlock and a
 * hiring enquiry are indistinguishable on the contact record - and it proves a
 * website interaction actually happened, which is what separates a real lead
 * from a rep editing a contact by hand.
 */
const LIVE_FORMS: Array<{ id: string; label: string; intent: string }> = [
  { id: '8f974ef4-a3dd-4bba-ad3a-086054ac235b', label: 'Quick hiring form', intent: 'Wants to hire engineers' },
  { id: 'a7a5be39-7014-4ed7-a4b2-75ee5adebd37', label: 'Pricing calculator', intent: 'Unlocked the pricing calculator' },
  { id: '4b883c7d-72c1-4f9c-8196-de68fce303d6', label: 'Contact form', intent: 'Sent a message via the contact form' },
]

interface Submission {
  label: string
  intent: string
  at: number
}

async function recentSubmissions(since: number): Promise<Map<string, Submission>> {
  const map = new Map<string, Submission>()
  for (const f of LIVE_FORMS) {
    const json = (await hs(`/form-integrations/v1/submissions/forms/${f.id}?limit=50`)) as
      | { results?: Array<{ submittedAt: number; values?: Array<{ name: string; value: string }> }> }
      | null
    for (const sub of json?.results ?? []) {
      if (sub.submittedAt < since) continue
      const email = (sub.values ?? []).find((v) => v.name === 'email')?.value?.toLowerCase()
      if (!email) continue
      // Keep the most recent submission per person: if they used two forms in
      // the window, the latest one is the one that describes where they got to.
      const prev = map.get(email)
      if (!prev || sub.submittedAt > prev.at) {
        map.set(email, { label: f.label, intent: f.intent, at: sub.submittedAt })
      }
    }
  }
  return map
}

/**
 * Which meetings mean "somebody booked a call with us from outside".
 *
 * MEASURED against 60 days of real data, 19 Aug: 461 meetings in the CRM. The
 * shape is unambiguous once you look:
 *
 *   INBOUND, always prefixed by HubSpot's Calendly integration:
 *     "Calendly: Discovery Call - Cloud Employee"
 *     "Calendly: Discovery Call - Cloud Employee (Clara)"
 *     "Calendly: Cloud Employee: Meet w/ Molly"
 *
 *   NOT inbound, never prefixed:
 *     "Company All-hands"                        (26 of them)
 *     "Alina - Element Human Final Interview"    (candidate)
 *     "Tech 1:1 | Eugene Pankratov and Bobby Reyes"
 *     "Gustavo Weinschutz and AJ Develos"
 *
 * A first attempt matched the two event NAMES instead, "Intro Call" and
 * "Discovery Call". That was nearly a serious mistake: "Intro Call" does not
 * appear once in 60 days, and it would have silently dropped every lead who
 * booked through a rep's own Calendly link - which is how several real
 * enquiries arrived. Matching the integration prefix catches all of them and
 * still excludes every interview and internal meeting.
 *
 * The failure modes are not symmetrical, and that is what decides this. A
 * candidate wrongly announced is noise somebody laughs at. A buyer silently
 * dropped is revenue nobody ever hears about. When in doubt, announce.
 */
const INBOUND_MEETING = /^calendly:/i

/**
 * Did they book a SALES call recently?
 *
 * Both halves matter. Recency, because a call booked in June is not somebody
 * escalating today. The title, because otherwise every candidate interview the
 * recruitment team books lands in the sales channel.
 */
async function bookedRecently(contactId: string, since: number): Promise<boolean> {
  const assoc = (await hs(`/crm/v4/objects/contacts/${contactId}/associations/meetings`)) as
    | { results?: Array<{ toObjectId?: string | number }> }
    | null
  const ids = (assoc?.results ?? []).map((r) => String(r.toObjectId)).filter(Boolean).slice(0, 10)
  if (ids.length === 0) return false
  const batch = (await hs('/crm/v3/objects/meetings/batch/read', {
    method: 'POST',
    body: JSON.stringify({
      properties: ['hs_createdate', 'hs_meeting_title'],
      inputs: ids.map((id) => ({ id })),
    }),
  })) as { results?: Array<{ properties?: Record<string, string> }> } | null
  return (batch?.results ?? []).some((m) => {
    const created = m.properties?.hs_createdate
    if (!created || Date.parse(created) < since) return false
    return INBOUND_MEETING.test((m.properties?.hs_meeting_title ?? '').trim())
  })
}

/**
 * Did this person come from Clara, RECENTLY?
 *
 * The recency half is the whole point, and leaving it out caused a real
 * embarrassment on 19 Aug. clara_session_url and clara_chat_summary are
 * permanent properties: once written they stay on the contact forever. So a
 * check for "is this property set" says "this person chatted at some point",
 * never "this person chatted today".
 *
 * What that produced: Kirk Davis, a contact created 7 May, was announced as a
 * new lead 103 days later - because a rep moved his deal to closed lost, which
 * bumped lastmodifieddate, which pulled him into the slice, where the permanent
 * Clara property waved him straight through the gate. He had done nothing. The
 * rep who had just edited him asked in the channel whether he had visited the
 * site, which is exactly the confusion a false positive causes: it makes people
 * distrust the record in front of them.
 *
 * Clara does not stamp a date we can read, so the contact's own age is the
 * proxy: a genuine new chat lead is a contact created within the window. An
 * existing contact being edited is not news, whatever properties it carries.
 *
 * Same lesson as the meetings filter, learned twice: a permanent property is
 * evidence that something HAPPENED, never evidence that it happened NOW.
 */
function claraSignal(c: HsContact, interactionSince: number): 'definite' | null {
  const p = c.properties
  if (!p.clara_chat_summary && !p.clara_session_url) return null
  const created = p.createdate ? Date.parse(p.createdate) : 0
  return created >= interactionSince ? 'definite' : null
}

function isVendorPitch(c: HsContact): boolean {
  const text = [c.properties.message, c.properties.company, c.properties.jobtitle]
    .filter(Boolean)
    .join(' ')
  return VENDOR_PATTERNS.test(text)
}

/**
 * The multi-step form answers, in the order a rep wants to read them.
 *
 * Only questions the visitor actually answered are included: an empty row reads
 * as a broken integration, where an absent row reads as a question they skipped.
 */
function answersOf(c: HsContact): Array<{ label: string; value: string }> {
  const p = c.properties
  const pretty = (v: string) => v.replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase())
  const rows: Array<[string, string | null | undefined]> = [
    ['Skills', p.ce_skills_requested],
    ['Tech needed', p.technology_expertise_needed],
    ['How many', p.how_many_needed_],
    ['How long', p.ce_engagement_length ?? p.how_long_needed_],
    ['Commitment', p.ce_commitment],
    ['Budget', p.monthly_budget],
    ['Needed', p.when_talent_is_needed],
  ]
  return rows
    .filter(([, v]) => v && v.trim() && !/^not[_ ]specified$/i.test(v))
    .map(([label, v]) => ({ label, value: pretty(String(v).trim()).slice(0, 120) }))
}

/**
 * What they asked for, in as close to their own words as HubSpot holds.
 * Never invented: if there is nothing to say, say that rather than guess.
 */
function inquiryOf(
  c: HsContact,
  booked: boolean,
  form: Submission | null,
  chatbot: boolean,
): string {
  const p = c.properties
  const parts: string[] = []
  // Their own words first, when there are any. The form intent is a fallback,
  // not a replacement - what someone typed always beats what we inferred.
  // Clara's summary outranks everything: it is the visitor explaining what they
  // want, unprompted, which no form field comes close to.
  if (p.clara_chat_summary) parts.push(p.clara_chat_summary.replace(/\s+/g, ' ').slice(0, 220))
  else if (p.message) parts.push(p.message.replace(/\s+/g, ' ').slice(0, 160))
  else if (form) parts.push(form.intent)
  else if (chatbot) parts.push('Started a conversation with Clara')
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

  const now = Date.now()
  // How far back an interaction still counts as "this visit". Slightly wider
  // than the window so a form filled a moment before the slice still qualifies.
  const interactionSince = now - (WINDOW_MINUTES + SLICE_MINUTES + 3) * 60_000

  const [contacts, submissions] = await Promise.all([
    contactsInSlice(),
    recentSubmissions(interactionSince),
  ])
  if (contacts.length === 0) return NextResponse.json({ ok: true, announced: 0 })

  let announced = 0
  let skipped = 0
  for (const c of contacts) {
    const p = c.properties
    const email = p.email
    if (!email) continue

    const form = submissions.get(email.toLowerCase()) ?? null
    const booked = await bookedRecently(c.id, interactionSince)

    const clara = claraSignal(c, interactionSince)
    const chatbot = clara !== null

    // THE GATE. A modified contact is not automatically a lead: reps edit
    // records, integrations write properties, imports run. Something the person
    // actually did on the website has to be visible, or nothing is announced.
    if (!form && !booked && !chatbot) {
      skipped += 1
      continue
    }

    // A deliberate test never reaches the leads channel, whatever else it looks
    // like. Checked before the junk rules so a test is never silently filed as
    // spam and hunted for in the wrong place.
    const isTest = isTestLead(email)
    const junk = !isTest && isVendorPitch(c)
    const company = companyFrom(email)

    // Enrichment is skipped for junk: no reason to spend a sales-brain call, or
    // your API credits, on somebody trying to sell you something.
    // No enrichment for tests either: no reason to spend sales-brain credits, or
    // to create a person record in the CRM, for a submission we made ourselves.
    const enrichment = junk || isTest
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
      inquiry: inquiryOf(c, booked, form, chatbot),
      source:
        [
          form?.label ??
            (clara ? 'Clara chat' : null),
          sourceLabel(p.hs_analytics_source),
        ]
          .filter(Boolean)
          .join('  ·  ') || 'Website',
      location: p.ip_country,
      claraSessionUrl: p.clara_session_url,
      answers: answersOf(c),
      hubspotId: c.id,
    }

    const posted = await postLead(
      buildBrief(lead, enrichment),
      briefFallback(lead),
      isTest ? 'test' : junk ? 'junk' : 'leads',
    )
    if (posted.ok) announced += 1
  }

  console.log(
    `[lead-briefs] seen ${contacts.length}, announced ${announced}, skipped ${skipped} with no website interaction (portal ${PORTAL_ID})`,
  )
  return NextResponse.json({ ok: true, announced, skipped, seen: contacts.length })
}
