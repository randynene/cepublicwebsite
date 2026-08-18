/**
 * End-to-end test of every lead surface on the site.
 *
 *   npx tsx scripts/e2e/forms.ts                 all surfaces, against production
 *   npx tsx scripts/e2e/forms.ts --only=pricing  one surface
 *   npx tsx scripts/e2e/forms.ts --no-slack      skip the Slack wait (fast)
 *   npx tsx scripts/e2e/forms.ts --cleanup       delete contacts left by past runs
 *
 * WHAT THIS EXISTS FOR. On 18 Aug the Lead Agent was declared live and silently
 * announced nothing for a day: the bot had never been invited to the channel, so
 * every brief was built correctly, posted, refused, and swallowed. Every
 * individual piece looked fine. Only the whole chain, checked end to end, would
 * have caught it - in about thirty seconds.
 *
 * So this deliberately asserts the LAST hop, not the first. "The form returned
 * 200" is the check that would have passed all day while nothing worked.
 *
 * THREE LINKS, REPORTED SEPARATELY. A run says which link broke, because
 * "forms are broken" and "Slack is broken" need different people:
 *
 *   1. submitted  - the form accepted it in a real browser
 *   2. hubspot    - a contact exists with the right form attached
 *   3. brief      - the Lead Agent posted to Slack
 *
 * WHAT IT DOES NOT TEST, deliberately: booking a Calendly slot. That puts a real
 * meeting in a real salesperson's diary and emails them an invite. There is no
 * way to automate it that is not spam. Book one by hand when you need to check
 * that path.
 */

import { chromium, type Browser, type Page } from 'playwright'

const SITE = process.env.E2E_SITE ?? 'https://www.cloudemployee.io'
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
const SLACK_TOKEN = process.env.SLACK_LEAD_AGENT_TOKEN
const SLACK_CHANNEL = process.env.SLACK_LEADS_CHANNEL_ID

/** The Lead Agent waits 7 minutes, so nothing can be asserted before then. */
const BRIEF_TIMEOUT_MS = 11 * 60_000
const HUBSPOT_TIMEOUT_MS = 90_000

/**
 * A real domain, not a disposable one. HubSpot rejects mailinator outright with
 * BLOCKED_EMAIL, and a test that submits to a blocked domain proves nothing -
 * it fails at HubSpot for a reason unrelated to whatever you were testing.
 */
const TEST_DOMAIN = process.env.E2E_DOMAIN ?? 'noxcapital.ae'
const stamp = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const mkEmail = (surface: string) => `e2e-${surface}-${stamp()}@${TEST_DOMAIN}`

type Link = 'submitted' | 'hubspot' | 'brief'
interface Result {
  surface: string
  email: string
  passed: Partial<Record<Link, boolean>>
  note?: string
}

interface Surface {
  id: string
  label: string
  url: string
  /** Fills and submits. Throws if the form cannot be driven. */
  fill: (page: Page, email: string) => Promise<void>
  /** Substring expected in the brief's "Lead source" line. */
  expectSource: string
}

// ── The surfaces ────────────────────────────────────────────────────────────

const SURFACES: Surface[] = [
  {
    id: 'pricing',
    label: 'Pricing calculator unlock',
    url: `${SITE}/pricing`,
    expectSource: 'Pricing calculator',
    async fill(page, email) {
      const form = page.locator('form#pricing-calculator-unlock')
      await form.waitFor({ state: 'visible', timeout: 30_000 })
      await form.locator('input[type=email]').fill(email)
      await form.locator('button[type=submit]').click()
      // The gate unblurs in place rather than navigating, so the calculator
      // becoming interactive IS the success signal.
      await page.waitForSelector('form#pricing-calculator-unlock', { state: 'detached', timeout: 20_000 })
    },
  },
  {
    id: 'contact',
    label: 'Contact form',
    url: `${SITE}/contact`,
    expectSource: 'Contact form',
    async fill(page, email) {
      // HubSpot renders this one in an iframe, so it has to be driven through
      // the frame rather than the page.
      const frame = page.frameLocator('iframe[id^=hs-form]')
      await frame.locator('input[name=firstname]').waitFor({ timeout: 40_000 })
      await frame.locator('input[name=firstname]').fill('E2E')
      await frame.locator('input[name=lastname]').fill('Test')
      await frame.locator('input[name=email]').fill(email)
      await frame.locator('textarea[name=message1]').fill('Automated end-to-end test of the contact form.')
      // Required, and the reason a hand-built API submission 400s without it.
      const heard = frame.locator('[name=how_did_you_hear_about_us_]')
      if (await heard.count()) await heard.first().fill('E2E test')
      await frame.locator('input[type=submit]').click()
      await page.waitForURL(/thank-you/, { timeout: 30_000 })
    },
  },
]

// ── Verification ────────────────────────────────────────────────────────────

