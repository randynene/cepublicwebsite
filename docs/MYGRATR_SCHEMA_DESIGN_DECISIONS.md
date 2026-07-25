# MYGRATR_SCHEMA_DESIGN_DECISIONS

Lock document for all Sanity schema design decisions for the Cloud Employee migration. Every decision here is grounded in `docs/CE_SITE_TRUTH.md` and the investigation outputs in `docs/investigations-2026-04-23/`. This document is the authoritative input to the MYGRATR-SCHEMA-1 session brief.

**Status:** LOCKED (2026-04-23). Changes require explicit revision and version bump.
**Version:** v1.2
**Revision history:**
- v1.0 (2026-04-23): Initial lock.
- v1.1 (2026-04-23): Surgical corrections from `docs/SCHEMA_DECISIONS_AUDIT_REPORT.md`. Fixes: B1 (doc type count), B2 (taxonomy count), B3 (fold field count), B4 (video URL field types), B5 (soft-404 handling), D1 (Legal pages mapping — new §7.14), D2 (Webflow name rule — new §7.13), D3 (hiddenCode field added to tool schema), D4 (653 Webflow redirects — §8 expanded with verification strategy). No structural changes.
- v1.2 (2026-04-23): Surgical corrections from `docs/SCHEMA_DECISIONS_AUDIT_REPORT_V2.md`. Fixes: NEW-1 (residual "40 flat fields" at §3.4 line 148 corrected to "34 flat fold-related fields"), D4 caveat (§8 updated to reference completed `redirects-verification.md` with locked 318-rule preservation strategy instead of deferring verification to CONTENT-1). No structural changes.
**Next phase:** MYGRATR-SCHEMA-1 (write Sanity schemas per the specifications below)

---

## 1. GUIDING PRINCIPLES

Every schema decision was evaluated against these four constraints in order:

1. **Preserve what's live today.** 602 indexable URLs, existing SEO equity, existing conversion tracking. Migration cannot lose any of it.
2. **Give Seb an editing experience equal to or better than Webflow.** Presentation Tool, sensible field names, clean Studio structure, singletons for static pages.
3. **Make programmatic content generation trivial.** Every schema is populatable via Sanity's API. Consistent structure across similar document types. Source tracking fields on content that may be AI-generated.
4. **Be reusable for customer 2 (Mygratr productisation).** Nothing CE-specific in the schema primitives. Document type names are generic where possible.

Any conflict between these principles is resolved in favour of the earlier principle.

---

## 2. THREE-TIER PAGE ARCHITECTURE

All pages on the site map to exactly one of these three tiers. No page belongs to more than one tier.

### Tier 1 — CMS Document Types
Content that has many instances (blog posts, technology pages, services, etc.) or will scale over time. Each instance is a Sanity document. Routes are generated from the document slug.

### Tier 2 — Singleton Documents
Unique pages that need editorial flexibility but exist once. Each is a Sanity document of a dedicated singleton type. Routes are fixed in Next.js and bound to the singleton document.

### Tier 3 — Hardcoded Next.js Routes with Sanity Marketing Copy
Pages that contain embedded calculators, tools, or interactive logic. The logic is hardcoded in Next.js. The surrounding marketing copy lives in a Sanity singleton. Seb edits the copy; the tool logic is a developer change.

Full routing table in Section 10.

---

## 3. CMS COLLECTION DECISIONS (Tier 1)

33 Webflow collections consolidate into 21 Sanity document types (16 core CMS types + 2 supporting embedded types + 3 AI-search placeholders), plus ~30 singletons defined in Section 4. Every consolidation is documented with rationale.

### 3.1 Blog consolidation

**Decision:** All 7 blog collections consolidate into one `blogPost` document type with a `category` field.

**Source collections:**
- Blogs & Guides (31 items)
- Staff Augmentation Blogs (28 items)
- Nearshoring & Offshoring Blogs (13 items)
- Scaling Teams Blogs (9 items)
- Hiring Tips Blogs (7 items)
- Managing Engineers Blogs (7 items)
- AI in Software Development Blogs (3 items)

**Total migrated items:** 98

**Rationale:** All 7 have identical 26-field structures per CE_SITE_TRUTH.md Section 1. One schema, one editing experience, one content migration script. The category field drives URL routing (`/[category-slug]/[post-slug]`) and blog hub filtering.

**Excluded from consolidation:**
- `New Blog Templates` collection — NOT MIGRATED. Confirmed by Jake as a Webflow design experiment that is not live. Replaced in Next.js by an auto-generated table of contents feature on the `blogPost` template (see Section 7.3).

**`blogPost` schema fields:**
```
title: string (required, max 160 chars) — maps to Webflow `name`
slug: slug (required, unique) — maps to Webflow `slug`
category: reference → blogCategory (required) — replaces `resource-category` hub reference
tags: array[reference → tag] (required) — maps to Webflow `tags`
author: reference → teamMember (REQUIRED, see Section 7.1)
date: date (required) — maps to Webflow `date`
thumbnailImage: image (required)
openGraphImage: image (optional) — maps to `open-graph-wide-image`
tldrSection: array[portableText block] (optional) — maps to `tldr-section`
content: array[portableText block] (required) — maps to `content`
resourceDescription: text (optional, max 300 chars)
featured: boolean (default false)
metaTitle: string (required, max 60 chars)
metaDescription: string (required, 140-160 chars)
faqs: array[{question: string, answer: array[portableText]}] (optional, max 6)
source: string enum [manual, beem, claude_code, imported] (default 'manual')
generatedAt: datetime (optional)
needsReview: boolean (default false)
locale: string enum [default, uk] (default 'default')
```

**Deprecated fields:** `faq-title-1` through `faq-title-6` and `faq-content-1` through `faq-content-6` collapse to a single `faqs` array. Migration script extracts the 12 fields and packs them into the array.

### 3.2 Taxonomy consolidation

**Decision:** All 6 taxonomy collections consolidate into one `tag` document type with a `category` field.

**Source collections:**
- Tags >> Blogs (8 items)
- Tags >> Alternatives (4 items)
- Tags >> Tools & Quizzes (3 items)
- Tags >> Video Library (3 items)
- Tags >> Downloads (2 items)
- Tags >> Events & Webinars (2 items)

**Total migrated items:** 22

