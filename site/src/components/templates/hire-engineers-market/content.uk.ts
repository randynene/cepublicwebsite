// UK Hire Engineers landing page (/uk/services/uk-hire-engineers) - static copy.
//
// Ported from docs/design/uk-hire-engineers.html. Every visible string lives
// here (the react/jsx-no-literals lint rule forbids literal text in JSX
// children); the template reads only from this object, so a Sanity singleton can
// be layered on later without touching the JSX. Author voice: no em/en dashes,
// hyphens only.
//
// This file is a SIBLING of content.us.ts, not a derivative of it. The two are
// deliberately standalone rather than sharing a spread base: the sections that
// happen to read identically today (the de-risk band, the differentiators, the
// intake form, the funnel, FAQs 02 and 05 to 07) are marketing copy for two
// different markets, and a base object would make a US wording tweak silently
// rewrite the UK page. Structural drift is prevented by the shared interface in
// ./content-types.ts; copy drift is allowed on purpose.
//
// SANITY: there is no `ukHireEngineersPage` singleton yet, by design - this pass
// is static content only. When one is added it attaches exactly where
// hireEngineersPage does on /services/software-engineers: the route fetches the
// doc, a `toHireEngineersMarketContent()` transform produces this same shape, and
// UKHE stays as the fallback when the doc is absent or fails validation.
//
// COPY IS FINAL. It carries the commercial facts the page depends on - six-month
// replacement guarantee, GBP 3,000 credited against the fee, two profiles in
// seven days, the written off-limits clause, live pair programming instead of
// take-homes. Do not rewrite or shorten it.

import type { HireEngineersMarketContent } from './content-types'

export const UK_HIRE_ENGINEERS_META = {
  title: 'Hire UK Software Engineers | Vetted by Senior Engineers',
  // 157 chars. Google truncates around 160, and the replacement guarantee
  // is the last clause, so it is the one that would have been cut.
  description:
    'Permanent UK engineering hires, interviewed live by a senior engineer. Two matched profiles in 7 days. No fee unless you hire, 6-month replacement guarantee.',
  /** schema.org Service.serviceType. */
  serviceType: 'Permanent software engineer recruitment',
  /** Third breadcrumb crumb, and the Service name in structured data. */
  breadcrumbLabel: 'Hire UK Engineers',
  /** schema.org areaServed. Data-backed, not inferred from the slug. */
  areaServed: 'United Kingdom',
} as const

