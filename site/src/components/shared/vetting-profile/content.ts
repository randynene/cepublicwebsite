// Vetting Profile section - all copy in one place.
//
// EVERY visible string on the section lives in this file so marketing can edit
// the section without opening the layout. The component reads one object; there
// are no hardcoded literals in the JSX (the UI_STRINGS lint rule enforces it).
//
// Source of truth for the design + copy: docs/design/Vetting Profile.html.
// Two strings deliberately differ from that file, per the 31 Jul handoff
// (docs/design/HANDOFF - Vetting Profile.md):
//   - explainer.body says "our own internal engineers at Cloud Employee"
//     (the design file said "our own engineers and psychologists").
//   - footer.ctaLabel is "Ask our AI anything" (the design file said
//     "Explore a real profile" and pointed at "#", a dead link).
//
// The candidate here is an ILLUSTRATIVE profile, not a real placed engineer.
// If that ever needs to become a real one, this is the only file that changes.

import { CHAT_HREF } from '@/lib/chat'

/** Tab ids, in autoplay order. */
export const VETTING_TAB_IDS = ['overview', 'cv', 'interview', 'coding', 'psych', 'soft'] as const

export type VettingTabId = (typeof VETTING_TAB_IDS)[number]

/** A labelled progress bar with a visible value (the value IS the text equivalent). */
export interface VettingBar {
  label: string
  /** Fill percentage, 0-100. */
  width: number
  /** The visible readout next to the bar. Never aria-hidden. */
  value: string
  /** Teal instead of lime - used for the one "watch this" score. */
  muted?: boolean
}

/** A 5-dot rating. The dots are decorative; `score` drives the screen-reader text. */
export interface VettingRating {
  label: string
  score: number
}

export interface VettingFact {
  label: string
  value: string
}

export interface VettingProfileContent {
  eyebrow: string
  headingLead: string
  headingAccent: string
  /** Glyph in the left-column check bullets. */
  checkGlyph: string
  points: { title: string; body: string }[]
  explainer: {
    body: string
    stages: string[]
    note: string
  }
  candidate: {
    photo: string
    photoAlt: string
    /** Intrinsic size of the file in /public - keeps next/image honest. */
    photoWidth: number
    photoHeight: number
    verifiedGlyph: string
    /** Announced instead of the bare tick on the photo badge. */
    verifiedLabel: string
    name: string
    badge: string
    roleLine: string
    rate: string
    ratePer: string
    separator: string
    availability: string
  }
  tabs: { id: VettingTabId; label: string }[]
  /** Screen-reader text for the 5-dot ratings, e.g. "4 out of 5". */
  ratingTemplate: string
  ratingMax: number
  panels: {
    overview: {
      label: string
      summary: string
      scores: VettingBar[]
      facts: VettingFact[]
      aiBadge: string
      aiBody: string
    }
    cv: {
      label: string
      roles: { period: string; title: string; org: string; body?: string }[]
      skills: string[]
    }
    interview: {
      label: string
      assessedByLead: string
      assessorName: string
      assessedByTail: string
      date: string
      duration: string
      ratings: VettingRating[]
      quote: string
    }
    coding: {
      label: string
      title: string
      meta: string
      score: string
      scoreLabel: string
      stats: (VettingFact & { accent?: boolean })[]
      diffFile: string
      diffLines: { kind: 'add' | 'remove'; text: string }[]
    }
    psych: {
      label: string
      lead: string
      percentile: string
      percentileSubTop: string
      percentileSubBottom: string
      traits: VettingBar[]
      tags: string[]
      note: string
    }
    soft: {
      label: string
      ratings: VettingRating[]
      facts: VettingFact[]
      quote: string
      quoteSource: string
    }
  }
  footer: {
    title: string
    ctaLabel: string
    ctaArrow: string
    /** `#chat` opens Clara; ChatLink falls back to /book-a-call if she is down. */
    ctaHref: string
  }
}