**`tag` schema fields:**
```
name: string (required, max 100 chars)
slug: slug (required, unique within category)
category: string enum [blogs, alternatives, tools, videoLibrary, downloads, eventsWebinars] (required)
singularName: string (optional) — only used by eventsWebinars category
```

### 3.3 Blog categories

**Decision:** New `blogCategory` document type replaces the Webflow `-- Hubs` collection entirely.

**Source collection:** `-- Hubs` (6 items)

**`blogCategory` schema fields:**
```
name: string (required) — e.g. "Scaling Teams", "Hiring Tips"
slug: slug (required, unique) — e.g. "scaling-teams"
order: number (optional) — for nav ordering
```

**Rationale:** Hubs in Webflow served as category metadata for blog posts AND linked to a static page. In Sanity we separate these concerns: `blogCategory` handles the metadata and slug; the hub landing page content lives in a `blogHub` singleton (see Section 4.1). This separation makes adding a new category trivial: create one `blogCategory` document and one `blogHub` singleton.

### 3.4 Technology Pages

**Decision:** Migrate as `technology` document type. Keep the 43-field structure but restructure into a `folds` array of typed objects for cleaner editing.

**Source collection:** Technology Pages (101 items)

**Critical finding from CE_SITE_TRUTH.md:** Technology Pages has no `meta-description` field at the CMS layer. SEO metadata is currently in Webflow's template SEO settings, not the CMS. This is a critical gap that must be fixed in the migration.

**`technology` schema fields:**
```
technologyName: string (required, max 100 chars) — maps to `technology-name`
slug: slug (required, unique)
order: number (optional)
shortLabel: string (optional, max 100 chars) — maps to `short-description`
techLogo: image (optional)
listItemOnly: boolean (default false)
thumbnail: image (optional)

# FOLDS as typed array (replaces 34 flat fold-related fields)
folds: array[fold] (required)

# SEO — NEW FIELDS (fix for CMS gap)
metaTitle: string (required, max 60 chars)  # NEW — backfill from live page <title>
metaDescription: string (required, 140-160 chars)  # NEW — backfill from live page <meta>
openGraphImage: image (optional)

# Structured data — replaces broken faq-schema-2 PlainText field
faqs: array[{question: string, answer: array[portableText]}] (optional, max 6)

# Programmatic content tracking
source: string enum [manual, beem, claude_code, imported] (default 'manual')
generatedAt: datetime (optional)
needsReview: boolean (default false)
locale: string enum [default, uk] (default 'default')
```

**Fold structure (typed object):**
```
fold: {
  type: string enum [headerIntro, featureBullets, itemList, paragraphSection, headerOnly],
  label: string (optional),
  header: string (optional),
  paragraph: array[portableText] (optional),
  bullets: array[string] (optional, max 6),
  items: array[{header: string, description: string}] (optional, max 6),
  featuredImage: image (optional)
}
```

**Rationale for fold restructure:** The existing 43 flat fields (Fold 1 Header Pre, Fold 1 Paragraph, Fold 1 Bullet 1/2/3, Fold 1 Featured Image, Fold 2 Label, Fold 2 Header, Fold 2 Paragraph, ... through Fold 6) are the same handful of patterns repeated. An array of typed folds handles all of this with fewer fields. Seb edits them as repeatable blocks in Studio. New fold types can be added without schema changes.

**Migration handling:** Migration script reads the 34 fold-related fields (Technology Pages has 43 total fields; 9 are non-fold: name, slug, list-item-only, technology-name, order, short-description, tech-logo, thumbnail, faq-schema-2), identifies which folds are populated (per the fill-rate data in field-population-summary), packs each into a fold object with the right type, and appends to the array in order.

**JSON-LD FAQ schema:** The `faq-schema-2` PlainText field currently stores raw JSON-LD string on 5% of items. In Sanity this becomes a proper `faqs` array. JSON-LD is generated server-side at render time from the array.

### 3.5 Services

**Decision:** Migrate as `service` document type. Same fold restructure as Technology. Add meta description (missing in Webflow schema).

**Source collection:** Services (23 items)

**`service` schema fields:**
```
name: string (required, max 100 chars)
slug: slug (required, unique)
order: number (optional)
type: string enum [staffAugmentation, productBuilds, consultingServices] (required)
prefix: string enum [hire, build, expert, endToEnd] (optional)
aiOffering: boolean (default false)
location: boolean (default false)
shortLabel: string (optional, max 100 chars)
thumbnail: image (optional)
associatedTechnologies: array[reference → technology] (optional)

# FOLDS as typed array — same pattern as technology
folds: array[fold] (required)

# SEO — NEW FIELDS
metaTitle: string (required, max 60 chars)  # NEW — backfill
metaDescription: string (required, 140-160 chars)  # NEW — backfill
openGraphImage: image (optional)

# Programmatic tracking
source: string enum [manual, beem, claude_code, imported] (default 'manual')
generatedAt: datetime (optional)
needsReview: boolean (default false)
locale: string enum [default, uk] (default 'default')
```

### 3.6 Customer Stories

**Decision:** Migrate as `customerStory` document type. Consolidate the two video fields into one. Add meta description.

**Source collection:** Customers / Customer Stories (18 items)

**`video-url-2` decision:** DROPPED. Investigation-2 confirmed only 2 items have it populated and both are malformed YouTube embed URLs that are likely broken on the live site. The real video field is `video-testimonial-if-available`. Migration script moves that value into a single `videoUrl` field and ignores `video-url-2`.

**`customerStory` schema fields:**
```
customerStoryTitle: string (required, max 160 chars)
companyName: string (required)
slug: slug (required, unique)
order: number (optional)
featureInHomeHeader: boolean (default false)
featureInFeaturedCustomers: boolean (default false)
featuredOnCustomerStoriesPage: boolean (default false)

companyLogo: image (required)
companyProductImage: image (optional)
companyPeopleImage: image (optional)
thumbnail: image (optional)

videoUrl: url (optional) — consolidates video-testimonial-if-available
videoIntroContent: array[portableText] (optional)

tldrContent: array[portableText] (optional)
hiringNeedsTable: array[portableText] (optional)
theCustomerContent: array[portableText] (optional)

# PROBLEM / SOLUTION / IMPACT as structured objects
problem: {
  content: array[portableText],
  quote: {
    paragraph: string,
    personImage: image,
    personName: string,
    personTitle: string
  }
}
solution: {
  content: array[portableText],
  quote: { paragraph: string, personImage: image, personName: string, personTitle: string }
}
impact: {
  content: array[portableText],
  quote: { paragraph: string, personImage: image, personName: string, personTitle: string }
}

ctaContent: array[portableText] (optional)
reviewSnippetForMeta: text (optional) — maps to `review-snippet-for-google-meta`

# SEO
metaTitle: string (required, max 60 chars)  # NEW — backfill
metaDescription: string (required, 140-160 chars)  # NEW — backfill. MIGRATION BLOCK: /customer-story/virgin has placeholder text "Customer story in progress..." — flag for CE to rewrite before launch.
openGraphImage: image (optional)

locale: string enum [default, uk] (default 'default')
```

