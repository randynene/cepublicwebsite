// Blog hubs (§4.1) — 7
import blogHub from './blog-hub'
import staffAugmentationHub from './staff-augmentation-hub'
import nearshoringOffshoringHub from './nearshoring-offshoring-hub'
import scalingTeamsHub from './scaling-teams-hub'
import hiringTipsHub from './hiring-tips-hub'
import managingEngineersHub from './managing-engineers-hub'
import aiInSoftwareDevelopmentHub from './ai-in-software-development-hub'

// Resource hubs (§4.2) — 4
import videosHub from './videos-hub'
import toolsHub from './tools-hub'
import downloadsHub from './downloads-hub'
import eventsHub from './events-hub'

// Collection index singletons (§4.3) — 5 (teamHub dropped per §6 deferred)
import servicesHub from './services-hub'
import technologyHub from './technology-hub'
import customerStoriesHub from './customer-stories-hub'
import reviewsHub from './reviews-hub'
import compareHub from './compare-hub'

// Static content singletons (§4.4)
//
// retentionPage / sourcingPage / embeddingPage / scaleThisWeekPage were removed
// on 26 Jul 2026. Those four URLs 301 rather than render (see the deliberate
// divergence block in site/next.config.ts), so the documents backed no route and
// only offered Seb fields that changed nothing.
import homePage from './home-page'
import aboutUsPage from './about-us-page'
import howItWorksPage from './how-it-works-page'
import contactPage from './contact-page'
import forDevelopersPage from './for-developers-page'
import workWithShawneePage from './work-with-shawnee-page'
import startHiringPage from './start-hiring-page'
import notFoundPage from './not-found-page'
import generalTermsPage from './general-terms-page'
import ourWorkPage from './our-work-page'
import bookACallPage from './book-a-call-page'
import bookACallConfirmedPage from './book-a-call-confirmed-page'
import bookACallThankYouPage from './book-a-call-thank-you-page'
import thankYouPage from './thank-you-page'
import thankYouCultureMatchPage from './thank-you-culture-match-page'
import thankYouForYourMessagePage from './thank-you-for-your-message-page'
import thankYouNowBookACallPage from './thank-you-now-book-a-call-page'
import alternativesHub from './alternatives-page'
import pricingPage from './pricing-page'
import referralsPage from './referrals-page'
import privacyPolicyPage from './privacy-policy-page'
import fractionalCtoPage from './fractional-cto-page'
import hireEngineersPage from './hire-engineers-page'

// Tier 3 calculator pages (§5) — 2
import hiringCostCalculatorPage from './hiring-cost-calculator-page'
import priceComparisonCalculatorPage from './price-comparison-calculator-page'

// Shared content blocks reused across many detail pages
import sharedServiceFaqs from './shared-service-faqs'

export const singletonTypes = [
  // Blog hubs
  blogHub,
  staffAugmentationHub,
  nearshoringOffshoringHub,
  scalingTeamsHub,
  hiringTipsHub,
  managingEngineersHub,
  aiInSoftwareDevelopmentHub,
  // Resource hubs
  videosHub,
  toolsHub,
  downloadsHub,
  eventsHub,
  // Collection index
  servicesHub,
  technologyHub,
  customerStoriesHub,
  reviewsHub,
  compareHub,
  // Static content
  homePage,
  aboutUsPage,
  howItWorksPage,
  contactPage,
  forDevelopersPage,
  workWithShawneePage,
  startHiringPage,
  notFoundPage,
  generalTermsPage,
  ourWorkPage,
  bookACallPage,
  bookACallConfirmedPage,
  bookACallThankYouPage,
  thankYouPage,
  thankYouCultureMatchPage,
  thankYouForYourMessagePage,
  thankYouNowBookACallPage,
  alternativesHub,
  pricingPage,
  referralsPage,
  privacyPolicyPage,
  fractionalCtoPage,
  hireEngineersPage,
  // Tier 3
  hiringCostCalculatorPage,
  priceComparisonCalculatorPage,
  // Shared content
  sharedServiceFaqs,
]

// Names used by structure config + singleton seed script.
export const SINGLETON_TYPE_NAMES = singletonTypes.map((t) => t.name)
