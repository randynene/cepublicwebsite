// Step 10 of MYGRATR-SCHEMA-1. Inserts one schema_designs row per Sanity
// document type (21 rows total) and advances the CE migration from
// schema_running to schema_complete.
//
// The sanity_schema JSONB column stores a curated summary — not a full
// serialisation of the defineType() result. The full schema lives in code
// under studio/schemas/. The Supabase row is a provenance record that
// captures design decisions (required fields, consolidations, notes)
// without trying to replicate the schema's validation functions.
import { assertValidTransition } from '@/lib/pipeline/state-machine'
import { createServerClient } from '@/lib/supabase'

const ORG_ID = 'ce000000-0000-0000-0000-000000000001'
const MIGRATION_ID = 'ce000000-0000-0000-0000-000000000002'

interface SchemaSummary {
  typeName: string
  title: string
  schemaFile: string
  sourceCollections: string[]
  sourceItemCount: number
  fieldCount: number
  requiredFields: string[]
  referenceFields: Array<{ field: string; to: string; filter?: string }>
  notes: string[]
}

interface SchemaDesignRow {
  collection_slug: string
  collection_display_name: string
  sanity_schema: SchemaSummary
  notes: string
}

const ROWS: SchemaDesignRow[] = [
  {
    collection_slug: 'blogs-consolidated',
    collection_display_name: 'Blogs (consolidated from 7 Webflow collections)',
    notes:
      'D1: 7 Webflow blog collections (Blogs & Guides, Staff Augmentation Blogs, Nearshoring & Offshoring, Scaling Teams, Hiring Tips, Managing Engineers, AI in Software Development) consolidate into a single blogPost type with a category reference. 98 items.',
    sanity_schema: {
      typeName: 'blogPost',
      title: 'Blog Post',
      schemaFile: 'studio/schemas/documents/blog-post.ts',
      sourceCollections: [
        'blogs-guides',
        'staff-augmentation-blogs',
        'nearshoring-offshoring-blogs',
        'scaling-teams-blogs',
        'hiring-tips-blogs',
        'managing-engineers-blogs',
        'ai-in-software-development-blogs',
      ],
      sourceItemCount: 98,
      fieldCount: 19,
      requiredFields: ['title', 'slug', 'category', 'tags', 'author', 'date', 'thumbnailImage', 'content', 'metaTitle', 'metaDescription', 'source', 'needsReview', 'locale'],
      referenceFields: [
        { field: 'category', to: 'blogCategory' },
        { field: 'tags[]', to: 'tag', filter: 'category=="blogs"' },
        { field: 'author', to: 'teamMember' },
      ],
      notes: ['12 flat faq fields collapse to faqs[] array (max 6)', 'author is REQUIRED per §7.1/D11', 'openGraphImage optional'],
    },
  },
  {
    collection_slug: 'compare-blogs',
    collection_display_name: 'Compare Blogs',
    notes: 'Same structure as blogPost minus resource-category ref, plus `competitor` string field.',
    sanity_schema: {
      typeName: 'compareBlog',
      title: 'Compare Blog',
      schemaFile: 'studio/schemas/documents/compare-blog.ts',
      sourceCollections: ['compare-blogs'],
      sourceItemCount: 29,
      fieldCount: 18,
      requiredFields: ['title', 'slug', 'tags', 'author', 'date', 'thumbnailImage', 'content', 'metaTitle', 'metaDescription', 'source', 'needsReview', 'locale'],
      referenceFields: [
        { field: 'tags[]', to: 'tag', filter: 'category=="alternatives"' },
        { field: 'author', to: 'teamMember' },
      ],
      notes: ['competitor field parsed from title during migration', 'author REQUIRED'],
    },
  },
  {
    collection_slug: 'technology-pages',
    collection_display_name: 'Technology Pages',
    notes: 'D3/D6/D8: 43 flat fold-related fields collapse into typed folds array. Required metaTitle/metaDescription NEW (Webflow CMS layer gap). JSON-LD faq-schema-2 replaced by structured faqs.',
    sanity_schema: {
      typeName: 'technology',
      title: 'Technology',
      schemaFile: 'studio/schemas/documents/technology.ts',
      sourceCollections: ['technology-pages'],
      sourceItemCount: 101,
      fieldCount: 15,
      requiredFields: ['technologyName', 'slug', 'folds', 'metaTitle', 'metaDescription', 'source', 'needsReview', 'locale'],
      referenceFields: [],
      notes: ['Typed folds[] of FOLD_TYPES enum replaces 34 flat fields', 'metaTitle/metaDescription backfill required', 'faqs[] structured array replaces raw JSON-LD PlainText', 'faq-schema-2 dropped'],
    },
  },
  {
    collection_slug: 'services',
    collection_display_name: 'Services',
    notes: 'D4/D7: same fold restructure as technology. Required metaTitle/metaDescription NEW.',
    sanity_schema: {
      typeName: 'service',
      title: 'Service',
      schemaFile: 'studio/schemas/documents/service.ts',
      sourceCollections: ['services'],
      sourceItemCount: 23,
      fieldCount: 15,
      requiredFields: ['name', 'slug', 'type', 'folds', 'metaTitle', 'metaDescription', 'source', 'needsReview', 'locale'],
      referenceFields: [{ field: 'associatedTechnologies[]', to: 'technology' }],
      notes: ['type enum: staffAugmentation|productBuilds|consultingServices', 'prefix enum: hire|build|expert|endToEnd'],
    },
  },
  {
    collection_slug: 'customer-stories',
    collection_display_name: 'Customer Stories',
    notes: 'D5: video-url-2 dropped (broken data). Problem/Solution/Impact as structured objects with quote subfield.',
    sanity_schema: {
      typeName: 'customerStory',
      title: 'Customer Story',
      schemaFile: 'studio/schemas/documents/customer-story.ts',
      sourceCollections: ['customers-customer-stories'],
      sourceItemCount: 18,
      fieldCount: 24,
      requiredFields: ['customerStoryTitle', 'companyName', 'slug', 'companyLogo', 'metaTitle', 'metaDescription', 'locale'],
      referenceFields: [],
      notes: ['problem/solution/impact use quoteBlock shared object', 'MIGRATION BLOCK: /customer-story/virgin needs meta rewrite'],
    },
  },
  {
    collection_slug: 'team-members',
    collection_display_name: 'Team Members',
    notes: 'Required metaTitle/metaDescription NEW (backfill).',
    sanity_schema: {
      typeName: 'teamMember',
      title: 'Team Member',
      schemaFile: 'studio/schemas/documents/team-member.ts',
      sourceCollections: ['team-members'],
      sourceItemCount: 28,
      fieldCount: 13,
      requiredFields: ['name', 'slug', 'teamMemberImage', 'metaTitle', 'metaDescription', 'locale'],
      referenceFields: [],
      notes: ['Referenced by blogPost.author, compareBlog.author, event.speakers[]'],
    },
  },
  {
    collection_slug: 'reviews',
    collection_display_name: 'Reviews',
    notes: 'featured-in-which-page and webpage-for-testimonial dropped. metaTitle/metaDescription required.',
    sanity_schema: {
      typeName: 'review',
      title: 'Review',
      schemaFile: 'studio/schemas/documents/review.ts',
      sourceCollections: ['reviews'],
      sourceItemCount: 26,
      fieldCount: 14,
      requiredFields: ['nameClient', 'slug', 'metaTitle', 'metaDescription', 'locale'],
      referenceFields: [],
      notes: ['snippetForMeta feeds metaDescription when present'],
    },
  },
  {
    collection_slug: 'videos',
    collection_display_name: 'Videos',
    notes: 'URLs kept as string, not url, to tolerate malformed Vimeo/YouTube values. Tech debt #6: validate post-launch.',
    sanity_schema: {
      typeName: 'video',
      title: 'Video',
      schemaFile: 'studio/schemas/documents/video.ts',
      sourceCollections: ['videos'],
      sourceItemCount: 32,
      fieldCount: 20,
      requiredFields: ['name', 'slug', 'backupImage', 'metaTitle', 'metaDescription', 'locale'],
      referenceFields: [{ field: 'tags[]', to: 'tag', filter: 'category=="videoLibrary"' }],
      notes: ['type enum 3 values, team enum 10 values', 'background+vimeo links as string type for tolerance'],
    },
  },
  {
    collection_slug: 'downloads',
    collection_display_name: 'Downloads',
    notes: 'FAQ 7/8, code-rich-text, you-ll-get-tag 4/5 dropped (0% fill). youllGet array max 5.',
    sanity_schema: {
      typeName: 'download',
      title: 'Download',
      schemaFile: 'studio/schemas/documents/download.ts',
      sourceCollections: ['downloads'],
      sourceItemCount: 5,
      fieldCount: 21,
      requiredFields: ['name', 'slug', 'metaTitle', 'metaDescription', 'locale'],
      referenceFields: [{ field: 'tags[]', to: 'tag', filter: 'category=="downloads"' }],
      notes: ['howToUseIt/theImpact/getItNow as nested objects', 'hubspotFormId string for gated form'],
    },
  },
  {
    collection_slug: 'downloads-access-pages',
    collection_display_name: 'Downloads Access Pages',
    notes: 'noindex route at /download-thank-you/[slug]. Minimal 3-field schema.',
    sanity_schema: {
      typeName: 'downloadAccess',
      title: 'Download Access (Thank-You Page)',
      schemaFile: 'studio/schemas/documents/download-access.ts',
      sourceCollections: ['downloads-access-pages'],
      sourceItemCount: 5,
      fieldCount: 3,
      requiredFields: ['name', 'slug', 'downloadFileLink'],
      referenceFields: [],
      notes: ['No SEO or locale — private lead-magnet route'],
    },
  },
  {
    collection_slug: 'tools-quizzes',
    collection_display_name: 'Tools & Quizzes',
    notes: 'D18: Culture Match parked with placeholder. D3: hiddenCode field added. API key excluded during migration.',
    sanity_schema: {
      typeName: 'tool',
      title: 'Tool / Quiz',
      schemaFile: 'studio/schemas/documents/tool.ts',
      sourceCollections: ['tools-quizzes'],
      sourceItemCount: 2,
      fieldCount: 21,
      requiredFields: ['name', 'slug', 'metaTitle', 'metaDescription', 'locale'],
      referenceFields: [{ field: 'tags[]', to: 'tag', filter: 'category=="tools"' }],
      notes: ['Webflow `blurbs` field maps to metaDescription', 'Culture Match API key NEVER migrates'],
    },
  },
  {
    collection_slug: 'book-a-call-pages',
    collection_display_name: 'Book A Call Pages',
    notes: 'D9: Webflow `title` field is actually meta description. Custom slug source joins firstName+lastName.',
    sanity_schema: {
      typeName: 'bookACall',
      title: 'Book-a-Call Page',
      schemaFile: 'studio/schemas/documents/book-a-call.ts',
      sourceCollections: ['book-a-call-pages'],
      sourceItemCount: 6,
      fieldCount: 6,
      requiredFields: ['firstName', 'lastName', 'slug', 'calendlyEmbed', 'metaTitle', 'metaDescription'],
      referenceFields: [],
      notes: ['No OG, no locale', 'metaTitle NEW — BACKFILL required'],
    },
  },
  {
    collection_slug: 'events-webinars',
    collection_display_name: 'Events & Webinars',
    notes: 'Minimal data (1 item) but full schema preserved; CE will populate future events.',
    sanity_schema: {
      typeName: 'event',
      title: 'Event / Webinar',
      schemaFile: 'studio/schemas/documents/event.ts',
      sourceCollections: ['events-webinars'],
      sourceItemCount: 1,
      fieldCount: 18,
      requiredFields: ['name', 'slug', 'dateTime', 'metaTitle', 'metaDescription', 'locale'],
      referenceFields: [
        { field: 'speakers[]', to: 'teamMember' },
        { field: 'eventType', to: 'tag', filter: 'category=="eventsWebinars"' },
        { field: 'eventCategory[]', to: 'tag', filter: 'category=="eventsWebinars"' },
      ],
      notes: ['topics/signUp as nested objects', 'headerDescriptionPostEvent for post-event variant'],
    },
  },
  {
    collection_slug: 'glassdoor-reviews',
    collection_display_name: 'Glassdoor Reviews',
    notes: 'review-link dropped (0% fill). Consumed by /for-developers and /reviews via glassdoorGrid section.',
    sanity_schema: {
      typeName: 'glassdoorReview',
      title: 'Glassdoor Review',
      schemaFile: 'studio/schemas/documents/glassdoor-review.ts',
      sourceCollections: ['glassdoor-reviews'],
      sourceItemCount: 10,
      fieldCount: 5,
      requiredFields: ['clientName', 'slug'],
      referenceFields: [],
      notes: ['No SEO fields', 'Reference-only consumption'],
    },
  },
  {
    collection_slug: 'client-benefits-company-values',
    collection_display_name: 'Client Benefits & Company Values',
    notes: 'Reference-only — no route. Consumed by benefitsGrid section.',
    sanity_schema: {
      typeName: 'benefitValue',
      title: 'Benefit / Value',
      schemaFile: 'studio/schemas/documents/benefit-value.ts',
      sourceCollections: ['client-benefits-company-values'],
      sourceItemCount: 9,
      fieldCount: 5,
      requiredFields: ['name', 'slug', 'category'],
      referenceFields: [],
      notes: ['category enum: benefits|values'],
    },
  },
  {
    collection_slug: 'staff-benefits',
    collection_display_name: 'Staff Benefits',
    notes: 'Reference-only — consumed by staffBenefitsGrid on /for-developers.',
    sanity_schema: {
      typeName: 'staffBenefit',
      title: 'Staff Benefit',
      schemaFile: 'studio/schemas/documents/staff-benefit.ts',
      sourceCollections: ['staff-benefits'],
      sourceItemCount: 6,
      fieldCount: 3,
      requiredFields: ['name', 'slug'],
      referenceFields: [],
      notes: [],
    },
  },
  {
    collection_slug: 'tags-consolidated',
    collection_display_name: 'Tags (consolidated from 6 Webflow collections)',
    notes: 'D2: 6 Tags collections (Blogs/Alternatives/Tools & Quizzes/Video Library/Downloads/Events & Webinars) consolidate with a category enum. 22 items.',
    sanity_schema: {
      typeName: 'tag',
      title: 'Tag',
      schemaFile: 'studio/schemas/documents/tag.ts',
      sourceCollections: [
        'tags-blogs',
        'tags-alternatives',
        'tags-tools-quizzes',
        'tags-video-library',
        'tags-downloads',
        'tags-events-webinars',
      ],
      sourceItemCount: 22,
      fieldCount: 4,
      requiredFields: ['name', 'slug', 'category'],
      referenceFields: [],
      notes: ['category enum 6 values', 'singularName only populated for eventsWebinars'],
    },
  },
  {
    collection_slug: 'hubs',
    collection_display_name: 'Hubs (blog categories)',
    notes: 'D13: Webflow -- Hubs metadata becomes blogCategory. Landing-page content moves to 7 blogHub-family singletons.',
    sanity_schema: {
      typeName: 'blogCategory',
      title: 'Blog Category',
      schemaFile: 'studio/schemas/documents/blog-category.ts',
      sourceCollections: ['hubs'],
      sourceItemCount: 6,
      fieldCount: 3,
      requiredFields: ['name', 'slug'],
      referenceFields: [],
      notes: ['Order field optional, set in Studio post-migration'],
    },
  },
  {
    collection_slug: 'industry-placeholder',
    collection_display_name: 'Industry (NEW — AI-search placeholder)',
    notes: 'D10: Empty schema ready for programmatic Beem/Claude Code population post-launch. Route: /industry/[slug].',
    sanity_schema: {
      typeName: 'industry',
      title: 'Industry',
      schemaFile: 'studio/schemas/documents/industry.ts',
      sourceCollections: [],
      sourceItemCount: 0,
      fieldCount: 12,
      requiredFields: ['name', 'slug', 'folds', 'metaTitle', 'metaDescription', 'source', 'needsReview', 'locale'],
      referenceFields: [],
      notes: ['Uses shared landing-page-factory (identical shape to persona, location)'],
    },
  },
  {
    collection_slug: 'persona-placeholder',
    collection_display_name: 'Persona (NEW — AI-search placeholder)',
    notes: 'D10: Empty schema. Identical structure to industry. Route: /persona/[slug].',
    sanity_schema: {
      typeName: 'persona',
      title: 'Persona',
      schemaFile: 'studio/schemas/documents/persona.ts',
      sourceCollections: [],
      sourceItemCount: 0,
      fieldCount: 12,
      requiredFields: ['name', 'slug', 'folds', 'metaTitle', 'metaDescription', 'source', 'needsReview', 'locale'],
      referenceFields: [],
      notes: ['Uses shared landing-page-factory'],
    },
  },
  {
    collection_slug: 'location-placeholder',
    collection_display_name: 'Location (NEW — AI-search placeholder)',
    notes: 'D10: Empty schema. Identical structure to industry. Route: /location/[slug].',
    sanity_schema: {
      typeName: 'location',
      title: 'Location',
      schemaFile: 'studio/schemas/documents/location.ts',
      sourceCollections: [],
      sourceItemCount: 0,
      fieldCount: 12,
      requiredFields: ['name', 'slug', 'folds', 'metaTitle', 'metaDescription', 'source', 'needsReview', 'locale'],
      referenceFields: [],
      notes: ['Uses shared landing-page-factory'],
    },
  },
]

