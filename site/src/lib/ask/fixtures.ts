// Ask Clara — P1 state fixtures.
//
// Ten hand-written screens, one per frame of the visual source of truth at
// docs/design/lead-conversion/ask-clara-reference/Ask_Clara_Page_standalone.html
// (frames carry `data-screen-label`). Every string below is transcribed from that
// file so the build can be diffed against it line by line.
//
// These exist so P1 can be reviewed and signed off with no Clara API, no token
// spend and no HubSpot. P2 replaces this module as the render source with a
// scripted SSE mock; P3 with real Clara turns. The components never learn which
// one they are being fed.
//
// Author-voice rule (CLAUDE.md): hyphens, never em/en dashes.

import { deriveBriefDisplay } from './display'
import type { Brief } from './brief'
import type {
  AskScreen,
  AskScreenId,
  BriefCanvas,
  ProofItem,
  ProofPanel,
} from './types'

// ─── Notes for the phases after this one ─────────────────────────────────────
//
// Three things the design needs that the locked Brief (execution plan §3) cannot
// express. All three are handled by `deriveBriefDisplay`'s override hatch here
// rather than by widening the Clara contract mid-build, and all three are worth
// resolving when the P3 Clara contract is written:
//
//   1. A product build has no name field. S5's headline "Clinic booking MVP" is
//      neither `goals` nor `companyContext`.
//   2. `engagement.durationMonths` is a single number, so S5's "3-6 months"
//      range cannot be stored.
//   3. Region overlap is phrased against London ("4h with London"). That belongs
//      to the visitor's timezone, not to the region.
export const ASK_P1_NOTES = [
  'Brief has no product name field (S5 headline).',
  'engagement.durationMonths cannot hold a range (S5 "3-6 months").',
  'Overlap phrasing assumes a London-based buyer.',
] as const

// ─── Proof content ───────────────────────────────────────────────────────────
// Static marketing/trust content. Sanity owns this from P3 onwards (`askPage`
// singleton); it is never the live brief and never AI-generated.

const STORY_SALMON_SUPPLIERS: ProofItem = {
  kind: 'client-story',
  id: 'story-salmon-suppliers',
  eyebrow: 'Client story',
  quote:
    'We interviewed four suppliers. CloudEmployee was the only one whose engineers asked about our roadmap before they asked about the rate.',
  author: 'Alex Prentice',
  role: 'CTO, Salmon Software',
}

const STORY_WILLO_WEEK_TWO: ProofItem = {
  kind: 'client-story',
  id: 'story-willo-week-two',
  eyebrow: 'Client story',
  quote:
    'Our first hire shipped to production in week two. Eighteen months on, he runs the payments squad.',
  author: 'Kirsty Bell',
  role: 'Head of Engineering, Willo',
}

const STORY_EVENT_CONNECTIONS_TEAM: ProofItem = {
  kind: 'client-story',
  id: 'story-event-connections-team',
  eyebrow: 'Client story',
  quote:
    "By month three it stopped feeling like outsourcing. Nobody on the team calls them the offshore guys - they're just the team.",
  author: 'Dan Merrow',
  role: 'Founder, Event Connections',
}

const FACT_VETTING: ProofItem = {
  kind: 'did-you-know',
  id: 'fact-vetting',
  eyebrow: 'Did you know',
  segments: [
    { text: 'Only ' },
    { text: '4.1%', accent: true },
    {
      text: ' of applicants clear our vetting. The other 95.9% never reach your inbox.',
    },
  ],
  support:
    'Five stages: technical screen, live build, code review, psychometrics, and an English fluency call.',
}

const FACT_MANILA_OVERLAP: ProofItem = {
  kind: 'did-you-know',
  id: 'fact-manila-overlap',
  eyebrow: 'Did you know',
  segments: [
    { text: 'Manila runs ' },
    { text: 'four hours', accent: true },
    { text: ' ahead of London - so standups happen live, not in a thread.' },
  ],
  support:
    'Eastern Europe gives you a full working-day overlap; LATAM covers US hours.',
}

