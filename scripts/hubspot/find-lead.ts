// Did that test lead actually reach HubSpot, and did it arrive complete?
//
// The submit button returning 200 proves the request left the browser. It does
// not prove HubSpot accepted it, and it certainly does not prove the five custom
// properties came through: a field the form definition does not know about is
// dropped SILENTLY, with a 200 and no warning. That is the failure this catches,
// and it is the one that would otherwise be found weeks later by Seb wondering
// why every lead has a blank skills field.
//
// Read-only. One GET-equivalent search, no writes.
//
// Run: npm run hubspot:find-lead -- someone@example.com
//      npm run hubspot:find-lead            (the 10 most recent form leads)

export {}

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const email = process.argv[2]

/** The fields the quick hiring form is supposed to deliver. */
const CE_FIELDS = [
  'ce_lead_gateway',
  'ce_source_page',
  'ce_skills_requested',
  'ce_engagement_length',
  'ce_commitment',
] as const

const PROPERTIES = [
  'email',
  'firstname',
  'lastname',
  'company',
  'phone',
  'createdate',
  'hs_object_source_label',
  'hs_object_source_detail_1',
  ...CE_FIELDS,
]

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  console.error('A cloud agent only receives secrets added BEFORE the agent started.')
  process.exit(1)
}

type Contact = { id: string; properties: Record<string, string | null> }

async function hs<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`HubSpot ${path} -> ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return res.json() as Promise<T>
}

async function main(): Promise<void> {
  const since = Date.now() - 24 * 60 * 60 * 1000
  const filters = email
    ? [{ propertyName: 'email', operator: 'EQ', value: email }]
    : [{ propertyName: 'ce_lead_gateway', operator: 'HAS_PROPERTY' }]

  const page = await hs<{ total: number; results: Contact[] }>('/crm/v3/objects/contacts/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{ filters }],
      properties: PROPERTIES,
      sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
      limit: 10,
    }),
  })

  console.log(
    email
      ? `Contacts matching ${email}: ${page.total}`
      : `Contacts carrying ce_lead_gateway (any date): ${page.total}\n`,
  )

  if (page.results.length === 0) {
    console.log('')
    console.log('NOT FOUND. The submission did not create a contact. Check, in order:')
    console.log('  1. NEXT_PUBLIC_HUBSPOT_PORTAL_ID is set for the environment you submitted from')
    console.log('  2. the form GUID in scripts/hubspot/create-quick-hiring-form.ts still exists')
    console.log('  3. #leads-test for the "Lead did NOT reach HubSpot" alert, which names the reason')
    process.exitCode = 1
    return
  }

  for (const c of page.results) {
    const p = c.properties
    const fresh = Date.parse(p.createdate ?? '') >= since
    console.log(`\n${p.email} (id ${c.id})${fresh ? '  [created in the last 24h]' : ''}`)
    console.log(`  created   ${p.createdate}`)
    console.log(`  name      ${[p.firstname, p.lastname].filter(Boolean).join(' ') || '(none)'}`)
    console.log(`  company   ${p.company ?? '(none)'}`)
    console.log(`  source    ${p.hs_object_source_detail_1 ?? p.hs_object_source_label ?? '(none)'}`)

    // The point of the whole script: a missing custom field is the silent failure.
    const missing = CE_FIELDS.filter((f) => !p[f])
    for (const f of CE_FIELDS) console.log(`  ${f.padEnd(22)} ${p[f] ?? '-- MISSING --'}`)
    if (missing.length > 0) {
      console.log(`  ^ ${missing.length} custom field(s) empty. HubSpot drops unknown fields silently,`)
      console.log('    so check the property names in the form definition match what the app sends.')
      process.exitCode = 1
    }
  }

  console.log('')
  console.log('Delete test contacts by hand in HubSpot. This script has no write scope and')
  console.log('deliberately cannot clean up after you.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
