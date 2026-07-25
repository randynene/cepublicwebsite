// MYGRATR-STATIC-1 Step 1b — seed 16 hub singletons + notFoundPage.
//
// Writes:
//   - 7 blog hubs (defineBlogHub shape): blogHub + 6 category hubs
//   - 4 resource hubs (defineCollectionHub shape): videosHub, toolsHub,
//     downloadsHub, eventsHub
//   - 5 collection-index hubs (defineCollectionHub shape): servicesHub,
//     technologyHub, customerStoriesHub, reviewsHub, compareHub
//   - notFoundPage (defineStaticPage shape with sections[] min 1)
//
// Source per hub:
//   - 14 hubs pull from audit-output/pages/<slug>/content.json (h1 →
//     title, metaDescription → heroDescription PT + metaDescription)
//   - 2 hubs (videosHub, staffAugmentationHub) use Jake-authored copy
//     locked at plan-mode close. videosHub schema enforces
//     heroDescription required (defineCollectionHub descriptionRequired:
//     true) — without authored copy the seed would be incomplete.
//
// Locked decisions threaded through:
//   - Hub URL pattern: /<category> (not /blog/<category>) per
//     Amendment #1.
//   - eyebrow populated per category: "Knowledge Hub" for blog
//     categories, "Resources" for resource hubs, empty for blogHub +
//     collection-index hubs.
//   - topicsHeader populated on 7 blog hubs only (defineBlogHub field
//     surface), format "Latest in the <Hub> Hub".
//   - featuredArticles / featuredItems left empty; Seb curates
//     post-seed via Sanity Studio.
//   - introContent left empty; Seb adds post-seed if needed.
//   - notFoundPage uses sections[] with one ctaSection (heading +
//     description + buttonText + buttonLink) per Amendment #2.
//
// Author-voice normalization (Jake's locked rule, persistent memory):
//   - No em dashes (—) or en dashes (–) in ANY seeded text, including
//     text lifted from audit-output sources. normalize() is the visible
//     enforcement point at the top of this file. Every string that
//     reaches Sanity passes through it, including audit-output H1s and
//     metaDescriptions.
//
// Run: `npm run static:seed-hubs`
// Token: SANITY_MIGRATION_WRITE_TOKEN (least-privilege, single-dataset)

import 'dotenv/config'

import fs from 'node:fs'
import path from 'node:path'

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

// Build a single-paragraph PortableText block from plain text. Sanity
// requires _key on every block + child for editor stability.
function ptBlock(text: string, keyPrefix = 'pt'): unknown[] {
  return [
    {
      _type: 'block',
      _key: `${keyPrefix}-b1`,
      style: 'normal',
      markDefs: [],
      children: [
        { _type: 'span', _key: `${keyPrefix}-s1`, text: normalize(text), marks: [] },
      ],
    },
  ]
}

// ────────────────────────────────────────────────────────────────────────
// audit-output reader
// ────────────────────────────────────────────────────────────────────────

const AUDIT_PAGES = path.resolve(
  __dirname,
  '..',
  '..',
  'audit-output',
  'pages',
)

type AuditContent = {
  h1?: string
  metaDescription?: string
  title?: string
}

function readAudit(slug: string): AuditContent | null {
  const file = path.join(AUDIT_PAGES, slug, 'content.json')
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as AuditContent
}

// ────────────────────────────────────────────────────────────────────────
// Jake-authored copy for the 2 hubs without Webflow source
// (locked at plan-mode close 2026-05-15)
// ────────────────────────────────────────────────────────────────────────

const VIDEOS_HUB_COPY = {
  title: 'Video Library',
  eyebrow: 'Resources',
  heroDescriptionText:
    "Watch how Cloud Employee teams actually work. Customer interviews, behind-the-scenes looks at our developer hiring process, and short explainers on offshoring, retention, and embedded engineering. Everything here is real footage from real engagements, no stock, no scripts. Use it to figure out whether what we do fits what you're trying to build.",
  metaTitle: 'Video Library | Cloud Employee',
  metaDescription:
    'Watch customer interviews, hiring process walkthroughs, and explainers on offshore developer teams from Cloud Employee.',
}

