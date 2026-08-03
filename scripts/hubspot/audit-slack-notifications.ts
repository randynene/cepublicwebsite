// What does HubSpot actually shout into Slack, and what will it shout after cutover?
//
// This exists because of a wrong answer. The step 3 form audit checked each form's
// own Slack toggle, found it off, and reported that the leads channel gets nothing
// from the Contact form. The channel plainly does get them. The toggle was never
// the mechanism: WORKFLOWS are, and there are 120 of them on this portal.
//
// Two things follow, and both matter more than the correction itself.
//
//   1. Do not build a second notifier for anything HubSpot already announces. The
//      leads channel would get every message twice, and a duplicated alert is how
//      a channel becomes noise that nobody reads.
//
//   2. Several of these fire off forms and pages that the new site retires. After
//      cutover they either go quiet, which nobody notices, or they announce a
//      surface that no longer exists. Both need a decision BEFORE the flip, and
//      neither is visible without listing them.
//
// Read-only. Every call is a GET. It changes nothing on the portal.
//
// Run: npm run hubspot:audit-slack-notifications
// Writes: docs/hubspot-slack-notifications.md

import { writeFileSync } from 'node:fs'

const API = 'https://api.hubapi.com'
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const OUT = 'docs/hubspot-slack-notifications.md'

/** HubSpot's "send a Slack message" action. */
const SLACK_ACTION_TYPE_ID = '1-179507819'

/**
 * Surfaces the launch consolidation removes. A hit is a PROMPT, not a verdict:
 * it means "check this one", not "this is broken".
 */
const RETIRED_HINTS = [
  /start hiring/i,
  /newsletter/i,
  /home_main_form/i,
  /chatbot/i,
  /download pricing guide/i,
  /webflow/i,
]

if (!TOKEN) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set.')
  console.error('A cloud agent only receives secrets added BEFORE the agent started.')
  process.exit(1)
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function hs<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
    if (res.ok) return res.json() as Promise<T>
    if ((res.status !== 429 && res.status < 500) || attempt >= 4) {
      throw new Error(`HubSpot ${path} -> ${res.status}: ${(await res.text()).slice(0, 200)}`)
    }
    await sleep(2 ** attempt * 500)
  }
}

type Flow = { id: string; name: string; isEnabled: boolean }
type SlackAction = { actionTypeId?: string; fields?: { slackChannelIds?: string[]; message?: string } }
type FlowDetail = Flow & { actions?: SlackAction[]; enrollmentCriteria?: unknown }
type Form = { id: string; name: string }

async function allFlows(): Promise<Flow[]> {
  const out: Flow[] = []
  let after: string | undefined
  for (;;) {
    const qs = new URLSearchParams({ limit: '100' })
    if (after) qs.set('after', after)
    const page = await hs<{ results: Flow[]; paging?: { next?: { after?: string } } }>(
      `/automation/v4/flows?${qs}`,
    )
    out.push(...(page.results ?? []))
    after = page.paging?.next?.after
    if (!after) break
  }
  return out
}

async function allForms(): Promise<Map<string, string>> {
  const byId = new Map<string, string>()
  let after: string | undefined
  for (;;) {
    const qs = new URLSearchParams({ limit: '100' })
    if (after) qs.set('after', after)
    const page = await hs<{ results: Form[]; paging?: { next?: { after?: string } } }>(
      `/marketing/v3/forms?${qs}`,
    )
    for (const f of page.results ?? []) byId.set(f.id, f.name)
    after = page.paging?.next?.after
    if (!after) break
  }
  return byId
}

function slackActions(flow: FlowDetail): SlackAction[] {
  return (flow.actions ?? []).filter(
    (a) => a.actionTypeId === SLACK_ACTION_TYPE_ID || Boolean(a.fields?.slackChannelIds?.length),
  )
}

/**
 * Which forms does this workflow depend on? Read off the raw flow rather than a
 * named field, because HubSpot references forms from several different shapes
 * (enrollment filters, fetched objects, branch conditions) and a targeted reader
 * would miss whichever shape it did not know about.
 */
function referencedForms(flow: FlowDetail, forms: Map<string, string>): string[] {
  const uuids = JSON.stringify(flow).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)
  const names = new Set<string>()
  for (const id of uuids ?? []) {
    const name = forms.get(id.toLowerCase())
    if (name) names.add(name)
  }
  return [...names]
}

