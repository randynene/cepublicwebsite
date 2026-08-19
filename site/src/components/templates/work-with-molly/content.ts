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
 * The card cover, rendered from Jake's own artwork
 * (docs/design/mollyContainer4.svg).
 *
 * The SVG is the same card he supplied as a JPEG, but it embeds a 1720x1096
 * PNG and draws the badge, the play button and the label as vectors - so there
 * is real detail to render, which the 559px screenshot it replaces did not
 * have. It is rasterised at 3x and cropped to lift the video area out of the
 * card frame, so the card's own border and rounded corners are not drawn twice:
 *
 *   sharp(svg, { density: 216 })            // 3x -> 1677x1260
 *     .extract({ left: 36, top: 36, width: 1587, height: 978 })
 *     .resize({ width: 1280 })
 *     .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
 *
 * 1280px against a card that renders around 611px, so it stays sharp on a
 * high-density screen. Re-run those numbers if the artwork is re-exported.
 *
 * THE BADGE AND THE PLAY BUTTON ARE IN THESE PIXELS. That is why the card does
 * not draw its own - see video-card.tsx.
 */
export const MOLLY_VIDEO_COVER = '/design/landing/molly-cover.jpg'
/** Same frame at full resolution, without the baked-in badge and play button. */
export const MOLLY_VIDEO_POSTER = '/design/landing/molly-poster.jpg'

/**
 * Which `bookACall` document owns the booking link on this page.
 *
 * Molly's real Calendly is not hardcoded here. It lives on the Sanity document
 * that already powers /book-a-call/molly, and this page reads it from there at
 * request time (see the route). So there is exactly ONE place her link is
 * recorded, Seb can change it in Studio, and the two pages cannot drift apart
 * into a landing page that books someone else's diary.
 */
export const MOLLY_BOOKING_SLUG = 'molly'

/**
 * Fallback only, for the case where that document is missing, retired, or has
 * no scheduling URL on it.
 *
 * This is CE's GENERIC intro-call event, which is what /book-a-call and
 * /contact use. It exists so a Studio mistake degrades to "books the team"
 * rather than to a dead panel on a live landing page. It is deliberately not
 * the normal path - if this is what renders, something upstream is wrong.
 */
export const FALLBACK_CALENDLY_URL =
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
    // Two subtitles, because the panel must describe whatever diary it is
    // actually showing. `subtitle` is the normal case: Molly's own 30-minute
    // event, read from her bookACall document. `subtitleFallback` is what the
    // page says if that lookup fails and the generic team event renders
    // instead - saying "with Molly Miller" over the team's diary would be a
    // promise the panel does not keep.
    subtitle: 'Free - 30 min - with Molly Miller',
    subtitleFallback: 'Free - 30 min - with the Cloud Employee team',
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
