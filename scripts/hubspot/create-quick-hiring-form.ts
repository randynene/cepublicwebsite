// Create the HubSpot form behind the quick hiring form (surface 4).
//
// Decision D2 of docs/HUBSPOT_FORMS_STRATEGY.md: ONE new form, and it does not
// reuse `24f5bd5f` (the calculator's "Start Hiring Request"). Mixing quick-form
// leads into that form's submission history makes both unreadable, and it carries
// no fields for skills, duration or commitment.
//
// The visitor never sees this form. The UI is a bespoke dark/lime React component
// and it posts to the HubSpot Forms submission API, which validates the payload
// against THIS definition. So every field the component intends to send has to
// exist here, including the two hidden ones, or HubSpot rejects the submission.
// That is the only reason the field list matters; the styling on it never renders.
//
// Naming follows D6: `CE Web - <Gateway>`. This is the first form to carry the
// convention. Renaming the existing forms to match is a SEPARATE pass that needs
// Jake's sign-off and Seb being told first, and this script does not touch them.
//
// SAFETY. Additive and idempotent. It looks for a form of this name first and
// leaves it alone if one exists. There is no PATCH and no DELETE in this file, so
// a re-run cannot alter a form or lose a submission.
//
// Run: npm run hubspot:create-quick-hiring-form
// Preview without writing: DRY_RUN=1 npm run hubspot:create-quick-hiring-form

export {}

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const DRY_RUN = process.env.DRY_RUN === '1'

const FORM_NAME = 'CE Web - Quick Hiring Form'

/**
 * Where HubSpot sends a visitor who somehow submits the raw embed rather than our
 * component. The component pushes to book-a-call itself, so this is a backstop,
 * not the mechanism. Absolute URL because HubSpot requires one.
 */
const POST_SUBMIT_REDIRECT = 'https://www.cloudemployee.io/book-a-call'

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  console.error('A cloud agent only receives secrets added BEFORE the agent started.')
  process.exit(1)
}

type Field = Record<string, unknown>

function text(name: string, label: string, required: boolean): Field {
  return { objectTypeId: '0-1', name, label, required, hidden: false, fieldType: 'single_line_text' }
}

function dropdown(name: string, label: string, values: Array<[string, string]>): Field {
  return {
    objectTypeId: '0-1',
    name,
    label,
    required: true,
    hidden: false,
    fieldType: 'dropdown',
    options: values.map(([value, optionLabel], i) => ({
      label: optionLabel,
      value,
      description: '',
      displayOrder: i,
    })),
  }
}

function hidden(name: string, label: string): Field {
  return { objectTypeId: '0-1', name, label, required: false, hidden: true, fieldType: 'single_line_text' }
}

/**
 * Grouped to mirror the four-step Proxify shape the component implements. HubSpot
 * does not enforce the stepping - our component does - but the grouping keeps the
 * definition readable next to the UI.
 *
 * HubSpot caps a group at 3 fields, which is why the contact step is split across
 * two groups rather than one.
 */
