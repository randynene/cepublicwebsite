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
  /**
   * Biases the stack step's suggestions. Not a filter; nothing is hidden.
   * "Something else" deliberately has none, so that visitor sees the broad
   * cross-category spread rather than a guess at what they meant.
   */
  category?: SkillCategory
}

export const ROLE_OPTIONS = [
  { id: 'backend', label: 'Backend', category: 'backend' },
  { id: 'frontend', label: 'Frontend', category: 'frontend' },
  { id: 'full-stack', label: 'Full-Stack', category: 'backend' },
  { id: 'ai-ml', label: 'AI / ML', category: 'ai' },
  { id: 'data', label: 'Data', category: 'data' },
  { id: 'devops', label: 'DevOps', category: 'devops' },
  { id: 'mobile', label: 'Mobile', category: 'mobile' },
  { id: 'something-else', label: 'Something else' },
] as const satisfies readonly RoleOption[]

/**
 * Every valid `prefillRole`. Typed rather than a bare string, because renaming
 * the roles once already broke prefill on every service page silently: the props
 * still compiled, they just stopped matching anything. The load-time guard in
 * section.tsx only covered the slug map; inline props walked straight past it.
 */
export type RoleId = (typeof ROLE_OPTIONS)[number]['id']

/**
 * CE-43. The Fractional CTO page was rendering the engineer-hiring form, so a
 * buyer looking for technical leadership was asked to choose between Backend,
 * Frontend and DevOps. These replace that first step on the `cto` variant.
 *
 * No `category`, deliberately: category only exists to bias the stack step's
 * suggestions, and the `cto` variant has no stack step. Labels do not match any
 * rule in `role-icons.tsx`, so every tile renders ROLE_ICON_FALLBACK. That is
 * intended - a fabricated icon mapping would imply a taxonomy we do not have.
 *
 * Safe to change freely: `role` is submitted as a free-text label that goes only
 * to Slack. It is NOT one of the HubSpot dropdown properties, so an unrecognised
 * value cannot get a submission rejected. (See app/api/lead/route.ts - the
 * HubSpot field list carries ce_engagement_length and ce_commitment, not role.)
 */
export const CTO_ENGAGEMENT_OPTIONS = [
  { id: 'fractional-cto', label: 'Fractional CTO' },
  { id: 'interim-cto', label: 'Interim CTO' },
  { id: 'technical-advisor', label: 'Technical advisor' },
  { id: 'tech-due-diligence', label: 'Tech due diligence' },
  { id: 'not-sure', label: 'Not sure yet' },
] as const satisfies readonly RoleOption[]

/**
 * Commitment, reworded for a leadership hire rather than an engineer.
 *
 * The `value` side is untouched on purpose. Those strings are submitted to
 * HubSpot as `ce_commitment`, which is a dropdown property: a value outside its
 * option list is rejected at submit. Only the visitor-facing `label` changes, so
 * this needs no HubSpot configuration and cannot break lead capture.
 */
export const CTO_COMMITMENT_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time (2-3 days a week)' },
  { value: 'hourly', label: 'Advisory (hourly)' },
] as const

/**
 * Copy overrides for the `cto` variant. Only the screens that actually differ
 * are listed; everything else falls through to LEAD_FORM_COPY.
 */
export const CTO_FORM_COPY = {
  role: {
    heading: 'What kind of CTO support do you need?',
    sub: 'Pick the closest fit - we will refine it on the call.',
  },
  length: {
    heading: 'How long do you need them for?',
    sub: 'Most engagements start at three months and roll on.',
  },
  commitment: {
    heading: 'How much of their time do you need?',
    sub: 'Most fractional engagements run two to three days a week.',
  },
} as const

/** Rail label for the first step on the `cto` variant. */
export const CTO_STEP_LABEL_ROLE = 'Engagement'

/**
 * One rail entry per ACTUAL screen, numbered in order.
 *
 * This replaced a four-tab version that grouped length and commitment under
 * "Team size" and details and booking under "Your match". It looked tidier and it
 * lied: on the commitment screen the rail still said Team size, so the visitor
 * could not tell where they were. A rail that does not match the screen is worse
 * than no rail. Five honest steps, and the count varies with prefill because a
 * prefilled step is genuinely not a step the visitor has to take.
 *
 * CE-58 / CE-73 removed a sixth entry, "Book a call". Booking is no longer a step
 * inside the form; details is the last one, and submitting hands the visitor to
 * /book-a-call. See BOOKING_PATH.
 */
export const STEP_LABELS = {
  role: 'Role',
  skills: 'Skills',
  length: 'Duration',
  commitment: 'Commitment',
  details: 'Details',
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
  actions: {
    continue: 'Next',
    back: 'Back',
    // CE-58 / CE-73. Was "Book a call". The label now describes the click that
    // actually happens - the requirement is saved - rather than the meeting that
    // follows it on the next page. The trailing arrow is not written here: the
    // solid CtaButton appends one itself, so putting it in the string would
    // render two.
    submit: 'Submit',
    submitting: 'Saving...',
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
 * Where a submitted form sends the visitor (CE-58 / CE-73).
 *
 * `/book-a-call` and not one of the `/book-a-call/[slug]` pages: the slugs are the
 * six per-person booking pages migrated from Webflow (Seb's, Molly's and so on),
 * so picking one would route every lead on the site to a single named individual.
 * The root is the pooled round-robin link, and it is already the agreed booking
 * destination elsewhere in the codebase - `lib/redirects/locked-rules.ts` points
 * /start-hiring, /start-hiring-now and /schedule-a-call at exactly this path.
 *
 * It also already renders a Calendly embed of its own, from
 * `bookACallPage.calendlyUrl` in Sanity, which holds the same pooled link the form
 * used to embed inline. So the visitor sees the same calendar either way, and Seb
 * can repoint it in Studio without a deploy.
 *
 * Locale is applied by the caller via buildLocalePath, so a UK visitor lands on
 * /uk/book-a-call rather than being dropped back into the US locale.
 */
export const BOOKING_PATH = '/book-a-call'
