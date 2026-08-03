// Ask Clara — turn session state into the declarative render input P1 built.
//
// Components still receive `AskCanvas` / `ComposerState` / `ChatEntry[]`. This
// module is the only place that decides proof vs brief vs brief-ready from the
// living brief, so an S3 → S4 reshape is just `intent` changing on the brief.

import { resolveBriefShape, type Brief } from '../brief'
import { deriveBriefDisplay } from '../display'
import {
  DISCOVERY_PROOF,
  PRODUCT_STRIP,
  SINGLE_HIRE_STRIP,
  TEAM_STRIP,
} from '../fixtures'
import type {
  AskCanvas,
  BriefCanvas,
  BriefPrompts,
  BriefReadyCta,
  ComposerState,
} from '../types'
import { isBriefReady, type AskSessionState } from './reducer'

const CTRL_D_HINT = 'Hold Ctrl+D to talk instead of typing'
const SKIP_STATUS = 'Skip - book a call'
const SAVED_STATUS = 'Brief saved to this session'
const PLACEHOLDER = 'Ask Clara...'

const READY_CTA: BriefReadyCta = {
  eyebrow: 'Brief ready to review',
  strengthLabel: 'Brief strength',
  title: 'Ready to review this with a human',
  body: '30 minutes, no obligation. We bring candidates that match this brief.',
  ctaLabel: 'Talk to a human',
  secondary: 'or keep refining in chat',
}

const DISCLAIMER =
  'A brief, not a match. A CloudEmployee lead reviews it with you and brings real candidates.'

const SQUAD_NOTE = 'Hired as one squad so they onboard together.'

/**
 * Dashed prompts for fields Clara has not captured yet. Deliberately derived
 * here (not on the Brief) so absent fields read as intentional prompts, not
 * zeros or errors.
 */
export function deriveBriefPrompts(brief: Brief): BriefPrompts {
  const shape = resolveBriefShape(brief)
  const prompts: BriefPrompts = {}

  if (shape === 'single') {
    const stacks = brief.techStacks ?? []
    if (!stacks.some((stack) => /test|playwright|cypress|jest/i.test(stack))) {
      prompts.stack = 'testing?'
    }
    if (!brief.timeline) {
      prompts.fields = { Timeline: 'Clara will ask next' }
    }
  }

  if (shape === 'team') {
    const roles = brief.roles ?? []
    const hasQa = roles.some((role) => /qa|devops|platform/i.test(role.title))
    if (!hasQa) {
      prompts.roleSlot = {
        title: 'QA / DevOps?',
        body: 'Clara is asking whether the squad needs test or platform cover.',
        note: 'awaiting signal',
      }
    }
  }

  if (shape === 'product') {
    if (!(brief.mustHaves ?? []).some((item) => /notif/i.test(item.label))) {
      prompts.mustHave = 'Notifications - email only, or SMS?'
    }
    if (!(brief.complianceFlags ?? []).some((flag) => /dpia/i.test(flag))) {
      prompts.compliance = 'DPIA?'
    }
    if (!brief.timeline) {
      prompts.fields = { 'Target live date': 'Clara is asking' }
    }
  }

  return prompts
}

function stripFor(brief: Brief) {
  const shape = resolveBriefShape(brief)
  if (shape === 'team') return TEAM_STRIP
  if (shape === 'product') return PRODUCT_STRIP
  return SINGLE_HIRE_STRIP
}

function displayOverrides(brief: Brief) {
  if (brief.intent === 'product_build') {
    return {
      headline: brief.goals?.replace(/^"|"$/g, '') || 'Product brief',
      engagementLine: brief.engagement?.durationMonths
        ? `Build pod, ${brief.engagement.durationMonths} months`
        : 'Build pod',
    }
  }
  if (brief.intent === 'team_hire' && (brief.regions?.length ?? 0) > 1) {
    return { regionName: 'PH + Eastern Europe' }
  }
  return {}
}

export function buildBriefCanvas(brief: Brief): BriefCanvas {
  const shape = resolveBriefShape(brief)
  return {
    brief,
    display: deriveBriefDisplay(brief, displayOverrides(brief)),
    prompts: deriveBriefPrompts(brief),
    squadNote: shape === 'team' ? SQUAD_NOTE : undefined,
    disclaimer: shape === 'single' ? DISCLAIMER : undefined,
    strip: isBriefReady(brief) ? undefined : stripFor(brief),
  }
}

function bookingChips(brief: Brief | null): string[] {
  if (!brief) return ['Your hiring brief']
  const display = deriveBriefDisplay(brief, displayOverrides(brief))
  return [
    display.title,
    display.headcountLine,
    display.regionLine ?? display.regionName,
    display.timelineLine,
  ].filter((value): value is string => Boolean(value))
}

/**
 * Canvas for the live session. Booking overrides everything else when open;
 * otherwise proof → brief → brief-ready follows the brief.
 */
export function deriveLiveCanvas(state: AskSessionState): AskCanvas {
  if (state.bookingOpen) {
    return {
      kind: 'booking',
      booking: {
        attachedLabel: 'Attached brief',
        attachedChips: bookingChips(state.brief),
        backLabel: 'Back to brief ›',
      },
    }
  }

  if (!state.brief || state.brief.intent === 'unknown') {
    return { kind: 'proof', proof: DISCOVERY_PROOF }
  }

  const briefCanvas = buildBriefCanvas(state.brief)
  if (isBriefReady(state.brief)) {
    return { kind: 'brief-ready', brief: briefCanvas, cta: READY_CTA }
  }
  return { kind: 'brief', brief: briefCanvas }
}

export function deriveLiveComposer(
  state: AskSessionState,
  chips: string[] | undefined,
): ComposerState {
  const ready = isBriefReady(state.brief)
  return {
    mode: 'idle',
    placeholder: PLACEHOLDER,
    chips: state.brief || state.entries.some((e) => e.kind === 'visitor')
      ? undefined
      : chips,
    hint: CTRL_D_HINT,
    status: ready ? SAVED_STATUS : SKIP_STATUS,
  }
}