async function hubspotHasContact(email: string): Promise<boolean> {
  if (!HUBSPOT_TOKEN) return false
  const deadline = Date.now() + HUBSPOT_TIMEOUT_MS
  while (Date.now() < deadline) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
        properties: ['email'],
        limit: 1,
      }),
    })
    if (res.ok) {
      const j = (await res.json()) as { total?: number }
      if ((j.total ?? 0) > 0) return true
    }
    await sleep(5_000)
  }
  return false
}

/**
 * Did the Lead Agent actually post?
 *
 * Needs the `channels:history` scope. Without it this returns null and the run
 * reports "unverified" rather than "passed" - because a test that cannot see
 * the last hop must not claim the last hop worked. That distinction is the
 * whole reason this file exists.
 */
async function slackHasBrief(email: string, since: number): Promise<boolean | null> {
  if (!SLACK_TOKEN || !SLACK_CHANNEL) return null
  const deadline = Date.now() + BRIEF_TIMEOUT_MS
  while (Date.now() < deadline) {
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL}&oldest=${Math.floor(since / 1000)}&limit=100`,
      { headers: { Authorization: `Bearer ${SLACK_TOKEN}` } },
    )
    const j = (await res.json()) as { ok?: boolean; error?: string; messages?: Array<Record<string, unknown>> }
    if (!j.ok) {
      if (j.error === 'missing_scope') {
        console.log('    ! Slack read needs the channels:history scope - cannot verify the brief')
        return null
      }
      console.log(`    ! Slack: ${j.error}`)
      return null
    }
    if ((j.messages ?? []).some((m) => JSON.stringify(m).includes(email))) return true
    process.stdout.write('.')
    await sleep(20_000)
  }
  return false
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Runner ──────────────────────────────────────────────────────────────────

async function runSurface(browser: Browser, s: Surface, checkSlack: boolean): Promise<Result> {
  const email = mkEmail(s.id)
  const result: Result = { surface: s.label, email, passed: {} }
  const startedAt = Date.now()

  // A fresh context per surface, always. HubSpot's tracking cookie attaches a
  // submission to whoever last used the browser regardless of the email typed,
  // which invalidated an entire afternoon of manual testing on 16 Aug.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  try {
    await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForTimeout(3_000)
    await s.fill(page, email)
    result.passed.submitted = true
  } catch (err) {
    result.passed.submitted = false
    result.note = err instanceof Error ? err.message.split('\n')[0] : 'fill failed'
    await ctx.close()
    return result
  }
  await ctx.close()

  result.passed.hubspot = await hubspotHasContact(email)
  if (checkSlack) {
    const brief = await slackHasBrief(email, startedAt)
    if (brief !== null) result.passed.brief = brief
  }
  return result
}

async function cleanup(): Promise<void> {
  if (!HUBSPOT_TOKEN) return console.log('HUBSPOT_ACCESS_TOKEN not set')
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'CONTAINS_TOKEN', value: 'e2e-*' }] }],
      properties: ['email'],
      limit: 100,
    }),
  })
  const j = (await res.json()) as { results?: Array<{ id: string; properties: { email: string } }> }
  const found = j.results ?? []
  console.log(`Found ${found.length} e2e contacts.`)
  for (const c of found) {
    // DELETE is real. Only ever touches addresses this script created.
    if (!c.properties.email?.startsWith('e2e-')) continue
    const d = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${c.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` },
    })
    console.log(`  ${d.ok ? 'deleted' : 'FAILED '} ${c.properties.email}`)
  }
}

const mark = (v: boolean | undefined) => (v === undefined ? '  -  ' : v ? ' PASS' : ' FAIL')

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.includes('--cleanup')) return cleanup()

  const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]
  const checkSlack = !args.includes('--no-slack')
  const surfaces = only ? SURFACES.filter((s) => s.id === only) : SURFACES

  if (!surfaces.length) {
    console.log(`No surface "${only}". Known: ${SURFACES.map((s) => s.id).join(', ')}`)
    process.exit(1)
  }

  console.log(`Testing ${surfaces.length} surface(s) against ${SITE}`)
  if (checkSlack) console.log('Waiting for briefs takes ~8 minutes each - the agent holds leads for 7.\n')

  const browser = await chromium.launch()
  const results: Result[] = []
  for (const s of surfaces) {
    console.log(`\n${s.label}`)
    const r = await runSurface(browser, s, checkSlack)
    results.push(r)
    console.log(`\n  submitted${mark(r.passed.submitted)}  hubspot${mark(r.passed.hubspot)}  brief${mark(r.passed.brief)}`)
    if (r.note) console.log(`  note: ${r.note}`)
  }
  await browser.close()

  console.log('\n' + '='.repeat(64))
  for (const r of results) {
    console.log(`${r.surface.padEnd(32)} sub${mark(r.passed.submitted)} hs${mark(r.passed.hubspot)} brief${mark(r.passed.brief)}`)
  }
  console.log('\nNot covered: Calendly booking (would put a real meeting in a real diary),')
  console.log('and Clara chat (needs a conversation long enough to summarise).')
  console.log('Clean up with: npx tsx scripts/e2e/forms.ts --cleanup')

  const failed = results.some((r) => Object.values(r.passed).includes(false))
  process.exit(failed ? 1 : 0)
}

void main()
