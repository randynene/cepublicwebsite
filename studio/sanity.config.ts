import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { defineLocations, presentationTool } from 'sanity/presentation'

import { schemaTypes } from './schemas'
import { deskStructure, SINGLETON_TYPES } from './schemas/structure'

// Hosted Studio reads this at deploy time. Staging is the source of truth
// for the designed site until cloudemployee.io cutover.
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_URL_ORIGIN ??
  process.env.SANITY_STUDIO_PREVIEW_URL ??
  'https://staging.jakevibes.dev'

const projectId = process.env.SANITY_PROJECT_ID || 'lzbhll1u'
const dataset = process.env.SANITY_DATASET || 'production'

// Presentation needs to be told which URL(s) a document appears on. Without an
// entry here the doc opens with an empty preview pane and an editor reasonably
// concludes the page is not wired up, even when it is fully Sanity-driven.
//
// Every route below is verified to exist in site/src/app. Most pages have a UK
// mirror under /uk; the ones that do not are marked usOnly.
//
// Deliberately ABSENT (no single URL to preview, so an entry would be a lie):
//   notFoundPage      renders on any bad URL
//   sharedServiceFaqs appears on all ~124 service + technology pages
//   navigation / footer / siteSettings   sitewide chrome
//   compareHub        hub root retired via 301 to /alternatives (Phase 4.2)
//   startHiringPage   drives /start-hiring/[step], a noindex funnel with no single page
const PAGE_LOCATIONS: Record<string, { title: string; path: string; usOnly?: boolean }> = {
  // Marketing
  aboutUsPage: { title: 'About Us', path: '/about-us' },
  howItWorksPage: { title: 'How It Works', path: '/how-it-works' },
  forDevelopersPage: { title: 'For Developers', path: '/for-developers' },
  ourWorkPage: { title: 'Our Work', path: '/our-work' },
  pricingPage: { title: 'Pricing', path: '/pricing' },
  referralsPage: { title: 'Referrals', path: '/referrals' },
  fractionalCtoPage: { title: 'Fractional CTO', path: '/services/fractional-ctos' },
  hireEngineersPage: { title: 'Hire Engineers', path: '/services/software-engineers' },
  workWithShawneePage: { title: 'Work With Shawnee', path: '/work-with-shawnee' },

  // Legal
  privacyPolicyPage: { title: 'Privacy Policy', path: '/legals/privacy-policy' },
  generalTermsPage: { title: 'General Terms', path: '/legals/general-terms' },

  // Calculators
  hiringCostCalculatorPage: {
    title: 'Hiring Cost Calculator',
    path: '/hiring-cost-calculator',
    usOnly: true,
  },
  priceComparisonCalculatorPage: {
    title: 'Price Comparison Calculator',
    path: '/price-comparison-calculator',
  },

  // Collection indexes
  servicesHub: { title: 'Services', path: '/services' },
  technologyHub: { title: 'Technology', path: '/technology' },
  customerStoriesHub: { title: 'Customer Stories', path: '/customer-stories' },
  reviewsHub: { title: 'Reviews', path: '/reviews' },
  alternativesHub: { title: 'Alternatives', path: '/alternatives' },

  // Blog + topic hubs
  blogHub: { title: 'Blog', path: '/blog' },
  staffAugmentationHub: { title: 'Staff Augmentation', path: '/staff-augmentation' },
  nearshoringOffshoringHub: { title: 'Nearshoring & Offshoring', path: '/nearshoring-offshoring' },
  scalingTeamsHub: { title: 'Scaling Teams', path: '/scaling-teams' },
  hiringTipsHub: { title: 'Hiring Tips', path: '/hiring-tips' },
  managingEngineersHub: { title: 'Managing Engineers', path: '/managing-engineers' },
  aiInSoftwareDevelopmentHub: {
    title: 'AI in Software Development',
    path: '/ai-in-software-development',
  },

  // Resource hubs
  videosHub: { title: 'Videos', path: '/videos' },
  toolsHub: { title: 'Tools', path: '/tools' },
  downloadsHub: { title: 'Downloads', path: '/downloads' },
  eventsHub: { title: 'Events', path: '/events' },
}

const pageLocationResolvers = Object.fromEntries(
  Object.entries(PAGE_LOCATIONS).map(([type, { title, path, usOnly }]) => [
    type,
    defineLocations({
      select: { title: 'title' },
      resolve: (doc) => ({
        locations: [
          { title: (doc?.title as string) || title, href: path },
          ...(usOnly ? [] : [{ title: `${title} (UK)`, href: `/uk${path}` }]),
        ],
      }),
    }),
  ]),
)

export default defineConfig({
  name: 'mygratr',
  title: 'Cloud Employee',
  projectId,
  dataset,

  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool(),
    presentationTool({
      resolve: {
        locations: {
          // Home is hand-written: it is the only page whose US path is '/', so
          // the generic `/uk${path}` join would produce '/uk/' rather than '/uk'.
          homePage: defineLocations({
            select: { title: 'title' },
            resolve: (doc) => ({
              locations: [
                { title: doc?.title || 'Home', href: '/' },
                { title: 'Home (UK)', href: '/uk' },
              ],
            }),
          }),
          contactPage: defineLocations({
            select: { title: 'title' },
            resolve: () => ({
              locations: [
                { title: 'Contact', href: '/contact' },
                { title: 'Contact (UK)', href: '/uk/contact' },
              ],
            }),
          }),
          ...pageLocationResolvers,
        },
      },
      previewUrl: {
        origin: previewOrigin,
        previewMode: { enable: '/api/draft-mode/enable' },
        draftMode: { enable: '/api/draft-mode/enable' },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !SINGLETON_TYPES.includes(schemaType)),
  },

  document: {
    actions: (input, context) =>
      SINGLETON_TYPES.includes(context.schemaType)
        ? input.filter(({ action }) => action !== 'duplicate' && action !== 'delete')
        : input,
  },
})