export const UKHE: HireEngineersMarketContent = {
  market: 'uk',

  hero: {
    eyebrow: 'Direct hire - United Kingdom',
    h1Lead: 'Hire UK engineers\nvetted by',
    h1Em: 'engineers',
    sub: 'Permanent hires, on your payroll. On average you interview two, and hire one. All candidates interviewed by our senior engineers.',
    ctaPrimary: 'Start a search',
    ctaGhost: 'How it works',
    ticks: [
      '2 matched profiles, not 200 CVs',
      'A senior engineer interviews every candidate',
      // The design's hero tick reads "3-month replacement guarantee" while the
      // de-risk band, FAQ 02 and the final CTA all say six months. Six wins: it
      // is the number in three places and in the metadata, and a page that
      // promises three months in the hero and six below it undercuts its own
      // strongest claim. Flagged for Jake in the PR.
      '6-month replacement guarantee',
    ],
    card: {
      label: 'YOUR SHORTLIST',
      badge: '2 profiles',
      profiles: [
        {
          role: 'Senior AI Engineer',
          // COPY DEFECT (design): the UK Figma reads 'Manchester, · 9 yrs', a
          // trailing comma with nothing after it. Dropped. Flagged for Jake.
          meta: 'Manchester · 9 yrs',
          stack: ['Go', 'Postgres', 'AWS', 'Kafka'],
          salary: '£80,000',
          salaryNote: 'base sought',
          photo: { brief: 'REAL PHOTO', image: '/assets/img/for-engineers/hero-card-engineer-glasses.jpg' },
        },
        {
          role: 'Senior Full-Stack Engineer',
          // COPY DEFECT (design): the UK Figma reads 'London, CO · 7 yrs'. CO is
          // Colorado, left behind by the copy-paste from the US file. Dropped.
          // Flagged for Jake.
          meta: 'London · 7 yrs',
          stack: ['TypeScript', 'React', 'Node', 'GraphQL'],
          salary: '£75,000',
          salaryNote: 'base sought',
          photo: { brief: 'REAL PHOTO', image: '/assets/img/for-engineers/hero-card-engineer-headphones.jpg' },
        },
      ],
      foot: 'Each profile ships with a written report on why they fit.',
      illustrative: 'Illustrative',
    },
  },

  problem: {
    eyebrow: 'State of the hiring market',
    h2: 'More applicants\nHarder to find the right\nengineer.',
    stat: '+412% Job applications per role since 2023',
    body: "We don't post jobs and wait for applicants. We headhunt every role, then a senior engineer runs a live coding interview before you see a candidate. You get 2 matched profiles in 7 days.",
    gridCaption: 'WHAT A JOB POST GETS YOU',
    floatCards: [
      { role: 'Senior Backend Engineer', note: 'Interviewed by a senior engineer' },
      { role: 'Senior Full-Stack Engineer', note: 'Interviewed by a senior engineer' },
    ],
    floatCaption: 'WHAT WE SEND',
  },

  process: {
    eyebrow: 'The process',
    h2Lead: 'How it works - ',
    h2Em: 'from your side.',
    stages: [
      {
        n: '01',
        eyebrow: 'The brief',
        h3: 'Tell us what you need',
        // COPY DEFECT (design): the UK Figma reads 'thrive in your your company
        // culture', a duplicated word. Dropped. Flagged for Jake.
        //
        // LAYOUT: this runs to three lines at desktop where the US one runs to
        // two. The design compensated by nudging the two elements below it down
        // 18px; the flex rebuild reflows instead, so nothing overlaps. See the
        // stage-01 note in hire-engineers-market.css.
        body: 'And one of our UK based Account Managers will help you build out the profile that will fit not just your technical needs but will thrive in your company culture.',
        emphasis: 'A senior engineer signs it off before we search.',
        pill: 'Twenty minutes. Then we go.',
      },
      {
        n: '02',
        eyebrow: 'We interview',
        // The UK design spells this correctly; the US design reads
        // "intervieews". Both pages ship the correct spelling.
        h3: 'Live coding session interviews',
        body: 'Live pair programming on a real problem from your stack. Not an algorithm puzzle. Not a take-home they can hand to an AI.',
        emphasis: "You can't fake the answer to a follow-up.",
        arrow: '100+ sourced. Two make it through.',
      },
      {
        n: '03',
        eyebrow: 'On average:',
        h3: 'You interview two. You hire one.',
        body: 'Both arrive with a detailed write-up from the engineer that interviewed them.',
        emphasis: 'Technical people should hire technical people',
        arrow: 'You decide. We handle scheduling, the offer, etc.',
      },
    ],
    brief: {
      label: 'THE BRIEF',
      role: 'Senior AI Engineer',
      requirements: [
        { text: 'Python, RAG, LLM APIs', met: false },
        { text: '5+ years commercial experience', met: false },
        { text: 'Has actually shipped AI to production', met: true },
        { text: 'Figures things out without being handheld', met: true },
        { text: "Will tell me when I'm wrong - and propose something better", met: true },
      ],
      note: 'The first two, any recruiter can match. The rest is why a person takes the brief.',
      photo: { brief: 'REAL PHOTO CTO + client', label: 'CTO INTAKE\nCALL', image: '/design/services/candid-1.png', alt: 'A Cloud Employee CTO scoping a role with a client over a laptop' },
    },
    code: {
      title: 'pair-session · your stack',
      live: 'LIVE',
      lines: [
        { text: '// why did you reach for a queue here?', indent: 0, comment: true },
        { text: 'async function processBatch(jobs) {', indent: 0, comment: false },
        { text: 'const chunks = chunk(jobs, 250)', indent: 1, comment: false },
        { text: 'for (const c of chunks) {', indent: 2, comment: false },
        { text: 'await enqueue(c, { retries: 3 })', indent: 3, comment: false },
        { text: '}', indent: 1, comment: false },
        { text: '}', indent: 0, comment: false },
        { text: '// "a retry storm would take the', indent: 0, comment: true },
        { text: '// write replica down at 250k..."', indent: 0, comment: true },
      ],
      rail: [
        { brief: 'REAL PHOTO senior engineer', label: 'CE engineer', image: '/assets/img/for-engineers/step2-cam-senior-engineer.jpg', alt: 'A senior Cloud Employee engineer on a live pair-programming call' },
        { brief: 'REAL PHOTO candidate', label: 'Candidate', image: '/assets/img/for-engineers/step2-cam-you-engineer.jpg', alt: 'A candidate engineer on the same live pair-programming call' },
      ],
    },
    report: {
      role: 'Senior AI Engineer',
      // COPY DEFECT (design): the UK Figma leaves this card reading
      // 'Austin, TX · 9 yrs · Python, Rag, AWS' - a US city on the UK page, and
      // 'Rag' lowercased. This card IS hero profile 1 (same role, same 9 yrs),
      // so it is set to Manchester to match. Flagged for Jake.
      meta: 'Manchester · 9 yrs · Python, RAG, AWS',
      open: 'Open report',
      tabs: ['Overview', 'CV', 'Tech interview', 'Coding test'],
      scores: [
        { label: 'Coding test', value: '88%', pct: 88, tone: 'teal' },
        { label: 'Interview', value: 'Strong', pct: 82, tone: 'teal' },
        { label: 'Culture fit', value: 'Good', pct: 73, tone: 'amber' },
      ],
      note: 'Worth knowing: short tenure in last role. Moving due to wanting to work on something more challenging.',
      photo: { brief: 'REAL PHOTO', image: '/assets/img/for-engineers/hero-card-engineer-glasses.jpg' },
    },
    funnel: {
      label: 'The funnel, in numbers',
      // Percentages are the design's bar widths against the 382.03px track:
      // 382.03 / 152.81 / 57.3 / 22.92 / 7.64.
      rows: [
        { label: 'Initial headhunting pool', value: '100+', pct: 100 },
        { label: 'After CV & AI screening', value: '~40', pct: 40 },
        { label: 'After technical interview', value: '~15', pct: 15 },
        { label: 'After live coding interview', value: '~6', pct: 6 },
        { label: 'You interview both. You hire one.', value: '2', pct: 2 },
      ],
    },
  },

  derisk: {
    claims: [
      'No fee unless you hire',
      '6-month replacement guarantee',
      'Weekly updates, news or not',
      'Anyone we place is off-limits to us, in writing',
    ],
  },

  differentiators: {
    eyebrow: 'Engineers should hire engineers',
    h2Lead: 'We do what a recruiter ',
    h2Em: "can't",
    h2Tail: ' do',
    lead: "We've been vetting senior engineers for companies since 2014. This is our proven process.",
    cards: [
      {
        h3: 'A senior engineer ran the interview',
        p: 'Live pair programming on a real problem, not a keyword match against a job description. You get their name and their notes.',
      },
      {
        h3: 'A written report on both finalists',
        p: 'Why they fit your company and how they work. A candidate with no blind-spots listed just means nobody looked properly.',
      },
    ],
  },

  intake: {
    eyebrow: 'Start a search',
    h2Lead: "Tell us who you're ",
    h2Em: 'looking for',
    lead: 'Four short steps. A senior engineer reads every one, and it does not go into a CRM.',
    label: 'THE ROLE',
    heading: "Start with what you've got",
    // Four-step brief builder. Only STEP 1 is built; see the TODO in index.tsx.
    stepLabel: 'THE ROLE',
    stepCounter: 'Step 1 of 4',
    stepCount: 4,
    dropTitle: 'Drop your job description here',
    // Deliberately states the constraint and promises nothing about reading:
    // the file is not uploaded anywhere yet. Restore the stronger line from
    // the Figma once there is somewhere for the bytes to go.
    dropHint: 'PDF or DOCX, up to 10MB',
    pillGuided: 'No spec? Build it with us',
    pillSay: 'Say it instead',
    pillType: 'Type it out',
    fileChosenLabel: 'Attached',
    fileRemoveLabel: 'Remove',
    fileNote: 'We will email you to collect this file before a senior engineer reads it.',
    fileTypeError: 'That file type is not supported. Please use a PDF or a DOCX.',
    fileSizeError: 'That file is over 10MB. Please send a smaller one.',
    jobLabel: 'Tell us about the role',
    jobPlaceholder:
      'Paste your job spec here, or just tell us the stack, the seniority and what this person will own in their first ninety days. No spec yet is fine, a senior engineer will build one with you.',
    helper:
      'One file, or a few lines. Whatever you have is enough to start.',
    nameLabel: 'Your name',
    namePlaceholder: 'Grace Hopper',
    emailLabel: 'Work email',
    emailPlaceholder: 'grace@company.com',
    consentNote: 'So we can save your brief and send you the market read for this role.',
    footNote: 'Saved as you go - finish anytime.',
    submit: 'Continue',
    submitting: 'Sending...',
    errorRequired: 'Please fill this in',
    errorEmail: 'Please use a valid work email',
    caption: "WE'LL COME BACK WITH WHAT YOUR SPEC DIDN'T SAY",
  },

  faq: {
    eyebrow: 'Questions',
    titleLead: 'The questions founders and CTOs',
    titleAccent: 'actually ask.',
    card: {
      h3: 'Not answered here?',
      p: "Ask our AI chatbot, trained on every sales call we've had.",
      cta: 'Open chat',
    },
    items: [
      {
        q: 'Two candidates? Other recruiters send me ten.',
        a: 'They do, and you read all ten. Two is what is left after we headhunt 100+ UK engineers, run a coding assessment on your stack, put the finalists through a live pair-programming session with a senior engineer, and get a CTO sign-off. Anyone who did not survive that is not a candidate, they are a CV. If neither of the two is right we go again at no extra cost. The fee is for the hire, not the shortlist.',
      },
      {
        q: "What if they quit, or it doesn't work out?",
        a: 'Every direct hire carries a six-month replacement guarantee. If the engineer leaves or the fit is wrong, we run the search again at no extra cost, with the same headhunting, the same coding assessment and the same live interview. You keep the market read and both written reports either way.',
      },
      {
        q: 'What if they accept and then take a counteroffer?',
        a: 'We ask about money, notice and reasons for leaving in the first conversation, then again the week they resign, so a counteroffer rarely arrives as a surprise. UK notice periods are long enough that a lot can change in three months, so we stay close to the engineer the whole way through, not just to the signature. If a counteroffer still wins, it is treated like any other failed hire and we go again.',
      },
      {
        q: 'How is this different from the recruiters emailing me every week?',
        a: 'Contingency recruiters forward CVs that match keywords. We headhunt for the role across the UK market, then a senior engineer runs a live technical interview on a real problem from your stack before you see anyone. What lands in your inbox is two engineers and two written reports, not ten profiles for you to screen.',
      },
      {
        q: 'Who actually does the technical interview?',
        a: 'A senior engineer on our team, and you get their name. The write-up you receive is theirs: what they asked, how the engineer reasoned, where they are strong and where they are a stretch. A CTO signs the brief off before we search and signs off the shortlist before it reaches you.',
      },
      {
        q: "How do you know they're not using AI in the interview?",
        a: 'There is no take-home to outsource. It is a live session on camera, on a problem from a real codebase, and the interviewer keeps asking why: why a queue, why that batch size, what breaks at ten times the traffic. AI can write the first answer. It cannot survive the third follow-up.',
      },
      {
        q: 'Will you approach them again later?',
        a: 'No. Anyone we place with you is off-limits to us, in writing, for as long as they work for you. That is a clause in the agreement, not a promise on a web page. Our business runs on repeat searches, not on recycling engineers we already placed.',
      },
      {
        q: 'What does it cost?',
        a: '£3,000 to start a search, credited in full against the placement fee. Nothing further is due unless you hire. The fee covers the hire rather than the shortlist, so if neither finalist is right we go again at no extra cost, and the six-month replacement guarantee sits behind it.',
      },
      {
        q: 'How long does it take?',
        a: 'Twenty minutes to scope the brief with a senior engineer, then two matched profiles in seven days. Most UK searches close inside three to four weeks once your own interviews, offer and acceptance are counted, then a one to three month notice period before they start. You get a written update every week the search is open, news or not.',
      },
      {
        q: 'Do you do this in the US?',
        a: 'Yes. Same process, same senior-engineer interview, priced and contracted for the US market. Plenty of clients run a UK search and a US search side by side off one brief. If you are hiring outside both, ask us and we will tell you honestly whether we can headhunt that market.',
        // The one deliberate cross-locale link on the page: the ONLY internal
        // href here that is not run through buildLocalePath, because it is
        // meant to leave /uk. `linkText` is a substring of `a` above, so the
        // JSON-LD answer stays byte-identical to the rendered one.
        linkText: 'priced and contracted for the US market',
        linkHref: '/services/hire-us-engineers',
      },
    ],
  },

  finalCta: {
    h2Lead: 'Two engineers. One hire. ',
    h2Em: 'Both interviewed by engineers.',
    lead: 'Tell us the role. A senior engineer will scope it with you before we search.',
    ctaPrimary: 'Start a search',
    ctaGhost: 'Book a call',
    foot: '£3,000 to start, credited to the fee · 6-month replacement guarantee',
  },
}
