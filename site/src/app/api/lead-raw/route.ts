import { NextResponse } from 'next/server'
import { z } from 'zod'

// THE RAW FEED. Everything the website receives, the moment it receives it.
//
// WHY THIS EXISTS. Every other check we have reads HubSpot: the Lead Agent, its
// enrichment, HubSpot's own Slack workflows. So they all go blind at exactly the
// same moment - if HubSpot rejects a submission, or a form GUID is wrong, or a
// required field changes, nothing anywhere says so. That is not hypothetical:
// the two market pages 400'd on every single submission for weeks, and the only
// reason anyone found out was a stray alarm in a channel nobody was reading.
//
// This is first-hand evidence, independent of HubSpot: the website got this, at
// this time, with these values. Whatever happens downstream, the record exists.
//
// It is DELIBERATELY DUMB. No filtering, no junk rules, no enrichment, no
// consolidation window, no dedup. Those all involve judgement, and judgement is
// what fails. This posts what arrived. A channel that is occasionally noisy is
// worth far more than a clever one that is silently incomplete.
//
// Failures are swallowed and never block the caller. A visitor mid-funnel must
// never wait on our logging, and a lead must never be lost because a Slack post
// failed.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN = process.env.SLACK_LEAD_AGENT_TOKEN
/** Falls back to the test channel rather than the leads channel: raw is noisy. */
const CHANNEL = process.env.SLACK_RAW_CHANNEL_ID ?? process.env.SLACK_TEST_CHANNEL_ID

const schema = z.object({
  surface: z.string().max(80),
  page: z.string().max(500).optional(),
  fields: z.record(z.string(), z.string().max(500)).default({}),
})

/** Never echo a password-ish or token-ish field into a Slack channel. */
const SENSITIVE = /pass|token|secret|card|cvv|ssn/i

export async function POST(request: Request): Promise<NextResponse> {
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await request.json())
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Always 200 to the caller, whatever happens next. See the note above.
  if (!TOKEN || !CHANNEL) {
    console.warn('[lead-raw] no Slack token or channel configured')
    return NextResponse.json({ ok: true, logged: false })
  }

  const country = request.headers.get('x-vercel-ip-country') ?? 'unknown'
  const rows = Object.entries(body.fields)
    .filter(([k, v]) => v && !SENSITIVE.test(k))
    .slice(0, 25)
    .map(([k, v]) => `>*${k}*  ${v.slice(0, 200)}`)

  const text = [
    `:inbox_tray: *${body.surface}*  ·  ${body.page ?? '/'}  ·  ${country}`,
    ...(rows.length ? rows : ['>_(no field values captured)_']),
  ].join('\n')

  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: CHANNEL, text, unfurl_links: false, unfurl_media: false }),
    })
  } catch (err) {
    console.warn(`[lead-raw] ${err instanceof Error ? err.message : 'post failed'}`)
  }
  return NextResponse.json({ ok: true, logged: true })
}