### 3.7 Team Members

**Decision:** Migrate as `teamMember`. Add meta description field.

**Source collection:** Team Members (28 items)

**`teamMember` schema fields:**
```
name: string (required, max 100 chars)
slug: slug (required, unique)
order: number (optional)
position: string (optional)
teamMemberImage: image (required)
aboutContent: array[portableText] (optional)
timeAtCloudEmployee: string (optional)
areasOfExpertise: array[portableText] (optional)
linkedinLink: url (optional)
bookACallLink: url (optional)
hideFromTeamAboutPage: boolean (default false)

# SEO — NEW FIELDS
metaTitle: string (required, max 60 chars)  # NEW
metaDescription: string (required, 140-160 chars)  # NEW

locale: string enum [default, uk] (default 'default')
```

### 3.8 Reviews

**Decision:** Migrate as `review`. Drop the "Featured in which page?" option field (legacy, replaced by explicit references from pages). Drop the "Webpage for testimonial (No Longer Used)" field.

**Source collection:** Reviews (26 items)

**`review` schema fields:**
```
nameClient: string (required, max 100 chars)
slug: slug (required, unique)
position: string (optional)
order: number (optional)

testimonyShort: text (optional)
testimonyParagraph: array[portableText] (optional)
testimonyFullPage: array[portableText] (optional)
snippetForMeta: string (optional, max 300 chars) — becomes metaDescription source

memberImage: image (optional)
companyLogo: image (optional)
thumbnailImage: image (optional)
additionalInfo: array[portableText] (optional)

# SEO
metaTitle: string (required, max 60 chars)  # NEW — derive from snippetForMeta or backfill
metaDescription: string (required, 140-160 chars) — prefer existing snippetForMeta

locale: string enum [default, uk] (default 'default')
```

### 3.9 Videos

**Decision:** Migrate as `video`. Preserve all existing fields.

**Source collection:** Videos (32 items)

**`video` schema fields:**
```
name: string (required, max 160 chars)
slug: slug (required, unique)
label: string (optional, max 100 chars)
type: string enum [firesideChats, workingWithUs, interviews] (optional)
team: string enum [talentSuccess, clientSuccess, peopleAndCulture, engineering, leadership, talentRecruitment, technicalVetting, hrComplianceLegal, learningDevelopment, employeeExperience] (optional)
order: number (optional)
featured: boolean (default false)

mainVideoEmbedLink: url (optional)
backgroundVideoPreviewLink: string (optional) — Webflow type is PlainText; preserved as string to avoid migration failures on malformed values. Validate/normalise post-launch.
vimeoYoutubeStandardLink: string (optional) — same reasoning as above
backupImage: image (required)

descriptionOfVideo: array[portableText] (optional)
fullVideoTranscript: array[portableText] (optional)
linksMentionedInVideo: array[portableText] (optional)
linkedinProfilesOfSpeakersInVideo: array[portableText] (optional)

tags: array[reference → tag (category: videoLibrary)] (optional)

# SEO
metaTitle: string (required, max 60 chars)  # NEW
metaDescription: string (required, 140-160 chars) — maps to existing field

locale: string enum [default, uk] (default 'default')
```

### 3.10 Compare Blogs

**Decision:** Migrate as `compareBlog`. Identical structure to `blogPost` minus the `resource-category` reference, plus a `competitor` field for structured competitor metadata.

**Source collection:** Compare Blogs (29 items)

**`compareBlog` schema fields:**
```
title: string (required, max 160 chars)
slug: slug (required, unique)
competitor: string (optional) — e.g. "Turing", "Toptal" — extracted from title
tags: array[reference → tag (category: alternatives)] (required)
author: reference → teamMember (REQUIRED)
date: date (required)
featured: boolean (default false)

thumbnailImage: image (required)
openGraphImage: image (optional)
tldrSection: array[portableText] (optional)
content: array[portableText] (required)
resourceDescription: text (optional, max 300 chars)

faqs: array[{question: string, answer: array[portableText]}] (optional, max 6)

metaTitle: string (required, max 60 chars)
metaDescription: string (required, 140-160 chars)

source: string enum [manual, beem, claude_code, imported] (default 'manual')
generatedAt: datetime (optional)
needsReview: boolean (default false)
locale: string enum [default, uk] (default 'default')
```

### 3.11 Downloads

**Decision:** Migrate as `download`. Drop the 8 unused FAQ 7/8 fields (0% fill rate). Drop `code-rich-text` (0% fill rate). Drop `you-ll-get-tag--4-2` and `you-ll-get-tag--5-2` (0% fill rate).

**Source collection:** Downloads (5 items)

**`download` schema fields:**
```
name: string (required, max 160 chars)
slug: slug (required, unique)
title: string (optional, max 160 chars)
featured: boolean (default false)
comingSoon: boolean (default false)
tags: array[reference → tag (category: downloads)] (optional)

mainDescription: array[portableText] (optional)
headerFooterImage: image (optional)

button1Text: string (optional)
button1Link: url (optional)
button2Text: string (optional)
button2Link: url (optional)

youllGet: array[string] (optional, max 5) — consolidates the 3 populated tag fields

howToUseIt: {
  videoThumbnail: image,
  videoLink: url,
  title: string,
  description: array[portableText]
}

theImpact: {
  image: image,
  title: string,
  description: array[portableText]
}

faqs: array[{question: string, answer: array[portableText]}] (optional, max 6) — consolidates FAQ 1-6

getItNow: {
  title: string,
  description: array[portableText]
}

metaTitle: string (required, max 60 chars)
metaDescription: string (required, 140-160 chars)
metaThumbnail: image (optional) — existing openGraph image

hubspotFormId: string (optional) — replaces the gated form embed with a structured reference

locale: string enum [default, uk] (default 'default')
```

