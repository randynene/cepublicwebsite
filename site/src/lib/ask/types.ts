// Ask Clara — the shapes the `/ask` UI renders.
//
// P1 filled these from fixtures; P2 fills them from the live session reducer
// (mock SSE); P3 will swap the transport for real Clara turns. Components stay
// declarative either way - that is the point of this module.

import type { Brief } from './brief'
import type { BriefDisplay } from './display'

/**
 * The ten design frames, per the reference HTML's `data-screen-label`, plus `DEEP`
 * - a deliberately overstuffed brief used to check that the canvas keeps working as
 * the brief grows. `DEEP` is a test instrument, not a designed state.
 */
export type AskScreenId =
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'S5'
  | 'S6'
  | 'S7'
  | 'S8'
  | 'S9'
  | 'S10'
  | 'DEEP'

// ─── Chat ────────────────────────────────────────────────────────────────────

/**
 * A run of text with an optional lime accent, used wherever the design colours
 * part of a sentence. Avoids putting markup inside copy strings.
 */
export interface TextSegment {
  text: string
  accent?: boolean
}

export type ChatEntry =
  /** Clara's turn. `streaming` paints the lime block caret at the end. */
  | { kind: 'clara'; id: string; text: string; streaming?: boolean }
  /** A sent visitor message. */
  | { kind: 'visitor'; id: string; text: string }
  /**
   * A live voice transcript that has not been sent yet - dashed outline, lime
   * caret. Distinct from `visitor` so it can never be mistaken for sent text.
   */
  | { kind: 'visitor-draft'; id: string; text: string }
  /** "Brief updated - stack, region" acknowledgement under Clara's turn. */
  | { kind: 'brief-update'; id: string; text: string }
  /** The soft human-handoff offer card (S6). Option A copy only. */
  | {
      kind: 'offer'
      id: string
      title: string
      body: string
      ctaLabel: string
    }
  /** A row of tappable follow-up prompts. */
  | { kind: 'suggestions'; id: string; items: string[] }

/**
 * A file the visitor has attached (a CV, a spec, a job description).
 *
 * Holds only what the composer needs to draw a chip. The `File` itself is not kept
 * here because P1 uploads nothing; when P3 sends attachments to Clara for analysis
 * this gains the payload (or a storage handle) alongside the display fields.
 */
export interface AskAttachment {
  id: string
  name: string
  /** Human-readable size, e.g. "184 KB". */
  size: string
}

export type ComposerMode = 'idle' | 'recording'

export interface ComposerState {
  mode: ComposerMode
  /** Placeholder in the text input. */
  placeholder: string
  /** Quick-start prompts shown above the composer (S1 only). */
  chips?: string[]
  /** Left-hand helper line under the composer. */
  hint: string
  /** Right-hand status/affordance under the composer. Absent on mobile. */
  status?: string
  /** Recording panel copy, when `mode` is 'recording'. */
  recording?: {
    label: string
    elapsed: string
    releaseHint?: string
    footnote?: string
    /** Mobile uses a single "Tap to stop" affordance instead of Cancel + stop. */
    compact?: boolean
  }
}

// ─── Canvas ──────────────────────────────────────────────────────────────────

export type ProofItem =
  | {
      kind: 'client-story'
      id: string
      eyebrow: string
      quote: string
      author: string
      role?: string
    }
  | {
      kind: 'did-you-know'
      id: string
      eyebrow: string
      segments: TextSegment[]
      support?: string
    }

export interface ProofPanel {
  /** Micro-label above the panel ("While we talk"). */
  eyebrow?: string
  items: ProofItem[]
  /** Which item reads as current. Also sets the active dot. */
  activeIndex: number
  /** False freezes the panel on `activeIndex` (S2, reduced motion). */
  rotating: boolean
  /** Footer line + link under the full-height panel (S1 only). */
  footer?: { text: string; linkLabel: string }
}

/**
 * Dashed "Clara has not captured this yet" prompts. Deliberately NOT part of
 * Brief: they are the canvas asking a question, not Clara asserting a fact.
 */
export interface BriefPrompts
{
  /** Dashed chip at the end of the tech-stack row ("testing?"). */
  stack?: string
  /** Dashed chip at the end of the compliance row ("DPIA?"). */
  compliance?: string
  /** Dashed value in a field slot, keyed by the field's label. */
  fields?: Record<string, string>
  /** Dashed role card in the team board. */
  roleSlot?: { title: string; body: string; note: string }
  /** Dashed must-have row in the product checklist. */
  mustHave?: string
}

export interface BriefCanvas {
  brief: Brief
  display: BriefDisplay
  prompts: BriefPrompts
  /** Supporting line inside the squad card ("Hired as one squad..."). */
  squadNote?: string
  /** Reassurance line under the card. Never claims a match (Option A). */
  disclaimer?: string
  /** Rotating proof that keeps running in the lower strip. */
  strip?: ProofPanel
}

export interface BookingCanvas {
  /** Chips summarising the brief that travels with the booking. */
  attachedLabel: string
  attachedChips: string[]
  backLabel: string
}

export interface BookedCanvas {
  eyebrow: string
  month: string
  day: string
  title: string
  detail: string
  actions: string[]
  briefSentLabel: string
  downloadLabel: string
  briefTitle: string
  briefChips: string[]
  notes: { title: string; body: string }[]
}

export type AskCanvas =
  | { kind: 'proof'; proof: ProofPanel }
  | { kind: 'brief'; brief: BriefCanvas }
  | { kind: 'brief-ready'; brief: BriefCanvas; cta: BriefReadyCta }
  | { kind: 'booking'; booking: BookingCanvas }
  | { kind: 'booked'; booked: BookedCanvas }

export interface BriefReadyCta {
  eyebrow: string
  strengthLabel: string
  title: string
  body: string
  ctaLabel: string
  secondary: string
}

// ─── A whole screen ──────────────────────────────────────────────────────────
//
// No header state here: /ask carries the standard sitewide header, so the frames'
// per-state header treatments (the lime halo at S6, the confirmed slot at S8) are
// not ours to draw. The booking confirmation still appears prominently, inside the
// S8 canvas.

export interface AskScreen {
  id: AskScreenId
  /** Switcher label, e.g. "Brief single hire". */
  label: string
  /** What makes this state happen, from the reference's state index. */
  trigger: string
  /** What the canvas shows, from the reference's state index. */
  canvasNote: string
  /**
   * Mobile frames (S9/S10) render the phone composition at any width so they are
   * reviewable from a desktop; every other frame is responsive as normal.
   */
  viewport: 'desktop' | 'mobile'
  entries: ChatEntry[]
  composer: ComposerState
  canvas: AskCanvas
}
