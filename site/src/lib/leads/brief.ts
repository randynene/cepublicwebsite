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
  /** Clara's session permalink, when the lead came through the chat widget. */
  claraSessionUrl?: string | null
  /**
   * What they typed into the multi-step form, label -> value, already filtered
   * to the questions they actually answered. This is the substance of an
   * enquiry: skills, headcount, budget, timeline. A brief without it makes a
   * rep open HubSpot to find out what the person asked for, which defeats the
   * point of a brief.
   */
  answers?: Array<{ label: string; value: string }>
  hubspotId: string | null
}

/**
 * Is this a deliberate test submission?
 *
 * A PATTERN rather than one fixed address, and the difference matters.
 *
 * The obvious design is a single test email that the agent recognises. It does
 * not work, and we proved why on 16 Aug: a reused address is never a NEW
 * contact again. HubSpot sets mql_tier to Tier 1 on the first run, and every
 * run after that sets it to Tier 1 again - no change, so the notification that
 * fires on the change does not fire, and the test reports a failure that is not
 * real. An hour was lost to exactly that. The record also accumulates
 * submissions, meetings and a lifecycle stage until it behaves like nothing
 * that happens in production.
 *
 * `+test-` keeps the marker and drops the reuse: jake+test-0819a, +test-0819b,
 * each a genuinely fresh contact that still announces itself as a test.
 *
 * The one thing this cannot solve: HubSpot's tracking cookie beats the address
 * typed into the form, so a submission from a browser that has been used before
 * attaches to THAT contact whatever you type. Always test in a fresh incognito
 * window.
 */
export function isTestLead(email: string): boolean {
  return /\+test-/i.test(email)
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

/**
 * Clara's session permalink, repaired.
 *
 * Clara wrote /dashboard/sessions/{id} for a long time and that route does not
 * exist, so every such link already in HubSpot is dead. The working form is
 * ?session={id}. Clara has fixed it going forward, but the broken ones stay
 * broken on old contacts, and a salesperson clicking a dead link concludes the
 * tool is broken rather than the link.
 *
 * Rewriting it here is two lines and makes historical leads clickable too.
 */
export function repairClaraSessionUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/^(https?:\/\/[^/]+)\/dashboard\/sessions\/([0-9a-f-]+)/i)
  return m ? `${m[1]}/dashboard?session=${m[2]}` : url
}

type Block = Record<string, unknown>

function md(text: string): Block {
  return { type: 'section', text: { type: 'mrkdwn', text } }
}

export function buildBrief(lead: Lead, enrichment: Enrichment): Block[] {
  const company = companyFrom(lead.email)
  const name = lead.name?.trim() || lead.email.split('@')[0]

  // The ICP number is hidden (Jake, 19 Aug). It was appearing as a bare figure
  // next to a person's name with nothing to interpret it by - "ICP 8" next to a
  // real buyer reads as a verdict, and readers had no way to know the scale, or
  // that a low score usually means a missing job title rather than a bad lead.
  // The score is still fetched and still available; it just is not shown until
  // it means something a reader can act on.
  const SHOW_ICP = false
  const headline = !SHOW_ICP || enrichment.score === null
    ? `:fire: *${name}*`
    : `:fire: *${name}*   ·   ICP ${enrichment.score}`

  const blocks: Block[] = []

  // Labelled at the top, not the bottom. Somebody skimming the channel decides
  // whether to care in the first line, and a test that looks like a lead for
  // even a moment is worse than no test at all.
  if (isTestLead(lead.email)) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: ':test_tube: *TEST SUBMISSION* - not a real lead' }],
    })
  }

  blocks.push(md(`${headline}\n*${lead.inquiry}*`),
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
  )

  // Their own answers, verbatim, before anything inferred. Rendered as a quote
  // block so it reads as "the visitor said this" rather than as our summary.
  if (lead.answers?.length) {
    blocks.push(
      md(lead.answers.map((a) => `>*${a.label}*  ${a.value}`).join('\n')),
    )
  }

  // THE AGENT READ IS OFF (Jake, 19 Aug), and this is the reasoning.
  //
  // It was a model writing prose about a real person into a channel the CCO
  // reads. When the underlying record was thin it produced three sentences of
  // confident-sounding nothing - "no title, no company, no LinkedIn, no signals,
  // treat as unqualified" - which is both long and, on a real buyer who simply
  // used a personal email, wrong in tone if not in fact.
  //
  // The judgement was usually sound. The risk was not worth it: a salesperson
  // repeating an invented detail to a prospect costs more than the block ever
  // added, and nobody can tell by looking which sentence came from data and
  // which from inference.
  //
  // Facts only now. The score stays, because it is a number the sales brain
  // computed rather than prose a model wrote. Re-enable by flipping this flag
  // once the sales brain holds enough per person to be worth summarising.
  const SHOW_AGENT_READ = false
  const read = enrichment.summary ?? enrichment.verdict
  if (SHOW_AGENT_READ && read) blocks.push(md(`:robot_face: ${read}`))

  const buttons: Block[] = []
  if (lead.hubspotId) {
    buttons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'HubSpot' },
      url: `https://app.hubspot.com/contacts/22809822/record/0-1/${lead.hubspotId}`,
    })
  }
  // The single most useful button on a chat lead: it is the conversation they
  // actually had, in their words. Worth more than any summary while Clara's
  // summary write is still landing empty on most sessions.
  const session = repairClaraSessionUrl(lead.claraSessionUrl)
  if (session) {
    buttons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'Read the conversation' },
      url: session,
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
