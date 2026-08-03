// Searching the skill list, and accepting things that are not in it.
//
// The second half matters more than the first. A picker that only accepts what it
// already knows tells the visitor their answer is wrong, at the exact moment we are
// asking them for their requirements. So anything typed is accepted. If it is not
// in the taxonomy it becomes a custom entry, indistinguishable to the visitor and
// clearly marked in the data.
//
// Those custom entries are the useful output. What people ask CE for that CE has no
// page for is normally invisible; here it arrives as a list. `ce_skills_requested`
// carries the labels to HubSpot, and the lead endpoint logs the custom ones
// separately so the taxonomy grows from real demand rather than from a guess.

import { SKILLS, type Skill, type SkillCategory } from './taxonomy'

export interface SkillMatch {
  id: string
  label: string
  /** True when the visitor typed something the taxonomy does not know. */
  custom: boolean
}

const norm = (value: string): string => value.trim().toLowerCase().replace(/[._]/g, ' ')

/** `C#` and `.NET` must survive normalisation, so punctuation is kept, not stripped. */
function score(skill: Skill, query: string): number {
  const label = norm(skill.label)
  const aliases = (skill.aliases ?? []).map(norm)

  if (label === query || aliases.includes(query)) return 100
  if (label.startsWith(query)) return 80
  if (aliases.some((a) => a.startsWith(query))) return 70
  // Word-boundary hit beats a mid-word one: "native" should find React Native
  // before it finds anything that merely contains the letters.
  if (label.split(/[\s/&(]+/).some((w) => w.startsWith(query))) return 60
  if (label.includes(query)) return 40
  if (aliases.some((a) => a.includes(query))) return 30
  return 0
}

export interface SearchOptions {
  /** Bias results toward the role the visitor picked, without hiding the rest. */
  category?: SkillCategory
  limit?: number
}

export function searchSkills(rawQuery: string, options: SearchOptions = {}): Skill[] {
  const query = norm(rawQuery)
  const limit = options.limit ?? 8
  if (query.length === 0) return []

  return SKILLS.map((skill) => {
    const base = score(skill, query)
    if (base === 0) return null
    // Tier and category are tie-breakers, never the reason something appears.
    const tierBonus = (4 - skill.tier) * 3
    const categoryBonus = options.category && skill.category === options.category ? 6 : 0
    return { skill, total: base + tierBonus + categoryBonus }
  })
    .filter((r): r is { skill: Skill; total: number } => r !== null)
    .sort((a, b) => b.total - a.total || a.skill.label.localeCompare(b.skill.label))
    .slice(0, limit)
    .map((r) => r.skill)
}

/**
 * Turn whatever the visitor typed into a selection. An exact match on a label or
 * alias resolves to the real skill, so "k8s" and "Kubernetes" do not become two
 * different things in the CRM. Everything else is kept verbatim.
 */
export function toSelection(rawInput: string): SkillMatch | null {
  const query = norm(rawInput)
  if (query.length === 0) return null

  const exact = SKILLS.find((s) => score(s, query) === 100)
  if (exact) return { id: exact.id, label: exact.label, custom: false }

  return {
    // `custom:` prefix so a free-text entry can never collide with a taxonomy id.
    id: `custom:${query.replace(/\s+/g, '-')}`,
    // Trimmed, not title-cased. "n8n" and "iOS" are not improved by capitalising.
    label: rawInput.trim().slice(0, 60),
    custom: true,
  }
}

export function isCustom(match: SkillMatch): boolean {
  return match.custom
}

/** What goes to HubSpot in `ce_skills_requested`. Order is the visitor's. */
export function serialiseSkills(matches: SkillMatch[]): string {
  return matches.map((m) => m.label).join(', ')
}