const DISCOVERY_PROOF: ProofPanel = {
  eyebrow: 'While we talk',
  items: [
    STORY_SALMON_SUPPLIERS,
    FACT_VETTING,
    STORY_WILLO_WEEK_TWO,
    STORY_EVENT_CONNECTIONS_TEAM,
  ],
  activeIndex: 0,
  rotating: true,
  footer: {
    text: 'Six weeks is our typical time from brief to embedded engineer.',
    linkLabel: 'See customer stories ›',
  },
}

// S2 freezes the panel on its second card while the visitor is talking, so the
// canvas holds still rather than competing with the waveform.
const VOICE_PROOF: ProofPanel = {
  items: [
    STORY_SALMON_SUPPLIERS,
    FACT_MANILA_OVERLAP,
    STORY_WILLO_WEEK_TWO,
    STORY_EVENT_CONNECTIONS_TEAM,
  ],
  activeIndex: 1,
  rotating: false,
}

const SINGLE_HIRE_STRIP: ProofPanel = {
  items: [
    STORY_WILLO_WEEK_TWO,
    {
      kind: 'did-you-know',
      id: 'fact-manila-cost',
      eyebrow: 'Did you know',
      segments: [
        {
          text: 'Senior React engineers in Manila cost roughly a third of London - with the same code review standards.',
        },
      ],
      support: 'Open the live price calculator ›',
    },
    {
      kind: 'client-story',
      id: 'story-salmon-kept-her',
      eyebrow: 'Client story',
      quote:
        'We asked for one React engineer. We kept her, then hired two more from the same team.',
      author: 'Alex Prentice',
      role: 'CTO, Salmon Software',
    },
  ],
  activeIndex: 0,
  rotating: true,
}

const TEAM_STRIP: ProofPanel = {
  items: [
    {
      kind: 'client-story',
      id: 'story-event-connections-squad',
      eyebrow: 'Client story',
      quote:
        'They built us a four-person squad in seven weeks. Our own UK hiring took five months for one role.',
      author: 'Dan Merrow',
      role: 'Founder, Event Connections',
    },
    {
      kind: 'did-you-know',
      id: 'fact-squad-velocity',
      eyebrow: 'Did you know',
      segments: [
        {
          text: 'Squads that onboard together in the same timezone reach full velocity roughly twice as fast as staggered hires.',
        },
      ],
      support: 'From 400+ placements across PH, EE and LATAM',
    },
  ],
  activeIndex: 0,
  rotating: true,
}

const PRODUCT_STRIP: ProofPanel = {
  items: [
    {
      kind: 'client-story',
      id: 'story-slotwise-bookings',
      eyebrow: 'Client story',
      quote:
        'We came in with a pitch deck and no engineers. Fourteen weeks later we were taking bookings.',
      author: 'Priya Raman',
      role: 'Founder, Slotwise',
    },
    {
      kind: 'did-you-know',
      id: 'fact-mvp-pod-size',
      eyebrow: 'Did you know',
      segments: [
        {
          text: 'Most MVPs we ship start with two engineers, not five. The pod grows once the product has users.',
        },
      ],
      support: 'See how product builds work ›',
    },
  ],
  activeIndex: 0,
  rotating: true,
}

const MOBILE_PROOF: ProofPanel = {
  items: [
    {
      kind: 'client-story',
      id: 'story-willo-mobile',
      eyebrow: 'Client story',
      quote: 'Our first hire shipped to production in week two.',
      author: 'Kirsty Bell',
      role: 'Willo',
    },
    {
      kind: 'did-you-know',
      id: 'fact-vetting-mobile',
      eyebrow: 'Did you know',
      segments: [{ text: 'Only 4.1% of applicants clear our vetting.' }],
      support: 'Five stages, including psychometrics',
    },
  ],
  activeIndex: 0,
  rotating: true,
}

// ─── Briefs ──────────────────────────────────────────────────────────────────

const SINGLE_HIRE_BRIEF: Brief = {
  version: 2,
  intent: 'single_hire',
  headcount: 1,
  roles: [{ title: 'Senior React Engineer', seniority: 'Senior · 5-8 yrs', count: 1 }],
  techStacks: ['React', 'TypeScript', 'Next.js'],
  regions: ['PH'],
  engagement: { type: 'full_time' },
  teamContext: 'Joins 4-person product team',
  strength: 58,
}

