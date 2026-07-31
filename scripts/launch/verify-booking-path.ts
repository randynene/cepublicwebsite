// Does a Calendly booking actually create a record in HubSpot?
//
// This is the single most load-bearing question on the site right now, and it is
// the one nothing else checks.
//
// The launch consolidation (30 Jul 2026) pointed effectively all of the site's
// intent at one action: book a call. The start-hiring funnel is retired, the
// newsletter is gone, and every CTA that used to scatter now converges on
// /book-a-call. That is the right shape for the business - but it means the
// booking path is now a single point of failure. If Calendly is not writing into
// HubSpot, every enquiry the site generates lands in a calendar and nowhere else,
// and no one finds out until someone asks why the CRM is empty.
//
// A settings toggle is not proof. A toggle can be on and still write nothing.
// This checks the DATA.
//
// What it CANNOT do is tell you the count is right. It sees HubSpot's side only.
// Pair it with Calendly's own count for the same window - either from the Calendly
// MCP or read off the dashboard - and compare. That cross-check is the conclusive
// test:
//
//   Calendly 13, HubSpot 13  -> connected, proven
//   Calendly 13, HubSpot 0   -> BROKEN, every booking is being lost
//   Calendly 13, HubSpot 4   -> PARTIAL, some bookings are being lost
//   Calendly 0,  HubSpot 0   -> inconclusive, book a test meeting and re-run
//
// Corrected 31 Jul 2026 after it reported a false pass. Two bugs, both of the
// same kind - a number that looked like an answer but was not:
//
//   1. It counted contacts whose source LABEL matched /integration/, then called
//      that "booking-style". On this portal that bucket was 49, of which 43 were
//      Fireflies.ai call transcripts and 2 were the Clara chatbot. Four were
//      Calendly. The integration NAME is in `hs_object_source_detail_1`, so that
//      is what gets matched now. A generic label is not a source.
//
//   2. It read the `appointments` object, got 0, and printed "Appointment records
//      in window: 0" as though that were evidence. Calendly writes MEETING
//      engagements, not appointments - a different object entirely. Meetings are
//      readable with this token and there were 216 of them. Reading the wrong
//      object and reporting its emptiness is worse than not looking.
//
// Run: npm run launch:verify-booking-path
// Optional: DAYS=60 npm run launch:verify-booking-path

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const DAYS = Number(process.env.DAYS ?? 30)

/**
 * HubSpot names the integration that created a record in this property. Exact
 * string, as it appears in the CRM.
 */
const CALENDLY = 'Calendly'

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  console.error('')
  console.error('It lives in two places, both outside this repo:')
  console.error('  - Cursor Dashboard > Cloud Agents > My Secrets (for cloud agents)')
  console.error('  - your own shell / .env for local runs')
  console.error('')
  console.error('A cloud agent only receives secrets added BEFORE it started.')
  process.exit(1)
}

const since = Date.now() - DAYS * 24 * 60 * 60 * 1000

async function hs<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`HubSpot ${path} -> ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

type Record_ = { id: string; properties: Record<string, string | null> }

async function searchAll(object: string, dateProp: string, properties: string[]): Promise<Record_[]> {
  const out: Record_[] = []
  let after: string | undefined
  for (;;) {
    const page = await hs<{ results: Record_[]; paging?: { next?: { after?: string } } }>(
      `/crm/v3/objects/${object}/search`,
      {
        method: 'POST',
        body: JSON.stringify({
          filterGroups: [
            { filters: [{ propertyName: dateProp, operator: 'GTE', value: String(since) }] },
          ],
          properties,
          limit: 100,
          sorts: [{ propertyName: dateProp, direction: 'DESCENDING' }],
          after,
        }),
      },
    )
    out.push(...(page.results ?? []))
    after = page.paging?.next?.after
    // HubSpot's search API caps out at 10k; this window will never approach it,
    // and an unbounded loop on a paging bug is worse than a truncated report.
    if (!after || out.length >= 1000) break
  }
  return out
}

/** Group by the integration NAME, falling back to the generic label. */
function bySource(records: Record_[]): Array<[string, number]> {
  const counts = new Map<string, number>()
  for (const r of records) {
    const p = r.properties
    const label = p.hs_object_source_label ?? p.hs_object_source ?? '(no source recorded)'
    const detail = p.hs_object_source_detail_1
    const key = detail ? `${detail} (${label})` : label
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1])
}

function isCalendly(r: Record_): boolean {
  return r.properties.hs_object_source_detail_1 === CALENDLY
}

/** Calendly writes cancellations back by prefixing the meeting title. */
function isCancelled(r: Record_): boolean {
  return /^\[Canceled\]/i.test(r.properties.hs_meeting_title ?? '')
}

function table(rows: Array<[string, number]>): void {
  for (const [label, n] of rows) console.log(`  ${String(n).padStart(4)}  ${label}`)
}

async function main(): Promise<void> {
  console.log(`HubSpot booking-path check - last ${DAYS} days\n`)

  const contacts = await searchAll('contacts', 'createdate', [
    'email',
    'createdate',
    'hs_object_source',
    'hs_object_source_label',
    'hs_object_source_detail_1',
    'hs_latest_source',
  ])

  console.log(`Contacts created: ${contacts.length}`)
  if (contacts.length > 0) {
    console.log('\nWhich system created them:')
    table(bySource(contacts))
  }
  const calendlyContacts = contacts.filter(isCalendly)

  const meetings = await searchAll('meetings', 'hs_createdate', [
    'hs_meeting_title',
    'hs_createdate',
    'hs_object_source_label',
    'hs_object_source_detail_1',
  ])

  console.log(`\nMeeting records created: ${meetings.length}`)
  if (meetings.length > 0) {
    console.log('\nWhich system created them:')
    table(bySource(meetings))
  }

  const calendlyMeetings = meetings.filter(isCalendly)
  const cancelled = calendlyMeetings.filter(isCancelled)

  console.log('\n---')
  console.log(`Calendly meetings written into HubSpot: ${calendlyMeetings.length}`)
  console.log(`  of which cancelled since:            ${cancelled.length}`)
  console.log(`Calendly-created NEW contacts:         ${calendlyContacts.length}`)
  console.log('')
  console.log(
    'Those two numbers differ on purpose. A repeat booker matches an existing contact, so it',
  )
  console.log('makes a meeting but no new contact. Meetings is the number to compare on.')

  console.log('\n---')
  if (calendlyMeetings.length > 0) {
    console.log('CALENDLY IS WRITING INTO HUBSPOT.')
    if (cancelled.length > 0) {
      console.log(
        `Cancellations are syncing too (${cancelled.length} title(s) marked [Canceled]), so the link is live,`,
      )
      console.log('not a one-off import.')
    }
  } else {
    console.log('NO CALENDLY MEETINGS FOUND IN HUBSPOT.')
    console.log('That is either a broken Calendly-to-HubSpot link, or simply no recent bookings.')
    console.log('It is not yet proof of either.')
  }

  console.log('')
  console.log('THIS IS NOT A PASS ON ITS OWN. It only sees HubSpot.')
  console.log(`To conclude it, get Calendly's own scheduled-event count for the last ${DAYS} days,`)
  console.log('cancellations included, and compare against the Calendly-meetings number above:')
  console.log('')
  console.log(`  equal              -> connected, proven, done`)
  console.log(`  Calendly higher    -> PARTIAL LOSS, that many bookings never reached the CRM`)
  console.log(`  Calendly > 0, HubSpot 0 -> BROKEN, every booking is being lost`)
  console.log(`  both 0             -> book a test meeting and re-run`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
