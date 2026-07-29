// Ask Clara — the Brief model.
//
// This type is the CONTRACT with the Clara Chatbot API, locked in
// docs/design/lead-conversion/ASK_CLARA_EXECUTION_PLAN.md §3. Clara emits it on
// each conversation turn as a `brief_update` event; this app merges and paints
// it. Nothing here is inferred from chat bubbles and there is no second LLM on
// the CE side.
//
// Keep this file free of React and of presentation concerns. Everything that
// turns a Brief into on-screen prose lives in ./display.ts, so the shape Clara
// has to satisfy stays exactly as specified.

export type BriefIntent =
  | 'unknown'
  | 'single_hire'
  | 'team_hire'
  | 'product_build'

export type BriefRegion = 'PH' | 'EE' | 'LATAM' | 'mixed'

export type BriefEngagementType = 'full_time' | 'part_time' | 'contract'

export interface BriefRole {
  title: string
  seniority?: string
  count: number
  stacks?: string[]
}

export interface BriefEngagement {
  type: BriefEngagementType
  durationMonths?: number
}

export interface BriefMustHave {
  label: string
  confirmed: boolean
}

export interface BriefPodSlot {
  role: string
  count: number
  note?: string
}

export interface Brief {
  version: number
  intent: BriefIntent
  headcount?: number
  roles?: BriefRole[]
  techStacks?: string[]
  regions?: BriefRegion[]
  engagement?: BriefEngagement
  timeline?: string
  teamContext?: string
  companyContext?: string
  goals?: string
  mustHaves?: BriefMustHave[]
  complianceFlags?: string[]
  suggestedPod?: BriefPodSlot[]
  /** 0-100. Drives the strength meter and the S6 "brief ready" threshold. */
  strength: number
}

/**
 * Strength at which the canvas switches to the S6 "brief ready" treatment and
 * Clara soft-offers a call. Starting value per the execution plan §3; tune with
 * Jake once real Clara turns are flowing (P3).
 */
export const BRIEF_READY_STRENGTH = 70

/**
 * Mode D from the UX brief: past this size we stop trying to draw a bigger and
 * bigger collage and recommend a human working session instead.
 */
export function isBigTeam(brief: Brief): boolean {
  const headcount = brief.headcount ?? 0
  const distinctRoles = brief.roles?.length ?? 0
  return headcount >= 5 || distinctRoles >= 3
}

/**
 * Which brief card the canvas should draw. Driven by `intent` first (a product
 * build has no named role, so headcount tells us nothing), then by headcount.
 */
export type BriefShape = 'pending' | 'single' | 'team' | 'product'

export function resolveBriefShape(brief: Brief): BriefShape {
  if (brief.intent === 'product_build') return 'product'
  if (brief.intent === 'team_hire') return 'team'
  if (brief.intent === 'single_hire') return 'single'
  return 'pending'
}

/** Total people across the role mix, for team briefs where headcount is unset. */
export function countRoleSlots(brief: Brief): number {
  if (typeof brief.headcount === 'number') return brief.headcount
  return (brief.roles ?? []).reduce((total, role) => total + role.count, 0)
}