const TEAM_BRIEF: Brief = {
  version: 3,
  intent: 'team_hire',
  headcount: 3,
  roles: [
    {
      title: 'Backend',
      seniority: 'Mid-senior Node',
      count: 2,
      stacks: ['Node.js', 'Postgres', 'AWS'],
    },
    {
      title: 'Frontend',
      seniority: 'Senior React',
      count: 1,
      stacks: ['React', 'TypeScript'],
    },
  ],
  techStacks: ['TypeScript', 'GitHub Actions'],
  regions: ['PH', 'EE'],
  timeline: 'Phased, September',
  strength: 74,
}

const PRODUCT_BRIEF: Brief = {
  version: 3,
  intent: 'product_build',
  techStacks: ['Next.js', 'Node', 'Postgres', 'Stripe'],
  regions: ['PH'],
  engagement: { type: 'contract', durationMonths: 6 },
  mustHaves: [
    { label: 'Patient booking + reschedule', confirmed: true },
    { label: 'Clinic availability management', confirmed: true },
    { label: 'Stripe payments + refunds', confirmed: true },
  ],
  complianceFlags: ['UK data hosting', 'Audit trail'],
  suggestedPod: [
    { role: 'Full-stack', count: 1, note: 'Next.js + Node lead' },
    { role: 'Backend', count: 1, note: 'Payments + data model' },
    { role: 'QA', count: 0.5, note: 'Part-time from week 3' },
  ],
  strength: 67,
}

const READY_BRIEF: Brief = {
  version: 4,
  intent: 'single_hire',
  headcount: 1,
  roles: [{ title: 'Senior React Engineer', seniority: 'Senior, 5-8 yrs', count: 1 }],
  techStacks: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Playwright'],
  regions: ['PH'],
  engagement: { type: 'full_time' },
  timeline: 'Within 6 weeks',
  teamContext: '4-person product team',
  goals:
    '"Ship the customer portal rewrite without pulling the London team off roadmap work."',
  strength: 96,
}

const MOBILE_BRIEF: Brief = {
  version: 2,
  intent: 'single_hire',
  headcount: 1,
  roles: [{ title: 'Senior React Engineer', seniority: 'Senior · 5-8 yrs', count: 1 }],
  techStacks: ['React', 'TypeScript'],
  regions: ['PH'],
  engagement: { type: 'full_time' },
  strength: 58,
}

const SINGLE_HIRE_CANVAS: BriefCanvas = {
  brief: SINGLE_HIRE_BRIEF,
  display: deriveBriefDisplay(SINGLE_HIRE_BRIEF),
  prompts: {
    stack: 'testing?',
    fields: { Timeline: 'Clara will ask next' },
  },
  disclaimer:
    'A brief, not a match. A CloudEmployee lead reviews it with you and brings real candidates.',
  strip: SINGLE_HIRE_STRIP,
}

const TEAM_CANVAS: BriefCanvas = {
  brief: TEAM_BRIEF,
  // "PH + Eastern Europe" is the design's shorthand; the derivation would spell
  // both regions out in full.
  display: deriveBriefDisplay(TEAM_BRIEF, { regionName: 'PH + Eastern Europe' }),
  prompts: {
    roleSlot: {
      title: 'QA / DevOps?',
      body: 'Clara is asking whether the squad needs test or platform cover.',
      note: 'awaiting signal',
    },
  },
  squadNote: 'Hired as one squad so they onboard together.',
  strip: TEAM_STRIP,
}

const PRODUCT_CANVAS: BriefCanvas = {
  brief: PRODUCT_BRIEF,
  display: deriveBriefDisplay(PRODUCT_BRIEF, {
    headline: 'Clinic booking MVP',
    engagementLine: 'Build pod, 3-6 months',
  }),
  prompts: {
    mustHave: 'Notifications - email only, or SMS?',
    compliance: 'DPIA?',
    fields: { 'Target live date': 'Clara is asking' },
  },
  strip: PRODUCT_STRIP,
}

const READY_CANVAS: BriefCanvas = {
  brief: READY_BRIEF,
  display: deriveBriefDisplay(READY_BRIEF),
  prompts: {},
}

const MOBILE_CANVAS: BriefCanvas = {
  brief: MOBILE_BRIEF,
  display: deriveBriefDisplay(MOBILE_BRIEF, {
    summaryLine: '1 hire · full-time · PH',
  }),
  prompts: { stack: 'timeline?' },
}

