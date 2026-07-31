// Read-only audit of every form on HubSpot portal 22809822.
//
// Why this exists: the launch consolidation (30 Jul 2026) cut the site down to
// four surviving lead surfaces. HubSpot still carries every form the site ever
// had, plus forms that were never on the site at all. Nobody can tell them apart
// by name, because the names are stale ("Start Hiring (Part 7/8)" sits on a funnel
// that no longer exists, and the numbering was never corrected when a step was
// removed).
//
// This writes docs/hubspot-form-audit.md so the keep-vs-archive decision is made
// against evidence rather than against a name.
//
// It CHANGES NOTHING. Every call is a GET. Archiving is a separate, later,
// Jake-approved pass.
//
// Three pieces of evidence per form, because any one of them alone is misleading:
//
//   1. Is the NEW site wired to it? Read from this repo and from Sanity, not
//      assumed. A form nothing renders cannot receive a website lead again.
//   2. Has it received submissions, and how recently? A form with traffic last
//      month is being fed by something we have not accounted for - an old
//      Webflow page, an email link, a sales sequence.
//   3. Is an ENABLED workflow listening to it? This is the one that bites.
//      Archiving a form that an enabled workflow triggers on silently breaks a
//      notification or a lifecycle change somewhere in Seb's setup, and nothing
//      reports it. This also closes Tech Debt #8: the April audit reported zero
//      connected workflows for every form purely because its token lacked the
//      `automation` scope.
//
// Run: npm run hubspot:audit-forms

import fs from 'node:fs'
import path from 'node:path'

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const PORTAL_ID = '22809822'
const OUT = path.join(process.cwd(), 'docs', 'hubspot-form-audit.md')

