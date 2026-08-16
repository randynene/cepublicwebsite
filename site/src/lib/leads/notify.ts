// Slack notification for website leads.
//
// WHY THIS EXISTS, AND WHY IT CHANGED SHAPE.
//
// Until now the site only posted to Slack when HubSpot REFUSED a lead. The
// reasoning was sound on its face: HubSpot has 14 enabled workflows posting
// into Slack, so posting again would duplicate them and produce a second,
// noisier feed that people stop reading.
//
// The forms audit (docs/briefs/active/FORMS-AUDIT.md, 16 Aug 2026) showed the
// premise was wrong. The workflow that creates deals and announces leads
// watches exactly two form ids:
//
//     05bfad44-0c7c-45f2-a3c4-3eccea71965d
//     4b883c7d-72c1-4f9c-8196-de68fce303d6   (/contact)
//
// The quick hiring form - which is the primary conversion path on nine pages -
// is neither of them, and nor is the pricing calculator unlock. Both submit to
// form 8f974ef4. So a successful submission created a contact, matched no
// workflow, produced no deal, and announced itself to nobody. The site was
// quietly deferring to a notification that was never going to arrive.
//
// So the rule is now: WE announce the paths HubSpot does not. That is additive,
// not duplicative - the original noise concern still holds for /contact and for
// bookings, and this is deliberately not wired to those.
//
// Second finding, equally load-bearing: SLACK_LEADS_WEBHOOK_URL was never set,
// in .env or in Vercel. postToSlack() opened with `if (!url) return`, so even
// the failure alert had never fired once. The safety net was decorative. This
// module therefore supports the bot token that DOES exist in .env
// (SLACK_LEAD_AGENT_TOKEN, an xoxb- token authenticating as `leads_agent` with
// chat:write) and falls back to a webhook if one is ever configured.
//
// DELAYS. HubSpot's own notifications are slow because the workflows carry
// built-in waits - 15 minutes on the MQL workflow, 4 on book-a-call. Those are
// configured in HubSpot and no amount of code here changes them. Posting
// directly is the only way the team hears about a lead immediately.
//
// FAILURE POSTURE. Never throws, never blocks the response. A lead is recorded
// in HubSpot first; this is how a human finds out, not where the data lives.

const BOT_TOKEN = process.env.SLACK_LEAD_AGENT_TOKEN
const CHANNEL_ID = process.env.SLACK_LEADS_CHANNEL_ID
const WEBHOOK_URL = process.env.SLACK_LEADS_WEBHOOK_URL
const JUNK_WEBHOOK_URL = process.env.SLACK_JUNK_WEBHOOK_URL

export type NotifyOutcome = 'sent' | 'unconfigured' | 'failed'

/**
 * Post a message to the leads channel.
 *
 * Prefers the bot token, because that is what the workspace actually has. Falls
 * back to an incoming webhook so that configuring one later needs no code
 * change. If neither is present it reports `unconfigured` rather than failing
 * silently - the caller logs it, so a missing env var shows up in the function
 * logs instead of leads vanishing without a trace, which is exactly how the
 * previous version hid its own misconfiguration.
 */
export async function notifySlack(text: string, webhookOverride?: string): Promise<NotifyOutcome> {
  const webhook = webhookOverride ?? WEBHOOK_URL

  try {
    if (BOT_TOKEN && CHANNEL_ID && !webhookOverride) {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${BOT_TOKEN}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ channel: CHANNEL_ID, text, unfurl_links: false }),
      })
      // Slack answers 200 with { ok: false, error } for application errors, so
      // the status code alone is not the signal.
      const body = (await res.json()) as { ok?: boolean; error?: string }
      if (body.ok) return 'sent'
      console.error(`[notify] Slack chat.postMessage failed: ${body.error ?? 'unknown'}`)
      return 'failed'
    }

    if (webhook) {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      return res.ok ? 'sent' : 'failed'
    }

    return 'unconfigured'
  } catch (err) {
    // A Slack outage must never fail a lead.
    console.error(`[notify] Slack post threw: ${err instanceof Error ? err.message : 'unknown'}`)
    return 'failed'
  }
}

/** Junk goes to its own channel when one is configured, so the leads feed stays clean. */
export async function notifyJunk(text: string): Promise<NotifyOutcome> {
  if (!JUNK_WEBHOOK_URL) return 'unconfigured'
  return notifySlack(text, JUNK_WEBHOOK_URL)
}
