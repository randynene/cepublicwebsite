// Renders one lead into a Slack message.
//
// The shape was settled with Jake on 16 Aug against real examples in
// #aa-leads-test: name, inquiry, then five fields (company, location, email,
// phone, lead source), then the agent read, then buttons. Deliberately short -
// the journey lives in the sales brain UI, not here, because a salesperson
// reading this in a channel needs the decision, not the history.
//
// FACTS AND INFERENCE ARE VISUALLY SEPARATE, and that separation is a
// requirement rather than a style choice. Everything above the robot emoji is
// reproduced verbatim from what the person actually submitted. Everything after
// it is a model's reading, and is labelled as such. The failure being designed
// out is a salesperson walking into a call confidently repeating something no
// one ever said.

import type { Enrichment } from './sales-brain'

/**
 * Domains that are NOT a company.
 *
 * Two kinds, and the distinction matters to whoever reads the brief.
 *
 * Consumer mailboxes: someone using a personal address is not hiding anything,
 * they just have not given you a company. Founders and CTOs at small companies
 * do this constantly, so it is a missing field rather than a bad signal.
 *
 * Disposable and throwaway: these ARE a signal, and a negative one. Nobody
 * spends a real budget from a ten-minute mailbox. HubSpot rejects several of
 * these outright with BLOCKED_EMAIL, so a lead arriving from one may not even
 * have a CRM record.
 *
 * Both render as "Unknown", because the alternative - printing "gmail.com" or
 * "mailinator.com" in a field headed Company - is actively misleading to a
 * salesperson skimming the channel.
 */
const CONSUMER_MAIL = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'live.co.uk',
  'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'gmx.com', 'gmx.de',
  'proton.me', 'protonmail.com', 'pm.me', 'zoho.com', 'yandex.com',
  'mail.com', 'inbox.com', 'fastmail.com', 'hey.com', 'qq.com', '163.com',
])

const DISPOSABLE_MAIL = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'temp-mail.org',
  '10minutemail.com', 'throwawaymail.com', 'yopmail.com', 'trashmail.com',
  'sharklasers.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
  'mailnesia.com', 'fakeinbox.com', 'spamgourmet.com', 'mintemail.com',
])

export interface Lead {
  name: string | null
  email: string
  phone: string | null
  /** What they asked for, in their words where possible. */
  inquiry: string
  /** Which form, plus how they found us. */
  source: string
  /** Country, best effort. See the note in the cron route on where this comes from. */
  location: string | null
  hubspotId: string | null
}

export function domainOf(email: string): string {
  return (email.split('@')[1] ?? '').toLowerCase()
}

/**
 * The company, derived from the email domain rather than read from HubSpot.
 *
 * This is not a shortcut. HubSpot's `company` and `website` fields were empty
 * on all 12 of the most recent contacts when this was written, while the domain
 * is present by definition on every business email. The domain is also a fact,
 * where a prettified name is a guess: "hotelengine.com" is right, and the
 * "Hotelengine" this used to render was wrong, because the company brands
 * itself Engine.
 */
export function companyFrom(email: string): { label: string; url: string | null } {
  const d = domainOf(email)
  if (!d) return { label: 'Unknown', url: null }
  if (DISPOSABLE_MAIL.has(d)) return { label: 'Unknown (disposable address)', url: null }
  if (CONSUMER_MAIL.has(d)) return { label: 'Unknown (personal email)', url: null }
  return { label: d, url: `https://${d}` }
}

type Block = Record<string, unknown>

function md(text: string): Block {
  return { type: 'section', text: { type: 'mrkdwn', text } }
}

export function buildBrief(lead: Lead, enrichment: Enrichment): Block[] {
  const company = companyFrom(lead.email)
  const name = lead.name?.trim() || lead.email.split('@')[0]

  const headline = enrichment.score === null
    ? `:fire: *${name}*`
    : `:fire: *${name}*   ·   ICP ${enrichment.score}`

  const blocks: Block[] = [
    md(`${headline}\n*${lead.inquiry}*`),
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Company*\n${company.url ? `<${company.url}|${company.label}>` : company.label}` },
        { type: 'mrkdwn', text: `*Location*\n${lead.location ?? 'unknown'}` },
        { type: 'mrkdwn', text: `*Email*\n${lead.email}` },
        { type: 'mrkdwn', text: `*Phone*\n${lead.phone ?? 'not given'}` },
        { type: 'mrkdwn', text: `*Lead source*\n${lead.source}` },
      ],
    },
  ]

  // Only rendered when the sales brain actually said something. An empty
  // "Agent read" block reads as a broken feature; omitting it reads as a lead
  // we simply do not know much about yet, which is the truth.
  const read = enrichment.summary ?? enrichment.verdict
  if (read) blocks.push(md(`:robot_face: ${read}`))

  const buttons: Block[] = []
  if (lead.hubspotId) {
    buttons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'HubSpot' },
      url: `https://app.hubspot.com/contacts/22809822/record/0-1/${lead.hubspotId}`,
    })
  }
  if (enrichment.profileUrl) {
    buttons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'Sales Brain' },
      url: enrichment.profileUrl,
    })
  }
  if (buttons.length) blocks.push({ type: 'actions', elements: buttons })

  return blocks
}

/** Fallback text for notifications and screen readers, where blocks do not render. */
export function briefFallback(lead: Lead): string {
  return `New lead: ${lead.name ?? lead.email} - ${lead.inquiry}`
}