const STAFF_AUGMENTATION_HUB_COPY = {
  title: 'Staff Augmentation Knowledge Hub',
  eyebrow: 'Knowledge Hub',
  heroDescriptionText:
    "Everything we've learned about staff augmentation, from the inside. Hiring offshore developers, embedding them into your team, managing retention, and avoiding the traps that turn a 6-month engagement into a 6-week disaster. Written by people who run these engagements every day, not consultants selling a framework. If you're scaling a team and not sure whether to hire, outsource, or augment, start here.",
  metaTitle: 'Staff Augmentation Knowledge Hub | Cloud Employee',
  metaDescription:
    'Practical guides on hiring, embedding, and managing offshore developers from a team that runs these engagements every day.',
}

// ────────────────────────────────────────────────────────────────────────
// Hub specifications (16 hubs)
// ────────────────────────────────────────────────────────────────────────

type HubSpec = {
  id: string
  shape: 'blog' | 'collection'
  auditSlug: string | null
  eyebrow: string
  topicsHeader?: string
  authored?: typeof VIDEOS_HUB_COPY
}

const HUB_SPECS: HubSpec[] = [
  // Blog hubs (7)
  { id: 'blogHub', shape: 'blog', auditSlug: 'blog', eyebrow: '', topicsHeader: 'Latest from the Blog' },
  {
    id: 'staffAugmentationHub',
    shape: 'blog',
    auditSlug: null,
    eyebrow: STAFF_AUGMENTATION_HUB_COPY.eyebrow,
    topicsHeader: 'Latest in the Staff Augmentation Hub',
    authored: STAFF_AUGMENTATION_HUB_COPY,
  },
  {
    id: 'nearshoringOffshoringHub',
    shape: 'blog',
    auditSlug: 'nearshoring-offshoring',
    eyebrow: 'Knowledge Hub',
    topicsHeader: 'Latest in the Nearshoring & Offshoring Hub',
  },
  {
    id: 'scalingTeamsHub',
    shape: 'blog',
    auditSlug: 'scaling-teams',
    eyebrow: 'Knowledge Hub',
    topicsHeader: 'Latest in the Scaling Teams Hub',
  },
  {
    id: 'hiringTipsHub',
    shape: 'blog',
    auditSlug: 'hiring-tips',
    eyebrow: 'Knowledge Hub',
    topicsHeader: 'Latest in the Hiring Tips Hub',
  },
  {
    id: 'managingEngineersHub',
    shape: 'blog',
    auditSlug: 'managing-engineers',
    eyebrow: 'Knowledge Hub',
    topicsHeader: 'Latest in the Managing Engineers Hub',
  },
  {
    id: 'aiInSoftwareDevelopmentHub',
    shape: 'blog',
    auditSlug: 'ai-in-software-development',
    eyebrow: 'Knowledge Hub',
    topicsHeader: 'Latest in the AI in Software Development Hub',
  },
  // Resource hubs (4)
  {
    id: 'videosHub',
    shape: 'collection',
    auditSlug: null,
    eyebrow: VIDEOS_HUB_COPY.eyebrow,
    authored: VIDEOS_HUB_COPY,
  },
  { id: 'toolsHub', shape: 'collection', auditSlug: 'tools', eyebrow: 'Resources' },
  { id: 'downloadsHub', shape: 'collection', auditSlug: 'downloads', eyebrow: 'Resources' },
  { id: 'eventsHub', shape: 'collection', auditSlug: 'events', eyebrow: 'Resources' },
  // Collection-index hubs (5)
  { id: 'servicesHub', shape: 'collection', auditSlug: 'services', eyebrow: '' },
  { id: 'technologyHub', shape: 'collection', auditSlug: 'technology', eyebrow: '' },
  { id: 'customerStoriesHub', shape: 'collection', auditSlug: 'customer-stories', eyebrow: '' },
  { id: 'reviewsHub', shape: 'collection', auditSlug: 'reviews', eyebrow: '' },
  { id: 'compareHub', shape: 'collection', auditSlug: 'compare', eyebrow: '' },
]

