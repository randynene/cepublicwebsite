import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

// One-shot metadata cleanup found by the Sanity wiring audit (Aug 2026).
//
// Two problems, both live in production meta:
//
// 1. EN DASHES. Three singleton meta fields carried "–", which the author-voice
//    rule forbids. Two of them are in <title> tags Google is already rendering,
//    so this is visible in the SERP, not just in the dataset. Replaced with the
//    pipe separator every other page title on the site already uses, and with a
//    comma in the one case where the dash was doing a comma's job.
//
// 2. MISSING DESCRIPTIONS. /legals/general-terms and /price-comparison-calculator
//    served no meta description at all, so Google was left to invent one from
//    the page body. Both are now written to the 140-160 character target.
//    priceComparisonCalculatorPage was also missing its metaTitle, so the page
//    was falling back to the code default rather than anything editable.
//
// Run: npm run static:patch-meta-dashes
// Token: SANITY_MIGRATION_WRITE_TOKEN

const NO_DASHES = /[–—]/

// `minimalEdit` marks a patch that only swaps the offending character in copy
// somebody else wrote. Those skip the length check on purpose: the existing
// description is 190 chars, which is over target, but shortening it is an
// editorial decision and not part of removing a dash.
const PATCHES: { id: string; set: Record<string, string>; why: string; minimalEdit?: true }[] = [
  {
    id: 'generalTermsPage',
    why: 'en dash in title + no description',
    set: {
      metaTitle: 'General Terms | Cloud Employee',
      metaDescription:
        'The terms governing your use of the Cloud Employee website and services, covering acceptable use, intellectual property, and the limits of our liability.',
    },
  },
  {
    id: 'privacyPolicyPage',
    why: 'en dash in title',
    set: { metaTitle: 'Privacy Policy | Cloud Employee' },
  },
  {
    id: 'ourWorkPage',
    why: 'en dash used as a comma inside the description',
    minimalEdit: true,
    set: {
      // Byte-for-byte the live description, with "drag–delivering" changed to
      // "drag, delivering". The curly apostrophe is deliberate: it is what the
      // live copy uses, and normalising it here would be an unrelated change.
      metaDescription:
        'Accelerate growth without the hiring bottleneck. We’ve helped hundreds of tech teams ship faster by removing recruitment drag, delivering vetted developers, real results, and measurable impact.',
    },
  },
  {
    id: 'priceComparisonCalculatorPage',
    why: 'no title and no description',
    set: {
      metaTitle: 'Price Comparison Calculator | Cloud Employee',
      metaDescription:
        'Select where your team is based and how many developers you need, and compare the cost of hiring them locally against hiring through Cloud Employee.',
    },
  },
]

async function main() {
  // Fail before writing anything rather than half-applying.
  for (const { id, set, minimalEdit } of PATCHES) {
    for (const [field, value] of Object.entries(set)) {
      if (NO_DASHES.test(value)) throw new Error(`${id}.${field} still contains an en/em dash`)
      if (minimalEdit) continue
      if (field === 'metaDescription' && (value.length < 140 || value.length > 160)) {
        throw new Error(`${id}.${field} is ${value.length} chars, outside the 140-160 target`)
      }
      if (field === 'metaTitle' && value.length > 60) {
        throw new Error(`${id}.${field} is ${value.length} chars, over the 60 char target`)
      }
    }
  }

  for (const { id, set, why } of PATCHES) {
    console.log(`\n${id}  (${why})`)
    for (const [field, value] of Object.entries(set)) {
      console.log(`  ${field} (${value.length}): ${value}`)
    }
    await sanityWriteClient.patch(id).set(set).commit()
    console.log('  patched OK')
  }

  console.log('\nAll metadata patches applied.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