const FIELD_GROUPS = [
  {
    groupType: 'default_group',
    richTextType: 'text',
    fields: [
      {
        objectTypeId: '0-1',
        name: 'ce_skills_requested',
        label: 'Skills needed',
        required: true,
        hidden: false,
        fieldType: 'multi_line_text',
        description: 'Comma separated. Free text on purpose - see D4.',
      },
    ],
  },
  {
    groupType: 'default_group',
    richTextType: 'text',
    fields: [
      dropdown('ce_engagement_length', 'How long do you need them?', [
        ['6_months_plus', '6+ months'],
        ['3_to_6_months', '3 to 6 months'],
        ['1_to_3_months', '1 to 3 months'],
        ['not_sure', 'Not sure'],
      ]),
    ],
  },
  {
    groupType: 'default_group',
    richTextType: 'text',
    fields: [
      dropdown('ce_commitment', 'What commitment?', [
        ['full_time', 'Full-time'],
        ['part_time', 'Part-time'],
        ['hourly', 'Hourly'],
      ]),
    ],
  },
  {
    groupType: 'default_group',
    richTextType: 'text',
    fields: [
      text('firstname', 'First name', true),
      text('lastname', 'Last name', false),
      {
        objectTypeId: '0-1',
        name: 'email',
        label: 'Work email',
        required: true,
        hidden: false,
        fieldType: 'email',
        validation: { blockedEmailDomains: [], useDefaultBlockList: false },
      },
    ],
  },
  {
    groupType: 'default_group',
    richTextType: 'text',
    fields: [
      {
        objectTypeId: '0-1',
        name: 'phone',
        label: 'Phone',
        required: false,
        hidden: false,
        fieldType: 'phone',
        useCountryCodeSelect: false,
        validation: { minAllowedDigits: 7, maxAllowedDigits: 20 },
      },
      text('company', 'Company', false),
    ],
  },
  {
    groupType: 'default_group',
    richTextType: 'text',
    fields: [
      hidden('ce_lead_gateway', 'Lead gateway'),
      hidden('ce_source_page', 'Source page'),
    ],
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
  const body = await res.text()
  let json: unknown = null
  try {
    json = JSON.parse(body)
  } catch {
    // Non-JSON error bodies happen; `body` is the fallback.
  }
  return { status: res.status, ok: res.ok, json, text: body }
}

type FormSummary = { id: string; name: string }

async function findByName(name: string): Promise<FormSummary | null> {
  let after: string | undefined
  for (;;) {
    const qs = new URLSearchParams({ limit: '100' })
    if (after) qs.set('after', after)
    const page = await hs(`/marketing/v3/forms?${qs}`)
    if (!page.ok) throw new Error(`Could not list forms: ${page.status} ${page.text.slice(0, 200)}`)
    const data = page.json as { results: FormSummary[]; paging?: { next?: { after?: string } } }
    const found = data.results.find((f) => f.name === name)
    if (found) return found
    after = data.paging?.next?.after
    if (!after) return null
  }
}

async function main(): Promise<void> {
  console.log(`Quick hiring form${DRY_RUN ? ' (DRY RUN - nothing will be written)' : ''}\n`)

  const existing = await findByName(FORM_NAME)
  if (existing) {
    console.log(`"${FORM_NAME}" already exists. Left alone.`)
    console.log(`\nFORM GUID: ${existing.id}`)
    return
  }

  if (DRY_RUN) {
    console.log(`"${FORM_NAME}" does not exist. WOULD CREATE it with:`)
    console.log(
      `  ${FIELD_GROUPS.flatMap((g) => g.fields).map((f) => String(f.name)).join(', ')}`,
    )
    return
  }

  // HubSpot's create schema reuses the read schema, so it rejects a payload
  // without `createdAt` / `updatedAt` / `archived` even though it sets its own.
  const now = new Date().toISOString()

  const created = await hs('/marketing/v3/forms', {
    method: 'POST',
    body: JSON.stringify({
      formType: 'hubspot',
      name: FORM_NAME,
      createdAt: now,
      updatedAt: now,
      archived: false,
      fieldGroups: FIELD_GROUPS,
      configuration: {
        language: 'en',
        cloneable: true,
        editable: true,
        archivable: true,
        recaptchaEnabled: false,
        notifyContactOwner: false,
        createNewContactForNewEmail: false,
        prePopulateKnownValues: true,
        allowLinkToResetKnownValues: false,
        postSubmitAction: { type: 'redirect_url', value: POST_SUBMIT_REDIRECT },
      },
      displayOptions: {
        renderRawHtml: false,
        theme: 'default_style',
        submitButtonText: 'Book a call',
        cssClass: 'hs-form stacked',
      },
      // Consent wording is J-E / J7, a legal call for Jake. CE runs no consent
      // banner today, so this ships as `none` rather than inventing wording.
      legalConsentOptions: { type: 'none' },
    }),
  })

  if (!created.ok) {
    throw new Error(`Could not create the form: ${created.status} ${created.text.slice(0, 600)}`)
  }

  const form = created.json as { id: string; name: string }
  console.log(`CREATED "${form.name}"`)
  console.log(`\nFORM GUID: ${form.id}`)
  console.log('')
  console.log('Not wired to anything yet. The React component is a later step.')
  console.log('Nothing renders this form, so nothing can submit to it by accident.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
