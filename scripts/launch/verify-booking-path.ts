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
// This checks the DATA, on both sides, and reaches its own verdict.
//
// It reads Calendly's scheduled events and HubSpot's meeting records for the same
// window and PAIRS them one by one. Counting alone would be too blunt: the two
// systems disagree by a booking or two at the window edge simply because HubSpot
// writes its record seconds to minutes after Calendly takes the booking. Pairing
// says which specific booking is missing, which is the only thing worth acting on.
//
//   every Calendly booking paired  -> connected, proven
//   a Calendly booking unpaired    -> that booking never reached the CRM. FAILS.
//   HubSpot record unpaired        -> almost always window-edge lag. Reported, not fatal.
//
// DATE SEMANTICS, which are easy to get wrong here. Both sides are counted by
// when the booking was MADE, not when the meeting happens. HubSpot's meetings are
// filtered on `hs_createdate`; Calendly has no created-at filter, so the events
// are fetched by start time over a deliberately wide range and then filtered on
// their own `created_at`. Comparing "booked in the last 30 days" against "meets in
// the next 30 days" would be two different sets and a meaningless verdict.
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
// Extended 1 Aug 2026 with the Calendly side, so it no longer ends by asking a
// human for a number. Without CALENDLY_ACCESS_TOKEN it still runs and still
// prints the HubSpot-only report; it just cannot conclude, and says so.
//
// Run: npm run launch:verify-booking-path
// Optional: DAYS=60 npm run launch:verify-booking-path

// Marks the file as a module so its top-level consts do not collide with the
// other import-less scripts in the same typecheck project.
export {}

const HUBSPOT_API = 'https://api.hubapi.com'
const CALENDLY_API = 'https://api.calendly.com'

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const CALENDLY_TOKEN = process.env.CALENDLY_ACCESS_TOKEN
const DAYS = Number(process.env.DAYS ?? 30)

/**
 * HubSpot names the integration that created a record in this property. Exact
 * string, as it appears in the CRM.
 */
const CALENDLY = 'Calendly'

/**
 * HubSpot's record lands after Calendly takes the booking - within seconds for a
 * new booking, and up to about twenty minutes for a cancellation on this portal.
 * A booking made moments ago is therefore not yet evidence of anything. Anything
 * inside this grace period is set aside rather than failed.
 */
const SYNC_GRACE_MINUTES = 30

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

const now = Date.now()
const since = now - DAYS * 24 * 60 * 60 * 1000
const graceCutoff = now - SYNC_GRACE_MINUTES * 60 * 1000

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * HubSpot's search API allows four requests a second and answers 429 above that.
 * A ninety-day window pages enough times to hit it, and dying halfway through is
 * indistinguishable to the reader from a failed check. Back off and carry on.
 */