// ─── Growth test ─────────────────────────────────────────────────────────────
// Not a design frame. The brief is meant to keep deepening for as long as the
// conversation runs, so this is a deliberately overstuffed one that cannot fit the
// canvas at any realistic window height - the only honest way to check that the
// brief region really scrolls, that the action bar stays pinned, and that the proof
// band underneath is still reachable.

const DEEP_BRIEF: Brief = {
  version: 11,
  intent: 'product_build',
  regions: ['PH', 'EE'],
  engagement: { type: 'contract', durationMonths: 9 },
  timeline: 'Phased from October, live by March',
  teamContext: 'Joins a 9-person product org across London and Lisbon',
  companyContext: 'Series A clinic software, 40 staff, 1,200 clinics onboarded',
  techStacks: [
    'Next.js',
    'Node',
    'Postgres',
    'Stripe',
    'Redis',
    'Terraform',
    'AWS',
    'Playwright',
    'Datadog',
    'GitHub Actions',
  ],
  mustHaves: [
    { label: 'Patient booking + reschedule', confirmed: true },
    { label: 'Clinic availability management', confirmed: true },
    { label: 'Stripe payments + refunds', confirmed: true },
    { label: 'Clinician rota import', confirmed: true },
    { label: 'SMS and email reminders', confirmed: true },
    { label: 'Waiting-list auto-fill', confirmed: true },
    { label: 'Insurer claim export', confirmed: true },
    { label: 'Multi-site reporting', confirmed: true },
    { label: 'Patient record migration from the legacy system', confirmed: true },
  ],
  complianceFlags: [
    'UK data hosting',
    'Audit trail',
    'DPIA complete',
    'ISO 27001 alignment',
    'NHS DSPT',
    'Pen test before launch',
    'Data processor agreements',
  ],
  suggestedPod: [
    { role: 'Full-stack', count: 2, note: 'Next.js + Node leads' },
    { role: 'Backend', count: 2, note: 'Payments, claims and data model' },
    { role: 'Frontend', count: 1, note: 'Clinician and patient surfaces' },
    { role: 'QA', count: 1, note: 'Automation from week 3' },
    { role: 'DevOps', count: 0.5, note: 'Terraform and release pipeline' },
    { role: 'Delivery lead', count: 0.5, note: 'Shared across the pod' },
  ],
  goals:
    '"Replace the legacy booking system without a weekend of downtime, keep every clinic live through the cutover, and come out of it with a platform we can add insurers to without another rebuild."',
  strength: 88,
}

const DEEP_CANVAS: BriefCanvas = {
  brief: DEEP_BRIEF,
  display: deriveBriefDisplay(DEEP_BRIEF, {
    headline: 'Clinic platform replacement',
    regionName: 'PH + Eastern Europe',
    engagementLine: 'Build pod, 9-12 months',
  }),
  prompts: {
    mustHave: 'Pharmacy integration - in scope for v1?',
    compliance: 'Cyber Essentials Plus?',
  },
  strip: PRODUCT_STRIP,
}

// ─── Screens ─────────────────────────────────────────────────────────────────

const CTRL_D_HINT = 'Hold Ctrl+D to talk instead of typing'
const SKIP_STATUS = 'Skip - book a call'
const SAVED_STATUS = 'Brief saved to this session'
const PLACEHOLDER = 'Ask Clara...'