// ────────────────────────────────────────────────────────────────────────
// Build hub document
// ────────────────────────────────────────────────────────────────────────

function buildHubDoc(spec: HubSpec): Record<string, unknown> {
  let title: string
  let heroText: string
  let metaTitle: string
  let metaDescription: string

  if (spec.authored) {
    title = spec.authored.title
    heroText = spec.authored.heroDescriptionText
    metaTitle = spec.authored.metaTitle
    metaDescription = spec.authored.metaDescription
  } else {
    if (!spec.auditSlug) {
      throw new Error(`Hub ${spec.id}: no auditSlug and no authored copy`)
    }
    const audit = readAudit(spec.auditSlug)
    if (!audit) {
      throw new Error(`Hub ${spec.id}: audit-output/pages/${spec.auditSlug}/content.json not found`)
    }
    if (!audit.h1) throw new Error(`Hub ${spec.id}: audit content has no h1`)
    if (!audit.metaDescription) {
      throw new Error(`Hub ${spec.id}: audit content has no metaDescription`)
    }
    title = audit.h1
    heroText = audit.metaDescription
    metaTitle = audit.h1
    metaDescription = audit.metaDescription
  }

  const base: Record<string, unknown> = {
    _id: spec.id,
    _type: spec.id, // singleton: _id and _type match per studio/schemas/structure.ts
    title: normalize(title),
    eyebrow: normalize(spec.eyebrow),
    heroDescription: ptBlock(heroText, `${spec.id}-hero`),
    metaTitle: normalize(metaTitle),
    metaDescription: normalize(metaDescription),
  }

  if (spec.shape === 'blog') {
    base.featuredArticles = [] // Seb curates post-seed
    base.topicsHeader = spec.topicsHeader ? normalize(spec.topicsHeader) : ''
  } else {
    base.featuredItems = [] // Seb curates post-seed
  }

  return base
}

// ────────────────────────────────────────────────────────────────────────
// notFoundPage (defineStaticPage shape — sections[] min 1)
// ────────────────────────────────────────────────────────────────────────

const NOT_FOUND_DESCRIPTION = normalize(
  "The page you were looking for has moved, been renamed, or never existed. Try the navigation above or head back to the homepage.",
)

const notFoundPage = {
  _id: 'notFoundPage',
  _type: 'notFoundPage',
  title: normalize('Page not found'),
  eyebrow: '',
  heroDescription: ptBlock(NOT_FOUND_DESCRIPTION, 'nf-hero'),
  sections: [
    {
      _key: 'nf-cta-1',
      _type: 'ctaSection',
      heading: normalize('Looking for something specific?'),
      description: normalize(
        'Head back to the homepage, or explore our services, customer stories, and resources from the navigation above.',
      ),
      buttonText: normalize('Go to homepage'),
      buttonLink: 'https://www.cloudemployee.io/',
    },
  ],
  metaTitle: normalize('Page Not Found | Cloud Employee'),
  // 144 chars, within 140-160 strict bound (publish-time validation).
  metaDescription: normalize(
    "The page you were looking for has moved or no longer exists. Try the navigation above, or head back to the Cloud Employee homepage.",
  ),
  locale: 'default',
}

// ────────────────────────────────────────────────────────────────────────
// run
// ────────────────────────────────────────────────────────────────────────

async function main() {
  const hubDocs = HUB_SPECS.map(buildHubDoc)
  const allDocs = [...hubDocs, notFoundPage]

  for (const doc of allDocs) {
    process.stdout.write(`seed-hubs: writing ${doc._id} ... `)
    await sanityWriteClient.createOrReplace(doc)
    process.stdout.write('OK\n')
  }
  process.stdout.write(`seed-hubs: ${allDocs.length} docs written (16 hubs + 1 404).\n`)
}

main().catch((err) => {
  console.error('seed-hubs: FAILED', err)
  process.exit(1)
})
