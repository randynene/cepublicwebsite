// Create the five custom contact properties the lead-gateway model needs.
//
// Locked in decision D4 of docs/HUBSPOT_FORMS_STRATEGY.md. The quick hiring form
// (surface 4) writes three of them, and `ce_lead_gateway` / `ce_source_page` apply
// to every gateway, including Ask Clara. Clara's track is instructed to write
// these same names rather than invent its own, because otherwise gateway 3 and
// gateway 4 leads are not comparable and the whole four-gateway model stops
// meaning anything.
//
// SAFETY. This script is additive and idempotent by construction:
//
//   - It GETs each property first. If the property exists it is LEFT ALONE. There
//     is no PATCH anywhere in this file, so a re-run cannot overwrite a label, an
//     option list, or a value Seb has since edited in HubSpot.
//   - Where an existing property's shape differs from what we would have created,
//     it says so and moves on. Reporting a divergence is useful; silently
//     "fixing" someone else's property is not.
//   - It creates nothing else. No forms, no contacts, no workflows.
//
// Run: npm run hubspot:create-lead-properties
// Preview without writing: DRY_RUN=1 npm run hubspot:create-lead-properties

// Marks the file as a module so its top-level consts do not collide with the
// other import-less scripts in the same typecheck project.
export {}

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const DRY_RUN = process.env.DRY_RUN === '1'

/**
 * A dedicated group, so the five sit together in HubSpot's property list rather
 * than being lost among the ~200 in "Contact information". That grouping is the
 * whole point of the tidy-up.
 */
const GROUP = { name: 'ce_website', label: 'CE Website' }

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  console.error('A cloud agent only receives secrets added BEFORE the agent started.')
  process.exit(1)
}

type Option = { label: string; value: string; displayOrder: number }

type PropertySpec = {
  name: string
  label: string
  description: string
  /** HubSpot's data type. */
  type: 'string' | 'enumeration'
  /** How it renders in the UI. */
  fieldType: 'text' | 'textarea' | 'select'
  options?: Option[]
}

function options(values: Array<[string, string]>): Option[] {
  return values.map(([value, label], i) => ({ value, label, displayOrder: i }))
}

const SPECS: PropertySpec[] = [
  {
    name: 'ce_skills_requested',
    label: 'Skills requested',
    description:
      'Skills the visitor selected on the quick hiring form, comma separated. Deliberately free text rather than a checkbox property: a checkbox list has to be maintained inside HubSpot every time CE adds a skill, and a skill nobody remembers to add is silently dropped on submit. Text never breaks.',
    type: 'string',
    fieldType: 'textarea',
  },
  {
    name: 'ce_engagement_length',
    label: 'Engagement length',
    description: 'How long the visitor expects to need the engineer. Step 2 of the quick hiring form.',
    type: 'enumeration',
    fieldType: 'select',
    options: options([
      ['6_months_plus', '6+ months'],
      ['3_to_6_months', '3 to 6 months'],
      ['1_to_3_months', '1 to 3 months'],
      ['not_sure', 'Not sure'],
    ]),
  },
  {
    name: 'ce_commitment',
    label: 'Commitment',
    description: 'Full-time, part-time or hourly. Step 3 of the quick hiring form.',
    type: 'enumeration',
    fieldType: 'select',
    options: options([
      ['full_time', 'Full-time'],
      ['part_time', 'Part-time'],
      ['hourly', 'Hourly'],
    ]),
  },
  {
    name: 'ce_lead_gateway',
    label: 'Lead gateway',
    description:
      'Which of the named gateways produced this lead. The highest-value property here: it makes "where do our leads actually come from" answerable in HubSpot forever, across every surface rather than just the quick hiring form.',
    type: 'enumeration',
    fieldType: 'select',
    options: options([
      ['book_a_call', 'Book a call (Calendly)'],
      ['contact_form', 'Contact form'],
      ['quick_hiring_form', 'Quick hiring form'],
      ['ask_clara', 'Ask Clara'],
      ['newsletter', 'Newsletter (retired)'],
      ['start_hiring_legacy', 'Start Hiring funnel (retired)'],
    ]),
  },
  {
    name: 'ce_source_page',
    label: 'Source page',
    description:
      'Path of the page the lead was submitted from, e.g. /services/software-engineers. Distinct from HubSpot\'s own first-touch analytics: this is where they converted, not where they landed.',
    type: 'string',
    fieldType: 'text',
  },
]

