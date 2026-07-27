// Hire Engineers landing page (/services/software-engineers) - static copy.
// 1:1 with docs/raw-html/Hire Engineers Page (offline).html. Every visible
// string lives here (the react/jsx-no-literals lint rule forbids literal text
// in JSX children); the template references these constants. Author voice: no
// em/en dashes - hyphens only (the source's em-dashes are converted here).
//
// This is the STATIC FALLBACK for the hireEngineersPage Sanity singleton
// (site/src/lib/sanity/queries/hire-engineers-page.ts). The shape is a mutable
// interface (not `as const`) so the Sanity transform can produce it. Optional
// `image?` fields sit on every image placeholder slot and `tourVideoUrl?` /
// `tourPoster?` on the 90-second tour; empty = the original CSS placeholder, so
// nothing breaks before Seb uploads in Studio.

export const HIRE_ENGINEERS_META = {
  title: 'Hire Engineers - Cloud Employee',
  description:
    'Tell us the role. We send two engineers already screened by senior engineers - no CVs, no job boards. You interview who you like and hire who fits.',
} as const

// ── Content shape (mutable, so the Sanity transform can produce it) ──────────
// The calculator lookup tables (CALC, below) stay code-driven; only the
// surrounding copy is content. The three calculator option arrays
// (price.roleOptions / regionOptions / senOptions) double as CALC lookup keys,
// so the transform splices them from this file (they are seeded + hidden in
// Studio) - editing them would break the maths.
export interface HeImageSlot {
  tag: string
  t: string
  s: string
  /** Optional real photo. Empty = the "Image suggestion" placeholder tile. */
  image?: string
}
export interface HireEngineersContent {
  hero: {
    eyebrow: string
    h1Lead: string
    h1Em: string
    sub: string
    ctaPrimary: string
    ctaGhost: string
    trust: string[]
    card: {
      label: string
      badge: string
      per: string
      /** `image` empty = the letter avatar (`av`). */
      candidates: { av: string; nm: string; rl: string; rate: string; image?: string }[]
      foot: string
    }
  }
  offer: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    lead: string
    cards: { h4: string; p: string }[]
    img: HeImageSlot
  }
  roles: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    items: { rn: string; rd: string }[]
  }
  how: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    steps: { n: string; h4: string; p: string }[]
    more: string
  }
  vet: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    points: { h4: string; p: string }[]
    profile: {
      av: string
      nm: string
      rl: string
      tabs: string[]
      assessment: string
      scores: { sn: string; w: number; sp: string }[]
      openTitle: string
      openBtn: string
      /** `image` empty = the letter avatar (`av`). */
      image?: string
    }
    tour: string
    modalStrong: string
    modalBody: string
    /** 90-second tour video (YouTube/Vimeo/Loom). Set = the tour opens a real embed. */
    tourVideoUrl?: string
    /** Optional still behind the tour embed. */
    tourPoster?: string
  }
  proof: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    stat: string
    quote: string
    whoName: string
    whoRole: string
    /** `whoImage` empty = the blank avatar disc. */
    whoImage?: string
    sideImg: HeImageSlot
    mini: { n: string; l: string }
    visitImg: HeImageSlot
    note: string
  }
  price: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    roleLabel: string
    regionLabel: string
    senLabel: string
    roleOptions: string[]
    regionOptions: string[]
    senOptions: string[]
    outLabel: string
    initialCost: string
    per: string
    vsLabel: string
    initialSave: string
    cta: string
    note: string
  }
  find: {
    eyebrow: string
    h2Lead: string
    h2Em: string
    lead: string
    stepper: { num: string; lbl: string }[]
    step0: { q: string; hint: string; opts: string[] }
    step1: { q: string; hint: string; opts: string[] }
    step2: { q: string; hint: string; opts: string[] }
    step3: {
      q: string
      hint: string
      per: string
      /** `image` empty = the `ftag` placeholder chip. */
      matches: { ftag: string; nm: string; rl: string; rate: string; image?: string }[]
      cta: string
    }
    footTrust: string[]
    back: string
    next: string
    img: HeImageSlot
    talkLabel: string
    talkAi: string
    talkBook: string
  }
  final: { h2Lead: string; h2Em: string; p: string; cta: string; sub: string }
}