async function hs<T>(path: string, init?: RequestInit): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${HUBSPOT_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
    if (res.ok) return res.json() as Promise<T>

    const retryable = res.status === 429 || res.status >= 500
    if (!retryable || attempt >= 4) {
      throw new Error(`HubSpot ${path} -> ${res.status}: ${await res.text()}`)
    }
    const retryAfter = Number(res.headers.get('Retry-After'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 500
    await sleep(wait)
  }
}

type Record_ = { id: string; properties: Record<string, string | null> }

/** `truncated` means the page cap was hit, so the count is a floor, not a total. */
type Search = { records: Record_[]; truncated: boolean }

async function searchAll(object: string, dateProp: string, properties: string[]): Promise<Search> {
  const out: Record_[] = []
  let after: string | undefined
  let truncated = false
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
    if (!after) break
    if (out.length >= 1000) {
      truncated = true
      break
    }
  }
  return { records: out, truncated }
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

// ---------------------------------------------------------------------------
// Calendly
// ---------------------------------------------------------------------------

type CalendlyEvent = {
  uri: string
  name: string | null
  status: string
  created_at: string
  start_time: string
  event_memberships?: Array<{ user_email?: string }>
}

type CalendlyPage<T> = {
  collection: T[]
  pagination?: { next_page_token?: string | null }
}

class CalendlyError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function cal<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${CALENDLY_API}${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${CALENDLY_TOKEN}` } })
  if (!res.ok) {
    throw new CalendlyError(res.status, `Calendly ${path} -> ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

async function calAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const out: T[] = []
  let pageToken: string | undefined
  for (;;) {
    const page = await cal<CalendlyPage<T>>(path, {
      ...params,
      count: '100',
      ...(pageToken ? { page_token: pageToken } : {}),
    })
    out.push(...(page.collection ?? []))
    pageToken = page.pagination?.next_page_token ?? undefined
    if (!pageToken) break
    // Silently reading half of Calendly would hide exactly the loss this check
    // exists to find, so say it out loud rather than just stopping.
    if (out.length >= 2000) {
      console.log(`WARNING: stopped reading ${path} at ${out.length} records. Narrow DAYS.`)
      break
    }
  }
  return out
}

/**
 * Calendly's scheduled_events endpoint filters on START time only, so the window
 * is deliberately wide and the created-at filter is applied here. A booking made
 * inside the window cannot start before the window opens (Calendly will not book
 * the past), and a year of lead time is far beyond anything CE takes.
 */
async function calendlyEventsCreatedInWindow(
  scope: Record<string, string>,
): Promise<CalendlyEvent[]> {
  const events = await calAll<CalendlyEvent>('/scheduled_events', {
    ...scope,
    min_start_time: new Date(since - 2 * 24 * 60 * 60 * 1000).toISOString(),
    max_start_time: new Date(now + 400 * 24 * 60 * 60 * 1000).toISOString(),
    sort: 'start_time:asc',
  })
  return events
    .filter((e) => Date.parse(e.created_at) >= since)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
}

type CalendlyScope =
  | { kind: 'organization'; owner: string; organization: string; scope: Record<string, string> }
  | { kind: 'user'; owner: string; organization: string; scope: Record<string, string> }

/**
 * Whether the token can read the whole organisation or only its own owner's
 * calendar. Never assumed: the org-wide read is attempted, and a 401/403 is the
 * answer. It changes what a matching count is worth, so it is reported either way.
 */
async function resolveCalendlyScope(): Promise<CalendlyScope> {
  const me = await cal<{ resource: { email: string; uri: string; current_organization: string } }>(
    '/users/me',
    {},
  )
  const { email, uri, current_organization: organization } = me.resource

  try {
    await cal('/scheduled_events', { organization, count: '1' })
    return { kind: 'organization', owner: email, organization, scope: { organization } }
  } catch (err) {
    if (err instanceof CalendlyError && (err.status === 401 || err.status === 403)) {
      return { kind: 'user', owner: email, organization, scope: { user: uri } }
    }
    throw err
  }
}

/**
 * Both systems name the same booking slightly differently: HubSpot prefixes the
 * Calendly event name, and prefixes it again on cancellation. Strip both back to
 * the bare name so the two can be compared.
 */
function normaliseName(title: string | null | undefined): string {
  return (title ?? '')
    .replace(/^\s*\[Canceled\]\s*/i, '')
    .replace(/^\s*Calendly:\s*/i, '')
    .trim()
    .toLowerCase()
}

function startMs(value: string | null | undefined): number {
  const parsed = Date.parse(value ?? '')
  return Number.isNaN(parsed) ? 0 : parsed
}

type Pairing = {
  paired: Array<{ event: CalendlyEvent; meeting: Record_ }>
  missingFromHubSpot: CalendlyEvent[]
  unmatchedInHubSpot: Record_[]
}

/**
 * Pair on meeting start time plus event name, then make a second pass on start
 * time alone for anything left over. The second pass exists because the name is
 * editable on both sides and a renamed event type is a cosmetic difference, not
 * a lost booking. Start time is the fact that cannot drift.
 */
function pair(events: CalendlyEvent[], meetings: Record_[]): Pairing {
  const pool = [...meetings]
  const paired: Pairing['paired'] = []
  const missingFromHubSpot: CalendlyEvent[] = []

  const take = (predicate: (m: Record_) => boolean): Record_ | undefined => {
    const i = pool.findIndex(predicate)
    return i === -1 ? undefined : pool.splice(i, 1)[0]
  }

  for (const event of events) {
    const start = startMs(event.start_time)
    const name = normaliseName(event.name)
    const match =
      take(
        (m) =>
          startMs(m.properties.hs_meeting_start_time ?? m.properties.hs_timestamp) === start &&
          normaliseName(m.properties.hs_meeting_title) === name,
      ) ??
      take(
        (m) => startMs(m.properties.hs_meeting_start_time ?? m.properties.hs_timestamp) === start,
      )

    if (match) paired.push({ event, meeting: match })
    else missingFromHubSpot.push(event)
  }

  return { paired, missingFromHubSpot, unmatchedInHubSpot: pool }
}

type CalendlyInvitee = { email: string; rescheduled?: boolean; new_invitee?: string | null }

/**
 * A reschedule is not a lost booking. Calendly models "invitee moved the meeting"
 * as cancel-the-old, create-the-new, and the HubSpot integration writes a record
 * for the survivor only. The stub left behind therefore has no HubSpot record BY
 * DESIGN, and failing on it would train everyone to ignore this check.
 *
 * The flag lives on the invitee, not the event, so it costs one call per unpaired
 * cancellation. That is nearly always zero calls and never many.
 */
async function wasRescheduledAway(event: CalendlyEvent): Promise<boolean> {
  if (event.status !== 'canceled') return false
  const uuid = event.uri.split('/').pop() ?? ''
  const invitees = await calAll<CalendlyInvitee>(`/scheduled_events/${uuid}/invitees`, {})
  return invitees.some((i) => i.rescheduled === true)
}

function describe(event: CalendlyEvent): string {
  const host = event.event_memberships?.[0]?.user_email ?? 'unknown host'
  return `booked ${event.created_at}  meets ${event.start_time}  ${event.status.padEnd(8)}  ${host}  ${event.name ?? '(unnamed)'}`
}

async function main(): Promise<void> {
  console.log(`Booking-path check - bookings MADE in the last ${DAYS} days\n`)

  const contacts = await searchAll('contacts', 'createdate', [
    'email',
    'createdate',
    'hs_object_source',
    'hs_object_source_label',
    'hs_object_source_detail_1',
    'hs_latest_source',
  ])

  const capped = ' (capped, the real number is higher)'

  console.log(`Contacts created: ${contacts.records.length}${contacts.truncated ? capped : ''}`)
  if (contacts.records.length > 0) {
    console.log('\nWhich system created them:')
    table(bySource(contacts.records))
  }
  const calendlyContacts = contacts.records.filter(isCalendly)

  const meetings = await searchAll('meetings', 'hs_createdate', [
    'hs_meeting_title',
    'hs_createdate',
    'hs_timestamp',
    'hs_meeting_start_time',
    'hs_object_source_label',
    'hs_object_source_detail_1',
  ])

  console.log(
    `\nMeeting records created: ${meetings.records.length}${meetings.truncated ? capped : ''}`,
  )
  if (meetings.records.length > 0) {
    console.log('\nWhich system created them:')
    table(bySource(meetings.records))
  }

  const calendlyMeetings = meetings.records.filter(isCalendly)
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

  if (!CALENDLY_TOKEN) {
    console.log('')
    console.log('CALENDLY_ACCESS_TOKEN is not set, so this run sees HubSpot only.')
    console.log('THAT IS NOT A PASS. HubSpot cannot tell you about a booking it never received.')
    console.log('')
    console.log("Set the token (Cursor Dashboard > Cloud Agents > Secrets, or your shell) and")
    console.log('re-run, and this check reaches its own verdict. A read-only Calendly personal')
    console.log('access token with scheduled_events:read and users:read is enough.')
    return
  }

  // A capped meeting search drops the OLDEST records first (the search is sorted
  // newest-first), so the window it really covers starts at the oldest record it
  // did return. Judging Calendly bookings older than that against a set that
  // cannot contain them would invent a loss that is not there.
  const oldestMeeting = meetings.records
    .map((m) => startMs(m.properties.hs_createdate))
    .filter((t) => t > 0)
    .sort((a, b) => a - b)[0]
  const effectiveSince = meetings.truncated && oldestMeeting ? oldestMeeting : since

  await calendlySide(calendlyMeetings, effectiveSince)
}

async function calendlySide(calendlyMeetings: Record_[], effectiveSince: number): Promise<void> {
  console.log('\n=== Calendly side ===\n')

  const scope = await resolveCalendlyScope()
  console.log(`Token owner: ${scope.owner}`)
  console.log(`Organisation: ${scope.organization}`)
  if (scope.kind === 'organization') {
    console.log("Visibility: ORGANISATION-WIDE. Every member's bookings are counted.")
  } else {
    console.log('Visibility: THIS USER ONLY. Calendly refused the organisation-wide read, so')
    console.log('bookings taken by anyone else in the team are invisible to this run.')
  }

  const events = await calendlyEventsCreatedInWindow(scope.scope)
  const inRange = events.filter((e) => Date.parse(e.created_at) >= effectiveSince)
  const settled = inRange.filter((e) => Date.parse(e.created_at) <= graceCutoff)
  const tooRecent = inRange.filter((e) => Date.parse(e.created_at) > graceCutoff)

  console.log(`\nCalendly bookings made in the window: ${events.length}`)
  console.log(`HubSpot meetings created by Calendly:  ${calendlyMeetings.length}`)
  if (effectiveSince > since) {
    console.log('')
    console.log(
      `HubSpot's search was capped, so the comparable window starts at ${new Date(effectiveSince).toISOString()}.`,
    )
    console.log(
      `${events.length - inRange.length} older Calendly booking(s) are not judged. Narrow DAYS for a full verdict.`,
    )
  }
  if (tooRecent.length > 0) {
    console.log(
      `\n${tooRecent.length} booking(s) made in the last ${SYNC_GRACE_MINUTES} minutes are set aside; HubSpot may not`,
    )
    console.log('have written them yet.')
  }

  const { paired, missingFromHubSpot, unmatchedInHubSpot } = pair(settled, calendlyMeetings)

  const rescheduledAway: CalendlyEvent[] = []
  const lost: CalendlyEvent[] = []
  for (const event of missingFromHubSpot) {
    if (await wasRescheduledAway(event)) rescheduledAway.push(event)
    else lost.push(event)
  }

  console.log(`\nPaired booking to CRM record: ${paired.length} of ${settled.length}`)
  if (rescheduledAway.length > 0) {
    console.log(
      `Rescheduled away, so no record is expected: ${rescheduledAway.length}. The booking that replaced`,
    )
    console.log('each of them is counted in its own right.')
  }

  if (unmatchedInHubSpot.length > 0) {
    console.log(
      `\nHubSpot records with no Calendly booking in the window: ${unmatchedInHubSpot.length}`,
    )
    if (scope.kind === 'organization') {
      console.log('Normally the window edge: the booking was taken just before the window opened')
      console.log('and HubSpot wrote its record just after. Not a loss, so not a failure.')
    } else {
      console.log('Expected here: HubSpot holds the whole team, this token reads one calendar.')
      console.log("These are almost certainly other people's bookings, arriving correctly.")
    }
    for (const m of unmatchedInHubSpot) {
      console.log(
        `  written ${m.properties.hs_createdate}  meets ${m.properties.hs_meeting_start_time ?? '?'}  ${m.properties.hs_meeting_title ?? '(untitled)'}`,
      )
    }
  }

  console.log('\n---')

  if (lost.length > 0) {
    console.log('BOOKINGS ARE BEING LOST.')
    console.log(
      `${lost.length} of the ${paired.length + lost.length} Calendly booking(s) judged never reached HubSpot:`,
    )
    for (const e of lost) console.log(`  ${describe(e)}`)
    console.log('')
    console.log('The site points effectively all of its intent at booking a call, so this is the')
    console.log('launch blocker, ahead of everything else. Check the Calendly-HubSpot integration')
    if (scope.kind === 'organization') {
      console.log('is enabled for the host(s) listed above, not only for the account owner.')
    } else {
      console.log('for the token owner.')
    }
    process.exitCode = 1
    return
  }

  if (paired.length === 0) {
    console.log('NO BOOKINGS IN THE WINDOW TO JUDGE, so there is nothing proven either way.')
    console.log('Book a test meeting and re-run, or widen the window with DAYS=90.')
    if (scope.kind === 'user') {
      console.log('Note that this token only sees one calendar, so the team may have booked anyway.')
    }
    return
  }

  console.log('CONNECTED. PROVEN.')
  console.log(
    `Every one of the ${paired.length} Calendly booking(s) made in the last ${DAYS} days has a matching`,
  )
  console.log('HubSpot meeting record. Nothing is being lost on the way to the CRM.')
  if (scope.kind === 'user') {
    console.log('')
    console.log('CAVEAT: this token only reads one calendar. It proves that calendar is connected;')
    console.log('it cannot speak for the rest of the team.')
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