async function hs(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; ok: boolean; json: unknown; text: string }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = JSON.parse(text)
  } catch {
    // Non-JSON error bodies happen; `text` is the fallback.
  }
  return { status: res.status, ok: res.ok, json, text }
}

type ExistingProperty = {
  name: string
  label: string
  type: string
  fieldType: string
  groupName: string
  options?: Array<{ value: string; label: string }>
}

async function ensureGroup(): Promise<void> {
  const found = await hs(`/crm/v3/properties/contacts/groups/${GROUP.name}`)
  if (found.ok) {
    console.log(`group ${GROUP.name}: exists, left alone`)
    return
  }
  if (found.status !== 404) {
    throw new Error(`Unexpected ${found.status} reading group ${GROUP.name}: ${found.text.slice(0, 200)}`)
  }
  if (DRY_RUN) {
    console.log(`group ${GROUP.name}: WOULD CREATE (dry run)`)
    return
  }
  const created = await hs('/crm/v3/properties/contacts/groups', {
    method: 'POST',
    body: JSON.stringify({ name: GROUP.name, label: GROUP.label, displayOrder: -1 }),
  })
  if (!created.ok) {
    throw new Error(`Could not create group ${GROUP.name}: ${created.status} ${created.text.slice(0, 300)}`)
  }
  console.log(`group ${GROUP.name}: CREATED`)
}

/** Everything about an existing property that differs from what we would create. */
function divergences(spec: PropertySpec, existing: ExistingProperty): string[] {
  const out: string[] = []
  if (existing.type !== spec.type) out.push(`type is "${existing.type}", spec says "${spec.type}"`)
  if (existing.fieldType !== spec.fieldType) {
    out.push(`fieldType is "${existing.fieldType}", spec says "${spec.fieldType}"`)
  }
  if (existing.groupName !== GROUP.name) {
    out.push(`sits in group "${existing.groupName}", spec says "${GROUP.name}"`)
  }
  const want = new Set((spec.options ?? []).map((o) => o.value))
  const have = new Set((existing.options ?? []).map((o) => o.value))
  const missing = [...want].filter((v) => !have.has(v))
  const extra = [...have].filter((v) => !want.has(v))
  if (missing.length) out.push(`missing option(s): ${missing.join(', ')}`)
  if (extra.length) out.push(`has extra option(s): ${extra.join(', ')}`)
  return out
}

type Outcome = 'created' | 'exists' | 'would-create'

async function ensureProperty(spec: PropertySpec): Promise<Outcome> {
  const found = await hs(`/crm/v3/properties/contacts/${spec.name}`)

  if (found.ok) {
    const existing = found.json as ExistingProperty
    const diffs = divergences(spec, existing)
    console.log(`${spec.name}: exists, left alone`)
    for (const d of diffs) console.log(`  note: ${d}`)
    if (diffs.length) {
      console.log('  not changed. Editing an existing property is a separate, deliberate decision.')
    }
    return 'exists'
  }

  if (found.status !== 404) {
    throw new Error(`Unexpected ${found.status} reading ${spec.name}: ${found.text.slice(0, 200)}`)
  }

  if (DRY_RUN) {
    console.log(`${spec.name}: WOULD CREATE (dry run)`)
    return 'would-create'
  }

  const created = await hs('/crm/v3/properties/contacts', {
    method: 'POST',
    body: JSON.stringify({
      name: spec.name,
      label: spec.label,
      description: spec.description,
      groupName: GROUP.name,
      type: spec.type,
      fieldType: spec.fieldType,
      ...(spec.options ? { options: spec.options } : {}),
      hasUniqueValue: false,
      hidden: false,
      formField: true,
    }),
  })
  if (!created.ok) {
    throw new Error(`Could not create ${spec.name}: ${created.status} ${created.text.slice(0, 400)}`)
  }
  console.log(`${spec.name}: CREATED`)
  return 'created'
}

async function main(): Promise<void> {
  console.log(`CE lead properties${DRY_RUN ? ' (DRY RUN - nothing will be written)' : ''}\n`)

  await ensureGroup()
  console.log('')

  const outcomes: Outcome[] = []
  for (const spec of SPECS) {
    outcomes.push(await ensureProperty(spec))
  }

  const created = outcomes.filter((o) => o === 'created').length
  const exists = outcomes.filter((o) => o === 'exists').length
  const would = outcomes.filter((o) => o === 'would-create').length

  console.log('')
  console.log(`created ${created} · already existed ${exists}${would ? ` · would create ${would}` : ''}`)
  if (created === 0 && would === 0) {
    console.log('No-op. Re-running this script changes nothing, which is the point.')
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
