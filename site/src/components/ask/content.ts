// Ask Clara — chrome copy and glyphs for `/ask`.
//
// Two jobs:
//
//   1. Keep every visible string out of JSX. The UI_STRINGS gate
//      (react/jsx-no-literals, see CONVENTIONS.md) requires copy to arrive as an
//      expression; the established idiom for page-level copy is a typed content
//      module like this one rather than the sitewide UI_STRINGS catalogue, which
//      is for repeated chrome.
//   2. Hold the P1 Calendly placeholder. The real embed lands in P5 via
//      CalendlyInlineEmbed with the URL from Sanity; until then S7 renders a
//      static picture of it so the canvas composition can be signed off.

/** Decorative glyphs. Constants, not JSX literals. */
export const GLYPH = {
  arrow: '→',
  arrowLeft: '←',
  arrowUp: '↑',
  attach: '⎘',
  caret: '▍',
  check: '✓',
  chevronUp: '⌃',
  chevronDown: '⌄',
  stop: '■',
  prev: '‹',
  next: '›',
  /** Multiplication sign for role counts: "×2", "1 × Full-stack". */
  multiply: '×',
} as const

export const ASK_LABELS = {
  /** Accessible name for the CE wordmark, which links home. */
  logoHome: 'Cloud Employee home',
  /**
   * The primary conversion CTA, sitewide as of 29 Jul (was "Schedule a Call").
   * Every booking entry point on this page uses this one string, so the header, the
   * offer card in the chat, the brief's action bar and the brief-ready panel cannot
   * drift apart.
   */
  talkToHuman: 'Talk to a human',
  /** The only route out of this page, since /ask carries no site nav. */
  backToSite: 'Back to site',
  claraAvatarAlt: 'Clara',
  /** aria-label for the draggable split handle. */
  resizeHandle: 'Resize the chat and canvas panels',
  /** aria-labels for the composer controls. */
  attach: 'Attach a file',
  talk: 'Talk',
  send: 'Send message',
  stopRecording: 'Stop recording',
  cancelRecording: 'Cancel',
  tapToStop: 'Tap to stop',
  /** Mobile brief card affordance. */
  expand: 'Expand',
  briefStrength: 'Brief strength',
  liveSuffix: '· live',
  techStack: 'Tech stack',
  sharedStack: 'Shared stack',
  suggestedStack: 'Suggested stack',
  regionOverlap: 'Region / overlap',
  teamContext: 'Team context',
  engagement: 'Engagement',
  timeline: 'Timeline',
  regions: 'Regions',
  start: 'Start',
  seniority: 'Seniority',
  overlap: 'Overlap',
  region: 'Region',
  mustHaves: 'Must-haves for v1',
  complianceFlags: 'Compliance flags',
  suggestedPod: 'Team shape Clara suggests',
  suggestedPodNote: 'confirm on the call',
  goalInYourWords: 'Goal, in your words',
  targetLiveDate: 'Target live date',
  /** Follows the headcount numeral on the squad card: "3 engineers". */
  engineers: 'engineers',
  /** Shown when intent is still unknown, so the canvas never fakes a card. */
  awaitingSignal: 'Clara is still working out what you need',
  /** Accessible name for the P1 static stand-in for the Calendly embed. */
  bookingPlaceholder: 'Booking calendar preview',

  // Brief actions. The brief is the document a CloudEmployee lead reviews on the
  // call, so it has to be takeable away: downloadable, emailable, and bookable
  // against. Wording avoids promising a match (Option A).
  briefActionsTitle: 'Take this brief with you',
  briefActionsNote:
    'Reviewed with you by a CloudEmployee lead, not scored by a machine.',
  downloadBrief: 'Download',
  emailBrief: 'Email it to me',
  briefVersion: 'Brief version',

  /** Accessible name for the X that closes the rotating proof band. */
  dismissProof: 'Hide the client stories',
  /** Accessible name for the file picker behind the paperclip. */
  attachFiles: 'Attach files',
  /** Prefix for the per-file remove control: "Remove CV.pdf". */
  removeFile: 'Remove',
} as const

/**
 * What the paperclip accepts. Broad on purpose - a CV arrives as a PDF, a Word
 * doc, or a phone photo of a printout, and refusing the third would be the kind of
 * friction this page exists to remove.
 *
 * P1 selects files and shows them; it uploads nothing. Reading and analysing them
 * is Clara's job and lands with P3.
 */
export const ACCEPTED_FILE_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.odt',
  '.rtf',
  '.txt',
  '.md',
  '.csv',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.heic',
].join(',')

export const ASK_META = {
  title: 'Ask AI anything',
  description:
    'Talk to Clara about the engineers you need and watch your hiring brief build as you go. No forms, no repeating yourself.',
} as const

/**
 * P1 placeholder for the in-canvas Calendly embed (S7).
 *
 * Copy is transcribed from the reference frame, which is itself a picture of the
 * real CE Discovery Call booking page. Nothing here is interactive and no
 * Calendly script is loaded - P5 replaces this whole object with the live embed.
 */
export const BOOKING_PLACEHOLDER = {
  eventTitle: 'Discovery Call - CloudEmployee',
  duration: '30 min',
  intro:
    'A 30-minute intro call with our team to see if CloudEmployee is the right fit to scale your engineering.',
  hostsLead: 'You will speak with Seb, Molly, Steph or AJ to:',
  bullets: [
    'Review the brief you just built',
    'Walk through how we source, embed and retain engineers',
    'Share candidate options and success stories',
  ],
  reassurance: 'No pressure - just a clear overview of how it works.',
  legalLinks: ['Cookie settings', 'Privacy Policy'],
  pickerTitle: 'Select a Date & Time',
  month: 'July 2026',
  weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  /** Leading blanks align 1 July 2026 to a Wednesday. */
  leadingBlanks: 2,
  daysInMonth: 31,
  selectedDay: 29,
  availableDays: [30, 31] as readonly number[],
  timezoneLabel: 'Time zone',
  timezoneValue: 'UK Time (13:56)',
  slotsHeading: 'Wed 29 July',
  slots: ['09:30', '11:00', '14:00', '15:30', '16:30'],
  /** The slot the frame shows mid-selection, with its confirm affordance. */
  activeSlot: '11:00',
  confirmLabel: 'Next',
} as const

/** Bar heights for the voice waveform, transcribed from the reference. */
export const WAVEFORM_HEIGHTS = [
  0.3, 0.55, 0.9, 0.45, 0.7, 1, 0.35, 0.6, 0.85, 0.4, 0.75, 0.5, 0.95, 0.3,
  0.65, 0.8, 0.45, 1, 0.55, 0.35, 0.7, 0.9, 0.4, 0.6, 0.85, 0.5, 0.75, 0.3,
  0.65, 0.95, 0.45, 0.55,
] as const

export const ASK_DEBUG = {
  title: 'Ask Clara debug',
  note: 'Dev only. ?askDebug=1 · fixtures freeze a frame · scripts run the mock.',
  triggerLabel: 'Trigger',
  canvasLabel: 'Canvas',
  fixturesLabel: 'Fixtures',
  scriptsLabel: 'Mock scripts',
  liveLabel: 'Live mock',
  resetScript: 'Reset script',
  close: 'Hide',
  open: 'Debug',
  mobileFrameNote: 'Mobile frame, 390 x 844',
} as const

export const ASK_LIVE = {
  /** Shown under the composer when the mock stream errors mid-turn. */
  streamErrorPrefix: 'Stream error',
} as const