export const VETTING_PROFILE: VettingProfileContent = {
  eyebrow: 'Vetting',
  headingLead: 'You see two people -',
  headingAccent: 'not 200 CVs.',
  checkGlyph: '✓',
  points: [
    {
      title: 'Engineers vet engineers',
      body: "A senior engineer runs a live technical conversation on the candidate's real stack - not a recruiter with a keyword list.",
    },
    {
      title: 'Live coding, not take-homes',
      body: 'Real problems solved in front of an assessor, with anti-cheating checks. You see the actual results.',
    },
    {
      title: 'A full profile, not a résumé',
      body: 'Every candidate comes with a CV, interview summary, coding-test breakdown, and rate - you decide on evidence.',
    },
  ],
  explainer: {
    body: 'Every tab is a stage a candidate has to clear. Six of them, all run by our own internal engineers at Cloud Employee, before you see a name.',
    stages: ['Overview', 'CV', 'Tech interview', 'Coding test', 'Psychometric', 'Soft skills'],
    note: 'Scored by people. We use AI to cross-check our own consistency - never to decide who reaches your shortlist.',
  },
  candidate: {
    // The file in /public is pre-cropped to the square the reference produced
    // with object-fit:cover + object-position:52% 22% on the original 1402x1122
    // photo. Because its natural ratio now matches the box it renders into,
    // there is no aspect-ratio mismatch for Lighthouse to report.
    //
    // The size below is the RENDERED box, not the file (the file is 304px, i.e.
    // 4x). next/image builds its srcset from these numbers, so passing the
    // file's size here would make it serve a 304px image into a 76px hole.
    photo: '/vetting/candidate-lucas.png',
    photoAlt: 'Lucas M., vetted Senior AI Engineer',
    photoWidth: 76,
    photoHeight: 76,
    verifiedGlyph: '✓',
    verifiedLabel: 'Vetting complete',
    name: 'Lucas M.',
    badge: 'Vetted',
    roleLine: 'Senior AI Engineer · Python · LLM systems · 6 yrs · Manila (GMT+8)',
    rate: '$42',
    ratePer: '/hr',
    separator: '|',
    availability: 'Available in 2 weeks',
  },
  tabs: [
    { id: 'overview', label: 'Overview' },
    { id: 'cv', label: 'CV' },
    { id: 'interview', label: 'Tech interview' },
    { id: 'coding', label: 'Coding test' },
    { id: 'psych', label: 'Psychometric' },
    { id: 'soft', label: 'Soft skills' },
  ],
  ratingTemplate: '{score} out of {max}',
  ratingMax: 5,
  panels: {
    overview: {
      label: 'Assessment',
      summary:
        'Six years in production Python, the last three on LLM systems - retrieval pipelines, eval suites, and agent tooling for UK fintech. Owns delivery end to end.',
      scores: [
        { label: 'Coding test', width: 88, value: '88%' },
        { label: 'Live interview', width: 85, value: 'Strong' },
        { label: 'Psychometric', width: 91, value: 'Top 9%' },
      ],
      facts: [
        { label: 'Stack', value: 'Python · LangGraph' },
        { label: 'English', value: 'C1 fluent' },
        { label: 'Overlap', value: '5 hrs UK' },
        { label: 'Notice', value: '2 weeks' },
      ],
      aiBadge: 'AI in practice',
      aiBody:
        'Ships with Copilot and Claude Code daily, and rewrote 40% of the generated code in his observed task - the judgement is his, the tooling only makes him faster.',
    },
    cv: {
      label: 'Career history',
      roles: [
        {
          period: '2023 - now',
          title: 'Senior AI Engineer',
          org: 'UK payments platform · 40-person product team',
          body: 'Built the retrieval assistant now resolving 30% of tier-1 tickets; owns its eval suite and guardrails.',
        },
        {
          period: '2020 - 2023',
          title: 'Backend Engineer, Python',
          org: 'Travel booking SaaS · Manila',
          body: 'Moved fraud scoring onto a real-time feature pipeline; cut false declines by 18%.',
        },
        {
          period: '2019 - 2020',
          title: 'Data Engineer',
          org: 'Agency · Python, Postgres, AWS',
        },
      ],
      skills: ['Python', 'FastAPI', 'LangGraph', 'pgvector', 'Evals & tracing', 'AWS', 'Docker'],
    },
    interview: {
      label: 'Technical interview',
      assessedByLead: 'Assessed by ',
      assessorName: 'Marco R.',
      assessedByTail: ', Principal Engineer',
      date: '12 Jun 2026',
      duration: '55 min · live call',
      ratings: [
        { label: 'System design', score: 4 },
        { label: 'Code quality', score: 5 },
        { label: 'Debugging', score: 4 },
        { label: 'Communication', score: 5 },
      ],
      quote:
        '"Walked me through an assistant that was quietly hallucinating refund policy, how he caught it in evals, and what he got wrong on the first fix. Hire-ready for a senior seat."',
    },
    coding: {
      label: 'Live coding test',
      title: 'Repair a leaking retrieval pipeline',
      meta: 'Python 3.12 · pytest · observed screen share',
      score: '88',
      scoreLabel: 'score',
      stats: [
        { label: 'Tests passed', value: '21 / 21', accent: true },
        { label: 'Time used', value: '62 of 90 min' },
        { label: 'Anti-cheat flags', value: '0' },
      ],
      diffFile: 'retrieval.py · submitted diff',
      diffLines: [
        { kind: 'remove', text: '- hits = index.query(q, k=50)' },
        { kind: 'add', text: '+ hits = index.query(rewrite(q), k=50, filter=tenant)' },
        { kind: 'add', text: '+ hits = rerank(hits, q)[:8]  # recall 0.62 -> 0.91' },
        { kind: 'add', text: '+ assert_context_budget(hits, max_tokens=6000)' },
      ],
    },
    psych: {
      label: 'Psychometric · technical thinking',
      lead: 'How he reasons under a real deadline - not a personality quiz.',
      percentile: 'Top 9%',
      percentileSubTop: 'of engineers',
      percentileSubBottom: 'we test',
      traits: [
        { label: 'Abstract reasoning', width: 92, value: '92' },
        { label: 'Problem decomposition', width: 88, value: '88' },
        { label: 'Attention to detail', width: 90, value: '90' },
        { label: 'Learning agility', width: 94, value: '94' },
        { label: 'Risk awareness', width: 82, value: '82', muted: true },
      ],
      tags: ['Systems thinker', 'Root cause over quick patch', 'Asks before assuming'],
      note: 'A 45-minute reasoning test, scored against the 4,000+ engineers we have already placed. Our assessors do the marking - AI only flags where our own scoring looks inconsistent.',
    },
    soft: {
      label: 'Soft skills · working with your team',
      ratings: [
        { label: 'Communication', score: 5 },
        { label: 'Ownership', score: 5 },
        { label: 'Collaboration', score: 4 },
        { label: 'Takes feedback', score: 4 },
      ],
      facts: [
        { label: 'Spoken English', value: 'C1 · assessed on call' },
        { label: 'References', value: '2 of 2 verified' },
      ],
      quote:
        '"He raised the payment edge case nobody else had spotted, in writing, two days before release."',
      quoteSource: 'Reference check · former tech lead, UK payments platform',
    },
  },
  footer: {
    title: 'This is what you receive - not a CV.',
    ctaLabel: 'Ask our AI anything',
    ctaArrow: '→',
    ctaHref: CHAT_HREF,
  },
}