export const ASK_SCREENS: Record<AskScreenId, AskScreen> = {
  S1: {
    id: 'S1',
    label: 'Discovery',
    trigger: 'Landing, no hiring signal',
    canvasNote: 'Rotating client stories + did-you-knows',
    viewport: 'desktop',
    entries: [
      {
        kind: 'clara',
        id: 's1-welcome',
        text: "Hi, I'm Clara - CloudEmployee's hiring assistant. Ask me anything about how embedded engineering works, or tell me who you're hiring and I'll build a brief on the right.",
      },
      {
        kind: 'visitor',
        id: 's1-q1',
        text: 'How is this different from an agency?',
      },
      {
        kind: 'clara',
        id: 's1-a1',
        text: 'You get the engineer, not a project team. They join your standups, your repo and your tooling, and they stay on your team - we handle recruitment, payroll, equipment and retention in the background.',
        streaming: true,
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      chips: [
        'Hire one senior React engineer',
        'Build a squad of 3',
        'Not sure - help me scope',
      ],
      hint: CTRL_D_HINT,
      status: SKIP_STATUS,
    },
    canvas: { kind: 'proof', proof: DISCOVERY_PROOF },
  },

  S2: {
    id: 'S2',
    label: 'Voice active',
    trigger: 'Mic pressed or Ctrl+D held',
    canvasNote: 'Unchanged - waveform sits above the input',
    viewport: 'desktop',
    entries: [
      {
        kind: 'clara',
        id: 's2-prompt',
        text: "Easier to say it than type it - go ahead, I'm listening.",
      },
      {
        kind: 'visitor-draft',
        id: 's2-draft',
        text: "So we've got a React app, and I need someone senior who can own the frontend while my team focuses on",
      },
    ],
    composer: {
      mode: 'recording',
      placeholder: PLACEHOLDER,
      hint: 'Voice is transcribed on-device, then sent as text',
      status: SKIP_STATUS,
      recording: {
        label: 'Transcribing as you speak',
        elapsed: '0:14',
        releaseHint: 'Release Ctrl+D to send',
        footnote: 'Your words land in the brief, not just the chat',
      },
    },
    canvas: { kind: 'proof', proof: VOICE_PROOF },
  },

  S3: {
    id: 'S3',
    label: 'Single hire',
    trigger: 'headcount = 1 and a role is named',
    canvasNote: 'One profile card, fields fill in live',
    viewport: 'desktop',
    entries: [
      {
        kind: 'visitor',
        id: 's3-q1',
        text: 'I need one senior React dev to join our product team in London.',
      },
      {
        kind: 'clara',
        id: 's3-a1',
        text: 'Started your brief on the right. Is TypeScript part of the stack, and would Next.js experience matter?',
      },
      { kind: 'visitor', id: 's3-q2', text: 'Both, yes.' },
      {
        kind: 'clara',
        id: 's3-a2',
        text: 'Added. The Philippines gives you around four hours of London overlap, which suits a live standup. When would you want them starting',
        streaming: true,
      },
      {
        kind: 'brief-update',
        id: 's3-update',
        text: 'Brief updated - stack, region',
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: CTRL_D_HINT,
      status: SKIP_STATUS,
    },
    canvas: { kind: 'brief', brief: SINGLE_HIRE_CANVAS },
  },

  S4: {
    id: 'S4',
    label: 'Team / squad',
    trigger: 'headcount 2 or more',
    canvasNote: 'Grouped profile mark + role mix board',
    viewport: 'desktop',
    entries: [
      {
        kind: 'visitor',
        id: 's4-q1',
        text: "Actually it's a squad, not one person - two backend, one frontend.",
      },
      {
        kind: 'clara',
        id: 's4-a1',
        text: 'Reshaped your brief into a 3-person squad. Node and Postgres on the backend side - does anyone need to own infrastructure, or does your team keep that?',
      },
      {
        kind: 'visitor',
        id: 's4-q2',
        text: 'We keep infra, but AWS familiarity matters. Phased start from September.',
      },
      {
        kind: 'clara',
        id: 's4-a2',
        text: 'Noted. Last scope question: do you want QA or platform cover inside the squad, or all three as product engineers',
        streaming: true,
      },
      {
        kind: 'brief-update',
        id: 's4-update',
        text: 'Brief updated - headcount 1 → 3, role mix, start',
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: CTRL_D_HINT,
      status: SKIP_STATUS,
    },
    canvas: { kind: 'brief', brief: TEAM_CANVAS },
  },

  S5: {
    id: 'S5',
    label: 'Product / MVP',
    trigger: 'Product intent, no role named',
    canvasNote: 'Scope checklist + suggested pod',
    viewport: 'desktop',
    entries: [
      {
        kind: 'visitor',
        id: 's5-q1',
        text: "Honestly I don't know what roles I need. I just need an MVP built - a booking app for clinics.",
      },
      {
        kind: 'clara',
        id: 's5-a1',
        text: "Then let's brief the product, not the roles - I'll suggest the team shape at the end. What does version one absolutely have to do on day one?",
      },
      {
        kind: 'visitor',
        id: 's5-q2',
        text: 'Patients book and reschedule, clinics manage availability, Stripe payments, and it has to survive a data audit.',
      },
      {
        kind: 'clara',
        id: 's5-a2',
        text: "Captured. Data audit usually means UK hosting and an audit trail - I've flagged both. Is there a date this has to be live by",
        streaming: true,
      },
      {
        kind: 'brief-update',
        id: 's5-update',
        text: 'Brief updated - scope, payments, compliance, suggested pod',
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: CTRL_D_HINT,
      status: SKIP_STATUS,
    },
    canvas: { kind: 'brief', brief: PRODUCT_CANVAS },
  },

  S6: {
    id: 'S6',
    label: 'Brief ready',
    trigger: 'Required fields captured',
    canvasNote: 'Full brief + Schedule a Call emphasis',
    viewport: 'desktop',
    entries: [
      {
        kind: 'visitor',
        id: 's6-q1',
        text: 'Within six weeks ideally. And Playwright for tests.',
      },
      {
        kind: 'clara',
        id: 's6-a1',
        text: "That's everything I need. Your brief is strong enough for a matching conversation - a CloudEmployee lead will bring real candidate options and walk through cost.",
      },
      {
        kind: 'offer',
        id: 's6-offer',
        title: 'Book 30 minutes to review your brief',
        body: 'Your brief comes with you - no forms, no repeating yourself.',
        ctaLabel: 'Schedule a Call',
      },
      {
        kind: 'suggestions',
        id: 's6-suggestions',
        items: ['Add a second role', 'Change region', 'What does this cost?'],
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: CTRL_D_HINT,
      status: SAVED_STATUS,
    },
    canvas: {
      kind: 'brief-ready',
      brief: READY_CANVAS,
      cta: {
        eyebrow: 'Brief ready to review',
        strengthLabel: 'Brief strength',
        title: 'Ready to review this with a human',
        body: '30 minutes, no obligation. We bring candidates that match this brief.',
        ctaLabel: 'Schedule a Call',
        secondary: 'or keep refining in chat',
      },
    },
  },

  S7: {
    id: 'S7',
    label: 'Booking open',
    trigger: 'Schedule a Call clicked anywhere',
    canvasNote: 'Calendly embed, brief pinned above it',
    viewport: 'desktop',
    entries: [
      { kind: 'visitor', id: 's7-q1', text: 'Let us do the call.' },
      {
        kind: 'clara',
        id: 's7-a1',
        text: 'Opening the calendar on the right - your brief goes with the booking, so whoever takes the call has already read it. Pick any slot that suits you.',
      },
      {
        kind: 'brief-update',
        id: 's7-update',
        text: 'Brief v4 attached · you can keep chatting while you book',
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: CTRL_D_HINT,
      status: SAVED_STATUS,
    },
    canvas: {
      kind: 'booking',
      booking: {
        attachedLabel: 'Attached brief',
        attachedChips: [
          'Senior React Engineer',
          '1 hire · full-time',
          'Philippines · 4h overlap',
          'Within 6 weeks',
        ],
        backLabel: 'Back to brief ›',
      },
    },
  },

  S8: {
    id: 'S8',
    label: 'Booked',
    trigger: 'Slot confirmed',
    canvasNote: 'Confirmation + brief sent as PDF',
    viewport: 'desktop',
    entries: [
      {
        kind: 'clara',
        id: 's8-a1',
        text: 'Booked - Wednesday 29 July at 11:00. The invite is on its way to jake@northrowhealth.co.uk with your brief attached as a PDF.',
      },
      {
        kind: 'clara',
        id: 's8-a2',
        text: 'Anything you remember before then, tell me here and I will update the brief - the call notes update with it.',
      },
      {
        kind: 'suggestions',
        id: 's8-suggestions',
        items: ['Add a second role', 'Email me the brief', 'What does this cost?'],
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: CTRL_D_HINT,
      status: SAVED_STATUS,
    },
    canvas: {
      kind: 'booked',
      booked: {
        eyebrow: 'You are booked in',
        month: 'Jul',
        day: '29',
        title: 'Discovery Call · 11:00-11:30 UK',
        detail: 'With Steph, hiring lead. Meet link is in the invite.',
        actions: ['Add to calendar', 'Reschedule'],
        briefSentLabel: 'Brief sent with the invite',
        downloadLabel: 'Download PDF ›',
        briefTitle: 'Senior React Engineer · Philippines',
        briefChips: [
          '1 hire · full-time',
          'React · TypeScript · Next.js',
          '4h London overlap',
          'Start within 6 weeks',
        ],
        notes: [
          {
            title: 'Before the call',
            body: 'We send 2-3 anonymised profiles that fit this brief where we already have a match.',
          },
          {
            title: 'Session',
            body: 'ask_9f2c · brief v4 · linked to your email, so a return visit picks up where you left off.',
          },
        ],
      },
    },
  },

  S9: {
    id: 'S9',
    label: 'Mobile discovery',
    trigger: 'Small viewport, no brief signal',
    canvasNote: 'Proof card above the thread',
    viewport: 'mobile',
    entries: [
      {
        kind: 'clara',
        id: 's9-prompt',
        text: "Tell me who you're hiring - or just talk, I'll write it down.",
      },
      {
        kind: 'visitor-draft',
        id: 's9-draft',
        text: 'One senior React dev working with our London team',
      },
    ],
    composer: {
      mode: 'recording',
      placeholder: PLACEHOLDER,
      hint: 'Hold the mic to talk instead of typing',
      recording: {
        label: 'Transcribing as you speak',
        elapsed: '0:09',
        compact: true,
      },
    },
    canvas: { kind: 'proof', proof: MOBILE_PROOF },
  },

  S10: {
    id: 'S10',
    label: 'Mobile brief',
    trigger: 'Small viewport, brief exists',
    canvasNote: 'Brief card pinned above the thread',
    viewport: 'mobile',
    entries: [
      { kind: 'visitor', id: 's10-q1', text: 'Working with our London team.' },
      {
        kind: 'clara',
        id: 's10-a1',
        text: 'Added - Manila gives you about four hours of London overlap. When would they start',
        streaming: true,
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: 'Hold the mic to talk instead of typing',
    },
    canvas: { kind: 'brief', brief: MOBILE_CANVAS },
  },

  DEEP: {
    id: 'DEEP',
    label: 'Deep brief',
    trigger: 'Growth test - not one of the design frames',
    canvasNote: 'Overstuffed brief: proves the canvas scrolls and the actions pin',
    viewport: 'desktop',
    entries: [
      {
        kind: 'visitor',
        id: 'deep-q1',
        text: 'One more thing - we also need the insurer claim export, and it has to pass a pen test before launch.',
      },
      {
        kind: 'clara',
        id: 'deep-a1',
        text: 'Added both. That is a substantial scope now, so I have sketched a six-person pod rather than trying to fit it into three. A CloudEmployee lead should walk the whole thing through with you.',
        streaming: true,
      },
      {
        kind: 'brief-update',
        id: 'deep-update',
        text: 'Brief updated - claims export, pen test, pod resized',
      },
    ],
    composer: {
      mode: 'idle',
      placeholder: PLACEHOLDER,
      hint: CTRL_D_HINT,
      status: SAVED_STATUS,
    },
    canvas: { kind: 'brief', brief: DEEP_CANVAS },
  },
}

export const ASK_SCREEN_ORDER: AskScreenId[] = [
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
  'S10',
  'DEEP',
]

/** The state `/ask` boots into. */
export const ASK_DEFAULT_SCREEN: AskScreenId = 'S1'

export function isAskScreenId(value: string | null): value is AskScreenId {
  return value !== null && value in ASK_SCREENS
}

type RawSearchParams = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

/**
 * Reads the review controls off the query string.
 *
 * `?askDebug=1` mounts the state switcher; `&askState=S4` deep-links a state so a
 * single frame can be shared as a URL. An unrecognised state falls back to the
 * default rather than erroring - this is a review aid, not an API.
 */
export function resolveAskParams(params: RawSearchParams): {
  debug: boolean
  screenId: AskScreenId
} {
  const debug = firstValue(params.askDebug) === '1'
  const requested = firstValue(params.askState)?.toUpperCase() ?? null
  return {
    debug,
    screenId:
      debug && isAskScreenId(requested) ? requested : ASK_DEFAULT_SCREEN,
  }
}
