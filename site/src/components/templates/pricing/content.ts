// TEMPLATE-PRICING content model.
//
// Copy is transcribed VERBATIM from the locked reference
// `docs/raw-html/Pricing Page 2.dc.html` (desktop artboard) + the full-page
// render `docs/raw-html-pdf/pricing-page-full.png`.
//
// Lives in this typed module (not inline JSX) so the template renders every
// string via an expression - passing the UI_STRINGS jsx-no-literals gate and
// giving a clean 1:1 shape to swap for the `pricingPage` Sanity fetch. The
// route falls back to PRICING_CONTENT when Sanity returns null.
//
// THE CALCULATOR SPLIT (per docs/design/PRICING_SCHEMA_PROPOSAL.md §1):
// the numeric engine (how region + country + currency + dev-count turn into a
// price range, hourly/annual figures, savings and the per-row breakdown) lives
// hardcoded in `./cost-calculator.tsx`. This module owns the *benchmark inputs*
// to that engine (CALC_MODEL) and every piece of surrounding copy. The default
// selection (Eastern Europe devs / UK company / GBP) reproduces the design's
// numbers exactly; other selections recompute by ratio off the same table.

export interface PricingMeta {
  title: string
  description: string
}

export interface TrustPill {
  value: string
  label: string
}

export interface Candidate {
  name: string
  role: string
  vettedLabel: string
  skills: string[]
  image: string
  imageAlt: string
  flag: string
  flagImage?: string
}

export interface PricingHero {
  eyebrow: string
  titleLead: string
  titleAccent: string
  paragraph: string
  pills: TrustPill[]
  candidate: Candidate
}

// ── Calculator benchmark model ───────────────────────────────────────────
// All monetary values are GBP-per-developer-per-month at the source; the
// engine multiplies by the developer count and converts to the chosen
// currency. Ranges are [low, high].

export interface CalcRegion {
  id: string
  label: string
  ceMonthly: [number, number]
}

export interface CalcCountry {
  id: string
  label: string
  localMonthly: [number, number]
  /** Emoji flag shown on the comparison card + in the select. */
  flag: string
}

export interface CalcCurrency {
  id: string
  label: string
  symbol: string
  /** Multiply a GBP figure by this to display in the chosen currency. */
  rate: number
}

export interface BreakdownRow {
  label: string
  desc: string
  /** GBP per developer per month; the total is the sum of the rows. */
  amount: number
}

export interface CalcModel {
  regions: CalcRegion[]
  countries: CalcCountry[]
  currencies: CalcCurrency[]
  /** Reference role the full breakdown itemises. */
  breakdownRole: string
  breakdownRows: BreakdownRow[]
  /** Assumed billable hours per month, for the "per hour" derivation. */
  hoursPerMonth: number
}

export interface PricingCalculator {
  eyebrow: string
  titleLead: string
  titleAccent: string
  devCountLabel: string
  countryPrompt: string
  regionPrompt: string
  currencyPrompt: string
  ceCardTitle: string
  ceLogo: string
  ceBrand: string
  localCardTitlePrefix: string
  savingsNote: string
  ceFootnote: string
  localFootnote: string
  // Connector words rendered between computed figures (kept out of JSX literals).
  toWord: string
  perMonth: string
  thatsPrefix: string
  perHourSuffix: string
  orYearSuffix: string
  saveAvgPrefix: string
  saveAvgYearSuffix: string
  higherCostSuffix: string
  breakdownShowLabel: string
  breakdownHideLabel: string
  breakdownEyebrow: string
  breakdownIntroPrefix: string
  breakdownIntroSuffix: string
  breakdownTotalLabel: string
  breakdownSavedTemplate: string
  breakdownCta: string
  breakdownCtaHref: string
  model: CalcModel
}

export interface BenefitCard {
  title: string
  body: string
  icon: string
}

export interface PricingBenefits {
  eyebrow: string
  titleLead: string
  titleAccent: string
  cards: BenefitCard[]
}

