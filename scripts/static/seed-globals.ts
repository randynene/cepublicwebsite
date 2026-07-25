// MYGRATR-STATIC-1 Step 1a — seed Sanity globals.
//
// Writes the three global singletons: `navigation`, `footer`, `siteSettings`.
// All three exist as stubs in production today (plan-mode confirmed
// 2026-05-15). Stubs hold no content; this script uses createOrReplace to
// install the full content payloads.
//
// Locked decisions threaded through:
//   - Two "How It Works" links in source resolve to one "Embedding" link
//     (/embedding) + one "How It Works" link (/how-it-works) per brief
//     STATIC-1 §2.3.
//   - Services dropdown: hand-curated 19 items per CE_SITE_TRUTH; cmsDriven
//     stays false (CMS-driven auto-resolve reserved for future enhancement).
//   - Resources dropdown: 6 items mirroring footer column 4 (the
//     "Resources" column). Locked at plan-mode close because CE_SITE_TRUTH
//     captured the count but not the items; footer column 4 is the
//     same-source mirror.
//   - /pricing stays in nav + footer; routing-side 301 to /services lands
//     in Step 5 (Header) via next.config.ts lockedRules.
//   - Footer columns + copyright (with {year} token) + legal links per
//     CE_SITE_TRUTH §15.
//
// Author-voice normalization (Jake's locked rule, persistent memory):
//   - No em dashes (—) or en dashes (–) in any seeded copy. The
//     normalize() helper at the top of this file is the visible
//     enforcement point. Every string written to Sanity passes through it.
//   - This applies even to text lifted from external sources (none of the
//     globals are lifted, but the rule is identical to seed-hubs.ts).
//
// Run: `npm run static:seed-globals`
// Token: SANITY_MIGRATION_WRITE_TOKEN (least-privilege, single-dataset)

import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// ────────────────────────────────────────────────────────────────────────
// Author-voice normalization (Jake's locked rule)
// ────────────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .replace(/—/g, ', ')   // em dash → comma + space
    .replace(/–/g, '-')    // en dash → hyphen
    .replace(/\s+/g, ' ')       // collapse whitespace
    .trim()
}

const CE_HOST = 'https://www.cloudemployee.io'
const url = (path: string): string => `${CE_HOST}${path}`

// ────────────────────────────────────────────────────────────────────────
// navigation
// ────────────────────────────────────────────────────────────────────────

const SERVICES_DROPDOWN: Array<{ label: string; url: string }> = [
  { label: 'Software Engineers', url: url('/services/software-engineers') },
  { label: 'Fractional CTOs', url: url('/services/fractional-ctos') },
  { label: 'Mobile Developers', url: url('/services/mobile-developers') },
  { label: 'QA Analysts & Testers', url: url('/services/qa-analysts-testers') },
  { label: 'DevOps Engineers', url: url('/services/devops-engineers') },
  { label: 'Data Scientists', url: url('/services/data-scientists') },
  { label: 'No-Code Developers', url: url('/services/no-code-developers') },
  { label: 'TypeScript Developers', url: url('/technology/typescript-developers') },
  { label: 'AWS Developers', url: url('/technology/aws-developers') },
  { label: '.NET Developers', url: url('/technology/dotnet-developers') },
  { label: 'React Developers', url: url('/technology/react-developers') },
  { label: 'Node.js Developers', url: url('/technology/nodejs-developers') },
  { label: 'Python Developers', url: url('/technology/python-developers') },
  { label: 'MVP Development', url: url('/services/mvp-development') },
  { label: 'Mobile Apps', url: url('/services/mobile-apps') },
  { label: 'Web-Based Apps', url: url('/services/web-based-apps') },
  { label: 'AI Engineers', url: url('/services/ai-engineers') },
  { label: 'AI Consulting', url: url('/services/ai-consulting') },
  { label: 'AI Product Builds', url: url('/services/ai-product-builds') },
]

// 6 items mirroring footer column 4 ("Resources") per locked Open Decision #2.
const RESOURCES_DROPDOWN: Array<{ label: string; url: string }> = [
  { label: 'Customer Stories', url: url('/customer-stories') },
  { label: 'CE vs. Alternatives', url: url('/compare') },
  { label: 'Blogs', url: url('/blog') },
  { label: 'Free Downloads', url: url('/downloads') },
  { label: 'Tools', url: url('/tools') },
  { label: 'Video Library', url: url('/videos') },
]