### 3.12 Downloads Access Pages

**Decision:** Migrate as `downloadAccess`. Private, noindex. URL path `/download-thank-you/[slug]` preserved exactly.

**Source collection:** > Downloads Access Pages (5 items)

**`downloadAccess` schema fields:**
```
name: string (required, max 160 chars)
slug: slug (required, unique)
downloadFileLink: url (required)
```

**Routing:** Next.js route includes `<meta name="robots" content="noindex, nofollow">` at the template level. Not in sitemap. GTM trigger `Lead Magnet Form - Confirmed` fires correctly.

### 3.13 Tools & Quizzes

**Decision:** Migrate as `tool`. Culture Match parked — placeholder migrated, API-driven content rebuilt post-launch.

**Source collection:** Tools & Quizzes (2 items)

**`tool` schema fields:**
```
name: string (required, max 160 chars)
slug: slug (required, unique)
subHeader: string (optional)
headerBlurb: array[portableText] (optional)
description: array[portableText] (optional)

button1Text: string (optional)
button1Link: url (optional)
button2Text: string (optional)
button2Link: url (optional)

toolEmbed: array[portableText] (optional) — for embedding tool widgets
hiddenCode: array[portableText] (optional) — generic field for custom HTML/scripts required by a tool (e.g. tracking pixels, embed configs). Maps from Webflow `hidden-code` RichText field. Culture Match's API key value is explicitly excluded from this field during migration.
videoOverview: array[portableText] (optional)

faqs: array[{question: string, answer: array[portableText]}] (optional, max 10)

thumbnail: image (optional)
metaTitle: string (required, max 60 chars)
metaDescription: text (required, 140-160 chars) — existing `blurbs` field maps here
tags: array[reference → tag (category: tools)] (optional)
featured: boolean (default false)

locale: string enum [default, uk] (default 'default')
```

**Culture Match migration handling:** Document migrated with placeholder content. API key excluded from all Sanity fields and all Next.js code. Tool logic rebuilt in a future phase.

### 3.14 Book A Call Pages

**Decision:** Migrate as `bookACall`. Rename `title` field to `metaDescription` (fixing Webflow naming bug).

**Source collection:** Book A Call Pages (6 items)

**`bookACall` schema fields:**
```
firstName: string (required, max 100 chars) — maps to Webflow `name`
lastName: string (required, max 100 chars)
slug: slug (required, unique)
calendlyEmbed: array[portableText] (required)

metaTitle: string (required, max 60 chars)  # NEW
metaDescription: text (required, 140-160 chars) — maps to Webflow `title` (which was mislabelled)
```

### 3.15 Events & Webinars

**Decision:** Migrate as `event`. Keep the full schema; CE intends to populate future events.

**Source collection:** Events & Webinars (1 item)

**`event` schema fields:**
```
name: string (required, max 160 chars)
slug: slug (required, unique)
dateTime: datetime (required)

headerDescription: array[portableText] (optional)
headerDescriptionPostEvent: array[portableText] (optional)
headerButtonText: string (optional)

featuredImage: image (optional)
thumbnailImage: image (optional)

topics: {
  header: string,
  description: array[portableText],
  items: array[{title: string, description: text}] (max 4)
}

speakers: array[reference → teamMember] (optional)

signUp: {
  header: string,
  description: array[portableText],
  formEmbed: array[portableText]
}

onDemandEmbedDescription: array[portableText] (optional)

eventType: reference → tag (category: eventsWebinars) (optional)
eventCategory: array[reference → tag (category: eventsWebinars)] (optional)

metaTitle: string (required, max 60 chars)
metaDescription: text (required, 140-160 chars)

locale: string enum [default, uk] (default 'default')
```

### 3.16 Glassdoor Reviews

**Decision:** Migrate as `glassdoorReview`. Drop `review-link` field (0% fill rate, all links 404).

**Source collection:** -- Glassdoor reviews (10 items)

**Consumed by:** `/for-developers` and `/reviews` pages (confirmed by Investigation 3 — 183 hits on each).

**`glassdoorReview` schema fields:**
```
clientName: string (required, max 100 chars)
slug: slug (required, unique)
title: string (optional)
reviewDescription: text (optional)
workField: string (optional)
```

### 3.17 Supporting embedded collections

These collections render as embedded components on other pages, not as standalone routes. All confirmed reference-only by Investigation 1 (zero matches in Screaming Frog export for their slugs).

**Decisions:**

| Webflow collection | Sanity document type | Routing |
|---|---|---|
| -- Client Benefits & Company Values (9 items) | `benefitValue` | No route — consumed by pages via reference |
| -- Staff Benefits (6 items) | `staffBenefit` | No route — consumed by /for-developers |
| -- Lead magnets / Tags (17 items) | NOT MIGRATED — Jake confirmed these lead to 404, unused |

**`benefitValue` schema:**
```
name: string (required)
slug: slug (required, unique)
category: string enum [benefits, values] (required)
thumbnailImage: image (optional)
paragraph: string (optional, max 160 chars)
```

**`staffBenefit` schema:**
```
name: string (required)
slug: slug (required, unique)
icon: image (optional)
```

### 3.18 Insights collection

**Decision:** NOT MIGRATED. Jake confirmed: "remove it — don't need it"

### 3.19 New Blog Templates collection

**Decision:** NOT MIGRATED. Jake confirmed: "We were testing this as a place to build a table of contents." Replaced in Next.js by auto-generated TOC feature (see Section 7.3).

### 3.20 Placeholder schemas for AI-search strategy (NEW)

**Decision:** Add three empty document types now, ready for programmatic population post-launch.

**Rationale:** Per Jake's AI-search priority, these content types will be programmatically generated via Beem / Claude Code. Adding the schema now means zero retrofit work later. The empty collections cost nothing. Once populated, they immediately have routing, SEO fields, and editing UX.

**`industry` schema fields:**
```
name: string (required) — e.g. "Fintech", "Healthcare", "SaaS"
slug: slug (required, unique)
order: number (optional)

shortLabel: string (optional)
thumbnail: image (optional)

folds: array[fold] (required) — same fold pattern as technology/service

metaTitle: string (required, max 60 chars)
metaDescription: text (required, 140-160 chars)
openGraphImage: image (optional)

source: string enum [manual, beem, claude_code, imported] (default 'manual')
generatedAt: datetime (optional)
needsReview: boolean (default false)
locale: string enum [default, uk] (default 'default')
```

