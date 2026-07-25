// THE LAUNCH GATE.
//
// CLAUDE.md, Hard Rules: "No cutover without redirect parity verified." This is
// the script that verifies it.
//
// Replays every URL the live site knows about against the new site and compares
// the outcomes. A legacy URL that 301s to /reviews on Webflow must 301 to
// /reviews on Next; one that returns 200 must return 200. Any difference is a
// page, and its rankings, silently changing behaviour at cutover.
//
// The reference is data/webflow/live-behaviour.json, produced by
// `npm run launch:capture-live` — what the live site ACTUALLY does, not what the
// April redirect export claims it does.
//
//   npm run launch:capture-live                              # refresh the reference
//   npm run launch:verify-parity                             # against localhost:3000
//   npm run launch:verify-parity -- --target https://...     # against a preview deploy
//
// Exit code 1 on any divergence, so it can gate a deploy.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import type { LiveBehaviour } from './capture-live-behaviour'

const REFERENCE_PATH = 'data/webflow/live-behaviour.json'
const EXCEPTIONS_PATH = 'data/webflow/parity-exceptions.json'
const REPORT_PATH = 'audit-output/launch/parity-report.json'
const CONCURRENCY = 12
const MAX_HOPS = 5

// Deliberate divergences from live. See the $comment in the file: this is an
// allowlist, not a mute button — the gate still probes these URLs and still
// checks them, it just holds them to what the exception SAYS they should do
// rather than to what the live site does. An exception whose actual behaviour
// stops matching its `expect` fails the run like anything else.
type Exception = {
  paths: string[]
  expect: string
  reason: string
  decidedBy: string
}

function loadExceptions(): Map<string, Exception> {
  const byPath = new Map<string, Exception>()
  let raw: string
  try {
    raw = readFileSync(EXCEPTIONS_PATH, 'utf-8')
  } catch {
    return byPath // No exceptions file. Every divergence is a failure, which is the stricter default.
  }
  const parsed = JSON.parse(raw) as { exceptions?: Exception[] }
  for (const ex of parsed.exceptions ?? []) {
    for (const path of ex.paths) byPath.set(path, ex)
  }
  return byPath
}

function targetFromArgv(): string {
  const i = process.argv.indexOf('--target')
  const value = i !== -1 ? process.argv[i + 1] : undefined
  return (value ?? 'http://localhost:3000').replace(/\/$/, '')
}

const TARGET = targetFromArgv()

type Outcome = {
  status: number
  location: string | null
  finalPath: string | null
  finalStatus: number | null
  hops: number
}

type Divergence = {
  path: string
  live: Outcome
  target: Outcome
  reason: string
}

function toPath(url: string, origin: string): string {
  try {
    const u = new URL(url, origin)
    if (u.origin !== origin) return u.toString()
    return u.pathname.replace(/\/$/, '') || '/'
  } catch {
    return url
  }
}

async function probe(path: string): Promise<Outcome> {
  let current = `${TARGET}${path}`
  let first: { status: number; location: string | null } | null = null
  let hops = 0

  for (;;) {
    const res = await fetch(current, { redirect: 'manual' })
    const location = res.headers.get('location')

    if (first === null) {
      first = { status: res.status, location: location ? toPath(location, TARGET) : null }
    }

    const isRedirect = res.status >= 300 && res.status < 400 && location
    if (!isRedirect || hops >= MAX_HOPS) {
      return {
        status: first.status,
        location: first.location,
        finalPath: toPath(current, TARGET),
        finalStatus: res.status,
        hops,
      }
    }

    current = new URL(location, current).toString()
    hops++
  }
}

// What counts as "the same behaviour".
//
// Status codes are compared by CLASS, not exact value. Webflow emits 301 and
// Next emits 308 for a permanent redirect; both are permanent, both pass link
// equity, and Google treats them equivalently. Demanding an exact match would
// fail all 300-odd redirects for no reason. What must match exactly is the
// DESTINATION, which is the thing that carries the rankings.
//
// 4xx other than 410 collapses into one class. Webflow answers a malformed path
// with 400 where Next answers 404; both mean "this URL serves no page", neither
// is indexable, and nothing links to a malformed path. Distinguishing them would
// leave a permanent false failure on the gate, and a gate that is expected to be
// red is a gate nobody reads. 410 stays separate because "gone" is a deliberate,
// meaningful signal that we owe some URLs (see the /archive/old-home TODO).
function classOf(status: number): 'ok' | 'permanent' | 'temporary' | 'notfound' | 'gone' | 'error' {
  if (status >= 200 && status < 300) return 'ok'
  if (status === 301 || status === 308) return 'permanent'
  if (status === 302 || status === 303 || status === 307) return 'temporary'
  if (status === 410) return 'gone'
  if (status >= 400 && status < 500) return 'notfound'
  return 'error'
}

