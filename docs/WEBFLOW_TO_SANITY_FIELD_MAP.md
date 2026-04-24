# Webflow → Sanity Field Map (Cloud Employee)

Authoritative field-level mapping for MYGRATR-CONTENT-1. Consumed by the
content migration script to map every Webflow field to its Sanity
counterpart. Every Webflow collection appears exactly once — grouped by
the Sanity document or singleton it maps to.

Cross-cutting rules that apply to every collection (§7.13 of
`docs/MYGRATR_SCHEMA_DESIGN_DECISIONS.md` v1.2):

- The Webflow system-required `name` field maps to the schema's primary
  title field (per-type override noted inline when different).
- Every Webflow `slug` field preserves exactly (§7.4 / D26) — no cleanup.
- Every Webflow RichText field converts to a Sanity Portable Text array
  via `@sanity/block-tools` (§7.5).

Status: v1.0 — initial draft written alongside the schema files in
SCHEMA-1.

---

## 1. Blog Posts → `blogPost` (Tier 1 CMS)

**Source Webflow collections (all 7 consolidate into one Sanity type per D1 / §3.1):**

- Blogs & Guides (31 items)
- Staff Augmentation Blogs (28 items)
- Nearshoring & Offshoring Blogs (13 items)
- Scaling Teams Blogs (9 items)
- Hiring Tips Blogs (7 items)
- Managing Engineers Blogs (7 items)
- AI in Software Development Blogs (3 items)

Total: 98 items. Migration script sets `category` based on the source
collection via a static collection→category map.

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | title | string | §7.13 — primary title |
| slug | Slug | slug.current | slug | Preserved exactly |
| resource-category | reference → -- Hubs | category | reference → blogCategory | References the new `blogCategory` document |
| tags | multiReference → Tags >> Blogs | tags | reference[] → tag | Filtered to `category=="blogs"` |
| author | reference → Team Members | author | reference → teamMember | REQUIRED on Sanity side (§7.1 / D11) |
| date | Date | date | date | |
| thumbnail-image | Image | thumbnailImage | image | |
| open-graph-wide-image | Image | openGraphImage | image | |
| tldr-section | RichText | tldrSection | portableText | |
| content | RichText | content | portableText | |
| resource-description | PlainText | resourceDescription | text | |
| featured | Switch | featured | boolean | |
| meta-title | PlainText | metaTitle | string | max 60 |
| meta-description | PlainText | metaDescription | text | 140-160 |
| faq-title-1..6 / faq-content-1..6 | PlainText / RichText (×6) | faqs[].question / faqs[].answer | faqItem[] | 12 flat fields pack into a single array, max 6 entries |

**New fields (no Webflow source):** `source` (default 'imported'), `generatedAt`, `needsReview` (default false), `locale` (default 'default').

---

## 2. Compare Blogs → `compareBlog` (Tier 1 CMS)