**Route:** `/industry/[slug]`

**`persona` schema fields:** (identical structure to `industry`)

**Route:** `/persona/[slug]`

**`location` schema fields:** (identical structure to `industry`)

**Route:** `/location/[slug]`

**Why identical structures:** The three types are conceptually the same — landing pages optimised for AI search queries. The difference is the routing prefix. Keeping them as separate document types (rather than a single generic `landingPage` with a type enum) gives Seb a cleaner Studio UX and gives Next.js cleaner routing logic. If this becomes unwieldy, we can consolidate later — easier than splitting.

---

## 4. SINGLETON DOCUMENT TYPES (Tier 2)

Unique pages that need editorial flexibility. Each is a dedicated singleton document type in Sanity. One document per type. Bound to a fixed Next.js route.

### 4.1 Blog hubs

**Six singleton types, one per blog category.** Each drives a content-rich landing page at `/[category-slug]`.

**Singleton types:**
- `staffAugmentationHub` → `/staff-augmentation`
- `nearshoringOffshoringHub` → `/nearshoring-offshoring`
- `scalingTeamsHub` → `/scaling-teams`
- `hiringTipsHub` → `/hiring-tips`
- `managingEngineersHub` → `/managing-engineers`
- `aiInSoftwareDevelopmentHub` → `/ai-in-software-development`

Plus the blog index:
- `blogHub` → `/blog`

**Shared schema across all 7:**
```
title: string (required)
eyebrow: string (optional) — e.g. "Cloud Employee Blog"
heroDescription: array[portableText] (required)
heroImage: image (optional)

featuredArticles: array[reference → blogPost] (optional, max 2)
introContent: array[portableText] (optional) — body copy above the article feed
topicsHeader: string (optional) — e.g. "Latest in the Scaling Teams Hub"

metaTitle: string (required, max 60 chars)
metaDescription: text (required, 140-160 chars)
openGraphImage: image (optional)
```

### 4.2 Resource hubs

**Four singleton types, one per resource type.**

- `videosHub` → `/videos`
- `toolsHub` → `/tools`
- `downloadsHub` → `/downloads`
- `eventsHub` → `/events`

**Shared schema:**
```
title: string (required)
eyebrow: string (optional) — e.g. "Cloud Employee Free Resources"
heroDescription: array[portableText] (required)
heroImage: image (optional)

featuredItems: array[reference → (video | tool | download | event)] (optional, max 2)
introContent: array[portableText] (optional)

metaTitle: string (required, max 60 chars)
metaDescription: text (required, 140-160 chars)
openGraphImage: image (optional)
```

### 4.3 Collection index singletons

For the CMS collection pages that need editable hero/intro content.

- `servicesHub` → `/services` — CMS-driven Services nav, also the landing page
- `technologyHub` → `/technology`
- `customerStoriesHub` → `/customer-stories` (and alias `/our-work`)
- `reviewsHub` → `/reviews`
- `compareHub` → `/compare` (and alias `/alternatives`)
- `teamHub` → `/team` (and its alias `/about-us` — these currently share content, see Section 10)

**Shared schema:** Same as resource hubs above, with `featuredItems` referencing the relevant collection type.

### 4.4 Static content singletons

Unique pages with rich editable content.

| Singleton | Route | Source |
|---|---|---|
| `homePage` | `/` | Current home page content |
| `aboutUsPage` | `/about-us` | Current about-us content |
| `howItWorksPage` | `/how-it-works` | Current how-it-works content |
| `contactPage` | `/contact` | Current contact content |
| `forDevelopersPage` | `/for-developers` | Current for-developers content |
| `retentionPage` | `/retention` | Current retention content |
| `sourcingPage` | `/sourcing` | Current sourcing content |
| `embeddingPage` | `/embedding` | Current embedding content |
| `scaleThisWeekPage` | `/scale-this-week` | Current content |
| `workWithShawneePage` | `/work-with-shawnee` | Current content |
| `startHiringPage` | `/start-hiring/contact-info` | Current content — embeds HubSpot form `1578f9b5-fb43-4772-83df-79c51c120a92` |
| `notFoundPage` | `/404` | Current 404 content |
| `privacyPolicyPage` | `/legals/privacy-policy` | Migrated from Webflow `Legal pages` collection (1 item) |

**Each singleton schema:**
```
title: string (required)
eyebrow: string (optional)
heroDescription: array[portableText] (optional)
heroImage: image (optional)

sections: array[section] (required) — typed section objects for page body

metaTitle: string (required, max 60 chars)
metaDescription: text (required, 140-160 chars)
openGraphImage: image (optional)

locale: string enum [default, uk] (default 'default')
```

**`section` typed object (polymorphic):**
```
section: one of [
  richTextSection: { heading: string, content: array[portableText] },
  twoColumnSection: { heading: string, leftContent: array[portableText], rightContent: array[portableText] },
  ctaSection: { heading: string, description: string, buttonText: string, buttonLink: url },
  imageSection: { image: image, caption: string },
  videoSection: { videoUrl: url, caption: string },
  testimonialSection: { review: reference → review },
  benefitsGrid: { heading: string, benefits: array[reference → benefitValue] },
  staffBenefitsGrid: { heading: string, benefits: array[reference → staffBenefit] },
  glassdoorGrid: { heading: string, reviews: array[reference → glassdoorReview] },
  customerStoriesGrid: { heading: string, stories: array[reference → customerStory] },
  faqSection: { heading: string, faqs: array[{question, answer}] },
  hubspotFormSection: { formId: string, portalId: string, heading: string }
]
```

---

## 5. HARDCODED NEXT.JS ROUTES (Tier 3)

Pages with embedded calculators or custom logic. The logic is hardcoded in Next.js; the marketing copy around it lives in a Sanity singleton.

| Page | Sanity singleton (marketing copy) | Hardcoded logic |
|---|---|---|
| `/hiring-cost-calculator` | `hiringCostCalculatorPage` | Calculator UI and logic in Next.js |
| `/price-comparison-calculator` | `priceComparisonCalculatorPage` | Calculator UI and logic in Next.js |
| `/tools/culture-match` | Handled by `tool` document type, placeholder content | Tool logic PARKED — placeholder page with "Coming back soon" CTA, preserves URL for SEO |