function compare(path: string, live: Outcome, target: Outcome): Divergence | null {
  const liveClass = classOf(live.status)
  const targetClass = classOf(target.status)

  if (liveClass !== targetClass) {
    return { path, live, target, reason: `live is ${liveClass} (${live.status}), new site is ${targetClass} (${target.status})` }
  }

  // For a redirect, the destination is what matters. Compare where the chain
  // actually lands, not the first hop, so a 2-hop chain that reaches the same
  // page as a 1-hop one is not flagged as a difference in destination.
  if (liveClass === 'permanent' || liveClass === 'temporary') {
    if (live.finalPath !== target.finalPath) {
      return {
        path,
        live,
        target,
        reason: `redirects to a different place: live lands on ${live.finalPath}, new site lands on ${target.finalPath}`,
      }
    }

    // A redirect that lands on a 404 is a dead page, and matching the live
    // site's DESTINATION is not enough to prove otherwise: /team correctly 308s
    // to /about-us on both sites, but /about-us does not exist on ours yet, so
    // the URL is dead here and alive there. An earlier version of this check
    // compared only finalPath and passed it — the gate has to verify the
    // destination actually resolves, or it certifies broken links as parity.
    if (classOf(live.finalStatus ?? 0) !== classOf(target.finalStatus ?? 0)) {
      return {
        path,
        live,
        target,
        reason: `redirect destination ${target.finalPath} resolves ${target.finalStatus} on the new site but ${live.finalStatus} on live`,
      }
    }

    // A chain that got longer is a real regression: each extra hop leaks link
    // equity and slows the crawl.
    if (target.hops > live.hops) {
      return { path, live, target, reason: `redirect chain grew from ${live.hops} hop(s) to ${target.hops}` }
    }
  }

  return null
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  async function worker(): Promise<void> {
    for (;;) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function main(): Promise<void> {
  const reference = JSON.parse(readFileSync(REFERENCE_PATH, 'utf-8')) as {
    origin: string
    capturedAt: string
    results: LiveBehaviour[]
  }

  console.log(`Reference: ${reference.results.length} URLs from ${reference.origin}`)
  console.log(`Captured:  ${reference.capturedAt}`)
  console.log(`Target:    ${TARGET}\n`)

  const outcomes = await mapWithConcurrency(reference.results, CONCURRENCY, async (live) => {
    const target = await probe(live.path).catch(
      (): Outcome => ({ status: 0, location: null, finalPath: null, finalStatus: null, hops: 0 }),
    )
    return { live, target }
  })

  const exceptions = loadExceptions()

  const divergences: Divergence[] = []
  const expected: Array<{ path: string; got: string; reason: string }> = []
  const brokenExceptions: Divergence[] = []

  for (const { live, target } of outcomes) {
    const ex = exceptions.get(live.path)

    if (ex) {
      // Held to what the exception promises, NOT to what live does. If a page we
      // deliberately 301'd starts 404ing, that is still a bug and still fails.
      const got = classOf(target.status)
      if (got === ex.expect) {
        expected.push({ path: live.path, got, reason: ex.reason })
      } else {
        brokenExceptions.push({
          path: live.path,
          live,
          target,
          reason: `deliberate exception expects ${ex.expect}, but the new site returns ${got} (${target.status})`,
        })
      }
      continue
    }

    const d = compare(live.path, live, target)
    if (d) divergences.push(d)
  }

  divergences.push(...brokenExceptions)

  mkdirSync(dirname(REPORT_PATH), { recursive: true })
  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      { target: TARGET, reference: reference.origin, checked: outcomes.length, divergences, expected },
      null,
      2,
    ),
  )

  const passed = outcomes.length - divergences.length
  console.log(`${passed}/${outcomes.length} URLs behave the same as the live site.`)

  if (expected.length > 0) {
    console.log(`${expected.length} of those diverge from live ON PURPOSE:`)
    for (const e of expected) {
      console.log(`  ${e.path} -> ${e.got}`)
    }
    console.log('  (see data/webflow/parity-exceptions.json for why)')
  }
  console.log()

  if (divergences.length === 0) {
    console.log('PARITY VERIFIED. Safe to cut over on this dimension.')
    return
  }

  // Group by reason so 200 instances of one broken rule read as one problem.
  const groups = new Map<string, Divergence[]>()
  for (const d of divergences) {
    const key = `${classOf(d.live.status)} -> ${classOf(d.target.status)}`
    const list = groups.get(key) ?? []
    list.push(d)
    groups.set(key, list)
  }

  console.log(`${divergences.length} DIVERGENCE(S):\n`)
  for (const [key, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${key}  (${list.length})`)
    for (const d of list.slice(0, 8)) {
      console.log(`    ${d.path}`)
      console.log(`      live: ${d.live.status} -> ${d.live.finalPath}`)
      console.log(`      new:  ${d.target.status} -> ${d.target.finalPath}`)
    }
    if (list.length > 8) console.log(`    ... and ${list.length - 8} more`)
    console.log()
  }

  console.log(`Full report: ${REPORT_PATH}`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
