// Collapses redirect chains to single hops.
//
// A chain is a redirect whose destination is itself a redirect source:
// /hire -> /start-hiring -> /start-hiring/contact-info -> /book-a-call. Next.js
// resolves redirects() once per request, so each arrow is a separate round trip.
// Every hop costs the visitor latency, leaks a little link equity, and shows a
// crawler a URL that is not a page. The August 2026 crawl found 28 of them.
//
// This is deliberately a pass over the ASSEMBLED table rather than a fix inside
// scripts/scaffold/extract-redirects.ts. The chains do not live inside any one
// table: /compare/cloud-employee-vs-arc-dev is a generated Webflow row whose
// destination /compare is a hand-written locked rule, and the generator cannot
// see the locked rules. The generator's own REDIRECT_DESTINATION_REWRITES map was
// the previous attempt at this, and it went stale exactly as a hand-maintained
// map of a derived fact does: it still rewrites /scale-this-week to a funnel step
// that has since been retired.
//
// The pass is order-faithful: it resolves a destination against the rules in the
// same order Next.js matches them, so a collapsed rule always lands where the
// chain landed. It never invents a destination.

import type { Redirect } from 'next/dist/lib/load-custom-routes'

/** Runaway guard. No legitimate chain on this site is close to this long. */
const MAX_HOPS = 10

type CompiledRule = {
  rule: Redirect
  /** Matches a path against this rule's source. Null for rules we will not resolve through. */
  match: ((path: string) => Record<string, string> | null) | null
}