**Each singleton schema (for the calculator pages):**
```
title: string (required)
eyebrow: string (optional)
heroDescription: array[portableText] (optional)

# Below-calculator copy
belowCalculatorContent: array[portableText] (optional)

# FAQ / supporting content
faqs: array[{question, answer}] (optional, max 10)

metaTitle: string (required, max 60 chars)
metaDescription: text (required, 140-160 chars)
openGraphImage: image (optional)
```

**GTM compatibility:** `/price-comparison-calculator` triggers the "Pricing Calculator Confirmed" GA4 event. Next.js implementation must fire the same event on form submission to preserve conversion tracking.

---

## 6. GLOBAL SCHEMAS

Site-wide objects that aren't tied to specific pages.

### 6.1 `siteSettings` singleton

```
siteName: string (required)
siteUrl: url (required)
defaultMetaTitle: string (required)
defaultMetaDescription: text (required)
defaultOgImage: image (required)

announcementBar: {
  enabled: boolean,
  text: string,
  ctaLabel: string,
  ctaLink: url
}

socialProof: {
  organizationName: string,
  organizationUrl: url,
  logo: image,
  foundingDate: date,
  description: text
}

claraChat: {
  enabled: boolean,
  workspaceId: string
}

hubspotPortalId: string (required) — value: 22809822
```

### 6.2 `navigation` singleton

```
primaryLinks: array[{
  label: string,
  url: url,
  cmsDriven: boolean,
  cmsCollection: string (optional),
  dropdownItems: array[{label, url}] (optional)
}]

ctaButton: { label: string, link: url, type: string enum [calendly, link, hubspotForm] }

localeDropdown: {
  enabled: boolean,
  options: array[{label, url, hreflang}]
}
```

### 6.3 `footer` singleton

```
newsletterFormId: string
copyrightText: string

columns: array[{
  heading: string,
  links: array[{label, url}]
}]

legalLinks: array[{label, url}]
```

---

## 7. CROSS-CUTTING DECISIONS

### 7.1 Author field on blog posts — REQUIRED

**Locked.** Every `blogPost` and `compareBlog` must have an `author` reference.

**Migration handling:** Posts without authors get flagged during content migration. Seb assigns defaults in bulk (expected: most posts authored by Seb). Migration blocks cutover if any blog post lacks an author.

**Impact on JSON-LD:** Article schema auto-populates with Person schema from the referenced author. Backfilled LinkedIn URLs and bios strengthen E-E-A-T signal.

### 7.2 Programmatic content tracking fields

**Applied to:** `blogPost`, `compareBlog`, `technology`, `service`, `industry`, `persona`, `location`.

**Fields:**
- `source: string enum [manual, beem, claude_code, imported] (default 'manual')`
- `generatedAt: datetime (optional)`
- `needsReview: boolean (default false)`

**Studio UX:** A dashboard widget filters documents by `needsReview: true` so Seb can batch-review AI-generated content before it goes live.

### 7.3 Auto-generated table of contents

**Locked.** Blog posts (all types), customer stories, technology pages, service pages render a floating TOC on the right side of the page, auto-generated from H1/H2/H3 headings in the body content.

**No schema field required.** The TOC is a template-level feature that parses the Portable Text body at render time.

### 7.4 Slug preservation

**Locked.** Every migrated item preserves its Webflow slug exactly. No slug cleanup or restructuring. URL patterns match Webflow 1:1 to preserve SEO equity.

**Exception:** Collection URL prefixes. Blog posts migrate from `/[blog-category]/[post-slug]` exactly (e.g. `/staff-augmentation/what-is-staff-augmentation` stays identical).

### 7.5 Rich text → Portable Text

**Locked.** Every Webflow RichText field becomes a Sanity Portable Text array. Migration script converts HTML to Portable Text using `@sanity/block-tools`. Custom HTML elements (embedded forms, Vimeo embeds, custom components) get extracted into Portable Text annotations or block types.

### 7.6 JSON-LD — server-side generated

**Locked.** All JSON-LD structured data generated server-side in Next.js from Sanity fields. No client-side script injection.

**Required JSON-LD types per template:**
- `homePage` → Organization + ProfessionalService
- `blogPost`, `compareBlog` → Article + Person (author)
- `teamMember` → Person
- `customerStory` → Review + Organization
- `review` → Review
- `video` → VideoObject
- `technology`, `service`, `industry`, `persona`, `location` → WebPage + CollectionPage; FAQPage if `faqs` present
- `bookACall` → ContactPage + Person

### 7.7 Hreflang — server-side generated

**Locked.** Every page renders hreflang tags server-side based on document locale and URL structure. No JavaScript injection (current Technology page hack is removed).

### 7.8 Canonical tags — server-side generated

**Locked.** Every page renders a canonical tag server-side from the Next.js route. Removes the current Technology page JavaScript-injection hack.

### 7.9 GeoTargetly

**Locked.** GeoTargetly script included in global `<head>` via `siteSettings`. Routing to `talent.cloudemployee.io` for PH traffic preserved.

### 7.10 Forms

**Locked.** Three HubSpot forms preserved:
- `24f5bd5f-3532-4c4e-908f-1266809bc897` — Start Hiring Request, rendered on `/price-comparison-calculator`
- `444bfbf1-2018-456c-b8fd-932d909b0888` — Blog form, rendered on `/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models`
- `1578f9b5-fb43-4772-83df-79c51c120a92` — Start Hiring Part 2/8, rendered on `/start-hiring/contact-info`

Forms referenced by form ID in content; HubSpot portal ID (22809822) in `siteSettings`.

### 7.11 Locale strategy

**Locked.** Schema is locale-aware via `locale` enum field on content-bearing documents. Default migration treats every document as locale-agnostic (served at both US and UK URLs). Post-launch, a MYGRATR-LOCALE-1 session runs a US/UK diff and splits documents where genuine content differences exist.

**Plugin:** `@sanity/document-internationalization` installed in SCAFFOLD-1.

### 7.12 Presentation Tool

**Locked.** `@sanity/presentation` and `@sanity/visual-editing` installed in SCAFFOLD-1. Every page template tagged with source/field metadata. Seb edits content by clicking in a live preview.

### 7.13 Webflow primary `name` field — cross-cutting migration rule

