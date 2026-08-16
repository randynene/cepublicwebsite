import 'dotenv/config'

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

// Add the quick hiring form to the workflow that creates MQL deals.
//
// THE PROBLEM. "Create MQL Deal from Contact or Get Started Forms" enrols on
// exactly two forms:
//
//   05bfad44-0c7c-45f2-a3c4-3eccea71965d   Start Hiring (Part 1/8)
//   4b883c7d-72c1-4f9c-8196-de68fce303d6   Contact Request (via /contact)
//
// The quick hiring form - the primary conversion path on nine pages, and the
// form the pricing calculator unlock also posts to - is 8f974ef4. It matched
// nothing. So a successful submission created a contact, created no deal,
// reached no board, and notified nobody. Found by the forms audit,
// docs/briefs/active/FORMS-AUDIT.md, 16 Aug 2026.
//
// WHY THIS USES THE v4 API. The v3 workflows endpoint still returns this
// workflow, but it has been migrated (`enrollmentMigrationStatus:
// PLATFORM_OWNED`), so v3 reports `segmentCriteria: []`, `triggerSets: []` and
// `UNSUPPORTED_ACTION` steps. Reading v3 gives the false impression that the
// criteria cannot be seen or edited via API at all - which is what this session
// initially concluded and got wrong. `automation/v4/flows` carries the real
// enrolment criteria in full. Note the two APIs use DIFFERENT ids for the same
// workflow: 97782078 on v3, 1738564756 on v4.
//
// WHAT IT CHANGES. One thing. It appends a third branch to
// `enrollmentCriteria.eventFilterBranches`, copying the exact shape of the two
// that already exist (same `eventTypeId`, same HAS_COMPLETED operator, same
// hs_form_id IS_ANY_OF filter) and swapping the form id. It does not touch the
// actions, the delay, the re-enrolment setting, or anything else.
//
// SAFETY. Three things, because this writes to a live workflow that creates
// deals:
//   1. The full current flow is written to disk before any write, so the
//      previous state can be restored by hand if needed.
//   2. `revisionId` is sent back with the PATCH. If somebody edits the workflow
//      in the HubSpot UI between the read and the write, HubSpot rejects it
//      rather than silently overwriting their change.
//   3. Idempotent: if the form is already enrolled, it reports and exits
//      without writing.
//
// WHAT IT DELIBERATELY DOES NOT DO. The first action in this workflow is a
// 15-minute delay (`delayMillis: 900000`), which is why lead notifications lag.
// Removing it changes timing for every lead already flowing through this
// workflow, so it is a separate decision and not bundled in here.
//
// KNOWN CONSEQUENCE, worth deciding on separately: the pricing calculator
// unlock posts to this same form id. Once enrolled, a visitor who only wanted
// to see prices will create a deal that looks like a hiring enquiry. They carry
// `ce_lead_gateway: 'pricing_unlock'` so they can be told apart, but only if
// somebody filters on it. The clean fix is a separate form for the pricing
// gate.
//
// Run (preview):  npx tsx scripts/hubspot/add-quick-hiring-form-to-mql-workflow.ts
// Run (write):    npx tsx scripts/hubspot/add-quick-hiring-form-to-mql-workflow.ts --apply
// Token: HUBSPOT_ACCESS_TOKEN (needs automation write)

const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const FLOW_ID = '1738564756'
const QUICK_HIRING_FORM_ID = '8f974ef4-a3dd-4bba-ad3a-086054ac235b'
const BACKUP_PATH = 'audit-output/hubspot/mql-workflow-before.json'

interface Filter {
  property?: string
  operation?: { values?: string[] }
}
interface Branch {
  filters?: Filter[]
  eventTypeId?: string
  operator?: string
  filterBranchType?: string
  filterBranchOperator?: string
  filterBranches?: unknown[]
}
interface Flow {
  id: string
  name: string
  revisionId: string
  isEnabled: boolean
  enrollmentCriteria: {
    eventFilterBranches: Branch[]
    [k: string]: unknown
  }
}

function formIdsIn(branches: Branch[]): string[] {
  return branches.flatMap((b) => b.filters?.flatMap((f) => f.operation?.values ?? []) ?? [])
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.hubapi.com/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${path}\n${text.slice(0, 500)}`)
  return JSON.parse(text) as T
}

async function main(): Promise<void> {
  if (!TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN is not set.')
  const apply = process.argv.includes('--apply')

  const flow = await api<Flow>(`automation/v4/flows/${FLOW_ID}`)
  console.log(`Workflow: ${flow.name}`)
  console.log(`Enabled : ${flow.isEnabled}`)
  console.log(`Revision: ${flow.revisionId}\n`)

  const branches = flow.enrollmentCriteria?.eventFilterBranches ?? []
  const current = formIdsIn(branches)
  console.log('Currently enrols on:')
  current.forEach((id) => console.log(`   ${id}`))

  if (current.includes(QUICK_HIRING_FORM_ID)) {
    console.log(`\nAlready enrolled on ${QUICK_HIRING_FORM_ID}. Nothing to do.`)
    return
  }

  const template = branches[0]
  if (!template) throw new Error('No existing enrolment branch to copy the shape from.')

  // Deep clone the existing branch and swap only the form id, so the new branch
  // is structurally identical to one HubSpot already accepts. Building it from
  // scratch risks a subtly different shape that validates but behaves oddly.
  const added = JSON.parse(JSON.stringify(template)) as Branch
  for (const f of added.filters ?? []) {
    if (f.property === 'hs_form_id' && f.operation) f.operation.values = [QUICK_HIRING_FORM_ID]
  }

  console.log(`\nWill add:\n   ${QUICK_HIRING_FORM_ID}   (CE Web - Quick Hiring Form)`)

  if (!apply) {
    console.log('\nPreview only. Re-run with --apply to write it.')
    return
  }

  mkdirSync(dirname(BACKUP_PATH), { recursive: true })
  writeFileSync(BACKUP_PATH, JSON.stringify(flow, null, 2))
  console.log(`\nBacked up current flow to ${BACKUP_PATH}`)

  const updated = await api<Flow>(`automation/v4/flows/${FLOW_ID}`, {
    method: 'PATCH',
    body: JSON.stringify({
      revisionId: flow.revisionId,
      enrollmentCriteria: {
        ...flow.enrollmentCriteria,
        eventFilterBranches: [...branches, added],
      },
    }),
  })

  const after = formIdsIn(updated.enrollmentCriteria?.eventFilterBranches ?? [])
  console.log('\nNow enrols on:')
  after.forEach((id) => console.log(`   ${id}`))
  console.log(
    after.includes(QUICK_HIRING_FORM_ID)
      ? '\nDone. Quick hiring form leads will now create MQL deals.'
      : '\nWRITE ACCEPTED BUT FORM NOT PRESENT - check the workflow in HubSpot before trusting this.',
  )
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
