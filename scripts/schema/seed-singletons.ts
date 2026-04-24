// Seeds all 34 singleton/global documents into Sanity. Idempotent —
// createIfNotExists means re-runs skip existing docs without overwriting.
// Seeded documents have minimum fields filled (_id, _type, placeholder title
// where applicable). Required fields without content get flagged by Studio
// as validation errors on load — that's by design: seeded docs become
// Seb's content-authoring work list.
import { createClient } from '@sanity/client'

import { env, ensureSanity } from '@/lib/env'

interface SeedDoc {
  _id: string
  _type: string
  [key: string]: unknown
}

// Per-type minimal-doc shapes. Keys are _type names; values are extra
// fields layered on top of { _id, _type }. Only include non-validation-
// blocking placeholders. Required content fields (meta, required images)
// are intentionally omitted so Seb sees them as TODOs in the Studio.
const SINGLETON_SEED_SHAPES: Record<string, Record<string, unknown>> = {
  // Blog hubs (§4.1) — title required; heroDescription required but omitted
  blogHub: { title: 'Blog' },
  staffAugmentationHub: { title: 'Staff Augmentation' },
  nearshoringOffshoringHub: { title: 'Nearshoring & Offshoring' },
  scalingTeamsHub: { title: 'Scaling Teams' },
  hiringTipsHub: { title: 'Hiring Tips' },
  managingEngineersHub: { title: 'Managing Engineers' },
  aiInSoftwareDevelopmentHub: { title: 'AI in Software Development' },

  // Resource hubs (§4.2)
  videosHub: { title: 'Videos' },
  toolsHub: { title: 'Tools' },
  downloadsHub: { title: 'Downloads' },
  eventsHub: { title: 'Events' },

  // Collection index singletons (§4.3)
  servicesHub: { title: 'Services' },
  technologyHub: { title: 'Technology' },
  customerStoriesHub: { title: 'Customer Stories' },
  reviewsHub: { title: 'Reviews' },
  compareHub: { title: 'Compare' },

  // Static content singletons (§4.4) — locale defaults to 'default'
  homePage: { title: 'Home', locale: 'default' },
  aboutUsPage: { title: 'About Us', locale: 'default' },
  howItWorksPage: { title: 'How It Works', locale: 'default' },
  contactPage: { title: 'Contact', locale: 'default' },
  forDevelopersPage: { title: 'For Developers', locale: 'default' },
  retentionPage: { title: 'Retention', locale: 'default' },
  sourcingPage: { title: 'Sourcing', locale: 'default' },
  embeddingPage: { title: 'Embedding', locale: 'default' },
  scaleThisWeekPage: { title: 'Scale This Week', locale: 'default' },
  workWithShawneePage: { title: 'Work With Shawnee', locale: 'default' },
  startHiringPage: { title: 'Start Hiring', locale: 'default' },
  notFoundPage: { title: '404 — Page Not Found', locale: 'default' },
  privacyPolicyPage: { title: 'Privacy Policy', locale: 'default' },

  // Tier 3 calculator pages (§5)
  hiringCostCalculatorPage: { title: 'Hiring Cost Calculator' },
  priceComparisonCalculatorPage: { title: 'Price Comparison Calculator' },

  // Site globals (§6)
  siteSettings: {
    siteName: 'Cloud Employee',
    siteUrl: 'https://cloudemployee.io',
    hubspotPortalId: '22809822',
    announcementBar: { enabled: false },
    claraChat: { enabled: false },
  },
  navigation: { primaryLinks: [], localeDropdown: { enabled: true, options: [] } },
  footer: { copyrightText: '© {year} Cloud Employee', columns: [], legalLinks: [] },
}

async function main(): Promise<void> {
  ensureSanity()

  const isProduction = env.SANITY_DATASET === 'production'
  const confirmFlag = process.argv.includes('--confirm-production')

  console.log(`Project:  ${env.SANITY_PROJECT_ID}`)
  console.log(`Dataset:  ${env.SANITY_DATASET}${isProduction ? ' (PRODUCTION)' : ''}`)

  if (isProduction && !confirmFlag) {
    console.error(
      '\nRefusing to seed into PRODUCTION dataset without --confirm-production flag.\n' +
        'Run again with: npm run schema:seed-singletons -- --confirm-production\n',
    )
    process.exit(1)
  }

  const client = createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    token: env.SANITY_API_TOKEN,
    apiVersion: '2024-10-01',
    useCdn: false,
  })

  let created = 0
  let alreadyExists = 0
  const failures: Array<{ type: string; error: string }> = []

  const typeNames = Object.keys(SINGLETON_SEED_SHAPES).sort()

  for (const typeName of typeNames) {
    const doc: SeedDoc = {
      _id: typeName,
      _type: typeName,
      ...SINGLETON_SEED_SHAPES[typeName],
    }

    try {
      const existing = await client.getDocument(typeName)
      if (existing) {
        console.log(`[skip]    ${typeName} (already exists)`)
        alreadyExists++
        continue
      }

      await client.createIfNotExists(doc)
      console.log(`[created] ${typeName}`)
      created++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[FAIL]    ${typeName}: ${message}`)
      failures.push({ type: typeName, error: message })
    }
  }

  console.log('')
  console.log(`Created: ${created}`)
  console.log(`Already existed: ${alreadyExists}`)
  console.log(`Failed: ${failures.length}`)

  if (failures.length > 0) {
    console.error('\nFailures:')
    for (const f of failures) console.error(`  - ${f.type}: ${f.error}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