const navigation = {
  _id: 'navigation',
  _type: 'navigation',
  primaryLinks: [
    {
      _key: 'pl-services',
      _type: 'primaryLink',
      label: normalize('Services'),
      url: url('/services'),
      cmsDriven: false,
      dropdownItems: SERVICES_DROPDOWN.map((item, i) => ({
        _key: `srv-${i}`,
        _type: 'dropdownItem',
        label: normalize(item.label),
        url: item.url,
      })),
    },
    {
      _key: 'pl-our-clients',
      _type: 'primaryLink',
      label: normalize('Our Clients'),
      url: url('/our-work'),
      cmsDriven: false,
      dropdownItems: [],
    },
    // Brief §2.3 locked relabel: source has two "How It Works" labels;
    // the /embedding link gets the label "Embedding" to match the page's
    // actual title. /how-it-works keeps its "How It Works" label.
    {
      _key: 'pl-embedding',
      _type: 'primaryLink',
      label: normalize('Embedding'),
      url: url('/embedding'),
      cmsDriven: false,
      dropdownItems: [],
    },
    {
      _key: 'pl-how-it-works',
      _type: 'primaryLink',
      label: normalize('How It Works'),
      url: url('/how-it-works'),
      cmsDriven: false,
      dropdownItems: [],
    },
    {
      _key: 'pl-resources',
      _type: 'primaryLink',
      label: normalize('Resources'),
      url: url('/blog'),
      cmsDriven: false,
      dropdownItems: RESOURCES_DROPDOWN.map((item, i) => ({
        _key: `rsrc-${i}`,
        _type: 'dropdownItem',
        label: normalize(item.label),
        url: item.url,
      })),
    },
    {
      _key: 'pl-pricing',
      _type: 'primaryLink',
      label: normalize('Pricing'),
      url: url('/pricing'),
      cmsDriven: false,
      dropdownItems: [],
    },
    {
      _key: 'pl-about',
      _type: 'primaryLink',
      label: normalize('About Us'),
      url: url('/about-us'),
      cmsDriven: false,
      dropdownItems: [],
    },
  ],
  ctaButton: {
    _type: 'object',
    label: normalize('Schedule a Call'),
    link: url('/contact'),
    type: 'calendly',
  },
  localeDropdown: {
    _type: 'object',
    enabled: true,
    options: [
      {
        _key: 'loc-us',
        _type: 'localeOption',
        label: normalize('United States'),
        url: 'https://www.cloudemployee.io/',
        hreflang: 'en',
      },
      {
        _key: 'loc-uk',
        _type: 'localeOption',
        label: normalize('United Kingdom'),
        url: 'https://www.cloudemployee.io/uk',
        hreflang: 'en-GB',
      },
    ],
  },
}

// ────────────────────────────────────────────────────────────────────────
// footer
// ────────────────────────────────────────────────────────────────────────

// Per CE_SITE_TRUTH plan-mode ITEM 15. Column ordering matches captured
// extract. Newsletter form copy was not captured; only the form GUID.
// Newsletter heading/sub-copy can be added by Seb in Studio post-seed.

type FooterColumn = { heading: string; links: Array<{ label: string; url: string }> }

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Full-time Staff Augmentation',
    links: [
      { label: 'Software Engineers', url: url('/services/software-engineers') },
      { label: 'AI Engineers', url: url('/services/ai-engineers') },
      { label: 'Fractional CTOs', url: url('/services/fractional-ctos') },
      { label: 'Mobile Developers', url: url('/services/mobile-developers') },
      { label: 'QA Analysts & Testers', url: url('/services/qa-analysts-testers') },
      { label: 'DevOps Engineers', url: url('/services/devops-engineers') },
      { label: 'Data Scientists', url: url('/services/data-scientists') },
      { label: 'No-Code Developers', url: url('/services/no-code-developers') },
    ],
  },
  {
    heading: 'Technology',
    links: [
      { label: 'React', url: url('/technology/react-developers') },
      { label: 'Node.js', url: url('/technology/nodejs-developers') },
      { label: 'Python', url: url('/technology/python-developers') },
      { label: 'TypeScript', url: url('/technology/typescript-developers') },
      { label: 'AWS', url: url('/technology/aws-developers') },
      { label: '.NET', url: url('/technology/dotnet-developers') },
      { label: 'Java', url: url('/technology/java-developers') },
      { label: 'LATAM Developers', url: url('/services/latam-developers') },
      { label: 'Philippines Developers', url: url('/services/philippines-developers') },
    ],
  },
  {
    heading: 'About',
    links: [
      // "Book a call" in CE_SITE_TRUTH points to `#` (anchor); routing to
      // /contact (matches the CTA button intent) is the pragmatic substitute.
      { label: 'Book a call', url: url('/contact') },
      { label: 'How it works', url: url('/how-it-works') },
      { label: 'About us', url: url('/about-us') },
      { label: 'Pricing', url: url('/pricing') },
      { label: 'Reviews', url: url('/reviews') },
      { label: 'Careers', url: url('/for-developers') },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Customer Stories', url: url('/customer-stories') },
      { label: 'CE vs. Alternatives', url: url('/compare') },
      { label: 'Blogs', url: url('/blog') },
      { label: 'Free Downloads', url: url('/downloads') },
      { label: 'Tools', url: url('/tools') },
      { label: 'Video Library', url: url('/videos') },
    ],
  },
]

