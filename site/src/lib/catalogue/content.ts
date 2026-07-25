import 'server-only'

import type { HubFaq } from '@/data/services'
import { urlFor } from '@/lib/sanity/image'
import type { Fold, Service } from '@/types/sanity/documents/service'
import type { SharedServiceFaqs } from '@/types/sanity/documents/shared-service-faqs'
import type { Technology } from '@/types/sanity/documents/technology'

// MYGRATR Phase 2 — Sanity -> CatalogueDetail transform.
//
// Both /services/[slug] and /technology/[slug] render the approved CatalogueDetail
// design (Decision D1). This module maps a Sanity service/technology doc into the
// structured content the design consumes, using the REAL per-page headings from
// Sanity (not fixed decorative copy) and placing EVERY piece of Sanity text so
// nothing is dropped (zero-loss, per Jake's Phase 2 decision):
//
//   Fold 0 headerIntro     -> hero subhead (paragraph) + hero bullets
//                             (its header duplicates the eyebrow + H1, so is not
//                             re-shown)
//   Fold "featureBullets"  -> "Our service" section (label/header/paragraph/bullets)
//   Fold "itemList"        -> the depth / capabilities cards (6 items)
//   Fold "paragraphSection"-> "Why Cloud Employee" section (label/header/paragraph/bullets)
//   Fold "headerOnly"      -> statement band(s)
//   associatedTechnologies -> hero skill pills + "technology coverage" cards (service)
//
// FAQs (two-layer, matches live): a page uses its OWN `faqs` if filled, otherwise
// the shared FAQ singleton. Service default = the three shared groups combined;
// technology default = the shared serviceModel group only.
//
// The transform is data-shaping only; layout lives in the template. It is imported
// by server components, so image URLs are resolved here via urlFor.

export interface CatalogueSection {
  eyebrow?: string
  heading?: string
  paragraph?: string
  bullets: string[]
}

export interface CatalogueItem {
  header?: string
  desc?: string
}

export interface CatalogueStatement {
  eyebrow?: string
  heading: string
}

export interface CatalogueTech {
  name: string
  sub?: string
  slug: string
  logo?: string
}

export interface CatalogueContent {
  name: string
  eyebrow: string
  heroSubhead?: string
  heroBullets: string[]
  skillBadges: string[]
  ourService: CatalogueSection
  capabilities: { eyebrow?: string; heading?: string; items: CatalogueItem[] }
  why: CatalogueSection
  statements: CatalogueStatement[]
  techCoverage: CatalogueTech[]
  faqs: HubFaq[]
  isTechnology: boolean
}

// Fixed hero eyebrow — brand furniture, identical across pages by design (the
// live pages open with this phrase). Fold 0's header repeats it plus the name,
// which the H1 already carries.
const HERO_EYEBROW = 'In-house feel, nearshore'

function clean(v?: string | null): string | undefined {
  const t = v?.trim()
  return t ? t : undefined
}

function cleanList(v?: (string | null)[] | null): string[] {
  if (!Array.isArray(v)) return []
  return v.map((s) => s?.trim()).filter((s): s is string => Boolean(s))
}

// Flatten simple PortableText (single/multi `normal` blocks) to plain text. The
// live data is plain blocks only (no marks/links), so this is lossless. Stega
// edit-metadata lives in the child text nodes and is preserved by concatenation.
function ptToPlain(pt: unknown): string | undefined {
  if (!Array.isArray(pt)) return undefined
  const text = pt
    .map((b) => {
      const block = b as { children?: { text?: string }[] }
      if (!Array.isArray(block.children)) return ''
      return block.children.map((c) => c?.text ?? '').join('')
    })
    .filter((s) => s.length > 0)
    .join('\n\n')
  return text.length > 0 ? text : undefined
}

function firstFold(folds: Fold[], type: Fold['type']): Fold | undefined {
  return folds.find((f) => f.type === type)
}

function sectionFrom(fold: Fold | undefined): CatalogueSection {
  return {
    eyebrow: clean(fold?.label),
    heading: clean(fold?.header),
    paragraph: ptToPlain(fold?.paragraph),
    bullets: cleanList(fold?.bullets),
  }
}

function itemsFrom(fold: Fold | undefined): CatalogueItem[] {
  if (!Array.isArray(fold?.items)) return []
  return fold.items
    .map((it) => ({ header: clean(it.header), desc: clean(it.description) }))
    .filter((it) => it.header || it.desc)
}

