// Ask Clara — turning a Brief into on-screen prose.
//
// The canvas never reads raw Brief fields for its sentences; it reads a
// BriefDisplay derived here. Two reasons:
//
//   1. The Brief contract (./brief.ts §3 of the execution plan) is Clara's to
//      satisfy and must not grow presentation fields.
//   2. Every string below has to degrade to `null` when the underlying field is
//      absent, so the canvas can draw a dashed placeholder instead of "0" or
//      "undefined". Doing that once here beats doing it in nine components.
//
// A fixture (or, later, a Clara turn) may override any single line via
// `overrides`. That hatch exists for the two things the locked Brief genuinely
// cannot express - see ASK_P1_NOTES in ./fixtures.ts.

import {
  countRoleSlots,
  type Brief,
  type BriefEngagementType,
  type BriefRegion,
} from './brief'

export interface BriefDisplay {
  /** Eyebrow above the canvas headline: "Your hiring brief" / "Your product brief". */
  label: string
  /** Canvas headline: "One engineer, embedded". */
  headline: string | null
  /** Card title: the role, or the product for a build brief. */
  title: string | null
  /** Seniority badge on the profile card: "Senior · 5-8 yrs". */
  seniorityBadge: string | null
  /** "1 hire · full-time". */
  headcountLine: string | null
  /** Region name alone: "Philippines". */
  regionName: string | null
  /** Overlap phrase alone: "4h with London". */
  overlapLine: string | null
  /** Region and overlap together: "Philippines · 4h with London". */
  regionLine: string | null
  /** "Full-time, ongoing". */
  engagementLine: string | null
  /** Free-text timeline straight from the brief: "Within 6 weeks". */
  timelineLine: string | null
  /** "Joins 4-person product team". */
  teamContextLine: string | null
  /** Headcount numeral for the squad card: "3". */
  squadCount: string | null
  /** Role mix for the squad card: "2 backend, 1 frontend". */
  squadMix: string | null
  /** One-liner under the S6 title and inside the S7 chip row. */
  summaryLine: string | null
}

const NUMBER_WORD: Record<number, string> = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
}

// Overlap is expressed against London because CE's buyer base is UK-weighted and
// the reference design says "4h with London". P3 should take the comparison city
// from Clara (or from the visitor's locale) rather than hard-coding it here.
const REGION: Record<BriefRegion, { name: string; overlapWithLondon: string }> = {
  PH: { name: 'Philippines', overlapWithLondon: '4h with London' },
  EE: { name: 'Eastern Europe', overlapWithLondon: 'Full working-day overlap' },
  LATAM: { name: 'LATAM', overlapWithLondon: 'US hours' },
  mixed: { name: 'Mixed regions', overlapWithLondon: 'Overlap varies by region' },
}

const ENGAGEMENT_LONG: Record<BriefEngagementType, string> = {
  full_time: 'Full-time, ongoing',
  part_time: 'Part-time',
  contract: 'Contract',
}

const ENGAGEMENT_SHORT: Record<BriefEngagementType, string> = {
  full_time: 'full-time',
  part_time: 'part-time',
  contract: 'contract',
}

function regionsOf(brief: Brief): BriefRegion[] {
  return brief.regions ?? []
}

function regionName(brief: Brief): string | null {
  const regions = regionsOf(brief)
  if (regions.length === 0) return null
  return regions.map((region) => REGION[region].name).join(' + ')
}

function overlapLine(brief: Brief): string | null {
  const regions = regionsOf(brief)
  // Overlap only reads cleanly for a single region; a mixed team gets its
  // overlap discussed on the call instead of averaged into a fake number.
  if (regions.length !== 1) return null
  return REGION[regions[0]].overlapWithLondon
}

function headcountLine(brief: Brief): string | null {
  const count = countRoleSlots(brief)
  if (count <= 0) return null
  const hires = count === 1 ? '1 hire' : `${count} hires`
  const engagement = brief.engagement
    ? ENGAGEMENT_SHORT[brief.engagement.type]
    : null
  return engagement ? `${hires} · ${engagement}` : hires
}

function engagementLine(brief: Brief): string | null {
  const engagement = brief.engagement
  if (!engagement) return null
  const base = ENGAGEMENT_LONG[engagement.type]
  if (engagement.type === 'contract' && engagement.durationMonths) {
    return `${base}, ${engagement.durationMonths} months`
  }
  return base
}

function headline(brief: Brief): string | null {
  if (brief.intent === 'single_hire') return 'One engineer, embedded'
  if (brief.intent === 'team_hire') {
    const count = countRoleSlots(brief)
    const word = NUMBER_WORD[count]
    if (!word) return null
    return `${word} engineers, one squad`
  }
  // A product build's headline is the product itself, which the locked Brief has
  // no field for. Fixtures supply it via `overrides.headline`.
  return null
}

function squadMix(brief: Brief): string | null {
  const roles = brief.roles ?? []
  if (roles.length === 0) return null
  return roles
    .map((role) => `${role.count} ${role.title.toLowerCase()}`)
    .join(', ')
}

function summaryLine(brief: Brief): string | null {
  const parts = [headcountLine(brief), regionName(brief)]
  if (brief.timeline) parts.push(`start ${brief.timeline.toLowerCase()}`)
  const present = parts.filter((part): part is string => Boolean(part))
  return present.length > 0 ? present.join(' · ') : null
}

export function deriveBriefDisplay(
  brief: Brief,
  overrides: Partial<BriefDisplay> = {},
): BriefDisplay {
  const primaryRole = brief.roles?.[0] ?? null
  const count = countRoleSlots(brief)

  const derived: BriefDisplay = {
    label:
      brief.intent === 'product_build'
        ? 'Your product brief'
        : 'Your hiring brief',
    headline: headline(brief),
    title: primaryRole?.title ?? null,
    seniorityBadge: primaryRole?.seniority ?? null,
    headcountLine: headcountLine(brief),
    regionName: regionName(brief),
    overlapLine: overlapLine(brief),
    regionLine: null,
    engagementLine: engagementLine(brief),
    timelineLine: brief.timeline ?? null,
    teamContextLine: brief.teamContext ?? null,
    squadCount: count > 0 ? String(count) : null,
    squadMix: squadMix(brief),
    summaryLine: summaryLine(brief),
  }

  const name = derived.regionName
  const overlap = derived.overlapLine
  derived.regionLine = name && overlap ? `${name} · ${overlap}` : name

  return { ...derived, ...overrides }
}
