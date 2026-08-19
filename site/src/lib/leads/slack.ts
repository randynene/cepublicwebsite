// Slack client for the Lead Agent app.
//
// Two channels, deliberately. Real leads go to the leads channel; vendor
// pitches and spam go to the junk channel with a shorter format and a "wrong
// call" button, so a misclassification stays visible and recoverable instead of
// being silently swallowed. On the real numbers - roughly one junk message
// every eight weeks - the point of the junk channel is not volume, it is that
// filtering leads without showing your working is how you lose one.
//
// `unfurl_links: false` matters: without it Slack renders a large preview card
// for the company website under every brief, which pushed the actual content
// off screen.

const TOKEN = process.env.SLACK_LEAD_AGENT_TOKEN
const CHANNEL_LEADS = process.env.SLACK_LEADS_CHANNEL_ID
const CHANNEL_JUNK = process.env.SLACK_JUNK_CHANNEL_ID
/** Where test submissions go. Falls back to the junk channel, never to leads. */
const CHANNEL_TEST = process.env.SLACK_TEST_CHANNEL_ID ?? CHANNEL_JUNK

type Block = Record<string, unknown>

interface PostResult {
  ok: boolean
  /** Slack message timestamp, the handle needed to edit it later. */
  ts: string | null
}

async function call(method: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (!TOKEN) {
    console.warn('[slack] SLACK_LEAD_AGENT_TOKEN not set')
    return null
  }
  try {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await res.json()) as Record<string, unknown>
    if (!json.ok) console.warn(`[slack] ${method} -> ${String(json.error)}`)
    return json
  } catch (err) {
    console.warn(`[slack] ${method} -> ${err instanceof Error ? err.message : 'failed'}`)
    return null
  }
}

/**
 * Has this person already been announced?
 *
 * The last safety net, and it exists because the gate cannot be perfect. A
 * contact is pulled in by lastmodifieddate, and HubSpot edits contacts for its
 * own reasons - a workflow setting mql_tier a minute after a form submission is
 * a SECOND modification, landing in a later slice, with the original form still
 * inside the interaction window. Both slices then announce the same person.
 *
 * Rather than reason harder about windows, this asks the channel. Slack is the
 * record of what was announced, so it is the honest place to check. Needs the
 * history scope, added 18 Aug.
 *
 * Fails OPEN: if the lookup fails for any reason, the lead is announced. A
 * duplicate is a minor annoyance; a lead silently suppressed because a
 * permissions call failed is the thing this whole system exists to prevent.
 */
async function alreadyAnnounced(channel: string, email: string): Promise<boolean> {
  if (!TOKEN || !email) return false
  const oldest = Math.floor((Date.now() - 6 * 60 * 60 * 1000) / 1000)
  try {
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${channel}&oldest=${oldest}&limit=100`,
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    )
    const json = (await res.json()) as { ok?: boolean; messages?: unknown[] }
    if (!json.ok) return false
    const needle = email.toLowerCase()
    return (json.messages ?? []).some((m) => JSON.stringify(m).toLowerCase().includes(needle))
  } catch {
    return false
  }
}

export async function postLead(
  blocks: Block[],
  fallback: string,
  target: 'leads' | 'junk' | 'test' = 'leads',
  /** Usually the email. Suppresses a repeat announcement within 6 hours. */
  dedupeKey?: string,
): Promise<PostResult> {
  const channel =
    target === 'junk' ? CHANNEL_JUNK : target === 'test' ? CHANNEL_TEST : CHANNEL_LEADS
  if (!channel) {
    console.warn(`[slack] no channel id configured for "${target}"`)
    return { ok: false, ts: null }
  }
  if (dedupeKey && (await alreadyAnnounced(channel, dedupeKey))) {
    console.log(`[slack] ${dedupeKey} already announced in the last 6h, skipping`)
    return { ok: true, ts: null }
  }
  const json = await call('chat.postMessage', {
    channel,
    text: fallback,
    blocks,
    unfurl_links: false,
    unfurl_media: false,
  })
  return { ok: Boolean(json?.ok), ts: (json?.ts as string) ?? null }
}

/**
 * Rewrite a brief already in the channel.
 *
 * This is what lets one lead stay one message. A lead who unlocks pricing, then
 * submits the contact form, then books a call is one person having one thought,
 * and posting that three times trains people to skim the channel. It also means
 * a brief can go out immediately with only the facts, and gain its ICP score a
 * few minutes later when the sales brain has caught up, rather than the whole
 * notification waiting on the slowest source.
 */
export async function updateLead(ts: string, blocks: Block[], fallback: string): Promise<boolean> {
  const channel = CHANNEL_LEADS
  if (!channel) return false
  const json = await call('chat.update', { channel, ts, text: fallback, blocks })
  return Boolean(json?.ok)
}
