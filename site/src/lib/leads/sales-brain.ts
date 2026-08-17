// Client for the CE Sales Brain MCP endpoint.
//
// The sales brain (branded "sales agent"; the codebase still says Clara, a
// documented split) exposes ~28 `sales_agent_*` tools over JSON-RPC at
// POST /api/mcp. It is the only system that sees a person across every source
// we have - website visits, LinkedIn engagement, Gmail, HubSpot, Calendly and
// call transcripts - so it is the right place to ask "is this a real lead".
//
// DEGRADATION IS THE POINT. Every function here returns null rather than
// throwing, and the caller renders the brief without enrichment when it does.
// A lead notification that arrives with fewer fields is a minor loss; one that
// never arrives because an upstream service was down is the whole product
// failing. The sales brain is an enhancement to the brief, never a dependency
// of it.
//
// It also genuinely will not know some people. A cold inbound lead who has
// never visited before and is not on LinkedIn is new to the sales brain too,
// and its HubSpot poll runs every 30 minutes - so for the first half hour of a
// lead's life "unknown" is the correct and expected answer, not an error.

const MCP_URL = process.env.SALES_BRAIN_MCP_URL ?? 'https://ce-sales-brain.vercel.app/api/mcp'
const MCP_BEARER = process.env.SALES_BRAIN_MCP_BEARER

/** Slow enough to allow a real lookup, short enough not to hold up the brief. */
const TIMEOUT_MS = 8_000

export interface Enrichment {
  /** ICP score, if the sales brain has one. Scale is the sales brain's, not ours. */
  score: number | null
  /** One-line qualification verdict. */
  verdict: string | null
  /** Prose on who this person and company are. */
  summary: string | null
  /** Deep link to the person in the sales brain UI, for the Slack button. */
  profileUrl: string | null
}

interface McpResult {
  result?: { content?: Array<{ type: string; text?: string }>; isError?: boolean }
  error?: { message?: string }
}

function parseSse(raw: string): McpResult | null {
  const line = raw.split('\n').find((l) => l.startsWith('data: '))
  try {
    return JSON.parse(line ? line.slice(6) : raw) as McpResult
  } catch {
    return null
  }
}

/**
 * One JSON-RPC tool call. Returns the tool's text payload, or null on any
 * failure at all: missing config, auth, timeout, transport, tool-level error.
 * The caller never needs to distinguish - it renders what it has either way.
 */
async function callTool(name: string, args: Record<string, unknown>): Promise<string | null> {
  if (!MCP_BEARER) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Both are mandatory. The endpoint speaks MCP streamable HTTP and
        // returns 406 "Not Acceptable" without the event-stream type, even
        // though every response we make is a single message.
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${MCP_BEARER}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.warn(`[sales-brain] ${name} -> HTTP ${res.status}`)
      return null
    }
    // Responses arrive as SSE frames ("event: message\ndata: {...}"), not bare
    // JSON, so the payload has to be lifted out of the data line.
    const body = parseSse(await res.text())
    if (!body) return null
    if (body.error) {
      console.warn(`[sales-brain] ${name} -> ${body.error.message ?? 'rpc error'}`)
      return null
    }
    if (body.result?.isError) return null
    const text = body.result?.content?.find((c) => c.type === 'text')?.text
    return text ?? null
  } catch (err) {
    // AbortError included. Never rethrow: see the degradation note above.
    console.warn(`[sales-brain] ${name} -> ${err instanceof Error ? err.message : 'failed'}`)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Submit a lead for ICP scoring, and read back whatever is known now.
 *
 * Two calls, because the sales brain splits them:
 *
 *  - `sales_agent_icp_qualify` takes a `leads` ARRAY (not an email) and only
 *    QUEUES the work - "Scoring runs async". It returns a `person_id` and a
 *    status, never a score. Calling it is what makes the person exist.
 *  - `sales_agent_person_header` reads the current score back.
 *
 * MEASURED BEHAVIOUR, 16 Aug: a cold inbound lead known only by name, email and
 * company domain scores **0** with `persona_match: "none"`. That is not a bug
 * and not worth hiding - the ICP model scores on title, seniority and company
 * fit, and a bare form submission carries none of that. A score only becomes
 * meaningful once the person has been enriched (LinkedIn) or has generated
 * signals. So the brief must treat 0/none as "not yet known" rather than
 * printing a damning zero next to a real buyer's name.
 */
export async function enrich(lead: {
  email: string
  name?: string | null
  companyDomain?: string | null
  hubspotId?: string | null
}): Promise<Enrichment> {
  const empty: Enrichment = { score: null, verdict: null, summary: null, profileUrl: null }
  if (!MCP_BEARER) return empty

  // Does the sales brain already know them? Cheap, and for anyone who arrived
  // via LinkedIn or the website tracker this is where the real value is.
  const about = await callTool('sales_agent_tell_me_about', { email: lead.email })
  const known = about ? (JSON.parse(about) as { person?: unknown; brief?: string | null }) : null

  const queued = await callTool('sales_agent_icp_qualify', {
    leads: [
      {
        email: lead.email,
        ...(lead.name ? { name: lead.name } : {}),
        ...(lead.companyDomain ? { company_domain: lead.companyDomain } : {}),
        ...(lead.hubspotId ? { hubspot_id: lead.hubspotId } : {}),
      },
    ],
  })

  let score: number | null = null
  const personId = queued
    ? ((JSON.parse(queued) as { results?: Array<{ person_id?: string }> }).results?.[0]?.person_id ?? null)
    : null

  // THE RE-FETCH, and it is the whole point of the sequence.
  //
  // `tell_me_about` above was asked BEFORE the person existed, so for a cold
  // inbound lead - which is most of them - it correctly returned person: null
  // and no prose. Creating them via icp_qualify and then never asking again is
  // how every brief for a genuinely new lead ended up with an empty agent read,
  // which is the one thing the enrichment exists to produce.
  //
  // The sales brain's own audit spells out this ladder: ask by email, and if the
  // person is not there, create them and ask again by person_id.
  let summary: string | null = known?.brief ?? null

  if (personId) {
    const header = await callTool('sales_agent_person_header', { person_id: personId })
    if (header) {
      const p = (JSON.parse(header) as { person?: { icp_score?: number; persona_match?: string } }).person
      // 0 with no persona match means unscored, not "scored badly". Showing it
      // as a zero would libel a real buyer on the strength of a missing title.
      if (p && typeof p.icp_score === 'number' && !(p.icp_score === 0 && p.persona_match === 'none')) {
        score = p.icp_score
      }
    }
    if (!summary) {
      const again = await callTool('sales_agent_tell_me_about', { person_id: personId })
      if (again) {
        try {
          summary = (JSON.parse(again) as { brief?: string | null }).brief ?? null
        } catch {
          summary = null
        }
      }
    }
  }

  return { score, verdict: null, summary, profileUrl: null }
}
