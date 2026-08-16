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

export async function postLead(
  blocks: Block[],
  fallback: string,
  target: 'leads' | 'junk' = 'leads',
): Promise<PostResult> {
  const channel = target === 'junk' ? CHANNEL_JUNK : CHANNEL_LEADS
  if (!channel) {
    console.warn(`[slack] no channel id configured for "${target}"`)
    return { ok: false, ts: null }
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
