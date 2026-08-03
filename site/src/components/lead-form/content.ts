// Copy and options for the quick hiring form.
//
// Everything a visitor reads lives here rather than inside JSX, for two reasons:
// the UI_STRINGS lint rule forbids literals in JSX, and this shape is what a
// Sanity singleton will hydrate later so Seb can reword the form without a
// developer. Treat this file as the fallback, not the source of truth, once that
// document exists.
//
// The ROLE step is first on purpose. Asking for the stack first ("React? PHP?")
// frames CE as a body shop where the buyer names a part and gets a price, which is
// the axis Proxify and Toptal compete on. Asking what KIND of engineer they need
// puts the conversation on judgment instead. The stack question survives, demoted
// to an optional refinement, because a buyer with a Laravel codebase does genuinely
// need a Laravel person and refusing to let them say so is just friction.
//
// The role list is not invented positioning: every entry maps to something in CE's
// real 23-service catalogue. AI leads because AI Engineers, AI Consulting and AI
// Product Builds are three of those services, not because it sounds modern.

import type { SkillCategory } from '@/lib/skills/taxonomy'

export interface RoleOption {
  id: string
  label: string
  /** Biases the stack step's suggestions. Not a filter; nothing is hidden. */
  category?: SkillCategory
  /** "Not sure" hands over to Clara instead of continuing the form. */
  handoffToClara?: boolean
}

export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'backend', label: 'Backend', category: 'backend' },
  { id: 'frontend', label: 'Frontend', category: 'frontend' },
  { id: 'full-stack', label: 'Full-Stack', category: 'backend' },
  { id: 'ai-ml', label: 'AI / ML', category: 'ai' },
  { id: 'data', label: 'Data', category: 'data' },
  { id: 'devops', label: 'DevOps', category: 'devops' },
  { id: 'mobile', label: 'Mobile', category: 'mobile' },
  { id: 'something-else', label: 'Something else', handoffToClara: true },
]

/**
 * One rail entry per ACTUAL screen, numbered in order.
 *
 * This replaced a four-tab version that grouped length and commitment under
 * "Team size" and details and booking under "Your match". It looked tidier and it
 * lied: on the commitment screen the rail still said Team size, so the visitor
 * could not tell where they were. A rail that does not match the screen is worse
 * than no rail. Six honest steps, and the count varies with prefill because a
 * prefilled step is genuinely not a step the visitor has to take.
 */
export const STEP_LABELS = {
  role: 'Role',
  skills: 'Skills',
  length: 'Duration',
  commitment: 'Commitment',
  details: 'Details',
  booking: 'Book a call',
} as const

/**
 * Proof line under the form.
 *
 * "300+" and "97% stay 2+ years" are both already used on the site (the sitewide
 * trust bar and /for-developers respectively), so they are established claims
 * rather than new ones. "Replace if it isn't working" is new copy, taken from
 * Jake's design reference. Flagged rather than assumed: if legal or Seb has not
 * signed off on stating a replacement guarantee on 250 pages, remove that third
 * item, and nothing else changes.
 */
export const TRUST_POINTS = [
  '300+ teams built',
  '97% stay 2+ years',
  "Replace if it isn't working",
] as const

/** Values must match the HubSpot dropdown options exactly or the submit is rejected. */
export const LENGTH_OPTIONS = [
  { value: '6_months_plus', label: 'More than 6 months' },
  { value: '3_to_6_months', label: '3 to 6 months' },
  { value: '1_to_3_months', label: '1 to 3 months' },
  { value: 'not_sure', label: 'Not sure yet' },
] as const

export const COMMITMENT_OPTIONS = [
  { value: 'full_time', label: 'Full-time (40h/week)' },
  { value: 'part_time', label: 'Part-time (20h/week)' },
  { value: 'hourly', label: 'Hourly' },
] as const

export const LEAD_FORM_COPY = {
  eyebrow: 'Find your engineer',
  role: {
    heading: 'What role are you hiring for?',
    sub: "Pick one to start - you'll see matching engineers at the end.",
  },
  skills: {
    heading: 'Any particular stack?',
    sub: 'Optional. Search anything, and add it if it is not listed.',
    searchLabel: 'Search technologies',
    searchPlaceholder: 'Search any technology',
    popularLabel: 'Popular right now',
    addPrefix: 'Add',
    selectedLabel: 'Selected',
    removeLabel: 'Remove',
    empty: 'No match. Press enter to add it anyway.',
  },
  length: {
    heading: 'How long do you need help for?',
    sub: 'We match your needs against the availability of our network.',
  },
  commitment: {
    heading: 'What level of commitment do you need?',
    sub: 'Most clients start full-time.',
  },
  details: {
    heading: 'Where do we send your matches?',
    sub: 'We come back within one working day.',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Work email',
    emailPlaceholder: 'name@companyname.com',
    phone: 'Phone number',
    optional: 'optional',
    company: 'Company',
    // DRAFT, pending Jake's legal sign-off (J-E). CE runs no cookie banner and has
    // no cookie-policy page, so only the privacy policy is linked. Do not invent a
    // second link to a page that does not exist.
    consent:
      'I agree to Cloud Employee using my details to contact me about hiring engineers.',
    consentLinkLabel: 'Read our privacy policy',
    consentLinkHref: '/legals/privacy-policy',
  },
  booking: {
    heading: 'Book your call',
    sub: 'Pick a time and we will come to it with your requirements already in hand.',
  },
  actions: {
    continue: 'Next',
    back: 'Back',
    submit: 'Book a call',
    submitting: 'Saving...',
    askClara: 'Talk it through with our AI',
  },
  progress: {
    // Rendered as "Step 2 of 5" via two spans, so the numbers stay dynamic while
    // the words stay lintable.
    of: 'of',
    step: 'Step',
  },
  error: {
    required: 'This one is needed to continue.',
    email: 'Please use a valid work email.',
    consent: 'Please tick the box so we can contact you.',
    generic: 'Something went wrong. Please try again.',
  },
} as const

/**
 * Booking link. The header CTA uses the same pooled round-robin link, which routes
 * to whichever of Seb, Molly, Steph or AJ is free. Overridable per placement so a
 * Sanity-driven page can point at a different event type.
 */
export const DEFAULT_CALENDLY_URL =
  'https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee'

/**
 * Where a CONFIRMED booking lands. `/book-a-call-confirmed` already exists and is
 * where Calendly sends people today, so this reuses it rather than adding an
 * eighth thank-you route to the seven the site already has.
 *
 * Not `/thank-you-now-book-a-call`, despite the name: that one is the page shown
 * BEFORE booking, telling a form-filler to go and book. Landing a confirmed
 * booking there would ask them to do the thing they just did.
 */
export const BOOKING_THANK_YOU_PATH = '/book-a-call-confirmed'