export interface FixedFeeBlock {
  statement: string
  bullets: string[]
  cta: string
  ctaHref: string
  disclaimer: string
}

export interface DeRiskBlock {
  eyebrow: string
  items: string[]
}

export interface GlassdoorBlock {
  rating: string
  reviewsLabel: string
  logo: string
  wordmark: string
}

export interface LogoItem {
  name: string
  src: string
  /** Rendered pixel height; the design varies logo heights 14-29px. */
  height: number
}

export interface LogoBar {
  label: string
  logos: LogoItem[]
}

export interface PricingTestimonial {
  eyebrow: string
  titleLead: string
  titleAccent: string
  quote: string
  stats: TrustPill[]
  name: string
  role: string
  caption: string
  companyLogo: string
  videoStill: string
}

export interface PricingFaqItem {
  number: string
  question: string
  answer: string
}

export interface PricingFaqBlock {
  eyebrow: string
  titleLead: string
  titleAccent: string
  helpEyebrow: string
  helpBody: string
  helpCta: string
  helpCtaHref: string
  items: PricingFaqItem[]
}

export interface PricingContent {
  hero: PricingHero
  calculator: PricingCalculator
  benefits: PricingBenefits
  fixedFee: FixedFeeBlock
  deRisk: DeRiskBlock
  glassdoor: GlassdoorBlock
  logoBar: LogoBar
  testimonial: PricingTestimonial
  faq: PricingFaqBlock
}

export const PRICING_META: PricingMeta = {
  title: 'World-class senior engineers at a fair price',
  description:
    'One fixed monthly fee, in your currency. No hourly rates, no variable invoices. See what your next engineer would cost with Cloud Employee versus hiring locally.',
}

