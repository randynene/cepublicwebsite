// One-shot read-only diagnostic — surfaces Sanity Studio "Invalid property
// value" cases across the 6 CONTENT-1D in-scope doc types.
//
// Studio's "Invalid property value — Reset value" message fires when a
// field holds a JS primitive type that doesn't match the schema's
// declared type (e.g. schema says `string`, doc holds object/array).
// This script walks every doc's fields and asserts the JS shape against
// an expected primitive map per type.
//
// Skips "missing required" cases — every in-scope doc is expected to be
// missing metaTitle/metaDescription pre-Step-5; that's not a validity
// issue, that's the backfill scope.
//
// No writes. Read-only.
import { sanityWriteClient } from '@/lib/content/sanity-write-client'

type Primitive = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'image' | 'slug' | 'reference' | 'portableText' | 'datetime' | 'url'

// Map of declared primitive expectations per type per top-level field.
// Sourced from studio/schemas/documents/*.ts. portableText and image both
// have an array/object representation we accept; this map is structural
// only — value validity (e.g. 60-char metaTitle) is not in scope.
//
// `string` accepts JS string OR null/undefined (only invalid if non-string).
// `slug` accepts {current, _type?}. `reference` accepts {_ref, _type}.
// `portableText` accepts an array. `image` accepts {asset, ...}. `url`
// accepts a string. `datetime` accepts an ISO string.
const FIELD_TYPES: Record<string, Record<string, Primitive>> = {
  customerStory: {
    customerStoryTitle: 'string',
    companyName: 'string',
    slug: 'slug',
    order: 'number',
    featureInHomeHeader: 'boolean',
    featureInFeaturedCustomers: 'boolean',
    featuredOnCustomerStoriesPage: 'boolean',
    companyLogo: 'image',
    companyProductImage: 'image',
    companyPeopleImage: 'image',
    thumbnail: 'image',
    videoUrl: 'url',
    videoIntroContent: 'portableText',
    tldrContent: 'portableText',
    hiringNeedsTable: 'portableText',
    theCustomerContent: 'portableText',
    problem: 'object',
    solution: 'object',
    impact: 'object',
    ctaContent: 'portableText',
    reviewSnippetForMeta: 'string',
    metaTitle: 'string',
    metaDescription: 'string',
    locale: 'string',
  },
  teamMember: {
    name: 'string',
    slug: 'slug',
    order: 'number',
    position: 'string',
    teamMemberImage: 'image',
    aboutContent: 'portableText',
    timeAtCloudEmployee: 'string',
    areasOfExpertise: 'portableText',
    linkedinLink: 'url',
    bookACallLink: 'url',
    hideFromTeamAboutPage: 'boolean',
    metaTitle: 'string',
    metaDescription: 'string',
    locale: 'string',
  },
  review: {
    nameClient: 'string',
    slug: 'slug',
    position: 'string',
    order: 'number',
    testimonyShort: 'string',
    testimonyParagraph: 'portableText',
    testimonyFullPage: 'portableText',
    snippetForMeta: 'string',
    memberImage: 'image',
    companyLogo: 'image',
    thumbnailImage: 'image',
    additionalInfo: 'portableText',
    metaTitle: 'string',
    metaDescription: 'string',
    locale: 'string',
  },
  bookACall: {
    firstName: 'string',
    lastName: 'string',
    slug: 'slug',
    calendlyEmbed: 'portableText',
    metaTitle: 'string',
    metaDescription: 'string',
  },
  technology: {
    technologyName: 'string',
    slug: 'slug',
    order: 'number',
    shortLabel: 'string',
    techLogo: 'image',
    listItemOnly: 'boolean',
    thumbnail: 'image',
    folds: 'array',
    metaTitle: 'string',
    metaDescription: 'string',
    openGraphImage: 'image',
    faqs: 'array',
    source: 'string',
    generatedAt: 'datetime',
    needsReview: 'boolean',
    locale: 'string',
  },
  service: {
    name: 'string',
    slug: 'slug',
    order: 'number',
    type: 'string',
    prefix: 'string',
    aiOffering: 'boolean',
    location: 'boolean',
    shortLabel: 'string',
    thumbnail: 'image',
    associatedTechnologies: 'array',
    folds: 'array',
    metaTitle: 'string',
    metaDescription: 'string',
    openGraphImage: 'image',
    source: 'string',
    generatedAt: 'datetime',
    needsReview: 'boolean',
    locale: 'string',
  },
}

const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
const SYSTEM_KEYS = new Set(['_id', '_type', '_createdAt', '_updatedAt', '_rev', '_key'])

type Issue = { docId: string; docType: string; field: string; expected: Primitive; actual: string; valuePreview: string }