**Locked.** Every Webflow collection has a system-required `name` field (100% populated, used for slug derivation and default listing). For every Sanity document type in Section 3, the Webflow `name` field maps to the schema's primary title field unless the schema defines a different primary (e.g. `technologyName`, `nameClient`, `customerStoryTitle`, `firstName`+`lastName`, `clientName`, etc.). Migration script preserves the Webflow `name` value exactly in whichever Sanity field is designated as the primary title.

### 7.14 Legal pages collection — explicit migration mapping

**Locked.** The Webflow `Legal pages` collection (1 item: `/legals/privacy-policy`) migrates to the `privacyPolicyPage` singleton defined in Section 4.4. Field mapping:

- `Legal pages.name` → `privacyPolicyPage.title`
- `Legal pages.legals-content` (RichText) → `privacyPolicyPage.sections` (converted to a single `richTextSection`)
- `Legal pages.meta-description` → `privacyPolicyPage.metaDescription`
- `Legal pages.slug` → hardcoded route `/legals/privacy-policy` (no dynamic slug)

If CE adds more legal pages post-launch (terms of service, cookie policy), they become additional static singletons or a new `legalPage` CMS document type — deferred to post-launch.

---

## 8. REDIRECTS

**Locked.** Three redirect sources are preserved in Next.js via `next.config.js` redirects array:

1. **11 regex redirects** from `ce-regex-redirects.json` — preserved as regex rules.
2. **30 crawl-discovered individual redirects** from `ce-canonical-urls.json` (29×301 + 1×302) — preserved as exact-match rules.
3. **653 Webflow-configured redirects** from `webflow-redirects.csv` — preservation strategy is CONDITIONAL on verification (see below).

**653 Webflow redirects — preservation strategy:**

Verification completed in `docs/investigations-2026-04-23/redirects-verification.md`. Findings:
- 336 rows target `/live-job-role/*` URLs (PH careers, no longer trafficked per Jake)
- 317 rows are heterogeneous non-job-role redirects (must preserve individually)

**Locked preservation approach:**
- The 336 `/live-job-role/*` redirects collapse to a single catch-all regex in `next.config.js`: `/live-job-role/(.*)` → `https://talent.cloudemployee.io/live-job-role/$1` (301).
- The 317 heterogeneous redirects are preserved individually in `next.config.js`.
- Result: 318 explicit rules in next.config.js (1 catch-all + 317 individual), down from 653.

CONTENT-1 brief consumes the existing `redirects-verification.md` directly — no re-verification required.

**Additional cleanup rules (all locales):**
- `/download-thank-you/*` pages → robots noindex (gated lead-gen pages)
- Dead Screaming Frog URLs not in sitemap → 410 Gone
- `/team` → `/about-us` (existing 301 preserved)
- `/archive/old-home` and `/uk/archive/old-home` → emit HTTP 410 Gone (fixes pre-existing soft-404 bug — both URLs currently return HTTP 200 with 404 template body)
- The 16 URLs in Section 10 of CE_SITE_TRUTH.md preserve their existing 30x behaviour

---

## 9. DELETED / EXCLUDED FROM MIGRATION

The following Webflow content is explicitly NOT migrated:

| Item | Reason |
|---|---|
| `Insights` collection (1 item) | Jake confirmed not needed |
| `New Blog Templates` collection (5 items) | Test collection, not live content |
| `-- Lead magnets / Tags` collection (17 items) | Jake confirmed dead — slugs return 404 |
| `Reviews.featured-in-which-page` field | Legacy field, replaced by explicit references |
| `Reviews.webpage-for-testimonial` field | Marked "No Longer Used" in Webflow |
| `Customer Stories.video-url-2` field | Broken data (only 2 populated, both malformed) |
| `Technology Pages.faq-schema-2` PlainText field | Replaced by proper `faqs` structured array |
| `Downloads.code-rich-text` field | 0% fill rate |
| `Downloads.you-ll-get-tag--4-2` / `...--5-2` fields | 0% fill rate |
| `Downloads.faq-title---7/8` / `faq-answer---7/8` fields | 0% fill rate |
| `Glassdoor reviews.review-link` field | 0% fill rate, all links 404 |
| `/uk/archive/old-home` page | Soft 404 — URL returns HTTP 200 with "Not Found" template body. LAUNCH must emit a proper HTTP 410 Gone response at this path in `next.config.js` to fix the existing soft-404 bug. |
| `/uk/pricing` | Existing 301 redirect preserved |
| `Varify.io` A/B testing tool | Lives on lp.cloudemployee.io, not migrated with main site |

---

## 10. FULL ROUTING TABLE

Complete list of every route on the new site, mapped to its Sanity source.

### CMS-driven routes (Tier 1)

| Route | Document type | Source | Count |
|---|---|---|---|
| `/[category]/[slug]` | blogPost (filtered by category) | 7 blog collections | 98 |
| `/compare/[slug]` | compareBlog | Compare Blogs | 29 |
| `/customer-story/[slug]` | customerStory | Customer Stories | 18 |
| `/services/[slug]` | service | Services | 23 |
| `/technology/[slug]` | technology | Technology Pages | 101 |
| `/team/[slug]` | teamMember | Team Members | 28 |
| `/reviews/[slug]` | review | Reviews | 11 |
| `/videos/[slug]` | video | Videos | 32 |
| `/download/[slug]` | download | Downloads | 5 |
| `/download-thank-you/[slug]` | downloadAccess (noindex) | > Downloads Access Pages | 5 |
| `/tools/[slug]` | tool | Tools & Quizzes | 2 |
| `/book-a-call/[slug]` | bookACall | Book A Call Pages | 6 |
| `/events/[slug]` | event | Events & Webinars | 1 |
| `/industry/[slug]` | industry | NEW placeholder | 0 |
| `/persona/[slug]` | persona | NEW placeholder | 0 |
| `/location/[slug]` | location | NEW placeholder | 0 |

### Singleton routes (Tier 2)