const footer = {
  _id: 'footer',
  _type: 'footer',
  newsletterFormId: 'deac2450-b51b-4630-b9e2-47017a13da15',
  // {year} token is rendered by the Footer component (Step 3); the schema
  // documents support.
  copyrightText: normalize('© {year} Cloud Employee. All rights reserved.'),
  columns: FOOTER_COLUMNS.map((col, ci) => ({
    _key: `fc-${ci}`,
    _type: 'footerColumn',
    heading: normalize(col.heading),
    links: col.links.map((link, li) => ({
      _key: `fc-${ci}-l-${li}`,
      _type: 'footerLink',
      label: normalize(link.label),
      url: link.url,
    })),
  })),
  legalLinks: [
    {
      _key: 'legal-privacy',
      _type: 'legalLink',
      label: normalize('Privacy Policy'),
      url: url('/legals/privacy-policy'),
    },
  ],
}

// ────────────────────────────────────────────────────────────────────────
// siteSettings
// ────────────────────────────────────────────────────────────────────────
//
// Schema requires defaultOgImage (image asset). Not seeded here, Seb
// uploads via Studio post-seed. createOrReplace doesn't enforce
// required-on-publish; the field stays absent until uploaded.
//
// defaultMetaDescription must be 140-160 chars (strict). Crafted below.

const META_TITLE_DEFAULT = 'Cloud Employee | Embedded Nearshore Developers'
const META_DESC_DEFAULT = normalize(
  // 144 chars — within the 140-160 strict bound.
  'Hire vetted nearshore developers who feel in-house from day one. Embedded engineering teams for fast-scaling startups and product companies.',
)

const siteSettings = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  siteName: normalize('Cloud Employee'),
  siteUrl: 'https://www.cloudemployee.io',
  defaultMetaTitle: META_TITLE_DEFAULT,
  defaultMetaDescription: META_DESC_DEFAULT,
  // defaultOgImage intentionally omitted; required only at publish-time.
  announcementBar: {
    _type: 'object',
    enabled: false,
    text: '',
    ctaLabel: '',
  },
  socialProof: {
    _type: 'object',
    organizationName: normalize('Cloud Employee'),
    organizationUrl: 'https://www.cloudemployee.io',
    foundingDate: '2013-01-01',
    description: normalize(
      'Cloud Employee builds embedded nearshore developer teams for fast-scaling product companies. Vetted engineers, long-term retention, transparent pricing.',
    ),
  },
  claraChat: {
    _type: 'object',
    enabled: true,
    // workspaceId left empty; GlobalScripts already loads the widget
    // (SCAFFOLD-1). Populate in Studio if a workspace ID is needed for
    // ClaraChat's own config endpoint.
    workspaceId: '',
  },
  hubspotPortalId: '22809822',
}

// ────────────────────────────────────────────────────────────────────────
// run
// ────────────────────────────────────────────────────────────────────────

async function main() {
  const docs = [navigation, footer, siteSettings]
  for (const doc of docs) {
    process.stdout.write(`seed-globals: writing ${doc._id} ... `)
    await sanityWriteClient.createOrReplace(doc)
    process.stdout.write('OK\n')
  }
  process.stdout.write(`seed-globals: ${docs.length} docs written.\n`)
}

main().catch((err) => {
  console.error('seed-globals: FAILED', err)
  process.exit(1)
})