**Source collection:** Compare Blogs (29 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | title | string | |
| slug | Slug | slug.current | slug | |
| (n/a — extracted from title) | — | competitor | string | Parsed from title by migration script |
| tags | multiReference → Tags >> Alternatives | tags | reference[] → tag | Filter `category=="alternatives"` |
| author | reference → Team Members | author | reference → teamMember | REQUIRED |
| date | Date | date | date | |
| featured | Switch | featured | boolean | |
| thumbnail-image | Image | thumbnailImage | image | |
| open-graph-wide-image | Image | openGraphImage | image | |
| tldr-section | RichText | tldrSection | portableText | |
| content | RichText | content | portableText | |
| resource-description | PlainText | resourceDescription | text | |
| faq-title-1..6 / faq-content-1..6 | PlainText / RichText (×6) | faqs | faqItem[] | Same consolidation as blogPost |
| meta-title | PlainText | metaTitle | string | |
| meta-description | PlainText | metaDescription | text | |

**New fields:** `source`, `generatedAt`, `needsReview`, `locale`.

---

## 3. Technology Pages → `technology` (Tier 1 CMS)

**Source collection:** Technology Pages (101 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | technologyName | string | Per-type primary override (§7.13) |
| slug | Slug | slug.current | slug | |
| order | Number | order | number | |
| short-description | PlainText | shortLabel | string | |
| tech-logo | Image | techLogo | image | |
| list-item-only | Switch | listItemOnly | boolean | |
| thumbnail | Image | thumbnail | image | |
| Fold 1 Pre / Fold 1 Header / Fold 1 Paragraph / Fold 1 Bullet 1/2/3 / Fold 1 Featured Image | various | folds[0] | fold | Packed into `{type:'headerIntro', ...}` |
| Fold 2..6 fields (Label, Header, Paragraph, Bullets/Items, Featured Image) | various | folds[1..5] | fold | Migration script inspects per-fold populated fields and picks the matching fold `type` from the 5-variant enum |

**Dropped fields:**
- `faq-schema-2` (PlainText JSON-LD string, 5% fill rate) — replaced by the structured `faqs` array; JSON-LD is generated server-side at render time (§3.4 / D8).

**New fields:**
- `metaTitle` (required, 60-char max) — BACKFILL from the live page `<title>` before launch.
- `metaDescription` (required, 140-160 chars) — BACKFILL from live `<meta name="description">`.
- `openGraphImage` (optional).
- `faqs` (structured array replacing `faq-schema-2`).
- `source`, `generatedAt`, `needsReview`, `locale`.

---

## 4. Services → `service` (Tier 1 CMS)

**Source collection:** Services (23 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| order | Number | order | number | |
| type | Option [staff-augmentation / product-builds / consulting-services] | type | enum | Normalised to camelCase values |
| prefix | Option | prefix | enum [hire / build / expert / endToEnd] | |
| ai-offering | Switch | aiOffering | boolean | |
| location | Switch | location | boolean | |
| short-description | PlainText | shortLabel | string | |
| thumbnail | Image | thumbnail | image | |
| associated-technologies | multiReference → Technology Pages | associatedTechnologies | reference[] → technology | |
| Fold 1..6 fields | various | folds[] | fold[] | Same typed-fold transformation as technology |

**New fields:** `metaTitle` (BACKFILL), `metaDescription` (BACKFILL), `openGraphImage`, `source`, `generatedAt`, `needsReview`, `locale`.

---

## 5. Customer Stories → `customerStory` (Tier 1 CMS)

**Source collection:** Customers / Customer Stories (18 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | customerStoryTitle | string | Per-type primary override |
| company-name | PlainText | companyName | string | |
| slug | Slug | slug.current | slug | |
| order | Number | order | number | |
| feature-in-home-header | Switch | featureInHomeHeader | boolean | |
| feature-in-featured-customers | Switch | featureInFeaturedCustomers | boolean | |
| featured-on-customer-stories-page | Switch | featuredOnCustomerStoriesPage | boolean | |
| company-logo | Image | companyLogo | image | |
| company-product-image | Image | companyProductImage | image | |
| company-people-image | Image | companyPeopleImage | image | |
| thumbnail | Image | thumbnail | image | |
| video-testimonial-if-available | Video | videoUrl | url | §3.6 — consolidated from this single field |
| video-intro-content | RichText | videoIntroContent | portableText | |
| tldr-content | RichText | tldrContent | portableText | |
| hiring-needs-table | RichText | hiringNeedsTable | portableText | |
| the-customer-content | RichText | theCustomerContent | portableText | |
| problem-content / problem-quote-* | RichText + fields | problem.content / problem.quote | portableText + quoteBlock | Packed into `{content, quote}` object |
| solution-content / solution-quote-* | same | solution | same | |
| impact-content / impact-quote-* | same | impact | same | |
| cta-content | RichText | ctaContent | portableText | |
| review-snippet-for-google-meta | PlainText | reviewSnippetForMeta | text | |

**Dropped fields:**
- `video-url-2` (Video; only 2 of 18 items populated, both malformed) — §3.6 / D5.

**New fields:**
- `metaTitle` (required, BACKFILL).
- `metaDescription` (required, BACKFILL). **MIGRATION BLOCK** — `/customer-story/virgin` placeholder text "Customer story in progress..." must be rewritten before launch.
- `openGraphImage` (optional).
- `locale`.

---

## 6. Team Members → `teamMember` (Tier 1 CMS)

**Source collection:** Team Members (28 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| order | Number | order | number | |
| position | PlainText | position | string | |
| team-member-image | Image | teamMemberImage | image | REQUIRED on Sanity side |
| about-content | RichText | aboutContent | portableText | |
| time-at-cloud-employee | PlainText | timeAtCloudEmployee | string | |
| areas-of-expertise | RichText | areasOfExpertise | portableText | |
| linkedin-link | Link | linkedinLink | url | |
| book-a-call-link | Link | bookACallLink | url | |
| hide-from-team-about-page | Switch | hideFromTeamAboutPage | boolean | |

**New fields:** `metaTitle` (BACKFILL, required), `metaDescription` (BACKFILL, required), `locale`.

---

## 7. Reviews → `review` (Tier 1 CMS)

**Source collection:** Reviews (26 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | nameClient | string | Per-type primary override |
| slug | Slug | slug.current | slug | |
| position | PlainText | position | string | |
| order | Number | order | number | |
| testimony-short | PlainText | testimonyShort | text | |
| testimony-paragraph | RichText | testimonyParagraph | portableText | |
| testimony-full-page | RichText | testimonyFullPage | portableText | |
| snippet-for-meta | PlainText | snippetForMeta | string | max 300. Feeds metaDescription if present |
| member-image | Image | memberImage | image | |
| company-logo | Image | companyLogo | image | |
| thumbnail-image | Image | thumbnailImage | image | |
| additional-info | RichText | additionalInfo | portableText | |

**Dropped fields:**
- `featured-in-which-page` (Option) — legacy, replaced by explicit page references (§3.8).
- `webpage-for-testimonial` (Link, marked "No Longer Used" in Webflow).

**New fields:** `metaTitle` (BACKFILL), `metaDescription` (prefers `snippetForMeta`, otherwise BACKFILL), `locale`.

---

## 8. Videos → `video` (Tier 1 CMS)

**Source collection:** Videos (32 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| label | PlainText | label | string | |
| type | Option | type | enum [firesideChats / workingWithUs / interviews] | Normalised |
| team | Option | team | enum (10 values) | Normalised |
| order | Number | order | number | |
| featured | Switch | featured | boolean | |
| main-video-embed-link | Link | mainVideoEmbedLink | url | |
| background-video-preview-link | PlainText | backgroundVideoPreviewLink | string | §3.9 — kept as `string`, not `url`, to tolerate malformed values; validate post-launch |
| vimeo-youtube-standard-link | PlainText | vimeoYoutubeStandardLink | string | Same tolerance rule |
| backup-image | Image | backupImage | image | REQUIRED |
| description-of-video | RichText | descriptionOfVideo | portableText | |
| full-video-transcript | RichText | fullVideoTranscript | portableText | |
| links-mentioned-in-video | RichText | linksMentionedInVideo | portableText | |
| linkedin-profiles-of-speakers-in-video | RichText | linkedinProfilesOfSpeakersInVideo | portableText | |
| tags | multiReference → Tags >> Video Library | tags | reference[] → tag | Filter `category=="videoLibrary"` |
| meta-title | PlainText | metaTitle | string | max 60 |
| meta-description | PlainText | metaDescription | text | 140-160 |

**New fields:** `locale`.

---

## 9. Downloads → `download` (Tier 1 CMS)

**Source collection:** Downloads (5 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| title | PlainText | title | string | |
| featured | Switch | featured | boolean | |
| coming-soon | Switch | comingSoon | boolean | |
| tags | multiReference → Tags >> Downloads | tags | reference[] → tag | Filter `category=="downloads"` |
| main-description | RichText | mainDescription | portableText | |
| header-footer-image | Image | headerFooterImage | image | |
| button-1-text / button-1-link | PlainText / Link | button1Text / button1Link | string / url | |
| button-2-text / button-2-link | same | button2Text / button2Link | same | |
| you-ll-get-tag--1 / you-ll-get-tag--2 / you-ll-get-tag--3 | PlainText | youllGet[] | string[] (max 5) | Packed into array |
| how-to-use-* fields (×4) | various | howToUseIt | object | Packed |
| the-impact-* fields (×3) | various | theImpact | object | Packed |
| faq-title-1..6 / faq-answer-1..6 | PlainText / RichText | faqs | faqItem[] (max 6) | Packed |
| get-it-now-title / get-it-now-description | PlainText / RichText | getItNow | object | Packed |
| meta-title | PlainText | metaTitle | string | |
| meta-description | PlainText | metaDescription | text | |
| open-graph-wide-image | Image | metaThumbnail | image | Renamed to match current field semantics |
| hubspot-form-id | PlainText | hubspotFormId | string | Gated form ID |

**Dropped fields:**
- `code-rich-text` (0% fill rate).
- `you-ll-get-tag--4-2`, `you-ll-get-tag--5-2` (0% fill rate).
- `faq-title---7`, `faq-title---8`, `faq-answer---7`, `faq-answer---8` (0% fill rate).

**New fields:** `locale`.

---

## 10. > Downloads Access Pages → `downloadAccess` (Tier 1 CMS, noindex)

**Source collection:** > Downloads Access Pages (5 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| download-file-link | Link | downloadFileLink | url | REQUIRED |

Routing: `/download-thank-you/[slug]` with `<meta name="robots" content="noindex, nofollow">` applied in the Next.js template (§3.12). GTM `Lead Magnet Form - Confirmed` preserved.

---

## 11. Tools & Quizzes → `tool` (Tier 1 CMS)

**Source collection:** Tools & Quizzes (2 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| sub-header | PlainText | subHeader | string | |
| header-blurb | RichText | headerBlurb | portableText | |
| description | RichText | description | portableText | |
| button-1-text / button-1-link | PlainText / Link | button1Text / button1Link | string / url | |
| button-2-text / button-2-link | same | button2Text / button2Link | same | |
| tool-embed | RichText | toolEmbed | portableText | |
| hidden-code | RichText | hiddenCode | portableText | §3.13 / D3 — Culture Match API key explicitly excluded during migration |
| video-overview | RichText | videoOverview | portableText | |
| faq-title-1..10 / faq-answer-1..10 | PlainText / RichText | faqs | faqItem[] (max 10) | Packed |
| thumbnail | Image | thumbnail | image | |
| meta-title | PlainText | metaTitle | string | |
| blurbs | PlainText | metaDescription | text | Renamed — the Webflow field is mislabelled |
| tags | multiReference → Tags >> Tools & Quizzes | tags | reference[] → tag | Filter `category=="tools"` |
| featured | Switch | featured | boolean | |

Culture Match tool migrates with placeholder content — real tool logic parked post-launch (§3.13 / D18). Placeholder page preserves `/tools/culture-match` URL for SEO.

**New fields:** `locale`.

---

## 12. Book A Call Pages → `bookACall` (Tier 1 CMS)

**Source collection:** Book A Call Pages (6 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | firstName | string | §7.13 override — split on whitespace |
| (n/a — derived) | — | lastName | string | Derived from `name` split |
| slug | Slug | slug.current | slug | Custom source function joins firstName + lastName |
| calendly-embed | RichText | calendlyEmbed | portableText | REQUIRED |
| title | PlainText | metaDescription | text | §3.14 / D9 — the Webflow `title` field is mislabelled; actually contains meta description copy |

**New fields:** `metaTitle` (BACKFILL, required, max 60).

---

## 13. Events & Webinars → `event` (Tier 1 CMS)

**Source collection:** Events & Webinars (1 item)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| date-time | Date/Time | dateTime | datetime | |
| header-description | RichText | headerDescription | portableText | |
| header-description-post-event | RichText | headerDescriptionPostEvent | portableText | |
| header-button-text | PlainText | headerButtonText | string | |
| featured-image | Image | featuredImage | image | |
| thumbnail-image | Image | thumbnailImage | image | |
| topics-* fields (×3) | various | topics | object with header, description, items[] (max 4) | Packed |
| speakers | multiReference → Team Members | speakers | reference[] → teamMember | |
| sign-up-* fields (×3) | various | signUp | object with header, description, formEmbed | Packed |
| on-demand-embed-description | RichText | onDemandEmbedDescription | portableText | |
| event-type | reference → Tags >> Events & Webinars | eventType | reference → tag | Filter `category=="eventsWebinars"` |
| event-category | multiReference → Tags >> Events & Webinars | eventCategory | reference[] → tag | Filter `category=="eventsWebinars"` |
| meta-title | PlainText | metaTitle | string | |
| meta-description | PlainText | metaDescription | text | |

**New fields:** `locale`.

---

## 14. -- Glassdoor reviews → `glassdoorReview` (Tier 1 CMS)

**Source collection:** -- Glassdoor reviews (10 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | clientName | string | Per-type primary override |
| slug | Slug | slug.current | slug | |
| title | PlainText | title | string | |
| review-description | PlainText | reviewDescription | text | |
| work-field | PlainText | workField | string | |

**Dropped fields:**
- `review-link` (Link, 0% fill rate, all links 404) — §3.16.

Consumed by `/for-developers` and `/reviews` via the `glassdoorGrid` section (§4.4 of design doc).

---

## 15. -- Client Benefits & Company Values → `benefitValue` (Tier 1 CMS, reference-only)

**Source collection:** -- Client Benefits & Company Values (9 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| category | Option [benefits / values] | category | enum | |
| thumbnail-image | Image | thumbnailImage | image | |
| paragraph | PlainText | paragraph | string (max 160) | |

No route. Consumed by the `benefitsGrid` section (§3.17).

---

## 16. -- Staff Benefits → `staffBenefit` (Tier 1 CMS, reference-only)

**Source collection:** -- Staff Benefits (6 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| icon | Image | icon | image | |

Consumed by `/for-developers` via the `staffBenefitsGrid` section.

---

## 17. Tags (6 Webflow collections) → `tag` (Tier 1 CMS)

**Source collections (all 6 consolidate per D2 / §3.2):**

- Tags >> Blogs (8 items) → `category: 'blogs'`
- Tags >> Alternatives (4 items) → `category: 'alternatives'`
- Tags >> Tools & Quizzes (3 items) → `category: 'tools'`
- Tags >> Video Library (3 items) → `category: 'videoLibrary'`
- Tags >> Downloads (2 items) → `category: 'downloads'`
- Tags >> Events & Webinars (2 items) → `category: 'eventsWebinars'`

Total: 22 items. Migration script sets `category` based on the source collection.

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | max 100 |
| slug | Slug | slug.current | slug | Unique within category |
| (n/a — derived) | — | category | enum | Set from source collection |
| singular-name | PlainText | singularName | string | Only populated for `eventsWebinars` category |

---

## 18. -- Hubs → `blogCategory` (Tier 1 CMS)

**Source collection:** -- Hubs (6 items)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | name | string | |
| slug | Slug | slug.current | slug | |
| (not preserved) | — | order | number | Optional — populate in Studio post-migration |

Note: the -- Hubs collection in Webflow served as both category metadata AND a static landing page. The metadata portion becomes `blogCategory`; the landing page portion becomes the 6 blog-category `*Hub` singletons (§4.1 / D13).

---

## 19. Legal pages → `privacyPolicyPage` (Tier 2 singleton, §7.14)

**Source collection:** Legal pages (1 item — `/legals/privacy-policy`)

| Webflow field | Webflow type | Sanity field | Sanity type | Notes |
|---|---|---|---|---|
| name | PlainText | title | string | |
| legals-content | RichText | sections[0] | richTextSection | Wrapped in a single section variant |
| meta-description | PlainText | metaDescription | text | |
| slug | Slug | (hardcoded route) | — | `/legals/privacy-policy` — no dynamic slug |

Additional legal pages (terms of service, cookie policy) — deferred to post-launch (§7.14).

---

## 20. DROPPED collections

Migrated: no. See §9 of the design doc for full rationale.

| Collection | Reason |
|---|---|
| Insights (1 item) | Jake confirmed not needed |
| New Blog Templates (5 items) | Webflow design experiment, not live content; replaced by auto-generated TOC (§3.19 / §7.3) |
| -- Lead magnets / Tags (17 items) | Jake confirmed dead — slugs return 404 |

---

## MIGRATION BLOCKS (must clear before LAUNCH)

These are hard blockers flagged for the content migration team. Cutover cannot proceed with any of these outstanding.

| Block | Scope | Resolution |
|---|---|---|
| Backfill `metaTitle` / `metaDescription` on all `technology` items | 101 items | Scrape live `<title>` + `<meta>` for each URL, write to Sanity before launch |
| Backfill `metaTitle` / `metaDescription` on all `service` items | 23 items | Same as above |
| Backfill `metaTitle` / `metaDescription` on all `teamMember` items | 28 items | Same |
| Backfill `metaTitle` on all `review` items | 26 items | Derive from `snippetForMeta` where present, otherwise write fresh |
| Author ref on every `blogPost` and `compareBlog` | 127 items | Seb assigns bulk defaults in Studio (§7.1 / open-question table) |
| `/customer-story/virgin` meta description | 1 item | Placeholder "Customer story in progress..." — CE to rewrite |
| `metaTitle` on all `bookACall` items | 6 items | BACKFILL |
| 4 `UNKNOWN` canonical URLs (tech debt #9) | 4 items | Step 1 of the audit pipeline content-type filter update — deferred to SCHEMA-1 → not SCHEMA-1's scope, tracked for follow-up |

*End of WEBFLOW_TO_SANITY_FIELD_MAP.md v1.0*