/** First non-empty line of the Slack message, which is what a human sees. */
function firstLine(message: string | undefined): string {
  return (message ?? '').split('\n').find((l) => l.trim().length > 0)?.trim() ?? '(no message)'
}

function retiredHit(text: string): boolean {
  return RETIRED_HINTS.some((re) => re.test(text))
}

async function main(): Promise<void> {
  console.log('Reading flows...')
  const flows = await allFlows()
  const enabled = flows.filter((f) => f.isEnabled)
  console.log(`${flows.length} flows, ${enabled.length} enabled. Reading forms...`)
  const forms = await allForms()
  console.log(`${forms.size} forms. Inspecting enabled flows for Slack actions...`)

  type Row = {
    id: string
    name: string
    channels: string[]
    firstLines: string[]
    forms: string[]
    checkAtCutover: boolean
  }

  const rows: Row[] = []
  for (const f of enabled) {
    let detail: FlowDetail
    try {
      detail = await hs<FlowDetail>(`/automation/v4/flows/${f.id}`)
    } catch (err) {
      console.log(`  could not read flow ${f.id} (${f.name}): ${(err as Error).message}`)
      continue
    }
    const actions = slackActions(detail)
    if (actions.length === 0) {
      await sleep(90)
      continue
    }
    const referenced = referencedForms(detail, forms)
    rows.push({
      id: f.id,
      name: f.name,
      channels: [...new Set(actions.flatMap((a) => a.fields?.slackChannelIds ?? []))],
      firstLines: actions.map((a) => firstLine(a.fields?.message)),
      forms: referenced,
      checkAtCutover: retiredHit([f.name, ...referenced].join(' ')),
    })
    await sleep(90)
  }

  rows.sort((a, b) => Number(b.checkAtCutover) - Number(a.checkAtCutover) || a.name.localeCompare(b.name))

  const channels = [...new Set(rows.flatMap((r) => r.channels))]
  const flag = (r: Row): string => (r.checkAtCutover ? '**CHECK**' : 'keep')

  const md = [
    '# What HubSpot posts into Slack',
    '',
    '> Generated by `npm run hubspot:audit-slack-notifications`. Read-only.',
    "> Regenerate rather than edit; a hand-edit is stale the moment someone touches a workflow.",
    `> Last run: ${new Date().toISOString().slice(0, 10)}.`,
    '',
    `**${flows.length} workflows exist, ${enabled.length} are enabled, and ${rows.length} of those post to Slack.**`,
    `They post into ${channels.length} distinct channel(s).`,
    '',
    'Why this file exists: the leads channel is already fed by HubSpot. Anything we',
    'build that also notifies Slack will double up, and a channel that repeats itself',
    'is a channel people stop reading. Check here before adding a notification.',
    '',
    '## The list',
    '',
    '`CHECK` means the workflow name or one of its forms matches a surface the new',
    'site retires. It is a prompt to look, not a verdict.',
    '',
    '| | Workflow | Slack channel id | Opening line |',
    '|---|---|---|---|',
    ...rows.map(
      (r) =>
        `| ${flag(r)} | ${r.name} | ${r.channels.join(', ') || '(none found)'} | ${r.firstLines[0]?.slice(0, 60) ?? ''} |`,
    ),
    '',
    '## Detail',
    '',
    ...rows.flatMap((r) => [
      `### ${r.name}`,
      '',
      `- Flow id: \`${r.id}\``,
      `- Channel id(s): ${r.channels.map((c) => `\`${c}\``).join(', ') || 'none found'}`,
      `- Forms referenced: ${r.forms.length > 0 ? r.forms.map((n) => `"${n}"`).join(', ') : 'none resolved'}`,
      `- At cutover: ${r.checkAtCutover ? '**CHECK** - names a surface the new site retires' : 'no retired surface named'}`,
      '',
      ...r.firstLines.map((l) => `> ${l}`),
      '',
    ]),
    '## Channel ids seen',
    '',
    'HubSpot stores the id, not the name. Resolve these in Slack once and note them here.',
    '',
    ...channels.map((c) => `- \`${c}\``),
    '',
  ].join('\n')

  writeFileSync(OUT, md)
  console.log(`\nWrote ${OUT}`)
  console.log(`${rows.length} Slack-posting workflows, ${rows.filter((r) => r.checkAtCutover).length} to check at cutover.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