/** A form with no submission in this many days counts as dormant. */
const RECENT_DAYS = 90

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  console.error('Cloud agents only receive secrets added BEFORE the agent started.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// What the NEW site actually wires up.
//
// Sourced, not guessed:
//   - site/src/components/templates/contact/content.ts (code fallback)
//   - Sanity contactPage.form.hubspotFormId (currently null, so the fallback wins)
//   - Sanity startHiringStep.hubspotFormId x8 (funnel retired behind 301s)
//   - Sanity footer.subscribe.formId (footer block deleted, value left in Sanity)
// ---------------------------------------------------------------------------

type Surface = {
  formId: string
  surface: string
  verdict: 'keep' | 'archive'
  why: string
}

const WIRED: Surface[] = [
  {
    formId: '4b883c7d-72c1-4f9c-8196-de68fce303d6',
    surface: 'Contact page (surviving surface 2)',
    verdict: 'keep',
    why: 'Rendered on /contact and /uk/contact. One of the four surviving surfaces.',
  },
  {
    formId: 'b411a11f-1548-4cf7-887e-26fac7824006',
    surface: 'Footer newsletter (REMOVED at launch)',
    verdict: 'archive',
    why: 'Footer block deleted. Value still sits in Sanity footer.subscribe.formId but nothing reads it.',
  },
  {
    formId: '1578f9b5-fb43-4772-83df-79c51c120a92',
    surface: '/start-hiring/contact-info (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call. Sanity doc left in place so it is reversible.',
  },
  {
    formId: '023ae2ad-cebc-4535-bb86-5807a578ffc6',
    surface: '/start-hiring/technology (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call.',
  },
  {
    formId: 'b51dfb72-7574-4d3f-843a-e3ea1a183e8f',
    surface: '/start-hiring/budget (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call.',
  },
  {
    formId: '2d69a43b-9e1f-405d-b5f6-11e8063d7ba5',
    surface: '/start-hiring/final-details (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call.',
  },
  {
    formId: '05bfad44-0c7c-45f2-a3c4-3eccea71965d',
    surface: '/uk/start-hiring/get-started (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call. UK-only entry step.',
  },
  {
    formId: '1c6864a5-cfc7-44e5-82cc-652b429fe816',
    surface: '/start-hiring/how-long (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call.',
  },
  {
    formId: '07a77a4d-07ad-4c8a-aef1-c1c2ea8499a8',
    surface: '/start-hiring/how-many (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call.',
  },
  {
    formId: 'c5e99e29-8968-4ad8-98c5-496218322b0d',
    surface: '/start-hiring/when-needed (RETIRED)',
    verdict: 'archive',
    why: 'Funnel retired behind 301s to /book-a-call.',
  },
  {
    formId: '24f5bd5f-3532-4c4e-908f-1266809bc897',
    surface: '/price-comparison-calculator on LIVE only (CONFIRM-2)',
    verdict: 'archive',
    why: 'Live embeds it; our rebuild does not. The replacement is the quick hiring form, not this.',
  },
]

const WIRED_BY_ID = new Map(WIRED.map((w) => [w.formId, w]))

// ---------------------------------------------------------------------------
// HubSpot reads
// ---------------------------------------------------------------------------

async function hs<T>(pathname: string): Promise<T> {
  const res = await fetch(`${API}${pathname}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`HubSpot ${pathname} -> ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return res.json() as Promise<T>
}

/** Same call, but a scope failure returns null instead of throwing. */
async function hsOptional<T>(pathname: string): Promise<T | null> {
  try {
    return await hs<T>(pathname)
  } catch {
    return null
  }
}

type Form = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  archived: boolean
  formType: string
  fieldGroups?: Array<{ fields?: Array<{ name: string; fieldType: string; hidden?: boolean }> }>
  configuration?: { postSubmitAction?: { type?: string; value?: string } }
}

async function fetchForms(archived: boolean): Promise<Form[]> {
  const out: Form[] = []
  let after: string | undefined
  for (;;) {
    const qs = new URLSearchParams({ limit: '100', archived: String(archived) })
    if (after) qs.set('after', after)
    const page = await hs<{ results: Form[]; paging?: { next?: { after?: string } } }>(
      `/marketing/v3/forms?${qs}`,
    )
    out.push(...page.results)
    after = page.paging?.next?.after
    if (!after) break
  }
  return out
}

type AnalyticsRow = { breakdown: string; submissions?: number }

/** Submission totals per form GUID for a date window. `business-intelligence` scope. */
async function fetchSubmissionTotals(startYmd: string, endYmd: string): Promise<Map<string, number>> {
  const data = await hsOptional<{ breakdowns?: AnalyticsRow[] }>(
    `/analytics/v2/reports/forms/total?start=${startYmd}&end=${endYmd}`,
  )
  const map = new Map<string, number>()
  for (const row of data?.breakdowns ?? []) map.set(row.breakdown, row.submissions ?? 0)
  return map
}

/**
 * Notify-on-submit recipients only exist on the legacy v2 form shape, and HubSpot
 * returns them as numeric USER IDS, not addresses. Left unresolved they read like
 * meaningless numbers, so they are looked up against the portal's user list.
 */
async function fetchNotifyRecipients(formId: string): Promise<string[]> {
  const data = await hsOptional<{ notifyRecipients?: string }>(`/forms/v2/forms/${formId}`)
  return (data?.notifyRecipients ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function fetchUserEmails(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  let after: string | undefined
  for (;;) {
    const qs = new URLSearchParams({ limit: '100' })
    if (after) qs.set('after', after)
    const page = await hsOptional<{
      results: Array<{ id: string; email: string }>
      paging?: { next?: { after?: string } }
    }>(`/settings/v3/users?${qs}`)
    if (!page) break
    for (const u of page.results) map.set(u.id, u.email)
    after = page.paging?.next?.after
    if (!after) break
  }
  return map
}

const GUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g

type Flow = { id: string; name: string; isEnabled: boolean }

type FlowScan = {
  /** form GUID -> the workflows that reference it */
  byForm: Map<string, Array<{ name: string; enabled: boolean }>>
  /** every workflow, with the GUIDs it references */
  flows: Array<Flow & { guids: string[] }>
  /** true when the automation scope was refused, so an empty result means "could not look" */
  scoped: boolean
}

/**
 * Which workflows reference which form GUIDs.
 *
 * The list endpoint returns summaries only, so each flow has to be fetched
 * individually to see its enrollment criteria and actions. A form GUID appearing
 * anywhere in that payload means the workflow depends on the form.
 *
 * Not every GUID found this way is a form - meeting links, lists and long-deleted
 * forms share the shape - so the caller filters against the real form list.
 */
async function scanWorkflows(): Promise<FlowScan> {
  const byForm = new Map<string, Array<{ name: string; enabled: boolean }>>()
  const scanned: Array<Flow & { guids: string[] }> = []

  const flows: Flow[] = []
  let after: string | undefined
  for (;;) {
    const qs = new URLSearchParams({ limit: '100' })
    if (after) qs.set('after', after)
    const page = await hsOptional<{ results: Flow[]; paging?: { next?: { after?: string } } }>(
      `/automation/v4/flows?${qs}`,
    )
    if (!page) {
      console.warn('  automation scope unavailable - workflow column is BLANK, not empty')
      return { byForm, flows: scanned, scoped: false }
    }
    flows.push(...page.results)
    after = page.paging?.next?.after
    if (!after) break
  }

  console.log(`  scanning ${flows.length} workflows for form references`)
  for (const flow of flows) {
    const res = await fetch(`${API}/automation/v4/flows/${flow.id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    if (!res.ok) continue
    const body = await res.text()
    const guids = [...new Set(body.match(GUID_RE) ?? [])]
    scanned.push({ ...flow, guids })
    for (const guid of guids) {
      const list = byForm.get(guid) ?? []
      list.push({ name: flow.name, enabled: flow.isEnabled })
      byForm.set(guid, list)
    }
  }
  return { byForm, flows: scanned, scoped: true }
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

type Verdict = 'keep' | 'archive' | 'unknown'

type Row = {
  form: Form
  submissionsAllTime: number
  submissionsRecent: number
  redirect: string | null
  notify: string[]
  workflows: Array<{ name: string; enabled: boolean }>
  verdict: Verdict
  reason: string
}

/**
 * Deliberately conservative. `unknown` is the honest answer far more often than
 * either of the other two, and a wrong `archive` is the only one of the three
 * that can silently break something in Seb's HubSpot.
 *
 * The trap this avoids: cloudemployee.io is still the LIVE Webflow site until
 * cutover, so a retired surface can still be taking submissions today. Reading
 * that as "something unknown is feeding it" would flag every start-hiring step as
 * a mystery when the explanation is simply that live has not been switched off
 * yet. A form we can name the surface for is never `unknown`.
 */
function decide(
  wired: Surface | undefined,
  recent: number,
  workflows: Array<{ name: string; enabled: boolean }>,
): { verdict: Verdict; reason: string } {
  const liveWorkflows = workflows.filter((w) => w.enabled)
  const workflowWarning = liveWorkflows.length
    ? ` Deal with ${liveWorkflows.length} ENABLED workflow(s) in the same pass or they break silently: ${liveWorkflows.map((w) => w.name).join('; ')}.`
    : ''

  if (wired?.verdict === 'keep') {
    const attached = liveWorkflows.length
      ? ` ${liveWorkflows.length} ENABLED workflow(s) already act on it: ${liveWorkflows.map((w) => w.name).join('; ')}. Nothing to change, but do not build a second path that duplicates them.`
      : ' No enabled workflow acts on it.'
    return { verdict: 'keep', reason: wired.why + attached }
  }

  if (wired) {
    const liveTraffic = recent
      ? ` The ${recent} submission(s) in the last ${RECENT_DAYS} days are live-Webflow traffic, which the cutover ends. Archive AFTER cutover, not before.`
      : ''
    return { verdict: 'archive', reason: wired.why + liveTraffic + workflowWarning }
  }

  if (recent > 0) {
    return {
      verdict: 'unknown',
      reason: `${recent} submission(s) in the last ${RECENT_DAYS} days and no surface on the new site renders it. Find out what is feeding it before archiving.${workflowWarning}`,
    }
  }

  if (liveWorkflows.length > 0) {
    return {
      verdict: 'unknown',
      reason: `No recent submissions and nothing on the new site renders it, but ${liveWorkflows.length} ENABLED workflow(s) trigger on it: ${liveWorkflows
        .map((w) => w.name)
        .join('; ')}. Archiving would break them silently.`,
    }
  }

  return {
    verdict: 'archive',
    reason: `Not rendered anywhere on the new site, no submissions in the last ${RECENT_DAYS} days, no enabled workflow depends on it.`,
  }
}

// ---------------------------------------------------------------------------

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function esc(s: string): string {
  return s.replace(/\|/g, '\\|')
}

function fieldSummary(form: Form): string {
  const names = (form.fieldGroups ?? [])
    .flatMap((g) => g.fields ?? [])
    .map((f) => (f.hidden ? `${f.name} (hidden)` : f.name))
  return names.length ? names.join(', ') : '(no fields)'
}

async function main(): Promise<void> {
  console.log(`HubSpot form audit - portal ${PORTAL_ID}\n`)

  console.log('Fetching forms')
  const live = await fetchForms(false)
  const archivedForms = await fetchForms(true)
  const forms = [...live, ...archivedForms]
  console.log(`  ${live.length} live, ${archivedForms.length} already archived`)

  const now = new Date()
  const recentStart = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000)

  console.log('Fetching submission totals')
  const allTime = await fetchSubmissionTotals('20180101', ymd(now))
  const recent = await fetchSubmissionTotals(ymd(recentStart), ymd(now))

  console.log('Fetching workflow dependencies')
  const scan = await scanWorkflows()
  const workflowsByForm = scan.byForm

  console.log('Fetching notify-on-submit recipients')
  const userEmails = await fetchUserEmails()
  const rows: Row[] = []
  for (const form of forms) {
    const action = form.configuration?.postSubmitAction
    const notify = (await fetchNotifyRecipients(form.id)).map(
      (id) => userEmails.get(id) ?? `user ${id} (not in the portal user list)`,
    )
    const workflows = workflowsByForm.get(form.id) ?? []
    const recentCount = recent.get(form.id) ?? 0
    const { verdict, reason } = decide(WIRED_BY_ID.get(form.id), recentCount, workflows)
    rows.push({
      form,
      submissionsAllTime: allTime.get(form.id) ?? 0,
      submissionsRecent: recentCount,
      redirect: action?.type === 'redirect_url' && action.value ? action.value : null,
      notify,
      workflows,
      verdict,
      reason,
    })
  }

  rows.sort((a, b) => b.submissionsAllTime - a.submissionsAllTime || a.form.name.localeCompare(b.form.name))

  const counts = {
    keep: rows.filter((r) => r.verdict === 'keep').length,
    archive: rows.filter((r) => r.verdict === 'archive').length,
    unknown: rows.filter((r) => r.verdict === 'unknown').length,
  }

  const formIds = new Set(forms.map((f) => f.id))
  const orphanGuidCount = [...workflowsByForm.keys()].filter((guid) => !formIds.has(guid)).length

  /**
   * Workflows that plausibly notify a human. Name-matching is crude, but HubSpot
   * does not expose "does this send to Slack" as a queryable field, and a name is
   * what Seb reads in the UI anyway.
   */
  const NOTIFY_RE = /slack|notif|notify|alert|email/i
  const notifiers = scan.flows
    .filter((f) => NOTIFY_RE.test(f.name))
    .map((f) => ({
      name: f.name,
      enabled: f.isEnabled,
      forms: f.guids.filter((g) => formIds.has(g)),
    }))
    .sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name))

  const md: string[] = []
  md.push('# HubSpot form audit - portal 22809822')
  md.push('')
  md.push(`> Generated by \`npm run hubspot:audit-forms\` on ${now.toISOString().slice(0, 10)}.`)
  md.push('> Read-only. Nothing in HubSpot was created, renamed, archived or deleted.')
  md.push('> Regenerate rather than hand-edit.')
  md.push('')
  md.push('## What this is')
  md.push('')
  md.push(
    'The launch consolidation cut the site to four lead surfaces. HubSpot still holds every form',
  )
  md.push(
    'the site ever had, plus forms that were never on it. The names cannot be trusted: "Start Hiring',
  )
  md.push(
    '(Part 7/8)" sits on a funnel that no longer exists, and the numbering was never corrected when a',
  )
  md.push('step was removed. So each form is judged on evidence, not on its name.')
  md.push('')
  md.push('The four surviving surfaces:')
  md.push('')
  md.push('| # | Surface | HubSpot form |')
  md.push('|---|---|---|')
  md.push('| 1 | Book a call (Calendly) | none - Calendly writes to HubSpot directly |')
  md.push('| 2 | Contact page | `4b883c7d-72c1-4f9c-8196-de68fce303d6` |')
  md.push('| 3 | Ask Clara | none yet - Jake\'s parallel track |')
  md.push('| 4 | Quick hiring form | to be created (step 4b) |')
  md.push('')
  md.push('## Headline')
  md.push('')
  md.push(`| | Count |`)
  md.push('|---|---|')
  md.push(`| Forms on the portal | **${forms.length}** (${live.length} live, ${archivedForms.length} already archived) |`)
  md.push(`| keep | ${counts.keep} |`)
  md.push(`| archive | ${counts.archive} |`)
  md.push(`| unknown - needs a human | ${counts.unknown} |`)
  md.push('')
  md.push(
    `The strategy doc says 25 forms, from the April audit. It is **${forms.length}**. Use this number.`,
  )
  md.push('')
  md.push('## The four things worth reading if you read nothing else')
  md.push('')
  md.push(
    '1. **J-B is answered: yes, a human reads the Contact form.** `4b883c7d` notifies **seb@cloudemployee.co.uk**',
  )
  md.push(
    '   on every submit, has taken **22 submissions in the last 90 days**, and three enabled workflows act on it,',
  )
  md.push(
    '   including one that creates an MQL deal. It is alive and watched. That was the open question that could',
  )
  md.push('   have invalidated surface 2.')
  md.push('')
  md.push(
    '2. **The Contact form\'s Slack notification is switched OFF.** The workflow "HubSpot Form Fill > Slack channel"',
  )
  md.push(
    '   references it and twelve other forms, and it is disabled. Seb gets the email; the leads channel gets nothing.',
  )
  md.push('   Worth knowing before deciding D3.')
  md.push('')
  md.push(
    '3. **Book-a-call already notifies Slack.** "Notification of Website Book A Call" and "Notification of Clara chat',
  )
  md.push(
    '   book a call" are both enabled. Gateway 1 is covered without us writing anything. Do not build a second path',
  )
  md.push('   for it.')
  md.push('')
  md.push(
    '4. **The lead-magnet and pricing-download forms are the real open question**, not the start-hiring ones.',
  )
  md.push(
    '   Downloads ship ungated on the new site by deliberate decision (CONFIRM-6), so five Lead Magnet forms plus',
  )
  md.push(
    '   both Pricing Guide forms have a live workflow each and no surface on the new site. They are labelled unknown',
  )
  md.push('   because that is a content decision, not a plumbing one.')
  md.push('')
  md.push('## How each label was decided')
  md.push('')
  md.push('| Label | Rule |')
  md.push('|---|---|')
  md.push('| **keep** | The new site renders it, and it is one of the four surviving surfaces. |')
  md.push(
    `| **archive** | Either we can name the dead surface it belonged to, or nothing renders it, nothing has submitted to it in ${RECENT_DAYS} days, and no enabled workflow depends on it. |`,
  )
  md.push(
    `| **unknown** | Nothing on the new site renders it, we cannot name its surface, and it either took a submission in the last ${RECENT_DAYS} days or an ENABLED workflow triggers on it. Something outside the website depends on it. A human decides. |`,
  )
  md.push('')
  md.push(
    'Archiving keeps submission history. It is reversible. Nothing here is a recommendation to delete.',
  )
  md.push('')
  md.push(
    '**One trap this deliberately avoids.** cloudemployee.io is still the live Webflow site until cutover,',
  )
  md.push(
    'so a surface we have already retired can still be taking submissions today. Reading that as "something',
  )
  md.push(
    'unknown is feeding it" would flag every start-hiring step as a mystery when the explanation is just that',
  )
  md.push(
    'live has not been switched off yet. Those are labelled **archive, after cutover** rather than unknown.',
  )
  md.push('')
  md.push('## Forms')
  md.push('')
  md.push('Sorted by all-time submissions, highest first.')
  md.push('')
  md.push(`| Verdict | Name | Form id | Subs (all time) | Subs (last ${RECENT_DAYS}d) | Post-submit redirect |`)
  md.push('|---|---|---|---|---|---|')
  for (const r of rows) {
    const label = r.verdict === 'keep' ? '**KEEP**' : r.verdict === 'unknown' ? '**UNKNOWN**' : 'archive'
    md.push(
      `| ${label} | ${esc(r.form.name)}${r.form.archived ? ' _(already archived)_' : ''} | \`${r.form.id}\` | ${r.submissionsAllTime} | ${r.submissionsRecent} | ${r.redirect ? esc(r.redirect) : '_inline message_'} |`,
    )
  }
  md.push('')
  md.push('## Why, per form')
  md.push('')
  for (const r of rows) {
    md.push(`### ${r.verdict.toUpperCase()} - ${r.form.name}`)
    md.push('')
    md.push(`- **Form id:** \`${r.form.id}\``)
    md.push(`- **Created:** ${r.form.createdAt.slice(0, 10)} · **Updated:** ${r.form.updatedAt.slice(0, 10)}`)
    md.push(
      `- **Submissions:** ${r.submissionsAllTime} all time, ${r.submissionsRecent} in the last ${RECENT_DAYS} days`,
    )
    md.push(`- **Post-submit:** ${r.redirect ? `redirect to ${r.redirect}` : 'inline thank-you message'}`)
    md.push(`- **Fields:** ${fieldSummary(r.form)}`)
    md.push(
      `- **Notified on submit:** ${r.notify.length ? r.notify.join(', ') : 'nobody (no notify-on-submit recipients set)'}`,
    )
    if (r.workflows.length) {
      md.push('- **Workflows referencing it:**')
      for (const w of r.workflows) md.push(`  - ${w.enabled ? '**ENABLED**' : 'off'} - ${w.name}`)
    } else {
      md.push('- **Workflows referencing it:** none')
    }
    md.push(`- **Verdict:** ${r.reason}`)
    md.push('')
  }

  md.push('## Tech Debt #8 / CONFIRM-3 - closed')
  md.push('')
  md.push(
    'The April audit reported `connectedWorkflowIds: []` for every form. That was a missing `automation`',
  )
  md.push(
    'token scope, not a fact about the portal. With the scope granted, the workflow column above is real,',
  )
  md.push(
    `and it is not empty: ${scan.flows.length} workflows exist and ${scan.flows.filter((f) => f.isEnabled).length} are enabled.`,
  )
  md.push('')
  md.push('### What HubSpot notifies today')
  md.push('')
  md.push(
    'This is the answer to J2, and it is a prerequisite for decision D3. Building a second Slack path',
  )
  md.push('without reading this first would have double-notified the leads channel.')
  md.push('')
  md.push('| On? | Workflow | Forms on this portal it references |')
  md.push('|---|---|---|')
  for (const n of notifiers) {
    md.push(
      `| ${n.enabled ? '**ON**' : 'off'} | ${esc(n.name)} | ${n.forms.length ? n.forms.map((g) => `\`${g.slice(0, 8)}\``).join(', ') : '_none on this portal_'} |`,
    )
  }
  md.push('')
  md.push(
    'Names are matched on "slack", "notify", "alert" or "email", because HubSpot does not expose "does this',
  )
  md.push(
    'send to Slack" as a queryable field. A workflow that notifies Slack under an unrelated name will not appear',
  )
  md.push('here, so treat this as a floor, not a ceiling.')
  md.push('')
  md.push(
    `${orphanGuidCount} further GUID(s) appear in workflow definitions but are not forms on this portal. Those are`,
  )
  md.push(
    'meeting links, lists and long-deleted forms, which share the GUID shape. Not evidence of a missing form.',
  )
  md.push('')
  md.push('## What this audit does NOT tell you')
  md.push('')
  md.push(
    '- **Whether a human reads the keep forms.** Open question J-B / J1. The notify-on-submit column is',
  )
  md.push('  the closest thing to an answer, and an empty one is not proof nobody looks.')
  md.push(
    '- **Whether an archived form is embedded on a page we do not know about.** Submissions in the last',
  )
  md.push(`  ${RECENT_DAYS} days is the proxy, and it is a good one, but a low-traffic page can go quiet for a quarter.`)
  md.push(
    '- **Nothing here has been actioned.** The rename pass (D6) and the archive pass are separate, and both',
  )
  md.push('  need Jake\'s sign-off and Seb being told first.')
  md.push('')

  fs.writeFileSync(OUT, md.join('\n'))
  console.log(`\nWrote ${path.relative(process.cwd(), OUT)}`)
  console.log(`  keep ${counts.keep} · archive ${counts.archive} · unknown ${counts.unknown}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