function escapeLiteral(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Compiles the path-to-regexp subset this codebase actually uses: `:name`,
// `:name+` and `:name*`. Anything richer (custom regex groups, optional
// segments) returns null and is simply not used as a resolution target, which
// costs nothing beyond leaving that one chain uncollapsed.
function compileSource(source: string): CompiledRule['match'] {
  if (!source.startsWith('/')) return null
  if (/\(|\)/.test(source)) return null

  const names: string[] = []
  let pattern = ''
  let index = 0

  const token = /\/?:([A-Za-z0-9_]+)([+*])?/g
  let match: RegExpExecArray | null

  while ((match = token.exec(source)) !== null) {
    pattern += escapeLiteral(source.slice(index, match.index))
    index = match.index + match[0].length

    const [raw, name, modifier] = match
    names.push(name)
    const precededBySlash = raw.startsWith('/')

    if (modifier === '+') {
      pattern += precededBySlash ? '/(.+)' : '(.+)'
    } else if (modifier === '*') {
      // `/x/:p*` matches /x as well as /x/a/b, so the slash is part of the
      // optional group.
      pattern += precededBySlash ? '(?:/(.*))?' : '(.*)'
    } else {
      pattern += precededBySlash ? '/([^/]+)' : '([^/]+)'
    }
  }

  pattern += escapeLiteral(source.slice(index))

  const regex = new RegExp(`^${pattern}$`)

  return (path: string) => {
    const result = regex.exec(path)
    if (!result) return null
    const params: Record<string, string> = {}
    names.forEach((name, i) => {
      params[name] = result[i + 1] ?? ''
    })
    return params
  }
}

function applyParams(destination: string, params: Record<string, string>): string | null {
  let unresolved = false
  const filled = destination.replace(
    /:([A-Za-z0-9_]+)[+*]?/g,
    (whole, name: string) => {
      const value = params[name]
      if (value === undefined) {
        unresolved = true
        return whole
      }
      return value
    },
  )
  return unresolved ? null : filled
}

/**
 * Returns `redirects` with every destination rewritten to the end of its chain.
 *
 * Rules are matched in the order given, which must be the order passed to
 * Next.js `redirects()`. A rule with `has`/`missing` conditions is emitted
 * unchanged and is never used to resolve another rule's destination: its match
 * depends on request state this pass cannot see.
 */
export function collapseRedirectChains(redirects: Redirect[]): Redirect[] {
  const compiled: CompiledRule[] = redirects.map((rule) => ({
    rule,
    match:
      rule.has || rule.missing || !rule.destination.startsWith('/')
        ? null
        : compileSource(rule.source),
  }))

  function resolveOnce(path: string, skipIndex: number): string | null {
    for (let i = 0; i < compiled.length; i += 1) {
      if (i === skipIndex) continue
      const { rule, match } = compiled[i]
      if (!match) continue
      const params = match(path)
      if (!params) continue
      return applyParams(rule.destination, params)
    }
    return null
  }

  return redirects.map((rule, index) => {
    // An off-site destination (talent.cloudemployee.io) has no rule to chain to.
    if (!rule.destination.startsWith('/')) return rule
    if (rule.has || rule.missing) return rule

    const seen = new Set<string>([rule.source, rule.destination])
    let destination = rule.destination

    for (let hop = 0; hop < MAX_HOPS; hop += 1) {
      const next = resolveOnce(destination, index)
      if (next === null) break
      // A cycle, or a rule that would redirect to its own source. Leave the
      // original destination alone rather than guess which hop was intended;
      // a wrong collapse is worse than an uncollapsed chain.
      if (next === rule.source || seen.has(next)) return rule
      seen.add(next)
      destination = next
    }

    return destination === rule.destination ? rule : { ...rule, destination }
  })
}

// A prefix-swap rule: `/resources/:slug+` -> `/blog/:slug+`. Same single param,
// plain literal prefixes on both sides, nothing else in the pattern.
const PREFIX_SWAP = /^(\/[^:]*)\/:([A-Za-z0-9_]+)\+$/

function prefixSwap(rule: Redirect): { from: string; to: string } | null {
  const source = PREFIX_SWAP.exec(rule.source)
  const destination = PREFIX_SWAP.exec(rule.destination)
  if (!source || !destination) return null
  if (source[2] !== destination[2]) return null
  return { from: source[1], to: destination[1] }
}

/**
 * Emits literal shortcut rules for chains that only exist per-slug.
 *
 * `collapseRedirectChains` cannot flatten `/resources/:slug+` -> `/blog/:slug+`,
 * because where it lands depends on the slug: most slugs reach a real article in
 * one hop, but 79 of them hit a per-slug rule (`/blog/x` -> `/staff-augmentation/x`)
 * and take two. The pattern is not the chain; a subset of the paths it matches is.
 *
 * So invert it. For every literal rule under the destination prefix, emit the
 * equivalent literal rule under the source prefix, pointing straight at the end.
 * A shortcut is skipped if any existing rule already matches that path, which is
 * what makes it safe to put them first: they can only add behaviour to paths that
 * had none.
 */
export function expandPrefixSwapShortcuts(redirects: Redirect[]): Redirect[] {
  // Only literal rules count as "already handled". The parameterised rule being
  // inverted matches these paths by definition - overriding it with a more
  // specific rule is the entire point - but an existing exact-path rule is a
  // deliberate decision about that URL and must win.
  const literalSources = literalRedirectSources(redirects)

  const shortcuts: Redirect[] = []
  const emitted = new Set<string>()

  for (const rule of redirects) {
    const swap = prefixSwap(rule)
    if (!swap) continue

    for (const target of redirects) {
      if (target.has || target.missing) continue
      if (target.source.includes(':') || target.source.includes('(')) continue
      if (!target.source.startsWith(`${swap.to}/`)) continue

      const source = `${swap.from}${target.source.slice(swap.to.length)}`
      if (emitted.has(source) || literalSources.has(source)) continue
      emitted.add(source)
      shortcuts.push({
        source,
        destination: target.destination,
        // Permanent only if BOTH hops were. A shortcut must not upgrade a
        // temporary redirect into one search engines treat as final.
        permanent: rule.permanent !== false && target.permanent !== false,
      })
    }
  }

  return [...shortcuts, ...redirects]
}

// `(` counts. Next.js reads a parenthesised group in a source as a real regex
// capture, so `/resources/(.*)` is a catch-all, not the exact path it looks like.
// Classifying it as exact put it at the front of the table where it swallowed
// everything under /resources. Caught by curl, not by tsc.
function isParameterised(source: string): boolean {
  return source.includes(':') || source.includes('(')
}

/**
 * Puts exact-path rules ahead of catch-alls, preserving order within each group.
 *
 * Next.js fires the first matching rule, so `/resources/:slug+` -> `/blog/:slug+`
 * sitting above `/resources/freelancers-vs-cloud-employee` -> `/compare/freelancers`
 * means the specific rule never runs and the visitor takes the long way round via
 * /blog/freelancers-vs-cloud-employee. That is where 4 of the 28 chains in the
 * August 2026 crawl came from, and no amount of destination rewriting fixes it:
 * the rule that needed collapsing was not the one being served.
 *
 * Audited before it was applied: exactly 4 URLs across the whole 773-rule table
 * are matched by an earlier catch-all with a different destination, and they are
 * those 4 chains. This reordering changes nothing else.
 */
export function specificRulesFirst(redirects: Redirect[]): Redirect[] {
  return [
    ...redirects.filter((rule) => !isParameterised(rule.source)),
    ...redirects.filter((rule) => isParameterised(rule.source)),
  ]
}

/**
 * Every literal (non-parameterised) path the redirect table intercepts.
 *
 * The sitemap filters against this so it can never advertise a URL that answers
 * with a 308. Parameterised sources are excluded on purpose: matching them here
 * would mean re-implementing the router, and the four URLs this exists to catch
 * are all literal.
 */
export function literalRedirectSources(redirects: Redirect[]): Set<string> {
  const sources = new Set<string>()
  for (const rule of redirects) {
    if (rule.has || rule.missing) continue
    if (rule.source.includes(':') || rule.source.includes('(')) continue
    sources.add(rule.source)
  }
  return sources
}