export const HE: HireEngineersContent = {
  hero: {
    eyebrow: 'Hire engineers',
    h1Lead: 'Two vetted engineers, in front of you in',
    h1Em: '7 days.',
    sub: 'Tell us the role. We send two engineers already screened by senior engineers - no CVs, no job boards. You interview who you like and hire who fits.',
    ctaPrimary: 'Get matched',
    ctaGhost: 'How it works',
    trust: ['300+ teams built', '97% stay 2+ years', 'Replace anytime · 30 days notice'],
    card: {
      label: 'Your shortlist',
      badge: '2 matched · 6 days',
      per: '/ mo',
      candidates: [
        { av: 'A', nm: 'Ana R.', rl: 'Senior Backend · Go · Buenos Aires', rate: '$5,400' },
        { av: 'M', nm: 'Marko P.', rl: 'Senior Full-Stack · TS · Zagreb', rate: '$5,200' },
      ],
      foot: 'Both vetted by engineers. Full profiles, rates, and coding tests included.',
    },
  },
  offer: {
    eyebrow: 'What you get',
    h2Lead: 'A real engineer on your team -',
    h2Em: 'we handle everything else.',
    lead: 'Not a contractor. A full-time, dedicated engineer embedded in your team. You direct the work. We run the employment.',
    cards: [
      { h4: 'Dedicated & embedded', p: 'Works only for you - standups, Slack, sprints. In-house in every way but payroll.' },
      { h4: 'One flat monthly fee', p: 'Salary, benefits, HR, retention - one predictable cost. No hidden extras.' },
      { h4: 'Replace anytime', p: 'Not the right fit? Replaced at no cost. 30 days notice. No lock-in.' },
      { h4: 'We keep them', p: 'HR, wellbeing, and L&D on our side means 97% stay 2+ years.' },
    ],
    // Real photo shipped (public/hire-engineers/website_image_ce.png), so the
    // "Image suggestion" tag + caption are suppressed at render. Seb can still
    // override the photo in Studio; t/s stay as the alt text + fallback brief.
    img: {
      tag: 'Image suggestion',
      t: 'Two Cloud Employee engineers talking at their desk.',
      s: 'Candid, real setup - sells "embedded", not "headshot".',
      image: '/hire-engineers/website_image_ce.png',
    },
  },
  roles: {
    eyebrow: 'Roles',
    h2Lead: 'Hire the role',
    h2Em: "you're missing.",
    items: [
      { rn: 'Software Engineers', rd: 'Backend, frontend, full-stack' },
      { rn: 'DevOps Engineers', rd: 'CI/CD, pipelines, cloud' },
      { rn: 'QA & Testers', rd: 'Coverage, automation' },
      { rn: 'Mobile Engineers', rd: 'iOS, Android, cross-platform' },
      { rn: 'Data Engineers', rd: 'Pipelines, models, insight' },
      { rn: 'AI / ML Engineers', rd: 'Applied AI, experimentation' },
      { rn: 'Fractional CTOs', rd: 'Startup-savvy leadership' },
      { rn: 'Something else?', rd: 'Tell us the role you need' },
    ],
  },
  how: {
    eyebrow: 'How it works',
    h2Lead: 'Four steps.',
    h2Em: 'Seven days.',
    steps: [
      { n: '01', h4: 'Tell us who you need', p: 'Role, stack, seniority. A short call or form.' },
      { n: '02', h4: 'We source & vet', p: 'Engineers vet engineers - live coding, CTO sign-off before you see anyone.' },
      { n: '03', h4: 'You pick', p: 'Two matched profiles with rates and test results. Interview and choose.' },
      { n: '04', h4: 'We handle the rest', p: 'Onboarding, payroll, HR, retention. Your engineer starts embedded.' },
    ],
    more: 'See our full process',
  },
  vet: {
    eyebrow: 'Vetting',
    h2Lead: 'You see two people -',
    h2Em: 'not 200 CVs.',
    points: [
      { h4: 'Engineers vet engineers', p: "A senior engineer runs a live technical conversation on the candidate's real stack - not a recruiter with a keyword list." },
      { h4: 'Live coding, not take-homes', p: 'Real problems solved in front of an assessor, with anti-cheating checks. You see the actual results.' },
      { h4: 'A full profile, not a résumé', p: 'Every candidate comes with a CV, interview summary, coding-test breakdown, and rate - you decide on evidence.' },
    ],
    profile: {
      av: 'L',
      nm: 'Lucas M.',
      rl: 'Senior Full-Stack · Laravel + Vue · 6 yrs',
      tabs: ['Overview', 'CV', 'Tech interview', 'Coding test', 'AI score'],
      assessment: 'Assessment',
      scores: [
        { sn: 'Coding', w: 88, sp: '88%' },
        { sn: 'Interview', w: 82, sp: 'Strong' },
        { sn: 'AI ability', w: 91, sp: '91%' },
      ],
      openTitle: 'This is what you receive - not a CV.',
      openBtn: 'Explore a real profile',
    },
    tour: 'Or watch the 90-second tour',
    modalStrong: 'Sample talent profile opens here.',
    modalBody: 'Embed the real, new-branded interactive profile - CV, tech interview, coding test, psychometric, AI ability score - so buyers explore it without leaving the page.',
  },
  proof: {
    eyebrow: 'Proof',
    h2Lead: 'Teams built,',
    h2Em: 'and kept.',
    stat: '11 engineers, 6 weeks',
    quote: '"To build a team this size in Dublin and Czech would\'ve taken four times as long. What impressed me was the whole team behind them - Client Services, Welfare, HR."',
    whoName: 'Marcus Kilgour',
    whoRole: 'CTO, Salmon Software',
    sideImg: { tag: 'Image suggestion', t: 'The team behind the engineer.', s: 'CE welfare / HR staff - proves the retention claim.' },
    mini: { n: '300+ teams · 97% stay 2+ yrs', l: 'Built and kept with Cloud Employee.' },
    visitImg: { tag: 'Image suggestion', t: 'A client meeting their team in person.', s: "Group shot / handshake at a hub - sells real relationships, not a faceless vendor. (e.g. Marcus's Manila visit.)" },
    note: 'Placeholder proof + image suggestions - swap for real case-study assets and photography before publish.',
  },
  price: {
    eyebrow: 'Pricing',
    h2Lead: 'What would your',
    h2Em: 'next engineer cost?',
    roleLabel: 'Role',
    regionLabel: 'Region',
    senLabel: 'Seniority',
    roleOptions: [
      'Senior Backend Engineer',
      'Senior Frontend Engineer',
      'Senior Full-Stack Engineer',
      'DevOps Engineer',
      'AI / ML Engineer',
    ],
    regionOptions: ['Latin America', 'Europe', 'Philippines'],
    senOptions: ['Senior', 'Mid', 'Lead / Staff'],
    outLabel: 'Estimated monthly cost',
    initialCost: '$5,400',
    per: '/mo, all-in',
    vsLabel: 'vs. hiring in the US',
    initialSave: '$85,200/yr saved',
    cta: 'Get matched at this rate',
    note: '*Ranges based on actual placements. Final price confirmed after a discovery call.',
  },
  find: {
    eyebrow: 'Ready to find your engineer?',
    h2Lead: 'See real engineer profiles, rates, and timelines.',
    h2Em: 'In 90 seconds.',
    lead: "Four quick questions. See who we'd build your team with.",
    stepper: [
      { num: '01', lbl: 'Role' },
      { num: '02', lbl: 'Skills' },
      { num: '03', lbl: 'Team size' },
      { num: '04', lbl: 'Your match' },
    ],
    step0: {
      q: 'What role are you hiring for?',
      hint: "Pick one to start - you'll see matching engineers at the end.",
      opts: ['Backend', 'Frontend', 'Full-Stack', 'AI / ML', 'Data', 'DevOps', 'Mobile', 'Something else'],
    },
    step1: {
      q: 'What should they know?',
      hint: 'Pick the main tech - choose as many as apply.',
      opts: ['Go', 'Python', 'TypeScript', 'React', 'Node.js', 'AWS', 'Kubernetes', '.NET'],
    },
    step2: {
      q: 'How many engineers?',
      hint: 'A rough number is fine - you can adjust later.',
      opts: ['Just one', '2-3', '4-10', '10+'],
    },
    step3: {
      q: "Here's who we'd build your team with.",
      hint: 'Real engineers, vetted and available. Full profiles on request.',
      per: '/ mo',
      matches: [
        { ftag: 'photo', nm: 'Ana R.', rl: 'Senior Backend · Go · Buenos Aires · 8 yrs', rate: '$5,400' },
        { ftag: 'photo', nm: 'Marko P.', rl: 'Senior Full-Stack · TS · Zagreb · 7 yrs', rate: '$5,200' },
      ],
      cta: 'See full profiles',
    },
    footTrust: ['300+ teams built', '97% stay 2+ years', "Replace if it isn't working"],
    back: 'Back',
    next: 'Next',
    img: { tag: 'Image suggestion', t: 'A real engineer, embedded in a real team.', s: 'Candid working shot beside the form - not a headshot. A/B against no-image.' },
    talkLabel: 'Prefer to talk first?',
    talkAi: 'Ask our AI anything',
    talkBook: 'Book a call',
  },
  final: {
    h2Lead: 'Ready to hire your',
    h2Em: 'next engineer?',
    p: 'Tell us what you need. Two vetted candidates in front of you within 7 working days.',
    cta: 'Contact us today',
    sub: '300+ teams built · 97% stay 2+ years · No lock-in',
  },
}

// Calculator engine - the rate tables now live in lib/calculators/next-hire.ts
// so the Home page calculator runs on exactly the same numbers. Re-exported
// here under the original name so nothing that imports CALC has to change.
export { NEXT_HIRE_RATES as CALC } from '@/lib/calculators/next-hire'
