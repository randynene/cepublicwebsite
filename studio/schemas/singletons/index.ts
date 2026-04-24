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

// Static content singletons (§4.4) — 13
import homePage from './home-page'
import aboutUsPage from './about-us-page'
import howItWorksPage from './how-it-works-page'
import contactPage from './contact-page'
import forDevelopersPage from './for-developers-page'
import retentionPage from './retention-page'
import sourcingPage from './sourcing-page'
import embeddingPage from './embedding-page'
import scaleThisWeekPage from './scale-this-week-page'
import workWithShawneePage from './work-with-shawnee-page'
import startHiringPage from './start-hiring-page'
import notFoundPage from './not-found-page'
import privacyPolicyPage from './privacy-policy-page'

// Tier 3 calculator pages (§5) — 2
import hiringCostCalculatorPage from './hiring-cost-calculator-page'
import priceComparisonCalculatorPage from './price-comparison-calculator-page'

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
  retentionPage,
  sourcingPage,
  embeddingPage,
  scaleThisWeekPage,
  workWithShawneePage,
  startHiringPage,
  notFoundPage,
  privacyPolicyPage,
  // Tier 3
  hiringCostCalculatorPage,
  priceComparisonCalculatorPage,
]

// Names used by structure config + singleton seed script.
export const SINGLETON_TYPE_NAMES = singletonTypes.map((t) => t.name)