function statementsFrom(folds: Fold[]): CatalogueStatement[] {
  const out: CatalogueStatement[] = []
  for (const f of folds) {
    if (f.type !== 'headerOnly') continue
    const heading = clean(f.header)
    if (!heading) continue
    out.push({ eyebrow: clean(f.label), heading })
  }
  return out
}

// A faqItem-shaped entry (question + PortableText answer). Loosely typed so it
// accepts the service override, the technology override, and the shared groups.
type FaqLike = { question?: string | null; answer?: unknown }

// Flatten faqItem[] to the {q, a} plain-text shape the accordion + FAQPage
// JSON-LD consume. Drops any entry missing a question or answer.
function faqsToHubFaqs(items?: FaqLike[] | null): HubFaq[] {
  if (!Array.isArray(items)) return []
  return items
    .map((it) => ({ q: clean(it.question) ?? '', a: ptToPlain(it.answer) ?? '' }))
    .filter((f) => f.q.length > 0 && f.a.length > 0)
}

// Short, pill-friendly labels only (drop full sentences).
function pillsFromItems(items: CatalogueItem[]): string[] {
  return items
    .map((it) => it.header)
    .filter((h): h is string => Boolean(h) && (h as string).length <= 24)
    .slice(0, 5)
}

export function mapServiceToContent(
  service: Service,
  shared?: SharedServiceFaqs | null,
): CatalogueContent {
  const folds = Array.isArray(service.folds) ? service.folds : []
  const intro = firstFold(folds, 'headerIntro')
  const itemList = firstFold(folds, 'itemList')

  // FAQs: this page's own override if filled, else the three shared groups
  // combined (service default = live behaviour).
  const override = faqsToHubFaqs(service.faqs)
  const faqs = override.length > 0
    ? override
    : [
        ...faqsToHubFaqs(shared?.serviceModel),
        ...faqsToHubFaqs(shared?.productBuilds),
        ...faqsToHubFaqs(shared?.consulting),
      ]

  const techCoverage: CatalogueTech[] = (service.associatedTechnologies ?? [])
    .filter((t): t is NonNullable<typeof t> & { slug: string } => Boolean(t?.slug))
    .map((t) => ({
      name: clean(t.name) ?? t.slug,
      sub: clean(t.sub),
      slug: t.slug,
      logo: t.techLogo?.asset ? urlFor(t.techLogo).width(96).height(96).fit('max').url() : undefined,
    }))

  // Hero pills: short tech names (strip the " Developers" suffix), first 5.
  const skillBadges = techCoverage
    .map((t) => t.name.replace(/\s+Developers$/i, '').trim())
    .filter(Boolean)
    .slice(0, 5)

  return {
    name: service.name,
    eyebrow: HERO_EYEBROW,
    heroSubhead: ptToPlain(intro?.paragraph) ?? clean(service.tagline),
    heroBullets: cleanList(intro?.bullets),
    skillBadges,
    ourService: sectionFrom(firstFold(folds, 'featureBullets')),
    capabilities: {
      eyebrow: clean(itemList?.label),
      heading: clean(itemList?.header),
      items: itemsFrom(itemList),
    },
    why: sectionFrom(firstFold(folds, 'paragraphSection')),
    statements: statementsFrom(folds),
    techCoverage,
    faqs,
    isTechnology: false,
  }
}

export function mapTechnologyToContent(
  technology: Technology,
  shared?: SharedServiceFaqs | null,
): CatalogueContent {
  const folds = Array.isArray(technology.folds) ? technology.folds : []
  const intro = firstFold(folds, 'headerIntro')
  const itemList = firstFold(folds, 'itemList')
  const items = itemsFrom(itemList)

  // FAQs: this page's own override if filled, else the shared serviceModel
  // group only (technology default = live behaviour).
  const override = faqsToHubFaqs(technology.faqs)
  const faqs = override.length > 0 ? override : faqsToHubFaqs(shared?.serviceModel)

  return {
    name: technology.technologyName,
    eyebrow: HERO_EYEBROW,
    heroSubhead: ptToPlain(intro?.paragraph) ?? clean(technology.tagline),
    heroBullets: cleanList(intro?.bullets),
    skillBadges: pillsFromItems(items),
    ourService: sectionFrom(firstFold(folds, 'featureBullets')),
    capabilities: {
      eyebrow: clean(itemList?.label),
      heading: clean(itemList?.header),
      items,
    },
    why: sectionFrom(firstFold(folds, 'paragraphSection')),
    statements: statementsFrom(folds),
    techCoverage: [],
    faqs,
    isTechnology: true,
  }
}
