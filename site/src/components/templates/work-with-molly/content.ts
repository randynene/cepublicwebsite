// /work-with-molly - a single-rep landing page.
//
// Built from docs/design/"V1 - First version to try.png". The design is a
// remix of the home page in Molly's voice, so almost nothing here is new
// construction: the logo bar, the calculator, the FAQ copy, the chat card and
// the chrome all come from components that already ship. The only genuinely
// new things on the page are this copy, the Tella intro video and the Calendly
// panel that replaces the design's non-functional calendar mock.
//
// All copy lives here rather than inline in JSX because of the UI_STRINGS lint
// rule (react/jsx-no-literals). See CONVENTIONS.md.

/**
 * Molly's intro video, hosted on Tella. Kept as the record of where the local
 * mp4 came from - re-pull from here if the video is ever re-recorded.
 */
export const MOLLY_VIDEO_URL =
  'https://www.tella.tv/video/streamlining-your-engineering-hiring-process-8kmn'
/**
 * Served from our own origin, not from Tella.
 *
 * Tella's embed has no autoplay: probed in a real browser, every parameter
 * combination (and Chrome with its autoplay policy switched off) left the real
 * video paused while a 5-second muted teaser looped over the top. A
 * cross-origin iframe cannot be clicked from here, so the visitor's click could
 * never reach their play button. See video-card.tsx for the full finding.
 *
 * This file is Tella's own HLS rendition pulled once and re-encoded to 1280x720
 * H.264 + AAC (7.5MB) with `+faststart` so it begins playing before it has
 * finished downloading. Re-pull from MOLLY_VIDEO_URL if the video is re-recorded.
 */
export const MOLLY_VIDEO_SRC = '/design/landing/molly-intro.mp4'
/**
 * The card cover, as supplied by Jake (docs/design/molly_Container3.jpg).
 *
 * This is HIS asset, cropped only to lift the video area out of the card frame
 * (`extract({left: 12, top: 12, width: 529, height: 326})`) so the card's own
 * border and rounded corners are not drawn twice. The red badge and the play
 * button are BAKED INTO THESE PIXELS, which is why the card no longer draws its
 * own - see video-card.tsx.
 *
 * KNOWN COST, and the reason the generated poster is kept beside it: the source
 * is a 559px-wide screenshot, so at the ~620px the card renders it is being
 * upscaled and will look soft on a high-density screen. There is no more detail
 * to recover from a screenshot. `molly-poster.jpg` is the same framing rendered
 * from the 1920x1080 master and is the swap if sharpness wins over exactness.
 */
export const MOLLY_VIDEO_COVER = '/design/landing/molly-cover.jpg'
/** Same frame at full resolution, without the baked-in badge and play button. */
export const MOLLY_VIDEO_POSTER = '/design/landing/molly-poster.jpg'

/**
 * The booking link behind every CTA on this page.
 *
 * This is CE's GENERIC intro-call event, the same one /book-a-call and
 * /contact use. If Molly has her own Calendly event the URL should be swapped
 * here and nowhere else - every CTA and the inline panel read this constant.
 */
export const MOLLY_CALENDLY_URL =
  'https://calendly.com/d/cwwf-6k5-2qy/intro-call-cloud-employee'

export const WORK_WITH_MOLLY_META = {
  title: 'Work with Molly Miller | Cloud Employee',
  description:
    'Molly Miller helps US companies hire senior engineers from Latin America, the EU and the US. Two custom-matched profiles in 7 days, free to try. Book time with her.',
} as const

export const WORK_WITH_MOLLY_CONTENT = {
  hero: {
    eyebrow: 'Molly Miller - helping US companies scale',
    // Three lines, as drawn: the break after "two" is deliberate and pinned,
    // not left to the browser - "senior engineers." has to hold line two on its
    // own or the accent line stops reading as the payoff.
    titleLines: ["I'll get you two", 'senior engineers.'],
    titleAccent: 'In 7 days.',
    paragraph:
      'I help US companies hire engineers from our hubs in Latin America, the EU, or the US - interviewed by engineers, not recruiters, and embedded full-time.',
    cta: 'Book time with me',
    proofPoints: [
      { lead: 'Interviewed by engineers.', rest: 'Not recruiters.' },
      { lead: 'Free to try.', rest: 'Interview your matches.' },
      { lead: '300+ teams built.', rest: 'Since 2014.' },
    ],
  },
  video: {
    badge: 'Molly Miller - quick intro',
    playLabel: "Play Molly's intro video",
    name: 'Molly Miller',
    company: 'Cloud Employee',
    role: 'Head of US SMBs',
    quote: "Let's find your next engineer.",
  },
  booking: {
    id: 'book',
    title: 'Pick a time to talk',
    // Matches the REAL event behind MOLLY_CALENDLY_URL (Discovery Call,
    // 30 min, Seb / Molly / Steph / AJ). The export says "Free - 20 min - with
    // Molly Miller"; writing that here would have been a promise the booking
    // panel does not keep. Change both together if Molly gets her own event.
    subtitle: 'Free - 30 min - with the Cloud Employee team',
  },
  testimonials: {
    eyebrow: 'Testimonials',
    titleLead: 'Reviews from real',
    titleAccent: 'teams',
    readMore: 'Read the full review',
  },
  process: {
    eyebrow: 'The process',
    titleLead: 'How it',
    titleAccent: 'works',
    askAi: 'Ask our AI anything',
    steps: [
      {
        number: '01',
        title: 'You tell us what you need.',
        body: 'Your stack, your culture, your region; the more specific, the better we match.',
        note: 'Quick form or talk to me.',
      },
      {
        number: '02',
        title: 'Interviewed by Engineers',
        body: 'Live coding on your stack. Cultural fit, psychometrics, background checks, KYC.',
        note: '100+ screened to find your shortlist.',
      },
      {
        number: '03',
        title: 'You pick. They start.',
        body: '2 profiles in 7 days. Interview both free. The one you pick joins your team full-time.',
        note: 'Embedded from day one. No side gigs.',
      },
      {
        number: '04',
        title: 'We handle the rest.',
        body: "HR, payroll, healthcare, L&D, retention. If it isn't working, we replace at no cost.",
        note: 'You direct. 97% stay 2+ years.',
      },
    ],
  },
  faq: {
    eyebrow: 'Got questions?',
    titleLead: 'The questions',
    titleAccent: 'CTOs and founders ask.',
    chatLabel: "Can't find your question?",
    chatBody: 'Ask our AI chatbot - trained on every sales call we have had.',
    chatCta: 'Open chat',
  },
  closing: {
    titleLead: "Let's find your",
    titleAccent: 'next engineer.',
    paragraphLines: [
      "I'll get you two custom-matched profiles in 7 days - free to try,",
      'no commitment. 300+ teams built with us so far.',
    ],
    cta: 'Book time with me',
    trust: ['97% stay 2+ years', 'No lock-ins'],
  },
} as const

export type WorkWithMollyContent = typeof WORK_WITH_MOLLY_CONTENT