| Route | Singleton |
|---|---|
| `/` | homePage |
| `/about-us` | aboutUsPage |
| `/how-it-works` | howItWorksPage |
| `/contact` | contactPage |
| `/for-developers` | forDevelopersPage |
| `/retention` | retentionPage |
| `/sourcing` | sourcingPage |
| `/embedding` | embeddingPage |
| `/scale-this-week` | scaleThisWeekPage |
| `/work-with-shawnee` | workWithShawneePage |
| `/start-hiring/contact-info` | startHiringPage |
| `/404` | notFoundPage |
| `/legals/privacy-policy` | privacyPolicyPage |
| `/blog` | blogHub |
| `/staff-augmentation` | staffAugmentationHub |
| `/nearshoring-offshoring` | nearshoringOffshoringHub |
| `/scaling-teams` | scalingTeamsHub |
| `/hiring-tips` | hiringTipsHub |
| `/managing-engineers` | managingEngineersHub |
| `/ai-in-software-development` | aiInSoftwareDevelopmentHub |
| `/videos` | videosHub |
| `/tools` | toolsHub |
| `/downloads` | downloadsHub |
| `/events` | eventsHub |
| `/services` | servicesHub |
| `/technology` | technologyHub |
| `/customer-stories` | customerStoriesHub |
| `/our-work` | Alias route → customerStoriesHub |
| `/reviews` | reviewsHub |
| `/compare` | compareHub |
| `/alternatives` | Alias route → compareHub |

### Hardcoded routes (Tier 3)

| Route | Singleton (for marketing copy) | Hardcoded logic |
|---|---|---|
| `/hiring-cost-calculator` | hiringCostCalculatorPage | Calculator |
| `/price-comparison-calculator` | priceComparisonCalculatorPage | Calculator + GA4 conversion event |
| `/tools/culture-match` | Handled via `tool` document | Tool logic parked (placeholder page) |

### UK locale mirror

All routes above are served at `/uk/[original-path]` until LOCALE-1 decides otherwise.

---

## 11. OPEN QUESTIONS & PENDING POST-LAUNCH WORK

Items that are NOT blockers for SCHEMA-1 but are explicitly flagged for later resolution.

| Item | Deferred to | Notes |
|---|---|---|
| US vs UK content duplication audit | MYGRATR-LOCALE-1 | Run HTML diff script, identify genuinely different pages, split documents as needed |
| Ahrefs baseline empty | MYGRATR-MONITOR-1 | Upgrade Ahrefs plan or use alternative tool |
| Custom code `semi_global` misclassification (745 items) | MYGRATR-CONTENT-1 | Adjust detector threshold during content extraction |
| HubSpot workflow cross-reference | MYGRATR-CONTENT-1 | Requires `automation` scope on HubSpot token |
| Culture Match tool rebuild | Post-launch | External dev builds Next.js-compatible version |
| Customer Story `/customer-story/virgin` meta description | Content migration | Flagged — placeholder text needs rewrite before launch |
| Blog post authorship backfill | Content migration | Every post needs a valid `author` reference before cutover |
| UK Blogs & Guides draft status (31 items all drafted in UK) | Content migration | Resolved by single-global-blog decision; drafts get promoted |

---

## 12. DECISIONS LOG — QUICK REFERENCE

Every question that was asked during schema design and its locked answer.

| # | Question | Decision |
|---|---|---|
| D1 | Consolidate 7 blog collections? | Yes → single `blogPost` with `category` |
| D2 | Consolidate 5 taxonomy collections? | Yes → single `tag` with `category` |
| D3 | Technology fold structure — 43 flat fields or typed array? | Typed `folds` array |
| D4 | Service fold structure? | Same typed `folds` array pattern |
| D5 | Drop `video-url-2` in Customer Stories? | Yes — data is broken |
| D6 | Fix Technology Pages missing meta description? | Yes — add `metaDescription` as required field |
| D7 | Fix Services missing meta description? | Yes — add `metaDescription` as required field |
| D8 | Replace `faq-schema-2` PlainText with structured `faqs`? | Yes |
| D9 | Fix Book A Call `title`-labelled-as-`metaDescription` bug? | Yes — rename to `metaDescription` |
| D10 | Add industry/persona/location placeholder schemas? | Yes (option B) |
| D11 | Author field required on blogs? | Yes — required |
| D12 | Blog hubs vs Resource hubs? | Two separate singleton types |
| D13 | Hubs collection → Sanity `blogCategory` + `blogHub` singletons? | Yes |
| D14 | Insights collection migration? | No — not migrated |
| D15 | New Blog Templates migration? | No — not migrated |
| D16 | Lead magnets migration? | No — dead links |
| D17 | Events & Webinars — keep or discard? | Keep, CE will populate future events |
| D18 | Culture Match — migrate or park? | Park with placeholder page |
| D19 | Hiring Cost Calculator — hardcode or Sanity? | Hardcode logic + Sanity marketing copy |
| D20 | Price Comparison Calculator — hardcode or Sanity? | Hardcode logic + Sanity marketing copy |
| D21 | UK/US content — duplicate or variant? | Duplicate by default, split post-launch in LOCALE-1 |
| D22 | Presentation Tool installation? | Yes — in SCAFFOLD-1 |
| D23 | Programmatic content tracking fields? | Yes — on generatable document types |
| D24 | Auto-generated TOC? | Yes — template feature, no schema field |
| D25 | Single global blog or US/UK separate? | Single global blog |
| D26 | Preserve Webflow slugs exactly? | Yes — no slug cleanup |
| D27 | JSON-LD rendering approach? | Server-side, generated from Sanity fields |
| D28 | Canonical tags approach? | Server-side, generated from routes |
| D29 | Hreflang approach? | Server-side, generated from locale + URL |
| D30 | Glassdoor Reviews — separate doc type or embedded? | Separate `glassdoorReview` doc, consumed by 2 pages |
| D31 | HubSpot form handling? | 3 forms referenced by ID, portal in `siteSettings` |
| D32 | GeoTargetly preservation? | Yes — in `siteSettings` global script list |

---

## 13. HANDOFF TO SCHEMA-1

The MYGRATR-SCHEMA-1 session brief consumes this document verbatim. Claude Code's job in SCHEMA-1 is exclusively:

1. Read this document and `docs/CE_SITE_TRUTH.md`
2. Generate Sanity schema files for every document type defined above
3. Organise them under `/studio/schemas/` per Sanity conventions
4. Write Zod validation types matching each schema for use in the Next.js app
5. Produce a migration map document (`docs/WEBFLOW_TO_SANITY_FIELD_MAP.md`) for use by CONTENT-1

No architecture decisions are made in SCHEMA-1. Every decision is already in this document.

---

*End of MYGRATR_SCHEMA_DESIGN_DECISIONS.md v1.2*