function actualPrimitive(v: unknown): { kind: string; preview: string } {
  if (v === null) return { kind: 'null', preview: 'null' }
  if (v === undefined) return { kind: 'undefined', preview: 'undefined' }
  if (Array.isArray(v)) return { kind: 'array', preview: `array(${v.length})` }
  if (typeof v === 'object') {
    const keys = Object.keys(v as Record<string, unknown>)
    return { kind: 'object', preview: `object{${keys.slice(0, 5).join(',')}}` }
  }
  if (typeof v === 'string') {
    return { kind: 'string', preview: v.length > 40 ? `"${v.slice(0, 40)}…"` : `"${v}"` }
  }
  return { kind: typeof v, preview: String(v) }
}

function checkField(value: unknown, expected: Primitive): boolean {
  if (value === null || value === undefined) return true // missing is not invalid
  switch (expected) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number'
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && !Array.isArray(value)
    case 'slug':
      return typeof value === 'object' && !Array.isArray(value) && typeof (value as Record<string, unknown>).current === 'string'
    case 'reference':
      return typeof value === 'object' && !Array.isArray(value) && typeof (value as Record<string, unknown>)._ref === 'string'
    case 'portableText':
      return Array.isArray(value)
    case 'image':
      return typeof value === 'object' && !Array.isArray(value) && (value as Record<string, unknown>).asset != null
    case 'datetime':
      return typeof value === 'string' && ISO_DATETIME_RE.test(value)
    case 'url':
      return typeof value === 'string'
    default:
      return false
  }
}

async function scanType(type: string): Promise<Issue[]> {
  const fieldMap = FIELD_TYPES[type]
  if (!fieldMap) throw new Error(`No field map for type: ${type}`)
  const docs = await sanityWriteClient.fetch<Array<Record<string, unknown>>>(
    `*[_type == $type && !(_id match "smoke-test-*")]`,
    { type },
  )
  const issues: Issue[] = []
  for (const doc of docs) {
    const docId = String(doc._id)
    for (const [field, expected] of Object.entries(fieldMap)) {
      const value = doc[field]
      if (!checkField(value, expected)) {
        const a = actualPrimitive(value)
        issues.push({
          docId,
          docType: type,
          field,
          expected,
          actual: a.kind,
          valuePreview: a.preview,
        })
      }
    }
    // Also flag any unexpected top-level keys with non-primitive shape
    // that suggest a renamed/orphan field (e.g. an object stored where
    // the schema has nothing). Skip system + known fields.
    for (const k of Object.keys(doc)) {
      if (SYSTEM_KEYS.has(k)) continue
      if (k in fieldMap) continue
      const v = doc[k]
      // Only surface if the value is non-trivial (object/array). Plain
      // primitives in unmapped keys are usually inert legacy data.
      if (v !== null && (typeof v === 'object' || Array.isArray(v))) {
        const a = actualPrimitive(v)
        issues.push({
          docId,
          docType: type,
          field: k,
          expected: 'string', // placeholder — unmapped
          actual: `unmapped(${a.kind})`,
          valuePreview: a.preview,
        })
      }
    }
  }
  return issues
}

async function main(): Promise<void> {
  console.log('=== CONTENT-1D in-scope validation scan (read-only) ===\n')

  // First: targeted look at the Willo customerStory doc Jake flagged.
  console.log('--- Willo customerStory inspection ---')
  const willo = await sanityWriteClient.fetch<Record<string, unknown> | null>(
    `*[_type == "customerStory" && (slug.current == "willo" || lower(companyName) == "willo")][0]`,
  )
  if (!willo) {
    console.log('  No customerStory matched slug=willo or companyName=Willo')
  } else {
    console.log(`  _id=${willo._id}`)
    for (const [k, v] of Object.entries(willo)) {
      if (SYSTEM_KEYS.has(k)) continue
      const a = actualPrimitive(v)
      console.log(`    ${k.padEnd(30)} ${a.kind.padEnd(12)} ${a.preview}`)
    }
  }
  console.log('')

  // Now: full scan across all 6 in-scope types.
  const allIssues: Issue[] = []
  for (const type of Object.keys(FIELD_TYPES)) {
    const issues = await scanType(type)
    console.log(`${type}: ${issues.length} issue${issues.length === 1 ? '' : 's'}`)
    allIssues.push(...issues)
  }
  console.log('')

  if (allIssues.length === 0) {
    console.log('=== NO TYPE MISMATCHES FOUND ===')
    return
  }

  console.log('=== ISSUES BY (type, field) ===\n')
  const grouped = new Map<string, Issue[]>()
  for (const i of allIssues) {
    const key = `${i.docType}.${i.field}`
    const list = grouped.get(key) ?? []
    list.push(i)
    grouped.set(key, list)
  }
  for (const [key, list] of [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const exemplar = list[0]
    console.log(
      `${key} (${list.length} doc${list.length === 1 ? '' : 's'}) — expected=${exemplar.expected}, actual=${exemplar.actual}`,
    )
    for (const i of list.slice(0, 5)) {
      console.log(`    ${i.docId.padEnd(50)} value=${i.valuePreview}`)
    }
    if (list.length > 5) console.log(`    … +${list.length - 5} more`)
  }
  console.log('')
  console.log(`=== ${allIssues.length} total field issues across ${grouped.size} (type, field) groups ===`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