export const PRICING_CONTENT: PricingContent = {
  hero: {
    eyebrow: 'Pricing',
    titleLead: 'World-class Senior engineers at a',
    titleAccent: 'fair price',
    paragraph:
      'Take your budget further with Cloud Employee engineers. One fixed monthly fee, in your currency. No hourly rates. No variable invoices. No surprises.',
    pills: [
      { value: '300+', label: 'Teams built' },
      { value: '97%', label: 'Stay 2+ years' },
      { value: '7 days', label: 'To shortlist' },
      { value: 'Cancel', label: 'Anytime' },
    ],
    candidate: {
      name: 'Reinaldo A.',
      role: 'Senior Backend · 8 yrs',
      vettedLabel: 'Vetted by Senior Eng',
      skills: ['AI Native', 'Python', 'AWS'],
      image: '/pricing/candidate.png',
      imageAlt: 'Reinaldo A., a senior backend engineer vetted by Cloud Employee',
      flag: '🇮🇹',
    },
  },
  calculator: {
    eyebrow: 'Calculate',
    titleLead: 'What would next hire',
    titleAccent: 'cost?',
    devCountLabel: 'Number of developers:',
    countryPrompt: 'My company is based in',
    regionPrompt: "I'd like devs based in",
    currencyPrompt: 'My preferred currency is',
    ceCardTitle: 'Hiring with',
    ceLogo: '/ce-logo.svg',
    ceBrand: 'CloudEmployee',
    localCardTitlePrefix: 'Hiring in',
    savingsNote: 'All expenses included. No hidden costs.',
    ceFootnote: '',
    localFootnote:
      'Based on salary benchmarks including region-specific employment costs',
    toWord: 'to',
    perMonth: '/ month',
    thatsPrefix: "That's",
    perHourSuffix: '/ hour',
    orYearSuffix: '/ year',
    saveAvgPrefix: 'Save an avg. of',
    saveAvgYearSuffix: '/year',
    higherCostSuffix: 'Higher annual cost',
    breakdownShowLabel: 'Show full breakdown',
    breakdownHideLabel: 'Hide full breakdown',
    breakdownEyebrow: 'The full breakdown',
    breakdownIntroPrefix: "Here's exactly what makes up the",
    breakdownIntroSuffix: 'all-in rate for a Senior Backend Engineer.',
    breakdownTotalLabel: 'Total monthly cost',
    breakdownSavedTemplate: 'vs. hiring in the US: {amount}/yr saved',
    breakdownCta: 'Get matched at this rate',
    breakdownCtaHref: '/schedule-a-call',
    model: {
      // Default cell (Eastern Europe / United Kingdom / GBP) reproduces the
      // design: CE GBP 3,770-6,786 vs UK GBP 8,099-14,356.
      regions: [
        { id: 'eastern-europe', label: 'Eastern Europe', ceMonthly: [3770, 6786] },
        { id: 'latam', label: 'Latin America', ceMonthly: [3450, 6200] },
        { id: 'philippines', label: 'Philippines', ceMonthly: [2980, 5400] },
      ],
      countries: [
        { id: 'united-states', label: 'United States', localMonthly: [9800, 17200], flag: '🇺🇸' },
        { id: 'united-kingdom', label: 'United Kingdom', localMonthly: [8099, 14356], flag: '🇬🇧' },
        { id: 'australia', label: 'Australia', localMonthly: [8600, 15100], flag: '🇦🇺' },
        { id: 'europe', label: 'Europe', localMonthly: [7600, 13400], flag: '🇪🇺' },
      ],
      currencies: [
        { id: 'gbp', label: 'GBP', symbol: '£', rate: 1 },
        { id: 'usd', label: 'USD', symbol: '$', rate: 1.27 },
        { id: 'eur', label: 'EUR', symbol: '€', rate: 1.17 },
      ],
      breakdownRole: 'Senior Backend Engineer',
      // Sums to 5,400 - the design's reference all-in monthly rate.
      breakdownRows: [
        { label: 'Base salary', desc: 'Paid to the engineer, in full', amount: 3200 },
        { label: 'Employer taxes', desc: 'Statutory contributions, fully covered', amount: 850 },
        { label: 'Benefits & private healthcare', desc: 'Medical cover plus statutory benefits', amount: 600 },
        { label: 'Cloud Employee management fee', desc: 'Sourcing, payroll, HR and account management', amount: 750 },
      ],
      hoursPerMonth: 160,
    },
  },
  benefits: {
    eyebrow: 'Additional benefits',
    titleLead: 'What else is',
    titleAccent: 'covered',
    cards: [
      {
        title: 'Dedicated account manager',
        body: 'A single point of contact who knows your team and steps in whenever you need support.',
        icon: 'user-round',
      },
      {
        title: 'Private health insurance',
        body: 'Comprehensive medical cover for every engineer, from day one of their contract.',
        icon: 'heart-pulse',
      },
      {
        title: 'Paid annual leave & holidays',
        body: 'Local statutory holidays plus paid annual leave, fully managed on your behalf.',
        icon: 'palmtree',
      },
      {
        title: 'Annual salary reviews',
        body: 'Fair, benchmarked pay reviews to keep your engineer motivated and retained.',
        icon: 'trending-up',
      },
      {
        title: 'L&D budget & training',
        body: 'Ongoing access to courses, certifications and peer learning groups.',
        icon: 'graduation-cap',
      },
      {
        title: 'Hardware & equipment budget',
        body: 'A dedicated allowance so your engineer has everything they need to do great work.',
        icon: 'laptop',
      },
    ],
  },
  fixedFee: {
    statement:
      'One fixed monthly fee, in your currency. No hourly rates. No variable invoices. No surprises.',
    bullets: [
      'One fixed monthly fee in your currency',
      'No hourly rates',
      'No variable invoices',
      'No surprises',
    ],
    cta: 'Talk to an expert',
    ctaHref: '/schedule-a-call',
    disclaimer:
      'All figures presented are estimates based on publicly available market data and internal benchmarks at the time of publication. Exact rates depend on role, requirements and more. This tool is intended for general informational purposes only and does not constitute a formal quote, offer, financial advice, or guarantee of actual costs. Figures such as salaries, taxes, benefits, insurance contributions, and holidays may change without notice, and Cloud Employee does not warrant the accuracy or completeness of the data over time. Users are solely responsible for any decisions made based on the information provided herein. Cloud Employee disclaims all liability for any loss, direct or indirect, arising from use of this tool beyond its intended purpose.',
  },
  deRisk: {
    eyebrow: 'Built to de-risk your hiring',
    items: ['No upfront fees', 'Replace at no cost', '30 days notice', 'Compliance covered'],
  },
  glassdoor: {
    rating: '4.8 / 5',
    reviewsLabel: '157 employee reviews',
    logo: '/pricing/glassdoor.png',
    wordmark: 'Glassdoor',
  },
  logoBar: {
    label: 'Trusted by 300+ engineering teams',
    logos: [
      { name: 'Virgin Experience Days', src: '/design/home/logos/virgin.png', height: 26 },
      { name: 'Salmon', src: '/design/home/logos/salmon.png', height: 22 },
      { name: 'Hotelplan', src: '/design/home/logos/hotelplan.png', height: 20 },
      { name: 'Willo', src: '/design/home/logos/willo.png', height: 22 },
      { name: 'Travelex', src: '/design/home/logos/travelex.png', height: 20 },
      { name: 'Tidal', src: '/design/home/logos/tidal.png', height: 24 },
      { name: 'Scorpion', src: '/design/home/logos/scorpion.png', height: 22 },
    ],
  },
  testimonial: {
    eyebrow: 'Testimonials',
    titleLead: 'What Our Clients',
    titleAccent: 'Say',
    quote:
      'Working with cloud employee felt nothing like hiring a contractor. The engineer was on our team from week one, shipping code, joining standups, genuinely invested in what we were building.',
    stats: [
      { value: '5', label: 'Engineers scaled to in 6 months' },
      { value: '40%', label: 'Faster sprint delivery' },
    ],
    name: 'Marcus Kilgour',
    role: 'CTO, Salmon Software',
    caption: 'Marcus Kilgour, CTO, Salmon Software · on onboarding the Manila team',
    companyLogo: '/design/home/logos/salmon.png',
    videoStill: '/pricing/video-still.png',
  },
  faq: {
    eyebrow: 'Got questions?',
    titleLead: 'The questions people ask before they',
    titleAccent: 'hire',
    helpEyebrow: "Can't find your question?",
    helpBody: "Ask our AI chatbot - trained on every sales call we've had.",
    helpCta: 'Open chat',
    helpCtaHref: '#chat',
    items: [
      {
        number: '01',
        question: 'When do I start paying and are there any upfront costs?',
        answer:
          'You start paying once your engineer begins work, not before. There are no upfront fees, no recruitment fees and no setup costs. Sourcing and vetting are on us; you only pay the fixed monthly fee once someone is on your team.',
      },
      {
        number: '02',
        question: 'Is there a long-term contract or commitment?',
        answer:
          'No long-term lock-in. You can scale your team up or down as your needs change, with just 30 days notice to end an engagement.',
      },
      {
        number: '03',
        question: "What happens if the developer isn't the right fit?",
        answer:
          'We replace them at no cost. If an engineer is not working out we source a replacement and manage the transition so your delivery keeps moving.',
      },
      {
        number: '04',
        question: 'How long does it take to get a developer onboarded?',
        answer:
          'We typically put two vetted candidates in front of you within 7 working days of understanding your requirements, and onboard your chosen engineer straight after.',
      },
      {
        number: '05',
        question: 'Who handles the legal, payroll, and compliance work?',
        answer:
          'We do, in full. Contracts, local employment compliance, payroll, taxes and benefits are all managed by Cloud Employee, so there is nothing for you to set up or administer.',
      },
      {
        number: '06',
        question: 'What is included in the monthly fee?',
        answer:
          "Everything: the engineer's salary, employer taxes, private healthcare, paid leave, hardware budget, annual salary reviews, and Cloud Employee's sourcing, payroll and account management. One fixed figure in your currency, with nothing billed on top.",
      },
    ],
  },
}
