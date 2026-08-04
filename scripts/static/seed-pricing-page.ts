import 'dotenv/config'

import { sanityWriteClient } from '@/lib/content/sanity-write-client'

import { PRICING_CONTENT as PC } from '../../site/src/components/templates/pricing/content'

// MYGRATR Pricing Sanity wiring - seed the pricingPage singleton.
//
// Builds the pricingPage document 1:1 with the template's PricingContent shape
// so Seb can edit every headline, benefit, FAQ answer, and - crucially - the
// calculator benchmark model (region/country monthly ranges, currency rates,
// breakdown rows) in Studio. No images: the candidate photo, client logos, and
// testimonial media are placeholders in the template pending real assets.
//
// The one structural transform: the model's [low, high] tuples become
// monthlyLow / monthlyHigh fields, matching the schema.
//
// Idempotent: deterministic array _keys + createOrReplace on _id "pricingPage".
// Author-voice rule (no em/en dashes): normalizeDeep strips them from every
// string written.
//
// Run: npm run static:seed-pricing-page
// Token: SANITY_MIGRATION_WRITE_TOKEN

// metaTitle <= 60, metaDescription 140-160 (schema validation, Studio-side).
const META_TITLE = 'World-class senior engineers at a fair price'
const META_DESCRIPTION =
  'One fixed monthly fee, in your currency, with no hourly rates or variable invoices. See what your next engineer costs with Cloud Employee versus hiring locally.'

const STRUCTURAL_KEYS = new Set(['_ref', '_type', '_key', 'asset'])

function normalizeStr(str: string): string {
  return str
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function normalizeDeep<T>(value: T): T {
  if (typeof value === 'string') return normalizeStr(value) as unknown as T
  if (Array.isArray(value)) return value.map((v) => normalizeDeep(v)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = STRUCTURAL_KEYS.has(k) ? v : normalizeDeep(v)
    }
    return out as T
  }
  return value
}

function keyed<T extends Record<string, unknown>>(items: T[], prefix: string): Array<T & { _key: string }> {
  return items.map((item, i) => ({ _key: `${prefix}-${i}`, ...item }))
}

function buildDoc() {
  const c = PC.calculator
  const m = c.model

  return {
    _id: 'pricingPage',
    _type: 'pricingPage',
    title: 'Pricing Page',
    metaTitle: META_TITLE,
    metaDescription: META_DESCRIPTION,

    hero: {
      eyebrow: PC.hero.eyebrow,
      titleLead: PC.hero.titleLead,
      titleAccent: PC.hero.titleAccent,
      paragraph: PC.hero.paragraph,
      pills: keyed([...PC.hero.pills], 'hero-pill'),
      candidate: {
        name: PC.hero.candidate.name,
        role: PC.hero.candidate.role,
        vettedLabel: PC.hero.candidate.vettedLabel,
        skills: [...PC.hero.candidate.skills],
        flag: PC.hero.candidate.flag,
        image: PC.hero.candidate.image,
        imageAlt: PC.hero.candidate.imageAlt,
      },
    },

    calculator: {
      eyebrow: c.eyebrow,
      titleLead: c.titleLead,
      titleAccent: c.titleAccent,
      devCountLabel: c.devCountLabel,
      countryPrompt: c.countryPrompt,
      regionPrompt: c.regionPrompt,
      currencyPrompt: c.currencyPrompt,
      ceCardTitle: c.ceCardTitle,
      ceLogo: c.ceLogo,
      ceBrand: c.ceBrand,
      localCardTitlePrefix: c.localCardTitlePrefix,
      savingsNote: c.savingsNote,
      ceFootnote: c.ceFootnote,
      localFootnote: c.localFootnote,
      toWord: c.toWord,
      perMonth: c.perMonth,
      thatsPrefix: c.thatsPrefix,
      perHourSuffix: c.perHourSuffix,
      orYearSuffix: c.orYearSuffix,
      saveAvgPrefix: c.saveAvgPrefix,
      saveAvgYearSuffix: c.saveAvgYearSuffix,
      higherCostSuffix: c.higherCostSuffix,
      breakdownShowLabel: c.breakdownShowLabel,
      breakdownHideLabel: c.breakdownHideLabel,
      breakdownEyebrow: c.breakdownEyebrow,
      breakdownIntroPrefix: c.breakdownIntroPrefix,
      breakdownIntroSuffix: c.breakdownIntroSuffix,
      breakdownTotalLabel: c.breakdownTotalLabel,
      breakdownSavedTemplate: c.breakdownSavedTemplate,
      breakdownCta: c.breakdownCta,
      breakdownCtaHref: c.breakdownCtaHref,
      model: {
        regions: keyed(
          m.regions.map((r) => ({
            id: r.id,
            label: r.label,
            monthlyLow: r.ceMonthly[0],
            monthlyHigh: r.ceMonthly[1],
          })),
          'region',
        ),
        countries: keyed(
          m.countries.map((r) => ({
            id: r.id,
            label: r.label,
            flag: r.flag,
            monthlyLow: r.localMonthly[0],
            monthlyHigh: r.localMonthly[1],
          })),
          'country',
        ),
        currencies: keyed([...m.currencies], 'currency'),
        breakdownRole: m.breakdownRole,
        breakdownTotalAmount: m.breakdownTotalAmount,
        hoursPerMonth: m.hoursPerMonth,
      },
    },

    benefits: {
      eyebrow: PC.benefits.eyebrow,
      titleLead: PC.benefits.titleLead,
      titleAccent: PC.benefits.titleAccent,
      cards: keyed([...PC.benefits.cards], 'benefit'),
    },

    fixedFee: { ...PC.fixedFee },

    deRisk: { eyebrow: PC.deRisk.eyebrow, items: [...PC.deRisk.items] },

    glassdoor: { ...PC.glassdoor },

    logoBar: { ...PC.logoBar },

    testimonial: {
      eyebrow: PC.testimonial.eyebrow,
      titleLead: PC.testimonial.titleLead,
      titleAccent: PC.testimonial.titleAccent,
      quote: PC.testimonial.quote,
      stats: keyed([...PC.testimonial.stats], 'testimonial-stat'),
      name: PC.testimonial.name,
      role: PC.testimonial.role,
      caption: PC.testimonial.caption,
      companyLogo: PC.testimonial.companyLogo,
      videoUrl: PC.testimonial.videoUrl,
    },

    faq: {
      eyebrow: PC.faq.eyebrow,
      titleLead: PC.faq.titleLead,
      titleAccent: PC.faq.titleAccent,
      helpEyebrow: PC.faq.helpEyebrow,
      helpBody: PC.faq.helpBody,
      helpCta: PC.faq.helpCta,
      helpCtaHref: PC.faq.helpCtaHref,
      items: keyed([...PC.faq.items], 'faq'),
    },
  }
}

async function main() {
  const doc = normalizeDeep(buildDoc())
  await sanityWriteClient.createOrReplace(doc)
  console.log('Seeded pricingPage singleton (_id: pricingPage).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
