// Studio structure config — surfaces every singleton/global as a direct
// nav entry (not a list view) and hides them from the default document list.
// Per Sanity v5 `sanity/structure` API. Referenced from sanity.config.ts.
import type { StructureResolver } from 'sanity/structure'

import { GLOBAL_TYPE_NAMES } from './globals'
import { SINGLETON_TYPE_NAMES } from './singletons'

export const SINGLETON_TYPES: string[] = [...SINGLETON_TYPE_NAMES, ...GLOBAL_TYPE_NAMES]

// Grouping labels for the Studio nav. Keeps 34 singleton items scannable
// instead of a 34-item flat list.
const BLOG_HUB_NAMES = [
  'blogHub',
  'staffAugmentationHub',
  'nearshoringOffshoringHub',
  'scalingTeamsHub',
  'hiringTipsHub',
  'managingEngineersHub',
  'aiInSoftwareDevelopmentHub',
]

const RESOURCE_HUB_NAMES = ['videosHub', 'toolsHub', 'downloadsHub', 'eventsHub']

const COLLECTION_INDEX_NAMES = [
  'servicesHub',
  'technologyHub',
  'customerStoriesHub',
  'reviewsHub',
  'compareHub',
]

const CALCULATOR_NAMES = ['hiringCostCalculatorPage', 'priceComparisonCalculatorPage']

const SHARED_CONTENT_NAMES = ['sharedServiceFaqs']

const STATIC_PAGE_NAMES = [
  'homePage',
  'aboutUsPage',
  'howItWorksPage',
  'contactPage',
  'forDevelopersPage',
  'retentionPage',
  'sourcingPage',
  'embeddingPage',
  'scaleThisWeekPage',
  'workWithShawneePage',
  'startHiringPage',
  'notFoundPage',
  'generalTermsPage',
  'ourWorkPage',
  'alternativesHub',
  'pricingPage',
  'referralsPage',
  'privacyPolicyPage',
  'fractionalCtoPage',
  'hireEngineersPage',
]

const GROUPED_SINGLETON_NAMES = new Set([
  ...BLOG_HUB_NAMES,
  ...RESOURCE_HUB_NAMES,
  ...COLLECTION_INDEX_NAMES,
  ...CALCULATOR_NAMES,
  ...SHARED_CONTENT_NAMES,
  ...STATIC_PAGE_NAMES,
  ...GLOBAL_TYPE_NAMES,
])

export const deskStructure: StructureResolver = (S) => {
  const singletonItem = (typeName: string) =>
    S.listItem()
      .title(humanise(typeName))
      .id(typeName)
      .child(S.document().schemaType(typeName).documentId(typeName))

  return S.list()
    .title('Content')
    .items([
      // Static pages
      S.listItem()
        .title('Static Pages')
        .child(S.list().title('Static Pages').items(STATIC_PAGE_NAMES.map(singletonItem))),
      // Blog hubs
      S.listItem()
        .title('Blog Hubs')
        .child(S.list().title('Blog Hubs').items(BLOG_HUB_NAMES.map(singletonItem))),
      // Resource hubs
      S.listItem()
        .title('Resource Hubs')
        .child(S.list().title('Resource Hubs').items(RESOURCE_HUB_NAMES.map(singletonItem))),
      // Collection indexes
      S.listItem()
        .title('Collection Indexes')
        .child(
          S.list().title('Collection Indexes').items(COLLECTION_INDEX_NAMES.map(singletonItem)),
        ),
      // Calculators
      S.listItem()
        .title('Calculator Pages')
        .child(S.list().title('Calculator Pages').items(CALCULATOR_NAMES.map(singletonItem))),
      // Shared content blocks
      S.listItem()
        .title('Shared Content')
        .child(S.list().title('Shared Content').items(SHARED_CONTENT_NAMES.map(singletonItem))),
      // Globals
      S.listItem()
        .title('Site Globals')
        .child(S.list().title('Site Globals').items(GLOBAL_TYPE_NAMES.map(singletonItem))),

      S.divider(),

      // Regular CMS document types — everything that isn't a grouped singleton.
      ...S.documentTypeListItems().filter(
        (item) => !GROUPED_SINGLETON_NAMES.has(item.getId() ?? ''),
      ),
    ])
}

function humanise(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}
