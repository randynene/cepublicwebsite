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
// This checks the DATA: are there contacts in HubSpot that came from the booking
// path, and do they carry booking activity?
//
// What it CANNOT do is tell you the count is right. It sees HubSpot's side only.
// Pair it with Calendly's own booking count for the same window - either from the
// Calendly MCP or read off the dashboard - and compare. That cross-check is the
// conclusive test:
//
//   Calendly 12, HubSpot 12  -> connected, proven
//   Calendly 12, HubSpot 0   -> BROKEN, every booking is being lost
//   Calendly 0,  HubSpot 0   -> inconclusive, book a test meeting and re-run
//
// Run: npm run launch:verify-booking-path
// Optional: DAYS=60 npm run launch:verify-booking-path

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const DAYS = Number(process.env.DAYS ?? 30)

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

type Contact = {
  id: string
  properties: Record<string, string | null>
}

/**
 * Contacts created in the window, with the properties that reveal where they
 * came from. `hs_object_source_label` is the useful one: an integration-created
 * contact names the integration, a form fill says FORM, a manual add says CRM_UI.
 */
async function recentContacts(): Promise<Contact[]> {
  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: 'createdate', operator: 'GTE', value: String(since) },
        ],
      },
    ],
    properties: [
      'email',
      'createdate',
      'hs_object_source',
      'hs_object_source_label',
      'hs_object_source_detail_1',
      'hs_analytics_source',
      'hs_latest_source',
      'hs_analytics_first_url',
    ],
    limit: 100,
    sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
  }
  const data = await hs<{ results: Contact[] }>('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return data.results ?? []
}

/**
 * Meetings are the strongest signal, but `crm.objects.meetings.read` is not
 * offered to Service Keys yet, so this may 403. Appointments is the closest
 * available object. A failure here is a scope gap, not a verdict - say so rather
 * than reporting zero, because "zero meetings" and "not allowed to look" mean
 * opposite things.
 */
async function recentAppointments(): Promise<{ count: number; note: string }> {
  try {
    const data = await hs<{ results: unknown[] }>(
      '/crm/v3/objects/appointments/search',
      {
        method: 'POST',
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: 'hs_createdate', operator: 'GTE', value: String(since) },
              ],
            },
          ],
          limit: 100,
        }),
      },
    )
    return { count: data.results?.length ?? 0, note: '' }
  } catch (err) {
    return {
      count: -1,
      note: err instanceof Error ? err.message.slice(0, 120) : 'unknown error',
    }
  }
}

function bucket(contacts: Contact[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const c of contacts) {
    const label =
      c.properties.hs_object_source_label ||
      c.properties.hs_object_source ||
      c.properties.hs_latest_source ||
      '(no source recorded)'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return counts
}

const CALENDLY_HINT = /calendly|meeting|scheduler|booking|integration/i

async function main(): Promise<void> {
  console.log(`HubSpot booking-path check - last ${DAYS} days\n`)

  const contacts = await recentContacts()
  console.log(`Contacts created: ${contacts.length}`)

  if (contacts.length === 0) {
    console.log('\nNo contacts created in this window, so this tells us nothing.')
    console.log('Book a test meeting through the site, then re-run.')
    return
  }

  console.log('\nWhere they came from:')
  const sorted = [...bucket(contacts)].sort((a, b) => b[1] - a[1])
  for (const [label, n] of sorted) {
    console.log(`  ${String(n).padStart(4)}  ${label}`)
  }

  const bookingish = sorted.filter(([label]) => CALENDLY_HINT.test(label))
  const bookingCount = bookingish.reduce((sum, [, n]) => sum + n, 0)

  const appts = await recentAppointments()
  console.log('')
  if (appts.count >= 0) {
    console.log(`Appointment records in window: ${appts.count}`)
  } else {
    console.log(`Appointment records: could not read (${appts.note})`)
    console.log('  That is a scope gap, NOT evidence of zero. Do not read it as a pass or a fail.')
  }

  console.log('\n---')
  if (bookingCount > 0 || appts.count > 0) {
    console.log(`LOOKS CONNECTED. ${bookingCount} contact(s) trace to a booking-style source.`)
  } else {
    console.log('NO BOOKING-SOURCED CONTACTS FOUND.')
    console.log('That is either a broken Calendly-to-HubSpot link, or simply no recent bookings.')
    console.log('It is not yet proof of either.')
  }

  console.log('')
  console.log('TO CONCLUDE THIS, compare against Calendly for the same window:')
  console.log(`  Calendly bookings in the last ${DAYS} days = ?`)
  console.log('    matches the above      -> connected, done')
  console.log('    Calendly > 0, above 0  -> BROKEN, every booking is being lost')
  console.log('    both 0                 -> book a test meeting and re-run')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