async function main(): Promise<void> {
  const supabase = createServerClient()

  console.log(`Inserting ${ROWS.length} schema_designs rows for migration ${MIGRATION_ID}...`)

  for (const row of ROWS) {
    const { error } = await supabase.from('schema_designs').insert({
      org_id: ORG_ID,
      migration_id: MIGRATION_ID,
      collection_slug: row.collection_slug,
      collection_display_name: row.collection_display_name,
      sanity_schema: row.sanity_schema,
      version: 1,
      status: 'approved',
      specialist_reviewed: false,
      notes: row.notes,
    })

    if (error) {
      console.error(`[FAIL] ${row.collection_slug}: ${error.message}`)
      process.exit(1)
    }
    console.log(`[ok]   ${row.collection_slug} → ${row.sanity_schema.typeName}`)
  }

  console.log('\nAll 21 schema_designs rows inserted. Advancing migration status...')

  const { data: current, error: fetchError } = await supabase
    .from('migrations')
    .select('status, metadata')
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)
    .single()

  if (fetchError) throw new Error(`Fetch migration failed: ${fetchError.message}`)

  assertValidTransition(current.status, 'schema_complete')

  const existingMetadata = (current.metadata as Record<string, unknown>) ?? {}

  const { error: updateError } = await supabase
    .from('migrations')
    .update({
      status: 'schema_complete',
      current_phase: 'schema_complete',
      metadata: {
        ...existingMetadata,
        schema_phase: {
          document_types: 21,
          singletons: 31,
          globals: 3,
          objects: 16,
          completed_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', MIGRATION_ID)
    .eq('org_id', ORG_ID)

  if (updateError) throw new Error(`Update migration failed: ${updateError.message}`)

  console.log(`Transitioned: ${current.status} → schema_complete`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
