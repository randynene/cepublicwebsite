# CE_SITE_TRUTH

Structured facts about the Cloud Employee Webflow site, derived from `docs/CE_RAW_EXTRACT.md` (which is a verbatim copy of every file under `audit-output/`). Every value below comes from that extract. Nothing is invented; where the extract is silent the entry says `NOT IN EXTRACT`.

- Webflow site: `Cloud Employee` id=`673326831abed6267051fa11`
- Inventory generated at: `2026-04-20T06:10:02.981Z`
- Canonical URL set generated at: `2026-04-21T02:12:53.564Z`
- Interaction analysis generated at: `2026-04-21T03:53:30.455Z`
- Content extraction generated at: `2026-04-21T02:13:30.675Z`
- Screenshots captured at: `2026-04-21T02:17:38.536Z`

Template types observed: `BLOG, BOOK_A_CALL, COMPARE, CUSTOMER_STORY, DOWNLOAD, HOME, REVIEW, SERVICE, STATIC, TAXONOMY, TEAM_MEMBER, TECHNOLOGY, TOOL, UNKNOWN, VIDEO`

---

## SECTION 1: COLLECTION INVENTORY

33 Webflow collections (per `ce-inventory.json.summary.totalCollections`). Total CMS items: 451. `ce-inventory.json.site.locales = []` — the Webflow site has **no native localization** configured. `ce-field-population-summary.json` reports every collection with `localeStrategy = "single-document"` and `ukOverrideFields = []`, meaning no collection has per-locale field overrides in the CMS.

### Team Members

- Slug: `team`
- Singular name: `Team Member`
- Collection ID: `673766d51434465f74c59142`
- Item count (inventory): 28
- Field count: 11
- Template type observed on public URLs: TEAM_MEMBER
- In nav: no (no nav link hits /team or /team/…)
- In footer: no (no footer link hits /team or /team/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0
- Edge-case field fill rates:
  - `book-a-call-link` → 18%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | order | `order` | Number | optional | — | {"format": "integer", "precision": 1, "allowNegative": false} |
| 2 | Position | `position` | PlainText | optional | — | {"singleLine": true} |
| 3 | Team member | `team-member` | Image | optional | — |  |
| 4 | About content | `about-content` | RichText | optional | — |  |
| 5 | Time at CloudEmployee | `time-at-cloudemployee` | PlainText | optional | — | {"singleLine": true} |
| 6 | Areas of Expertise | `areas-of-expertise` | RichText | optional | — |  |
| 7 | Linkedin link | `linkedin-link` | Link | optional | — |  |
| 8 | Book a call link | `book-a-call-link` | Link | optional | — |  |
| 9 | Hide from Team/About Page | `hide-from-team-about-page` | Switch | optional | — |  |
| 10 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 11 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Reviews

- Slug: `reviews`
- Singular name: `Review`
- Collection ID: `673a50eebf20965117e1fa9f`
- Item count (inventory): 26
- Field count: 15
- Template type observed on public URLs: REVIEW
- In nav: no (no nav link hits /reviews or /reviews/…)
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=3
- Edge-case field fill rates:
  - `additional-info` → 36%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Testimony short | `testimony-short` | PlainText | optional | — | {"singleLine": false} |
| 2 | Testimony paragraph | `testimony-paragraph-2` | RichText | optional | — |  |
| 3 | Testimony full page | `testimony-full-page` | RichText | optional | — |  |
| 4 | Snippet for Meta | `snippet-for-meta` | PlainText | optional | — | {"singleLine": true} |
| 5 | Name Client | `name-client` | PlainText | optional | — | {"singleLine": true} |
| 6 | Position | `position` | PlainText | optional | — | {"singleLine": true} |
| 7 | Member image | `member-image` | Image | optional | — |  |
| 8 | Company Logo | `company-logo` | Image | optional | — |  |
| 9 | Thumbnail Image | `thumbnail-image` | Image | optional | — |  |
| 10 | Featured in which page? | `featured-in-which-page` | Option | optional | — | {"options": [{"name": "Featured ", "id": "dad248ab53d405acfead3d019fad766e"}, {"name": "How it works", "id": "c811f4ed9eca3a0c9a49f9b54ed52c2a"}, {"name": "About us", "id": "15458c6e2eb6a66a3df6e80c2d8de41c"}, {"name": "Pricing", "id": "727535aa69e6f00aaa9f5924eadf613d"}, {"name": "Start hiring", "id": "df42b62c30cb4bc6242cac862febd886"}, {"name": "Lead magnet", "id": "501cffde66110603d9ec77a6a21b090d"}]} |
| 11 | Additional info | `additional-info` | RichText | optional | — |  |
| 12 | Order | `order` | Number | optional | — | {"format": "integer", "precision": 1, "allowNegative": false} |
| 13 | Webpage for testimonial (No Longer Used) | `webpage-for-testimonial` | PlainText | optional | — | {"singleLine": true} |
| 14 | Company name | `name` | PlainText | required | — | {"maxLength": 256} |
| 15 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Customers / Customer Stories

- Slug: `customer-story`
- Singular name: `Customers / Customer Story`
- Collection ID: `673a5beebf20965117eab8f4`
- Item count (inventory): 18
- Field count: 34
- Template type observed on public URLs: CUSTOMER_STORY
- In nav: no (no nav link hits /customer-story or /customer-story/…)
- In footer: no (no footer link hits /customer-story or /customer-story/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0
- Edge-case field fill rates:
  - `video-testimonial-if-available` → 35%
  - `video-url-2` → 12%
  - `tldr-content` → 35%
  - `hiring-needs-table` → 18%
  - `video-testimonial-intro-content` → 35%
  - `the-problem-content` → 18%
  - `problem-quote---paragraph` → 18%
  - `problem-quote---person-image` → 18%
  - `problem-quote---person-name` → 18%
  - `problem-quote---person-title` → 18%
  - `the-solution-content` → 18%
  - `solution-quote---paragraph` → 18%
  - `solution-quote---person-image` → 18%
  - `solution-quote---person-name` → 18%
  - `solution-quote---person-title` → 18%
  - `the-impact-content` → 18%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Company Logo (Colour) | `company-logo` | Image | optional | — |  |
| 2 | Order | `order` | Number | optional | — | {"format": "integer", "precision": 1, "allowNegative": false} |
| 3 | Feature in Home Page Header Scrolls | `feature-in-home-page-header-scrolls` | Switch | optional | — |  |
| 4 | Feature in Featured Customers Section | `feature-in-featured-customers-section` | Switch | optional | — |  |
| 5 | Company Product Image | `company-product-image` | Image | optional | — |  |
| 6 | Company People Image | `company-people-image` | Image | optional | — |  |
| 7 | Video Testimonial URL – Full (if available) | `video-testimonial-if-available` | VideoLink | optional | — |  |
| 8 | Video Testimonial URL – Background/Short (if available) | `video-url-2` | PlainText | optional | — | {"singleLine": true} |
| 9 | Customer Story Title | `customer-story-title` | PlainText | optional | — | {"singleLine": true} |
| 10 | TLDR Content | `tldr-content` | RichText | optional | — |  |
| 11 | Hiring Needs Table | `hiring-needs-table` | RichText | optional | — |  |
| 12 | The Customer Content | `the-customer-content` | RichText | optional | — |  |
| 13 | Video Testimonial Intro Content | `video-testimonial-intro-content` | RichText | optional | — |  |
| 14 | The Problem Content | `the-problem-content` | RichText | optional | — |  |
| 15 | Problem Quote - Paragraph | `problem-quote---paragraph` | PlainText | optional | — | {"singleLine": true} |
| 16 | Problem Quote - Person Image | `problem-quote---person-image` | Image | optional | — |  |
| 17 | Problem Quote - Person Name | `problem-quote---person-name` | PlainText | optional | — | {"singleLine": true} |
| 18 | Problem Quote - Person Title | `problem-quote---person-title` | PlainText | optional | — | {"singleLine": true} |
| 19 | The Solution Content | `the-solution-content` | RichText | optional | — |  |
| 20 | Solution Quote - Paragraph | `solution-quote---paragraph` | PlainText | optional | — | {"singleLine": true} |
| 21 | Solution Quote - Person Image | `solution-quote---person-image` | Image | optional | — |  |
| 22 | Solution Quote - Person Name | `solution-quote---person-name` | PlainText | optional | — | {"singleLine": true} |
| 23 | Solution Quote - Person Title | `solution-quote---person-title` | PlainText | optional | — | {"singleLine": true} |
| 24 | The Impact Content | `the-impact-content` | RichText | optional | — |  |
| 25 | Impact Quote - Paragraph | `impact-quote---paragraph` | PlainText | optional | — | {"singleLine": true} |
| 26 | Impact Quote - Person Image | `impact-quote---person-image` | Image | optional | — |  |
| 27 | Impact Quote - Person Name | `impact-quote---person-name` | PlainText | optional | — | {"singleLine": true} |
| 28 | Impact Quote - Person Title | `impact-quote---person-title` | PlainText | optional | — | {"singleLine": true} |
| 29 | CTA Content | `cta-content` | RichText | optional | — |  |
| 30 | Review snippet for google meta | `review-snippet-for-google-meta` | PlainText | optional | — | {"singleLine": false} |
| 31 | Feature on CS Page | `featured-on-cs-page` | Switch | optional | — |  |
| 32 | Thumbnail | `thumbnail` | Image | optional | — |  |
| 33 | Company name | `name` | PlainText | required | — | {"maxLength": 256} |
| 34 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Client Benefits & Company Values

- Slug: `benefits-values`
- Singular name: `-- Client Benefits & Company Value`
- Collection ID: `673b079ec2ec5c9208429616`
- Item count (inventory): 9
- Field count: 5
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /benefits-values — collection may be referenced-only)
- In nav: no (no nav link hits /benefits-values or /benefits-values/…)
- In footer: no (no footer link hits /benefits-values or /benefits-values/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Paragraph | `paragraph` | PlainText | optional | — | {"singleLine": true, "maxLength": 160} |
| 3 | Category | `category` | Option | required | — | {"options": [{"name": "Benefits", "id": "21c13274484fde9403a3d56c33fe7160"}, {"name": "Values", "id": "c0ffb288e564af046e3d5dfe99d1b52f"}]} |
| 4 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 5 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Legal pages

- Slug: `legals`
- Singular name: `Legal page`
- Collection ID: `673b0e5be824148d8429f0f4`
- Item count (inventory): 1
- Field count: 4
- Template type observed on public URLs: STATIC
- In nav: no (no nav link hits /legals or /legals/…)
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=1

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Legals content | `legals-content` | RichText | optional | — |  |
| 2 | Meta Description | `meta-description` | PlainText | optional | — | {"singleLine": true} |
| 3 | Legal title | `name` | PlainText | required | — | {"maxLength": 256} |
| 4 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Staff Benefits

- Slug: `enjoy-marquee`
- Singular name: `-- Staff Benefit`
- Collection ID: `673db88247fa67e4e5718326`
- Item count (inventory): 6
- Field count: 3
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /enjoy-marquee — collection may be referenced-only)
- In nav: no (no nav link hits /enjoy-marquee or /enjoy-marquee/…)
- In footer: no (no footer link hits /enjoy-marquee or /enjoy-marquee/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Icon | `icon` | Image | optional | — |  |
| 2 | Enjoy title | `name` | PlainText | required | — | {"maxLength": 256} |
| 3 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Blogs & Guides

- Slug: `blog`
- Singular name: `Blogs & Guide`
- Collection ID: `67459ce1ce88de64c07213a7`
- Item count (inventory): 31
- Field count: 26
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /blog — collection may be referenced-only)
- In nav: yes
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=31
- Edge-case field fill rates:
  - `author-2` → 23%
  - `faq-title-5` → 32%
  - `faq-content-5` → 32%
  - `faq-title-6` → 10%
  - `faq-content-6` → 10%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Resource category | `resource-category` | Reference | required | -- Hubs |  |
| 8 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 9 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 10 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": true} |
| 11 | Featured? | `featured` | Switch | optional | — |  |
| 12 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 15 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 17 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 19 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 21 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 23 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 25 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 26 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Hubs

- Slug: `hubs`
- Singular name: `-- Hub`
- Collection ID: `67459cfaa9262fed6e8eb9d9`
- Item count (inventory): 6
- Field count: 4
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /hubs — collection may be referenced-only)
- In nav: no (no nav link hits /hubs or /hubs/…)
- In footer: no (no footer link hits /hubs or /hubs/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Order | `order` | Number | required | — | {"format": "integer", "precision": 1, "allowNegative": false} |
| 2 | Link to Hub Static Page | `link-to-hub-static-page` | Link | required | — |  |
| 3 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 4 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Downloads

- Slug: `download`
- Singular name: `Download`
- Collection ID: `6749e40f04d10cf9b88d5bb3`
- Item count (inventory): 5
- Field count: 46
- Template type observed on public URLs: DOWNLOAD
- In nav: no (no nav link hits /download or /download/…)
- In footer: no (no footer link hits /download or /download/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=3
- Edge-case field fill rates:
  - `code-rich-text` → 0%
  - `you-ll-get-tag--4-2` → 0%
  - `you-ll-get-tag--5-2` → 0%
  - `faq-title---7` → 0%
  - `faq-answer---7` → 0%
  - `faq-title---8` → 0%
  - `faq-answer---8` → 0%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Featured | `featured` | Switch | optional | — |  |
| 2 | Coming soon | `coming-soon` | Switch | optional | — |  |
| 3 | Tags | `tags` | MultiReference | optional | -- Tags >> Downloads |  |
| 4 | Title | `title` | PlainText | optional | — | {"singleLine": true} |
| 5 | Header Description | `main-description` | RichText | optional | — |  |
| 6 | Button Text - 1 | `button-text---1` | PlainText | optional | — | {"singleLine": true} |
| 7 | Button Link - 1 | `button-link---1` | Link | optional | — |  |
| 8 | Button Text - 2 | `button-text---2` | PlainText | optional | — | {"singleLine": true} |
| 9 | Button Link - 2 | `button-link---2` | Link | optional | — |  |
| 10 | Gated Button - Add HubSpot Form Here (Code rich text) | `code-rich-text` | RichText | optional | — |  |
| 11 | Header & Footer Image | `benefits-image` | Image | optional | — |  |
| 12 | You’ll get ( Tag -1 ) | `you-ll-get-tag--1` | PlainText | optional | — | {"singleLine": true} |
| 13 | You’ll get ( Tag -2 ) | `you-ll-get-tag--2` | PlainText | optional | — | {"singleLine": true} |
| 14 | You’ll get ( Tag -3 ) | `you-ll-get-tag--3` | PlainText | optional | — | {"singleLine": true} |
| 15 | You'll get ( Tag -4) | `you-ll-get-tag--4-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | You'll get ( Tag -5) | `you-ll-get-tag--5-2` | PlainText | optional | — | {"singleLine": true} |
| 17 | How To Use It Video Thumbnail | `how-to-use-it-video-thumbnail` | Image | optional | — |  |
| 18 | How To Use It Video Link | `how-to-use-it-video-link` | VideoLink | optional | — |  |
| 19 | How To Use It Title | `how-to-use-it-title` | PlainText | optional | — | {"singleLine": true} |
| 20 | How To Use It Description | `how-to-use-it-description` | RichText | optional | — |  |
| 21 | The Impact Image | `thumbnail-image` | Image | optional | — |  |
| 22 | The Impact Title | `benefits-title` | PlainText | optional | — | {"singleLine": true} |
| 23 | The Impact Description | `the-impact-description` | RichText | optional | — |  |
| 24 | FAQ Title - 1 | `faq-title---1` | PlainText | optional | — | {"singleLine": true} |
| 25 | FAQ Answer - 1 | `faq-answer---1` | RichText | optional | — |  |
| 26 | FAQ Title - 2 | `faq-title---2` | PlainText | optional | — | {"singleLine": true} |
| 27 | FAQ Answer - 2 | `faq-answer---2` | RichText | optional | — |  |
| 28 | FAQ Title - 3 | `faq-title---3` | PlainText | optional | — | {"singleLine": true} |
| 29 | FAQ Answer - 3 | `faq-answer---3` | RichText | optional | — |  |
| 30 | FAQ Title - 4 | `faq-title---4` | PlainText | optional | — | {"singleLine": true} |
| 31 | FAQ Answer - 4 | `faq-answer---4` | RichText | optional | — |  |
| 32 | FAQ Title - 5 | `faq-title---5` | PlainText | optional | — | {"singleLine": true} |
| 33 | FAQ Answer - 5 | `faq-answer---5` | RichText | optional | — |  |
| 34 | FAQ Title - 6 | `faq-title---6` | PlainText | optional | — | {"singleLine": true} |
| 35 | FAQ Answer - 6 | `faq-answer---6` | RichText | optional | — |  |
| 36 | FAQ Title - 7 | `faq-title---7` | PlainText | optional | — | {"singleLine": true} |
| 37 | FAQ Answer - 7 | `faq-answer---7` | RichText | optional | — |  |
| 38 | FAQ Title - 8 | `faq-title---8` | PlainText | optional | — | {"singleLine": true} |
| 39 | FAQ Answer - 8 | `faq-answer---8` | RichText | optional | — |  |
| 40 | Get It Now Title | `get-it-now-title` | PlainText | optional | — | {"singleLine": true} |
| 41 | Get It Now Description | `get-it-now-description` | RichText | optional | — |  |
| 42 | Meta Title | `meta-title` | PlainText | optional | — | {"singleLine": true} |
| 43 | Meta Description | `meta-description` | PlainText | optional | — | {"singleLine": true} |
| 44 | Meta Thumbnail | `meta-thunbnail` | Image | optional | — |  |
| 45 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 46 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Lead magnets / Tags

- Slug: `lead-magnets-tags`
- Singular name: `-- Lead magnets / Tag`
- Collection ID: `6749ed4c54cff57bfe2f2ec5`
- Item count (inventory): 17
- Field count: 2
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /lead-magnets-tags — collection may be referenced-only)
- In nav: no (no nav link hits /lead-magnets-tags or /lead-magnets-tags/…)
- In footer: no (no footer link hits /lead-magnets-tags or /lead-magnets-tags/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 2 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Glassdoor reviews

- Slug: `glassdoor-reviews`
- Singular name: `-- Glassdoor review`
- Collection ID: `674ef8fc1f14b706295a5f3f`
- Item count (inventory): 10
- Field count: 6
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /glassdoor-reviews — collection may be referenced-only)
- In nav: no (no nav link hits /glassdoor-reviews or /glassdoor-reviews/…)
- In footer: no (no footer link hits /glassdoor-reviews or /glassdoor-reviews/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0
- Edge-case field fill rates:
  - `review-link` → 0%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Title | `title` | PlainText | optional | — | {"singleLine": true} |
| 2 | Review description | `review-description` | PlainText | optional | — | {"singleLine": true} |
| 3 | Work field | `work-field` | PlainText | optional | — | {"singleLine": true} |
| 4 | Review link | `review-link` | Link | optional | — |  |
| 5 | Client name | `name` | PlainText | required | — | {"maxLength": 256} |
| 6 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Technology Pages

- Slug: `technology`
- Singular name: `Technology Page`
- Collection ID: `67bcf13e56583ba5581b1d38`
- Item count (inventory): 101
- Field count: 43
- Template type observed on public URLs: TECHNOLOGY
- In nav: yes
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=5
- Edge-case field fill rates:
  - `fold-1---featured-image` → 0%
  - `thumbnail` → 0%
  - `faq-schema-2` → 5%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | List Item Only | `list-item-only` | Switch | optional | — |  |
| 2 | Developer Name | `technology-name` | PlainText | optional | — | {"singleLine": true} |
| 3 | Order | `order` | Number | optional | — | {"format": "integer", "precision": 1, "allowNegative": false} |
| 4 | Short Label | `short-description` | PlainText | optional | — | {"singleLine": true} |
| 5 | Tech Logo | `tech-logo` | Image | optional | — |  |
| 6 | Fold 1 - Header Pre | `header-blurb` | PlainText | optional | — | {"singleLine": true} |
| 7 | Fold 1 - Paragraph | `fold-1---paragraph` | RichText | optional | — |  |
| 8 | Fold 1 - Bullet 1 | `section-1-label` | PlainText | optional | — | {"singleLine": true} |
| 9 | Fold 1 - Bullet 2 | `section-1-header` | PlainText | optional | — | {"singleLine": true} |
| 10 | Fold 1 - Bullet 3 | `section-1-description` | PlainText | optional | — | {"singleLine": false} |
| 11 | Fold 1 - Featured Image | `fold-1---featured-image` | Image | optional | — |  |
| 12 | Fold 2 - Label | `focus-1-title` | PlainText | optional | — | {"singleLine": true} |
| 13 | Fold 2 - Header | `focus-1-blurb` | PlainText | optional | — | {"singleLine": true} |
| 14 | Fold 2 - Paragraph | `fold-2---paragraph` | RichText | optional | — |  |
| 15 | Fold 2 - Bullet 1 | `focus-2-title` | PlainText | optional | — | {"singleLine": true} |
| 16 | Fold 2 - Bullet 2 | `focus-2-blurb` | PlainText | optional | — | {"singleLine": true} |
| 17 | Fold 2 - Bullet 3 | `focus-3-title` | PlainText | optional | — | {"singleLine": true} |
| 18 | Fold 3 - Label | `focus-3-blurb` | PlainText | optional | — | {"singleLine": true} |
| 19 | Fold 3 - Header | `focus-4-title` | PlainText | optional | — | {"singleLine": true} |
| 20 | Fold 3 - Item 1 Header | `focus-4-blurb` | PlainText | optional | — | {"singleLine": true} |
| 21 | Fold 3 - Item 1 Description | `fold-3---item-1-description` | PlainText | optional | — | {"singleLine": true} |
| 22 | Fold 3 - Item 2 Header | `fold-3---item-2-header` | PlainText | optional | — | {"singleLine": true} |
| 23 | Fold 3 - Item 2 Description | `fold-3---item-2-description` | PlainText | optional | — | {"singleLine": true} |
| 24 | Fold 3 - Item 3 Header | `fold-3---item-3-header` | PlainText | optional | — | {"singleLine": true} |
| 25 | Fold 3 - Item 3 Description | `fold-3---item-3-description` | PlainText | optional | — | {"singleLine": true} |
| 26 | Fold 3 - Item 4 Header | `fold-3---item-4-header` | PlainText | optional | — | {"singleLine": true} |
| 27 | Fold 3 - Item 4 Description | `fold-3---item-4-description` | PlainText | optional | — | {"singleLine": true} |
| 28 | Fold 3 - Item 5 Header | `fold-3---item-5-header` | PlainText | optional | — | {"singleLine": true} |
| 29 | Fold 3 - Item 5 Description | `fold-3---item-5-description` | PlainText | optional | — | {"singleLine": true} |
| 30 | Fold 3 - Item 6 Header | `fold-3---item-6-header` | PlainText | optional | — | {"singleLine": true} |
| 31 | Fold 3 - Item 6 Description | `fold-3---item-6-description` | PlainText | optional | — | {"singleLine": true} |
| 32 | Fold 5 - Label | `fold-5---label` | PlainText | optional | — | {"singleLine": true} |
| 33 | Fold 5 - Header | `fold-5---header` | PlainText | optional | — | {"singleLine": true} |
| 34 | Fold 5 - Description | `fold-5---description` | RichText | optional | — |  |
| 35 | Fold 5 - Bullet 1 | `fold-5---bullet-1` | PlainText | optional | — | {"singleLine": true} |
| 36 | Fold 5 - Bullet 2 | `fold-5---bullet-2` | PlainText | optional | — | {"singleLine": true} |
| 37 | Fold 5 - Bullet 3 | `fold-5---bullet-3` | PlainText | optional | — | {"singleLine": true} |
| 38 | Fold 6 - Label | `fold-6---label` | PlainText | optional | — | {"singleLine": true} |
| 39 | Fold 6 - Header | `fold-6---header` | PlainText | optional | — | {"singleLine": true} |
| 40 | Thumbnail | `thumbnail` | Image | optional | — |  |
| 41 | FAQ Schema | `faq-schema-2` | PlainText | optional | — | {"singleLine": false} |
| 42 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 43 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### > Downloads Access Pages

- Slug: `download-thank-you`
- Singular name: `> Downloads Access Page`
- Collection ID: `67e18cb55008a1170e325a83`
- Item count (inventory): 5
- Field count: 3
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /download-thank-you — collection may be referenced-only)
- In nav: no (no nav link hits /download-thank-you or /download-thank-you/…)
- In footer: no (no footer link hits /download-thank-you or /download-thank-you/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Download File Link | `download-file-link` | Link | optional | — |  |
| 2 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 3 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Services

- Slug: `services`
- Singular name: `Service`
- Collection ID: `6838a76ae8981810f6c2089b`
- Item count (inventory): 23
- Field count: 47
- Template type observed on public URLs: SERVICE
- In nav: yes
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0
- Edge-case field fill rates:
  - `thumbnail` → 0%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Type | `type` | Option | required | — | {"options": [{"name": "Staff Augmentation", "id": "e65d0cf07ca57468720af519be368349"}, {"name": "Product Builds", "id": "d087a0a41606a705a43030a0ecc2f35b"}, {"name": "Consulting Services", "id": "5366828a84793dd582697f1bc0fd19c3"}]} |
| 2 | Order | `order` | Number | optional | — | {"format": "integer", "precision": 1, "allowNegative": false} |
| 3 | AI Offering? | `ai-offering` | Switch | optional | — |  |
| 4 | Location? | `location` | Switch | optional | — |  |
| 5 | Prefix | `prefix` | Option | optional | — | {"options": [{"name": "Hire", "id": "c78e22c58a9af1f506af55fed0ff4011"}, {"name": "Build", "id": "1cd523f050224f6c79b856e1b797be28"}, {"name": "Expert", "id": "4fa71c045ab6f3940bf783413020e219"}, {"name": "End-to-End", "id": "7b115bb333dd0d7faf4db96ffde91925"}]} |
| 6 | Short Label | `short-label` | PlainText | optional | — | {"singleLine": true} |
| 7 | Fold 1 - Header Pre | `fold-1---header-pre` | PlainText | optional | — | {"singleLine": true} |
| 8 | Fold 1 - Paragraph | `fold-1---paragraph` | RichText | optional | — |  |
| 9 | Fold 1 - Bullet 1 | `fold-1---bullet-1` | PlainText | optional | — | {"singleLine": true} |
| 10 | Fold 1 - Bullet 2 | `fold-1---bullet-2` | PlainText | optional | — | {"singleLine": true} |
| 11 | Fold 1 - Bullet 3 | `fold-1---bullet-3` | PlainText | optional | — | {"singleLine": true} |
| 12 | Fold 1 - Featured Image | `fold-1---featured-image` | Image | optional | — |  |
| 13 | Fold 2 - Label | `fold-2---label` | PlainText | optional | — | {"singleLine": true} |
| 14 | Fold 2 - Header | `fold-2---header` | PlainText | optional | — | {"singleLine": true} |
| 15 | Fold 2 - Paragraph | `fold-2---paragraph-2` | RichText | optional | — |  |
| 16 | Fold 2 - Bullet 1 | `fold-2---bullet-1` | PlainText | optional | — | {"singleLine": true} |
| 17 | Fold 2 - Bullet 2 | `fold-2---bullet-2` | PlainText | optional | — | {"singleLine": true} |
| 18 | Fold 2 - Bullet 3 | `fold-2---bullet-3` | PlainText | optional | — | {"singleLine": true} |
| 19 | Fold 2 - Featured Image | `fold-2---featured-image` | Image | optional | — |  |
| 20 | Fold 3 - Label | `fold-3---label` | PlainText | optional | — | {"singleLine": true} |
| 21 | Fold 3 - Header | `fold-3---header` | PlainText | optional | — | {"singleLine": true} |
| 22 | Fold 3 - Item 1 Header | `fold-3---item-1-header` | PlainText | optional | — | {"singleLine": true} |
| 23 | Fold 3 - Item 1 Description | `fold-3---item-1-description` | PlainText | optional | — | {"singleLine": true} |
| 24 | Fold 3 - Item 2 Header | `fold-3---item-2-header` | PlainText | optional | — | {"singleLine": true} |
| 25 | Fold 3 - Item 2 Description | `fold-3---item-2-description` | PlainText | optional | — | {"singleLine": true} |
| 26 | Fold 3 - Item 3 Header | `fold-3---item-3-header` | PlainText | optional | — | {"singleLine": true} |
| 27 | Fold 3 - Item 3 Description | `fold-3---item-3-description` | PlainText | optional | — | {"singleLine": true} |
| 28 | Fold 3 - Item 4 Header | `fold-3---item-4-header` | PlainText | optional | — | {"singleLine": true} |
| 29 | Fold 3 - Item 4 Description | `fold-3---item-4-description` | PlainText | optional | — | {"singleLine": true} |
| 30 | Fold 3 - Item 5 Header | `fold-3---item-5-header` | PlainText | optional | — | {"singleLine": true} |
| 31 | Fold 3 - Item 5 Description | `fold-3---item-5-description` | PlainText | optional | — | {"singleLine": true} |
| 32 | Fold 3 - Item 6 Header | `fold-3---item-6-header` | PlainText | optional | — | {"singleLine": true} |
| 33 | Fold 3 - Item 6 Description | `fold-3---item-6-description` | PlainText | optional | — | {"singleLine": true} |
| 34 | Fold 4 - Label | `fold-4---label` | PlainText | optional | — | {"singleLine": true} |
| 35 | Fold 4 - Header | `fold-4---header` | PlainText | optional | — | {"singleLine": true} |
| 36 | Associated Technologies | `associated-technologies` | MultiReference | optional | Technology Pages |  |
| 37 | Fold 5 - Label | `fold-5---label` | PlainText | optional | — | {"singleLine": true} |
| 38 | Fold 5 - Header | `fold-5---header` | PlainText | optional | — | {"singleLine": true} |
| 39 | Fold 5 - Description | `fold-5---description` | RichText | optional | — |  |
| 40 | Fold 5 - Bullet 1 | `fold-5---bullet-1` | PlainText | optional | — | {"singleLine": true} |
| 41 | Fold 5 - Bullet 2 | `fold-5---bullet-2` | PlainText | optional | — | {"singleLine": true} |
| 42 | Fold 5 - Bullet 3 | `fold-5---bullet-3` | PlainText | optional | — | {"singleLine": true} |
| 43 | Fold 6 - Label | `fold-6---label` | PlainText | optional | — | {"singleLine": true} |
| 44 | Fold 6 - Header | `fold-6---header` | PlainText | optional | — | {"singleLine": true} |
| 45 | Thumbnail | `thumbnail` | Image | optional | — |  |
| 46 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 47 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Videos

- Slug: `videos`
- Singular name: `Video`
- Collection ID: `685d8ce311e274210e36fdca`
- Item count (inventory): 32
- Field count: 17
- Template type observed on public URLs: VIDEO
- In nav: no (no nav link hits /videos or /videos/…)
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=10
- Edge-case field fill rates:
  - `order` → 28%
  - `links-mentioned-in-video` → 3%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Label (Short name like "Talent Retention") | `label-short-name-like-talent-retention` | PlainText | optional | — | {"singleLine": true} |
| 2 | Type | `type` | Option | optional | — | {"options": [{"name": "Fireside chats", "id": "f377b753284683707bf26d78b16f3d22"}, {"name": "Working with us", "id": "2c9a1df1500b980f47ffa6b8b7162966"}, {"name": "Interviews", "id": "c32b305a761bb6212f4970930858f8e4"}]} |
| 3 | Main Video Embed Link | `main-video-embed-link` | VideoLink | optional | — |  |
| 4 | Background Video Preview Link | `background-video-preview-link` | PlainText | optional | — | {"singleLine": true} |
| 5 | Vimeo/Youtube Standard Link | `vimeo-youtube-standard-link` | PlainText | optional | — | {"singleLine": true} |
| 6 | Default/Thumbnail Image | `backup-image` | Image | optional | — |  |
| 7 | Team | `team` | Option | optional | — | {"options": [{"name": "Talent Success Team", "id": "7e7e77d117a7a010c4a02d23c74dc15d"}, {"name": "Client Success Team", "id": "a08bf3ba88a4f4a985663018f094ea0e"}, {"name": "People and Culture Team", "id": "a9fe0a246265f92967a3ac1eb588d2e9"}, {"name": "Engineering Team", "id": "212f2a678fd28dcae69372a3aab19e33"}, {"name": "Leadership Team", "id": "b2b408cf59f47e30c5f62adc027b451f"}, {"name": "Talent Recruitment Team", "id": "4dde7a67da2865102be3c86662ee0f4f"}, {"name": "Technical Vetting Team", "id": "d6745e01c211f2c60b160e5376606242"}, {"name": "HR, Compliance and Legal Team", "id": "1990d0d235fd74bf88dd0d13728b2774"}, {"name": "Learning & Development Team", "id": "09c4647ad53212f008cca04e5fb80d7a"}, {"name": "Employee Experience Team", "id": "58c5f762c2d793b4f8e22a2c4ef691b3"}]} |
| 8 | Order | `order` | Number | optional | — | {"format": "integer", "precision": 1, "allowNegative": false} |
| 9 | Description of video | `description-of-video` | RichText | optional | — |  |
| 10 | Full Video Transcript | `full-video-transcript` | RichText | optional | — |  |
| 11 | Links Mentioned in Video | `links-mentioned-in-video` | RichText | optional | — |  |
| 12 | LinkedIn Profiles of speakers in Video | `linkedin-profiles-of-speakers-in-video` | RichText | optional | — |  |
| 13 | Tags | `tags` | MultiReference | optional | -- Tags >> Video Library |  |
| 14 | Featured | `featured` | Switch | optional | — |  |
| 15 | Meta Description | `meta-description` | PlainText | optional | — | {"singleLine": true} |
| 16 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 17 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Tags >> Blogs

- Slug: `tags`
- Singular name: `-- Tags >> Blog`
- Collection ID: `68a75db7c8e5e19116c69835`
- Item count (inventory): 8
- Field count: 2
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /tags — collection may be referenced-only)
- In nav: no (no nav link hits /tags or /tags/…)
- In footer: no (no footer link hits /tags or /tags/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 2 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Tags >> Downloads

- Slug: `tags-downloads`
- Singular name: `-- Tags >> Download`
- Collection ID: `68acd74f1f02ea30f900f25a`
- Item count (inventory): 2
- Field count: 2
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /tags-downloads — collection may be referenced-only)
- In nav: no (no nav link hits /tags-downloads or /tags-downloads/…)
- In footer: no (no footer link hits /tags-downloads or /tags-downloads/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 2 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Tags >> Tools & Quizzes

- Slug: `tags-tools-quizzes`
- Singular name: `-- Tags >> Tools & Quiz`
- Collection ID: `68adfbb8b04bf90be89253c8`
- Item count (inventory): 3
- Field count: 2
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /tags-tools-quizzes — collection may be referenced-only)
- In nav: no (no nav link hits /tags-tools-quizzes or /tags-tools-quizzes/…)
- In footer: no (no footer link hits /tags-tools-quizzes or /tags-tools-quizzes/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=1

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 2 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Tags >> Video Library

- Slug: `tags-video-library`
- Singular name: `-- Tags >> Video Library`
- Collection ID: `68adfc4b958d615bd521b67d`
- Item count (inventory): 3
- Field count: 2
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /tags-video-library — collection may be referenced-only)
- In nav: no (no nav link hits /tags-video-library or /tags-video-library/…)
- In footer: no (no footer link hits /tags-video-library or /tags-video-library/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 2 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Tags >> Events & Webinars

- Slug: `tags-events-webinars`
- Singular name: `-- Tags >> Events & Webinar`
- Collection ID: `68adfc67a5687dd561c0d476`
- Item count (inventory): 2
- Field count: 3
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /tags-events-webinars — collection may be referenced-only)
- In nav: no (no nav link hits /tags-events-webinars or /tags-events-webinars/…)
- In footer: no (no footer link hits /tags-events-webinars or /tags-events-webinars/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Singular Name | `singular-name` | PlainText | optional | — | {"singleLine": true} |
| 2 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 3 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Tools & Quizzes

- Slug: `tools`
- Singular name: `Tools & Quiz`
- Collection ID: `68b893c2861ab8104a00477f`
- Item count (inventory): 2
- Field count: 36
- Template type observed on public URLs: TOOL
- In nav: no (no nav link hits /tools or /tools/…)
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Sub Header | `sub-header` | PlainText | optional | — | {"singleLine": true} |
| 2 | Header Blurb | `header-blurb` | RichText | optional | — |  |
| 3 | Button 1 Text | `button-1-text` | PlainText | optional | — | {"singleLine": true} |
| 4 | Button 1 Link | `button-1-link` | Link | optional | — |  |
| 5 | Button 2 Text | `button-2-text` | PlainText | optional | — | {"singleLine": true} |
| 6 | Button 2 Link | `button-2-link` | Link | optional | — |  |
| 7 | Tool/Quiz (Embed) | `tool-embed` | RichText | optional | — |  |
| 8 | Hidden Code | `hidden-code` | RichText | optional | — |  |
| 9 | Video Overview | `video-overview` | RichText | optional | — |  |
| 10 | Description | `description` | RichText | optional | — |  |
| 11 | FAQ Header 1 | `faq-header-1` | PlainText | optional | — | {"singleLine": true} |
| 12 | FAQ Answer 1 | `faq-answer-1` | RichText | optional | — |  |
| 13 | FAQ Header 2 | `faq-header-2` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Answer 2 | `faq-answer-2` | RichText | optional | — |  |
| 15 | FAQ Header 3 | `faq-header-3` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Answer 3 | `faq-answer-3` | RichText | optional | — |  |
| 17 | FAQ Header 4 | `faq-header-4` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Answer 4 | `faq-answer-4` | RichText | optional | — |  |
| 19 | FAQ Header 5 | `faq-header-5` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Answer 5 | `faq-answer-5` | RichText | optional | — |  |
| 21 | FAQ Header 6 | `faq-header-6` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Answer 6 | `faq-answer-6` | RichText | optional | — |  |
| 23 | FAQ Header 7 | `faq-header-7` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Answer 7 | `faq-answer-7` | RichText | optional | — |  |
| 25 | FAQ Header 8 | `faq-header-8` | PlainText | optional | — | {"singleLine": true} |
| 26 | FAQ Answer 8 | `faq-answer-8` | RichText | optional | — |  |
| 27 | FAQ Header 9 | `faq-header-9` | PlainText | optional | — | {"singleLine": true} |
| 28 | FAQ Answer 9 | `faq-answer-9` | RichText | optional | — |  |
| 29 | FAQ Header 10 | `faq-header-10` | PlainText | optional | — | {"singleLine": true} |
| 30 | FAQ Answer 10 | `faq-answer-10` | RichText | optional | — |  |
| 31 | Thumbnail | `thumbnail` | Image | optional | — |  |
| 32 | Meta Description | `blurbs` | PlainText | optional | — | {"singleLine": false} |
| 33 | Tags | `tags` | MultiReference | optional | -- Tags >> Tools & Quizzes |  |
| 34 | Featured? | `featured` | Switch | optional | — |  |
| 35 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 36 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Book A Call Pages

- Slug: `book-a-call`
- Singular name: `Book A Call Page`
- Collection ID: `68cc200833fe6f7277646d72`
- Item count (inventory): 6
- Field count: 5
- Template type observed on public URLs: BOOK_A_CALL
- In nav: no (no nav link hits /book-a-call or /book-a-call/…)
- In footer: no (no footer link hits /book-a-call or /book-a-call/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Last name | `last-name` | PlainText | required | — | {"singleLine": true} |
| 2 | Calendly Embed | `calendly-embed` | RichText | required | — |  |
| 3 | Meta Description | `title` | PlainText | required | — | {"singleLine": false} |
| 4 | First Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 5 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Compare Blogs

- Slug: `compare`
- Singular name: `Compare Blog`
- Collection ID: `68d2ef79fb8136fee577c68e`
- Item count (inventory): 29
- Field count: 25
- Template type observed on public URLs: COMPARE
- In nav: no (no nav link hits /compare or /compare/…)
- In footer: yes
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=3
- Edge-case field fill rates:
  - `faq-title-6` → 24%
  - `faq-content-6` → 24%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Tags | `tags-2` | MultiReference | required | -- Tags >> Alternatives |  |
| 8 | Meta Title | `meta-title` | PlainText | optional | — | {"singleLine": true} |
| 9 | Meta Description | `meta-description` | PlainText | optional | — | {"singleLine": true} |
| 10 | Featured? | `featured` | Switch | optional | — |  |
| 11 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 12 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 13 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 14 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 15 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 16 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 17 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 18 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 19 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 20 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 21 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 22 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 23 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 24 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 25 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### -- Tags >> Alternatives

- Slug: `tags-alternatives`
- Singular name: `-- Tags >> Alternative`
- Collection ID: `68d2f613feb6d6f660a9e95c`
- Item count (inventory): 4
- Field count: 2
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /tags-alternatives — collection may be referenced-only)
- In nav: no (no nav link hits /tags-alternatives or /tags-alternatives/…)
- In footer: no (no footer link hits /tags-alternatives or /tags-alternatives/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 2 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Events & Webinars

- Slug: `events`
- Singular name: `Events & Webinar`
- Collection ID: `68d585745aa126329fe687ee`
- Item count (inventory): 1
- Field count: 28
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /events — collection may be referenced-only)
- In nav: no (no nav link hits /events or /events/…)
- In footer: no (no footer link hits /events or /events/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=1
- Edge-case field fill rates:
  - `on-demand-embed-description` → 0%
  - `event-type` → 0%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Date & Time | `date-time` | DateTime | required | — | {"format": "date-time"} |
| 2 | Header Description | `header-description` | RichText | optional | — |  |
| 3 | Header Description - Post Event | `header-description---post-event` | RichText | optional | — |  |
| 4 | Header Button Text | `header-button-text` | PlainText | optional | — | {"singleLine": true} |
| 5 | Featured Image | `featured-image` | Image | optional | — |  |
| 6 | Topics Header | `topics-header` | PlainText | optional | — | {"singleLine": true} |
| 7 | Topics Description | `topics-description` | RichText | optional | — |  |
| 8 | Topics Section - Title 1 | `topics-section---title-1` | PlainText | optional | — | {"singleLine": true} |
| 9 | Topics Section - Description 1 | `topics-section---description-1` | PlainText | optional | — | {"singleLine": false} |
| 10 | Topics Section - Title 2 | `topics-section---title-2` | PlainText | optional | — | {"singleLine": true} |
| 11 | Topics Section - Description 2 | `topics-section---description-2` | PlainText | optional | — | {"singleLine": false} |
| 12 | Topics Section - Title 3 | `topics-section---title-3` | PlainText | optional | — | {"singleLine": true} |
| 13 | Topics Section - Description 3 | `topics-section---description-3` | PlainText | optional | — | {"singleLine": false} |
| 14 | Topics Section - Title 4 (Optional) | `topics-section---title-4` | PlainText | optional | — | {"singleLine": true} |
| 15 | Topics Section - Description 4 (Optional) | `topics-section---description-4` | PlainText | optional | — | {"singleLine": false} |
| 16 | Speakers Header | `speakers-header` | PlainText | optional | — | {"singleLine": true} |
| 17 | Speakers | `speakers` | MultiReference | optional | Team Members |  |
| 18 | Sign-up Header | `sign-up-header` | PlainText | optional | — | {"singleLine": true} |
| 19 | Sign-up Description | `sign-up-description` | RichText | optional | — |  |
| 20 | Sign-up Form Embed | `sign-up-form-embed` | RichText | optional | — |  |
| 21 | On-Demand Embed & Description | `on-demand-embed-description` | RichText | optional | — |  |
| 22 | Meta Title | `meta-title` | PlainText | optional | — | {"singleLine": true} |
| 23 | Meta Description | `meta-description` | PlainText | optional | — | {"singleLine": false} |
| 24 | Thumbnail Image | `thumbnail-image` | Image | optional | — |  |
| 25 | Event Type | `event-type` | Reference | optional | -- Tags >> Events & Webinars |  |
| 26 | Event Category | `event-category` | MultiReference | optional | -- Tags >> Events & Webinars |  |
| 27 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 28 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Staff Augmentation Blogs

- Slug: `staff-augmentation`
- Singular name: `Staff Augmentation Blog`
- Collection ID: `68f65c9a068e55b032b196ab`
- Item count (inventory): 28
- Field count: 26
- Template type observed on public URLs: BLOG
- In nav: no (no nav link hits /staff-augmentation or /staff-augmentation/…)
- In footer: no (no footer link hits /staff-augmentation or /staff-augmentation/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=3
- Edge-case field fill rates:
  - `faq-title-6` → 29%
  - `faq-content-6` → 29%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Resource category | `resource-category` | Reference | required | -- Hubs |  |
| 8 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 9 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 10 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": true} |
| 11 | Featured? | `featured` | Switch | optional | — |  |
| 12 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 15 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 17 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 19 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 21 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 23 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 25 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 26 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Hiring Tips Blogs

- Slug: `hiring-tips`
- Singular name: `Hiring Tips Blog`
- Collection ID: `68f65d2c0e71fdbba5046b0e`
- Item count (inventory): 7
- Field count: 26
- Template type observed on public URLs: BLOG
- In nav: no (no nav link hits /hiring-tips or /hiring-tips/…)
- In footer: no (no footer link hits /hiring-tips or /hiring-tips/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=1
- Edge-case field fill rates:
  - `faq-title-5` → 14%
  - `faq-content-5` → 14%
  - `faq-title-6` → 0%
  - `faq-content-6` → 0%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Resource category | `resource-category` | Reference | required | -- Hubs |  |
| 8 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 9 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 10 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": true} |
| 11 | Featured? | `featured` | Switch | optional | — |  |
| 12 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 15 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 17 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 19 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 21 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 23 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 25 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 26 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Nearshoring & Offshoring Blogs

- Slug: `nearshoring-offshoring`
- Singular name: `Nearshoring & Offshoring Blog`
- Collection ID: `68f65d73dbe40dd7e103ef15`
- Item count (inventory): 13
- Field count: 26
- Template type observed on public URLs: BLOG
- In nav: no (no nav link hits /nearshoring-offshoring or /nearshoring-offshoring/…)
- In footer: no (no footer link hits /nearshoring-offshoring or /nearshoring-offshoring/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0
- Edge-case field fill rates:
  - `author-2` → 25%
  - `faq-title-5` → 33%
  - `faq-content-5` → 33%
  - `faq-title-6` → 25%
  - `faq-content-6` → 25%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Resource category | `resource-category` | Reference | required | -- Hubs |  |
| 8 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 9 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 10 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": true} |
| 11 | Featured? | `featured` | Switch | optional | — |  |
| 12 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 15 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 17 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 19 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 21 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 23 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 25 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 26 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Managing Engineers Blogs

- Slug: `managing-engineers`
- Singular name: `Managing Engineers Blog`
- Collection ID: `68f65d86e9f1630e92f762ec`
- Item count (inventory): 7
- Field count: 26
- Template type observed on public URLs: BLOG
- In nav: no (no nav link hits /managing-engineers or /managing-engineers/…)
- In footer: no (no footer link hits /managing-engineers or /managing-engineers/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=1
- Edge-case field fill rates:
  - `author-2` → 29%
  - `faq-title-6` → 0%
  - `faq-content-6` → 0%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Resource category | `resource-category` | Reference | required | -- Hubs |  |
| 8 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 9 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 10 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": true} |
| 11 | Featured? | `featured` | Switch | optional | — |  |
| 12 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 15 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 17 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 19 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 21 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 23 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 25 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 26 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Scaling Teams Blogs

- Slug: `scaling-teams`
- Singular name: `Scaling Teams Blog`
- Collection ID: `68f65dbd5dfc1bedb4edb50b`
- Item count (inventory): 9
- Field count: 26
- Template type observed on public URLs: BLOG
- In nav: no (no nav link hits /scaling-teams or /scaling-teams/…)
- In footer: no (no footer link hits /scaling-teams or /scaling-teams/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=1
- Edge-case field fill rates:
  - `faq-title-5` → 11%
  - `faq-content-5` → 11%
  - `faq-title-6` → 11%
  - `faq-content-6` → 11%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Resource category | `resource-category` | Reference | required | -- Hubs |  |
| 8 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 9 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 10 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": true} |
| 11 | Featured? | `featured` | Switch | optional | — |  |
| 12 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 15 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 17 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 19 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 21 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 23 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 25 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 26 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### AI in Software Development Blogs

- Slug: `ai-in-software-development`
- Singular name: `AI in Software Development Blog`
- Collection ID: `68f65dd531a77bd2a3936581`
- Item count (inventory): 3
- Field count: 26
- Template type observed on public URLs: BLOG
- In nav: no (no nav link hits /ai-in-software-development or /ai-in-software-development/…)
- In footer: no (no footer link hits /ai-in-software-development or /ai-in-software-development/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0
- Edge-case field fill rates:
  - `author-2` → 33%
  - `resource-description` → 33%
  - `faq-title-1` → 33%
  - `faq-content-1` → 33%
  - `faq-title-2` → 33%
  - `faq-content-2` → 33%
  - `faq-title-3` → 33%
  - `faq-content-3` → 33%
  - `faq-title-4` → 33%
  - `faq-content-4` → 33%
  - `faq-title-5` → 33%
  - `faq-content-5` → 33%
  - `faq-title-6` → 33%
  - `faq-content-6` → 33%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail image | `thumbnail-image` | Image | optional | — |  |
| 2 | Open graph Wide image | `open-graph-wide-image` | Image | optional | — |  |
| 3 | TLDR Section | `tldr-section` | RichText | optional | — |  |
| 4 | Date | `date` | DateTime | optional | — |  |
| 5 | Content | `content` | RichText | optional | — |  |
| 6 | Author | `author-2` | Reference | optional | Team Members |  |
| 7 | Resource category | `resource-category` | Reference | required | -- Hubs |  |
| 8 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 9 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 10 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": true} |
| 11 | Featured? | `featured` | Switch | optional | — |  |
| 12 | Resource description | `resource-description` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Content 1 | `faq-content-1` | RichText | optional | — |  |
| 15 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 16 | FAQ Content 2 | `faq-content-2` | RichText | optional | — |  |
| 17 | FAQ Title 3 | `faq-title-3` | PlainText | optional | — | {"singleLine": true} |
| 18 | FAQ Content 3 | `faq-content-3` | RichText | optional | — |  |
| 19 | FAQ Title 4 | `faq-title-4` | PlainText | optional | — | {"singleLine": true} |
| 20 | FAQ Content 4 | `faq-content-4` | RichText | optional | — |  |
| 21 | FAQ Title 5 | `faq-title-5` | PlainText | optional | — | {"singleLine": true} |
| 22 | FAQ Content 5 | `faq-content-5` | RichText | optional | — |  |
| 23 | FAQ Title 6 | `faq-title-6` | PlainText | optional | — | {"singleLine": true} |
| 24 | FAQ Content 6 | `faq-content-6` | RichText | optional | — |  |
| 25 | Title | `name` | PlainText | required | — | {"maxLength": 256} |
| 26 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### Insights

- Slug: `insights`
- Singular name: `Insight`
- Collection ID: `69703f90c9afaae68892fa46`
- Item count (inventory): 1
- Field count: 5
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /insights — collection may be referenced-only)
- In nav: no (no nav link hits /insights or /insights/…)
- In footer: no (no footer link hits /insights or /insights/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0
- Edge-case field fill rates:
  - `thumbnail-image` → 0%

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Thumbnail Image | `thumbnail-image` | Image | optional | — |  |
| 2 | Post Body | `post-body` | RichText | optional | — |  |
| 3 | Post Summary | `post-summary` | PlainText | optional | — | {"singleLine": true} |
| 4 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 5 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |

### New Blog Templates

- Slug: `new-blog-template`
- Singular name: `New Blog Template`
- Collection ID: `69b72a983d3153253072b712`
- Item count (inventory): 5
- Field count: 17
- Template type observed on public URLs: NOT IN EXTRACT (no URL path starts with /new-blog-template — collection may be referenced-only)
- In nav: no (no nav link hits /new-blog-template or /new-blog-template/…)
- In footer: no (no footer link hits /new-blog-template or /new-blog-template/…)
- EN-GB locale variants: no (per-field override) — `localeStrategy`=`single-document`, `ukOverrideFields`=`[]`, `draftInUk`=0

**Fields:**

| # | Field display name | Slug | Type | Required | Referenced collection | Extra validations |
|---|---|---|---|---|---|---|
| 1 | Meta Title | `meta-title` | PlainText | required | — | {"singleLine": true} |
| 2 | Meta Description | `meta-description` | PlainText | required | — | {"singleLine": false} |
| 3 | Date Published | `date-published` | DateTime | optional | — |  |
| 4 | Date Modified | `date-modified` | DateTime | optional | — |  |
| 5 | Feature Images | `feature-images` | Image | optional | — |  |
| 6 | Sub Title | `sub-title` | RichText | optional | — |  |
| 7 | Post Excerpt | `post-excerpt` | PlainText | required | — | {"singleLine": false} |
| 8 | Author | `author-2` | Reference | optional | Team Members |  |
| 9 | TL;DR | `tl-dr` | RichText | optional | — |  |
| 10 | Main Content | `main-content` | RichText | optional | — |  |
| 11 | FAQ Title 1 | `faq-title-1` | PlainText | optional | — | {"singleLine": true} |
| 12 | FAQ Description 1 | `faq-description-11` | PlainText | optional | — | {"singleLine": false} |
| 13 | FAQ Title 2 | `faq-title-2` | PlainText | optional | — | {"singleLine": true} |
| 14 | FAQ Description 2 | `faq-description-22` | PlainText | optional | — | {"singleLine": false} |
| 15 | Tags | `tags` | MultiReference | required | -- Tags >> Blogs |  |
| 16 | Name | `name` | PlainText | required | — | {"maxLength": 256} |
| 17 | Slug | `slug` | PlainText | required | — | {"maxLength": 256, "pattern": {}, "messages": {"pattern": "Must be alphanumerical and not contain any spaces or special characters", "maxLength": "Must be less than 256 characters"}} |


---

## SECTION 2: URL INVENTORY BY TEMPLATE TYPE

From `ce-template-map.json` (602 entries). 312 US URLs + 290 UK URLs. The template map also flags 4 URL(s) as `requiresManualReview=true`.

**Summary table:**

| Template type | US URLs | UK URLs | Total |
|---|---|---|---|
| BLOG | 63 | 49 | 112 |
| BOOK_A_CALL | 9 | 9 | 18 |
| COMPARE | 23 | 18 | 41 |
| CUSTOMER_STORY | 10 | 9 | 19 |
| DOWNLOAD | 2 | 2 | 4 |
| HOME | 1 | 2 | 3 |
| REVIEW | 8 | 7 | 15 |
| SERVICE | 26 | 24 | 50 |
| STATIC | 8 | 7 | 15 |
| TAXONOMY | 13 | 14 | 27 |
| TEAM_MEMBER | 26 | 28 | 54 |
| TECHNOLOGY | 96 | 96 | 192 |
| TOOL | 3 | 2 | 5 |
| UNKNOWN | 3 | 1 | 4 |
| VIDEO | 21 | 22 | 43 |

### BLOG

- US count: 63
- UK count: 49

**US URLs:**

- https://cloudemployee.io/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards
- https://cloudemployee.io/ai-in-software-development/shaping-whats-next-how-future-forward-is-advancing-ai-at-cloud-employee
- https://cloudemployee.io/ai-in-software-development/why-staff-augmentation-matters-in-the-age-of-ai
- https://cloudemployee.io/hiring-tips/developer-vetting-in-latam-live-pair-programming-coding-tests-and-quality-signals-that-matter
- https://cloudemployee.io/hiring-tips/hiring-developers-in-the-philippines-cost-quality-culture-fit-for-outsourced-software-development
- https://cloudemployee.io/hiring-tips/how-to-avoid-costly-mistakes-when-hiring-a-remote-developer
- https://cloudemployee.io/hiring-tips/how-to-run-pair-programming-interviews-cloud-employees-hiring-sop
- https://cloudemployee.io/hiring-tips/our-proven-model-for-onboarding-software-developers
- https://cloudemployee.io/hiring-tips/the-reality-of-modern-tech-recruitment-a-broken-system
- https://cloudemployee.io/managing-engineers/avoiding-burnout-in-scaling-engineering-teams
- https://cloudemployee.io/managing-engineers/data-engineer-vs-data-scientist-vs-ai-engineer-key-differences-demand-drivers-and-how-to-hire-right
- https://cloudemployee.io/managing-engineers/how-peer-forums-are-changing-remote-work-at-cloud-employee
- https://cloudemployee.io/managing-engineers/how-to-manage-remote-engineers
- https://cloudemployee.io/managing-engineers/managing-distributed-teams-a-ctos-2025-playbook
- https://cloudemployee.io/managing-engineers/onboarding-latam-developers-90-day-ramp-up-timeline-productivity-curve-and-integration-playbook
- https://cloudemployee.io/nearshoring-offshoring/7-benefits-of-outsourcing-web-development-for-startups
- https://cloudemployee.io/nearshoring-offshoring/choosing-nearshore-or-offshore-software-development-costs-by-country
- https://cloudemployee.io/nearshoring-offshoring/freelancers-vs-cloud-employee
- https://cloudemployee.io/nearshoring-offshoring/it-outsourcing-services-scope-slas-2025-costs
- https://cloudemployee.io/nearshoring-offshoring/nearshore-software-development-how-to-choose-the-right-vendor
- https://cloudemployee.io/nearshoring-offshoring/nearshore-vs-offshore-costs-2026-software-development-rates
- https://cloudemployee.io/nearshoring-offshoring/nearshore-vs-offshore-staff-augmentation
- https://cloudemployee.io/nearshoring-offshoring/nearshoring-or-offshoring-the-strategic-choice-for-tech-leaders
- https://cloudemployee.io/nearshoring-offshoring/offshore-developer-pricing-hourly-vs-monthly
- https://cloudemployee.io/nearshoring-offshoring/what-is-it-outsourcing-definition-models-when-to-use-it
- https://cloudemployee.io/nearshoring-offshoring/what-is-nearshoring-benefits-and-challenges-for-software-development-teams
- https://cloudemployee.io/nearshoring-offshoring/what-is-offshoring-cost-effective-tech-teams-explained
- https://cloudemployee.io/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models
- https://cloudemployee.io/scaling-teams/cloud-employee-pricing-team-size-scenarios
- https://cloudemployee.io/scaling-teams/cto-profile-meet-des-matthewson
- https://cloudemployee.io/scaling-teams/h-1b-vs-staff-augmentation-the-true-cost-of-hiring-in-2025-and-why-costs-are-rising
- https://cloudemployee.io/scaling-teams/leadership-strategies-for-scaling-engineering-teams
- https://cloudemployee.io/scaling-teams/scaling-agile-teams-across-time-zones
- https://cloudemployee.io/scaling-teams/scaling-latam-developers-1-to-10-strategy
- https://cloudemployee.io/scaling-teams/why-consider-alternatives-to-software-development-outsourcing
- https://cloudemployee.io/staff-augmentation/best-staff-augmentation-companies-2026
- https://cloudemployee.io/staff-augmentation/best-staff-augmentation-companies-in-latin-america-2026-a-ranked-comparison
- https://cloudemployee.io/staff-augmentation/cloud-employee-pricing-checklist-before-hire
- https://cloudemployee.io/staff-augmentation/cloud-employee-vs-in-house-total-cost-ownership
- https://cloudemployee.io/staff-augmentation/guide-to-it-staff-augmentation-services-in-usa
- https://cloudemployee.io/staff-augmentation/h-1b-changes-2025-2030-staff-augmentation-for-scaling-teams
- https://cloudemployee.io/staff-augmentation/how-much-does-staff-augmentation-cost
- https://cloudemployee.io/staff-augmentation/how-staff-augmentation-is-rewriting-the-rules-of-software-development-speed-and-efficiency
- https://cloudemployee.io/staff-augmentation/how-to-choose-the-right-it-staff-augmentation-company
- https://cloudemployee.io/staff-augmentation/how-to-evaluate-staff-augmentation-providers-in-latam-a-founders-vetting-checklist
- https://cloudemployee.io/staff-augmentation/staff-augmentation-contract-terms-explained-commitments-guarantees-and-exit-clauses
- https://cloudemployee.io/staff-augmentation/staff-augmentation-fintech-security-compliance
- https://cloudemployee.io/staff-augmentation/staff-augmentation-implementation-90-day-onboarding-playbook-for-new-developers
- https://cloudemployee.io/staff-augmentation/staff-augmentation-misconceptions-what-ctos-need-to-know
- https://cloudemployee.io/staff-augmentation/staff-augmentation-mistakes-to-avoid
- https://cloudemployee.io/staff-augmentation/staff-augmentation-mistakes-to-avoid-common-failures-and-how-to-prevent-them
- https://cloudemployee.io/staff-augmentation/staff-augmentation-models-scale-tech-teams-globally-win
- https://cloudemployee.io/staff-augmentation/staff-augmentation-pricing-and-costs-what-youll-actually-pay
- https://cloudemployee.io/staff-augmentation/staff-augmentation-roi-calculator-measure-cost-savings-and-productivity-gains
- https://cloudemployee.io/staff-augmentation/staff-augmentation-team-depth
- https://cloudemployee.io/staff-augmentation/staff-augmentation-vs-consulting-outsourcing-and-managed-services
- https://cloudemployee.io/staff-augmentation/staff-augmentation-vs-freelancers
- https://cloudemployee.io/staff-augmentation/staff-augmentation-vs-in-house-hiring-cost-speed-and-risk-comparison
- https://cloudemployee.io/staff-augmentation/staff-augmentation-vs-traditional-hiring-cost-speed-and-risk-comparison
- https://cloudemployee.io/staff-augmentation/using-latam-staff-augmentation-to-scale-early-stage-saas
- https://cloudemployee.io/staff-augmentation/what-is-nearshore-staff-augmentation-model-benefits-examples
- https://cloudemployee.io/staff-augmentation/what-is-staff-augmentation
- https://cloudemployee.io/staff-augmentation/what-is-staff-augmentation-and-what-are-the-benefits

**UK URLs:**

- https://cloudemployee.io/uk/ai-in-software-development/securing-ai-the-ctos-guide-to-validation-and-minimum-safety-standards
- https://cloudemployee.io/uk/ai-in-software-development/shaping-whats-next-how-future-forward-is-advancing-ai-at-cloud-employee
- https://cloudemployee.io/uk/ai-in-software-development/why-staff-augmentation-matters-in-the-age-of-ai
- https://cloudemployee.io/uk/hiring-tips/developer-vetting-in-latam-live-pair-programming-coding-tests-and-quality-signals-that-matter
- https://cloudemployee.io/uk/hiring-tips/hiring-developers-in-the-philippines-cost-quality-culture-fit-for-outsourced-software-development
- https://cloudemployee.io/uk/hiring-tips/how-to-avoid-costly-mistakes-when-hiring-a-remote-developer
- https://cloudemployee.io/uk/hiring-tips/how-to-run-pair-programming-interviews-cloud-employees-hiring-sop
- https://cloudemployee.io/uk/hiring-tips/our-proven-model-for-onboarding-software-developers
- https://cloudemployee.io/uk/hiring-tips/the-reality-of-modern-tech-recruitment-a-broken-system
- https://cloudemployee.io/uk/managing-engineers/avoiding-burnout-in-scaling-engineering-teams
- https://cloudemployee.io/uk/managing-engineers/data-engineer-vs-data-scientist-vs-ai-engineer-key-differences-demand-drivers-and-how-to-hire-right
- https://cloudemployee.io/uk/managing-engineers/how-peer-forums-are-changing-remote-work-at-cloud-employee
- https://cloudemployee.io/uk/managing-engineers/how-to-manage-remote-engineers
- https://cloudemployee.io/uk/managing-engineers/managing-distributed-teams-a-ctos-2025-playbook
- https://cloudemployee.io/uk/managing-engineers/onboarding-latam-developers-90-day-ramp-up-timeline-productivity-curve-and-integration-playbook
- https://cloudemployee.io/uk/managing-engineers/software-developer-performance-metrics-for-ctos
- https://cloudemployee.io/uk/nearshoring-offshoring/7-benefits-of-outsourcing-web-development-for-startups
- https://cloudemployee.io/uk/nearshoring-offshoring/choosing-nearshore-or-offshore-software-development-costs-by-country
- https://cloudemployee.io/uk/nearshoring-offshoring/freelancers-vs-cloud-employee
- https://cloudemployee.io/uk/nearshoring-offshoring/it-outsourcing-services-scope-slas-2025-costs
- https://cloudemployee.io/uk/nearshoring-offshoring/nearshore-software-development-how-to-choose-the-right-vendor
- https://cloudemployee.io/uk/nearshoring-offshoring/nearshore-vs-offshore-costs-2026-software-development-rates
- https://cloudemployee.io/uk/nearshoring-offshoring/nearshoring-or-offshoring-the-strategic-choice-for-tech-leaders
- https://cloudemployee.io/uk/nearshoring-offshoring/offshore-developer-pricing-hourly-vs-monthly
- https://cloudemployee.io/uk/nearshoring-offshoring/what-is-it-outsourcing-definition-models-when-to-use-it
- https://cloudemployee.io/uk/nearshoring-offshoring/what-is-nearshoring-benefits-and-challenges-for-software-development-teams
- https://cloudemployee.io/uk/nearshoring-offshoring/what-is-offshoring-cost-effective-tech-teams-explained
- https://cloudemployee.io/uk/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models
- https://cloudemployee.io/uk/scaling-teams/cloud-employee-pricing-team-size-scenarios
- https://cloudemployee.io/uk/scaling-teams/cto-profile-meet-des-matthewson
- https://cloudemployee.io/uk/scaling-teams/h-1b-vs-staff-augmentation-the-true-cost-of-hiring-in-2025-and-why-costs-are-rising
- https://cloudemployee.io/uk/scaling-teams/leadership-strategies-for-scaling-engineering-teams
- https://cloudemployee.io/uk/scaling-teams/scaling-agile-teams-across-time-zones
- https://cloudemployee.io/uk/scaling-teams/why-consider-alternatives-to-software-development-outsourcing
- https://cloudemployee.io/uk/staff-augmentation/best-staff-augmentation-companies-2026
- https://cloudemployee.io/uk/staff-augmentation/best-staff-augmentation-companies-in-latin-america-2026-a-ranked-comparison
- https://cloudemployee.io/uk/staff-augmentation/guide-to-it-staff-augmentation-services-in-usa
- https://cloudemployee.io/uk/staff-augmentation/h-1b-changes-2025-2030-staff-augmentation-for-scaling-teams
- https://cloudemployee.io/uk/staff-augmentation/how-much-does-staff-augmentation-cost
- https://cloudemployee.io/uk/staff-augmentation/how-staff-augmentation-is-rewriting-the-rules-of-software-development-speed-and-efficiency
- https://cloudemployee.io/uk/staff-augmentation/how-to-choose-the-right-it-staff-augmentation-company
- https://cloudemployee.io/uk/staff-augmentation/how-to-evaluate-staff-augmentation-providers-in-latam-a-founders-vetting-checklist
- https://cloudemployee.io/uk/staff-augmentation/staff-augmentation-misconceptions-what-ctos-need-to-know
- https://cloudemployee.io/uk/staff-augmentation/staff-augmentation-models-scale-tech-teams-globally-win
- https://cloudemployee.io/uk/staff-augmentation/staff-augmentation-roi-calculator-measure-cost-savings-and-productivity-gains
- https://cloudemployee.io/uk/staff-augmentation/staff-augmentation-vs-consulting-outsourcing-and-managed-services
- https://cloudemployee.io/uk/staff-augmentation/using-latam-staff-augmentation-to-scale-early-stage-saas
- https://cloudemployee.io/uk/staff-augmentation/what-is-nearshore-staff-augmentation-model-benefits-examples
- https://cloudemployee.io/uk/staff-augmentation/what-is-staff-augmentation-and-what-are-the-benefits

### BOOK_A_CALL

- US count: 9
- UK count: 9

**US URLs:**

- https://cloudemployee.io/book-a-call
- https://cloudemployee.io/book-a-call/aj
- https://cloudemployee.io/book-a-call/anto
- https://cloudemployee.io/book-a-call/seb
- https://cloudemployee.io/book-a-call/shawnee
- https://cloudemployee.io/book-a-call/stephanie
- https://cloudemployee.io/scale-this-week
- https://cloudemployee.io/start-hiring/contact-info
- https://cloudemployee.io/work-with-shawnee

**UK URLs:**

- https://cloudemployee.io/uk/book-a-call
- https://cloudemployee.io/uk/book-a-call/aj
- https://cloudemployee.io/uk/book-a-call/anto
- https://cloudemployee.io/uk/book-a-call/seb
- https://cloudemployee.io/uk/book-a-call/shawnee
- https://cloudemployee.io/uk/book-a-call/stephanie
- https://cloudemployee.io/uk/scale-this-week
- https://cloudemployee.io/uk/start-hiring/contact-info
- https://cloudemployee.io/uk/start-hiring/get-started

### COMPARE

- US count: 23
- UK count: 18

**US URLs:**

- https://cloudemployee.io/alternatives
- https://cloudemployee.io/compare/arc-dev-pricing-vs-cloud-employee-true-cost
- https://cloudemployee.io/compare/arc-dev-to-dedicated-team-migration-guide
- https://cloudemployee.io/compare/cloud-employee-no-hidden-fees-transparency
- https://cloudemployee.io/compare/cloud-employee-pricing-plans-cost-breakdown
- https://cloudemployee.io/compare/cloud-employee-vs-andela
- https://cloudemployee.io/compare/cloud-employee-vs-bairesdev-reviews
- https://cloudemployee.io/compare/cloud-employee-vs-beon-tech
- https://cloudemployee.io/compare/cloud-employee-vs-clouddevs
- https://cloudemployee.io/compare/cloud-employee-vs-contra
- https://cloudemployee.io/compare/cloud-employee-vs-fiverr
- https://cloudemployee.io/compare/cloud-employee-vs-proxify
- https://cloudemployee.io/compare/cloud-employee-vs-turing
- https://cloudemployee.io/compare/cloud-employee-vs-unosquare
- https://cloudemployee.io/compare/cloud-employee-vs-upwork
- https://cloudemployee.io/compare/dedicated-teams-vs-toptal
- https://cloudemployee.io/compare/freelancers
- https://cloudemployee.io/compare/inhouse-hiring
- https://cloudemployee.io/compare/switching-from-arc-dev-to-a-dedicated-development-team
- https://cloudemployee.io/compare/the-hidden-costs-of-arc-dev-screening-time-failed-hires-and-context-switching
- https://cloudemployee.io/compare/toptal-limitations
- https://cloudemployee.io/compare/toptal-vs-cloud-employee-freelance-marketplace-vs-dedicated-staff-augmentation
- https://cloudemployee.io/compare/toptal-vs-upwork

**UK URLs:**

- https://cloudemployee.io/uk/alternatives
- https://cloudemployee.io/uk/compare/cloud-employee-pricing-plans-cost-breakdown
- https://cloudemployee.io/uk/compare/cloud-employee-vs-andela
- https://cloudemployee.io/uk/compare/cloud-employee-vs-arc-dev
- https://cloudemployee.io/uk/compare/cloud-employee-vs-bairesdev-reviews
- https://cloudemployee.io/uk/compare/cloud-employee-vs-beon-tech
- https://cloudemployee.io/uk/compare/cloud-employee-vs-clouddevs
- https://cloudemployee.io/uk/compare/cloud-employee-vs-contra
- https://cloudemployee.io/uk/compare/cloud-employee-vs-fiverr
- https://cloudemployee.io/uk/compare/cloud-employee-vs-proxify
- https://cloudemployee.io/uk/compare/cloud-employee-vs-turing
- https://cloudemployee.io/uk/compare/cloud-employee-vs-unosquare
- https://cloudemployee.io/uk/compare/cloud-employee-vs-upwork
- https://cloudemployee.io/uk/compare/dedicated-teams-vs-toptal
- https://cloudemployee.io/uk/compare/freelancers
- https://cloudemployee.io/uk/compare/inhouse-hiring
- https://cloudemployee.io/uk/compare/toptal-limitations
- https://cloudemployee.io/uk/compare/toptal-vs-cloud-employee-freelance-marketplace-vs-dedicated-staff-augmentation

### CUSTOMER_STORY

- US count: 10
- UK count: 9

**US URLs:**

- https://cloudemployee.io/customer-story/cleanlink
- https://cloudemployee.io/customer-story/event-connections
- https://cloudemployee.io/customer-story/mercato
- https://cloudemployee.io/customer-story/salmon-software
- https://cloudemployee.io/customer-story/sqr
- https://cloudemployee.io/customer-story/travel-tech-client
- https://cloudemployee.io/customer-story/travelx
- https://cloudemployee.io/customer-story/virgin
- https://cloudemployee.io/customer-story/willo
- https://cloudemployee.io/our-work

**UK URLs:**

- https://cloudemployee.io/uk/customer-story/cleanlink
- https://cloudemployee.io/uk/customer-story/event-connections
- https://cloudemployee.io/uk/customer-story/mercato
- https://cloudemployee.io/uk/customer-story/salmon-software
- https://cloudemployee.io/uk/customer-story/sqr
- https://cloudemployee.io/uk/customer-story/travel-tech-client
- https://cloudemployee.io/uk/customer-story/travelx
- https://cloudemployee.io/uk/customer-story/virgin
- https://cloudemployee.io/uk/customer-story/willo

### DOWNLOAD

- US count: 2
- UK count: 2

**US URLs:**

- https://cloudemployee.io/download/10-ai-prompts
- https://cloudemployee.io/download/why-top-devs-wont-apply

**UK URLs:**

- https://cloudemployee.io/uk/download/10-ai-prompts
- https://cloudemployee.io/uk/download/why-top-devs-wont-apply

### HOME

- US count: 1
- UK count: 2

**US URLs:**

- https://cloudemployee.io/

**UK URLs:**

- https://cloudemployee.io/uk
- https://cloudemployee.io/uk/archive/old-home

### REVIEW

- US count: 8
- UK count: 7

**US URLs:**

- https://cloudemployee.io/reviews/aspire-creative
- https://cloudemployee.io/reviews/bladefs
- https://cloudemployee.io/reviews/cleanlink-software-ltd
- https://cloudemployee.io/reviews/healthpointe
- https://cloudemployee.io/reviews/salmon-software
- https://cloudemployee.io/reviews/square-eye
- https://cloudemployee.io/reviews/tidal
- https://cloudemployee.io/reviews/willo

**UK URLs:**

- https://cloudemployee.io/uk/reviews/aspire-creative
- https://cloudemployee.io/uk/reviews/bladefs
- https://cloudemployee.io/uk/reviews/cleanlink-software-ltd
- https://cloudemployee.io/uk/reviews/healthpointe
- https://cloudemployee.io/uk/reviews/salmon-software
- https://cloudemployee.io/uk/reviews/square-eye
- https://cloudemployee.io/uk/reviews/tidal

### SERVICE

- US count: 26
- UK count: 24

**US URLs:**

- https://cloudemployee.io/embedding
- https://cloudemployee.io/retention
- https://cloudemployee.io/services/ai-consulting
- https://cloudemployee.io/services/ai-engineers
- https://cloudemployee.io/services/ai-product-builds
- https://cloudemployee.io/services/android-developers
- https://cloudemployee.io/services/back-end-developers
- https://cloudemployee.io/services/cloud-engineers
- https://cloudemployee.io/services/data-scientists
- https://cloudemployee.io/services/devops-engineers
- https://cloudemployee.io/services/fractional-ctos
- https://cloudemployee.io/services/front-end-developers
- https://cloudemployee.io/services/full-stack-developers
- https://cloudemployee.io/services/ios-developers
- https://cloudemployee.io/services/latam-developers
- https://cloudemployee.io/services/mobile-apps
- https://cloudemployee.io/services/mobile-developers
- https://cloudemployee.io/services/mvp-development
- https://cloudemployee.io/services/no-code-developers
- https://cloudemployee.io/services/philippines-developers
- https://cloudemployee.io/services/product-scoping-service
- https://cloudemployee.io/services/qa-analysts-testers
- https://cloudemployee.io/services/software-engineers
- https://cloudemployee.io/services/web-based-apps
- https://cloudemployee.io/services/web-developers
- https://cloudemployee.io/sourcing

**UK URLs:**

- https://cloudemployee.io/uk/retention
- https://cloudemployee.io/uk/services/ai-consulting
- https://cloudemployee.io/uk/services/ai-engineers
- https://cloudemployee.io/uk/services/ai-product-builds
- https://cloudemployee.io/uk/services/android-developers
- https://cloudemployee.io/uk/services/back-end-developers
- https://cloudemployee.io/uk/services/cloud-engineers
- https://cloudemployee.io/uk/services/data-scientists
- https://cloudemployee.io/uk/services/devops-engineers
- https://cloudemployee.io/uk/services/fractional-ctos
- https://cloudemployee.io/uk/services/front-end-developers
- https://cloudemployee.io/uk/services/full-stack-developers
- https://cloudemployee.io/uk/services/ios-developers
- https://cloudemployee.io/uk/services/latam-developers
- https://cloudemployee.io/uk/services/mobile-apps
- https://cloudemployee.io/uk/services/mobile-developers
- https://cloudemployee.io/uk/services/no-code-developers
- https://cloudemployee.io/uk/services/philippines-developers
- https://cloudemployee.io/uk/services/product-scoping-service
- https://cloudemployee.io/uk/services/qa-analysts-testers
- https://cloudemployee.io/uk/services/software-engineers
- https://cloudemployee.io/uk/services/web-based-apps
- https://cloudemployee.io/uk/services/web-developers
- https://cloudemployee.io/uk/sourcing

### STATIC

- US count: 8
- UK count: 7

**US URLs:**

- https://cloudemployee.io/404
- https://cloudemployee.io/about-us
- https://cloudemployee.io/archive/old-home
- https://cloudemployee.io/contact
- https://cloudemployee.io/events
- https://cloudemployee.io/for-developers
- https://cloudemployee.io/how-it-works
- https://cloudemployee.io/legals/privacy-policy

**UK URLs:**

- https://cloudemployee.io/uk/404
- https://cloudemployee.io/uk/contact
- https://cloudemployee.io/uk/events
- https://cloudemployee.io/uk/for-developers
- https://cloudemployee.io/uk/how-it-works
- https://cloudemployee.io/uk/legals/privacy-policy
- https://cloudemployee.io/uk/pricing

### TAXONOMY

- US count: 13
- UK count: 14

**US URLs:**

- https://cloudemployee.io/ai-in-software-development
- https://cloudemployee.io/blog
- https://cloudemployee.io/compare
- https://cloudemployee.io/customer-stories
- https://cloudemployee.io/downloads
- https://cloudemployee.io/hiring-tips
- https://cloudemployee.io/managing-engineers
- https://cloudemployee.io/nearshoring-offshoring
- https://cloudemployee.io/reviews
- https://cloudemployee.io/scaling-teams
- https://cloudemployee.io/services
- https://cloudemployee.io/technology
- https://cloudemployee.io/tools

**UK URLs:**

- https://cloudemployee.io/uk/ai-in-software-development
- https://cloudemployee.io/uk/blog
- https://cloudemployee.io/uk/compare
- https://cloudemployee.io/uk/customer-stories
- https://cloudemployee.io/uk/downloads
- https://cloudemployee.io/uk/hiring-tips
- https://cloudemployee.io/uk/managing-engineers
- https://cloudemployee.io/uk/nearshoring-offshoring
- https://cloudemployee.io/uk/our-work
- https://cloudemployee.io/uk/scaling-teams
- https://cloudemployee.io/uk/services
- https://cloudemployee.io/uk/technology
- https://cloudemployee.io/uk/tools
- https://cloudemployee.io/uk/videos

### TEAM_MEMBER

- US count: 26
- UK count: 28

**US URLs:**

- https://cloudemployee.io/team/aj-develos
- https://cloudemployee.io/team/albert-labarento
- https://cloudemployee.io/team/anto-cabraja
- https://cloudemployee.io/team/caitlin-murray
- https://cloudemployee.io/team/des-matthewman
- https://cloudemployee.io/team/erwin-panganiban
- https://cloudemployee.io/team/grace-tannor
- https://cloudemployee.io/team/heather-wood
- https://cloudemployee.io/team/heidi-dela-cruz
- https://cloudemployee.io/team/jake-hall
- https://cloudemployee.io/team/jimmy-mclellan
- https://cloudemployee.io/team/kean-reynancia
- https://cloudemployee.io/team/kyla-taal
- https://cloudemployee.io/team/luis-santos
- https://cloudemployee.io/team/lyka-duran
- https://cloudemployee.io/team/maica-padillo
- https://cloudemployee.io/team/rich-holgate
- https://cloudemployee.io/team/robert-reyes
- https://cloudemployee.io/team/russel-lobrio
- https://cloudemployee.io/team/seb-hall
- https://cloudemployee.io/team/shawnee-malesich
- https://cloudemployee.io/team/sofia-wood
- https://cloudemployee.io/team/stephanie-bird
- https://cloudemployee.io/team/stephanie-silva
- https://cloudemployee.io/team/steven-sy
- https://cloudemployee.io/team/viktoria-mangarin

**UK URLs:**

- https://cloudemployee.io/uk/team/aj-develos
- https://cloudemployee.io/uk/team/albert-labarento
- https://cloudemployee.io/uk/team/anto-cabraja
- https://cloudemployee.io/uk/team/caitlin-murray
- https://cloudemployee.io/uk/team/des-matthewman
- https://cloudemployee.io/uk/team/ericka-go
- https://cloudemployee.io/uk/team/erwin-panganiban
- https://cloudemployee.io/uk/team/ezekiel-mariano
- https://cloudemployee.io/uk/team/grace-tannor
- https://cloudemployee.io/uk/team/heather-wood
- https://cloudemployee.io/uk/team/heidi-dela-cruz
- https://cloudemployee.io/uk/team/jake-hall
- https://cloudemployee.io/uk/team/jimmy-mclellan
- https://cloudemployee.io/uk/team/kean-reynancia
- https://cloudemployee.io/uk/team/kyla-taal
- https://cloudemployee.io/uk/team/luis-santos
- https://cloudemployee.io/uk/team/lyka-duran
- https://cloudemployee.io/uk/team/maica-padillo
- https://cloudemployee.io/uk/team/rich-holgate
- https://cloudemployee.io/uk/team/robert-reyes
- https://cloudemployee.io/uk/team/seb-hall
- https://cloudemployee.io/uk/team/shawnee-malesich
- https://cloudemployee.io/uk/team/sofia-wood
- https://cloudemployee.io/uk/team/stephanie-bird
- https://cloudemployee.io/uk/team/stephanie-silva
- https://cloudemployee.io/uk/team/steven-sy
- https://cloudemployee.io/uk/team/viktoria-mangarin
- https://cloudemployee.io/uk/work-with-shawnee

### TECHNOLOGY

- US count: 96
- UK count: 96

**US URLs:**

- https://cloudemployee.io/technology/airtable-developers
- https://cloudemployee.io/technology/android
- https://cloudemployee.io/technology/android-studio
- https://cloudemployee.io/technology/angular-developers
- https://cloudemployee.io/technology/ansible
- https://cloudemployee.io/technology/aws-developers
- https://cloudemployee.io/technology/azure-developers
- https://cloudemployee.io/technology/bigquery
- https://cloudemployee.io/technology/browserstack
- https://cloudemployee.io/technology/bubble-developers
- https://cloudemployee.io/technology/cloudformation
- https://cloudemployee.io/technology/combine
- https://cloudemployee.io/technology/compose
- https://cloudemployee.io/technology/coredata
- https://cloudemployee.io/technology/csharp-developers
- https://cloudemployee.io/technology/css3
- https://cloudemployee.io/technology/cypress
- https://cloudemployee.io/technology/dagger
- https://cloudemployee.io/technology/dbt
- https://cloudemployee.io/technology/docker
- https://cloudemployee.io/technology/dotnet-developers
- https://cloudemployee.io/technology/express
- https://cloudemployee.io/technology/fastapi-developers
- https://cloudemployee.io/technology/fastlane
- https://cloudemployee.io/technology/figma
- https://cloudemployee.io/technology/firebase-developers
- https://cloudemployee.io/technology/flutter-developers
- https://cloudemployee.io/technology/github-actions
- https://cloudemployee.io/technology/gitlab-ci
- https://cloudemployee.io/technology/glide
- https://cloudemployee.io/technology/google-cloud-developers
- https://cloudemployee.io/technology/graphql
- https://cloudemployee.io/technology/huggingface-developers
- https://cloudemployee.io/technology/iam
- https://cloudemployee.io/technology/ionic-developers
- https://cloudemployee.io/technology/ios
- https://cloudemployee.io/technology/java-android-developers
- https://cloudemployee.io/technology/java-developers
- https://cloudemployee.io/technology/jest
- https://cloudemployee.io/technology/jetpack
- https://cloudemployee.io/technology/jira
- https://cloudemployee.io/technology/jupyter
- https://cloudemployee.io/technology/kotlin-developers
- https://cloudemployee.io/technology/kubeflow
- https://cloudemployee.io/technology/kubernetes
- https://cloudemployee.io/technology/langchain-developers
- https://cloudemployee.io/technology/laravel-developers
- https://cloudemployee.io/technology/llamaindex-developers
- https://cloudemployee.io/technology/make
- https://cloudemployee.io/technology/mlflow
- https://cloudemployee.io/technology/mlops-developers
- https://cloudemployee.io/technology/mongodb
- https://cloudemployee.io/technology/mvvm
- https://cloudemployee.io/technology/n8n
- https://cloudemployee.io/technology/nextjs-developers
- https://cloudemployee.io/technology/nodejs-developers
- https://cloudemployee.io/technology/numpy
- https://cloudemployee.io/technology/openai-developers
- https://cloudemployee.io/technology/pandas
- https://cloudemployee.io/technology/php-developers
- https://cloudemployee.io/technology/pinecone-developers
- https://cloudemployee.io/technology/playwright
- https://cloudemployee.io/technology/posthog-developers
- https://cloudemployee.io/technology/postman
- https://cloudemployee.io/technology/prometheus
- https://cloudemployee.io/technology/python-developers
- https://cloudemployee.io/technology/pytorch
- https://cloudemployee.io/technology/qase
- https://cloudemployee.io/technology/react-developers
- https://cloudemployee.io/technology/react-native-developers
- https://cloudemployee.io/technology/redis
- https://cloudemployee.io/technology/ruby-developers
- https://cloudemployee.io/technology/rust-developers
- https://cloudemployee.io/technology/scikit-learn
- https://cloudemployee.io/technology/selenium
- https://cloudemployee.io/technology/softr
- https://cloudemployee.io/technology/storybook
- https://cloudemployee.io/technology/supabase-developers
- https://cloudemployee.io/technology/swift-developers
- https://cloudemployee.io/technology/swiftui
- https://cloudemployee.io/technology/tailwind
- https://cloudemployee.io/technology/tensorflow-developers
- https://cloudemployee.io/technology/terraform
- https://cloudemployee.io/technology/testrail
- https://cloudemployee.io/technology/typescript-developers
- https://cloudemployee.io/technology/uikit
- https://cloudemployee.io/technology/unity-developers
- https://cloudemployee.io/technology/vector-db-developers
- https://cloudemployee.io/technology/vercel-developers
- https://cloudemployee.io/technology/vertex-ai-developers
- https://cloudemployee.io/technology/weaviate-developers
- https://cloudemployee.io/technology/webflow-developers
- https://cloudemployee.io/technology/xamarin-developers
- https://cloudemployee.io/technology/xano
- https://cloudemployee.io/technology/xcode
- https://cloudemployee.io/technology/zapier

**UK URLs:**

- https://cloudemployee.io/uk/technology/airtable-developers
- https://cloudemployee.io/uk/technology/android
- https://cloudemployee.io/uk/technology/android-studio
- https://cloudemployee.io/uk/technology/angular-developers
- https://cloudemployee.io/uk/technology/ansible
- https://cloudemployee.io/uk/technology/aws-developers
- https://cloudemployee.io/uk/technology/azure-developers
- https://cloudemployee.io/uk/technology/bigquery
- https://cloudemployee.io/uk/technology/browserstack
- https://cloudemployee.io/uk/technology/bubble-developers
- https://cloudemployee.io/uk/technology/cloudformation
- https://cloudemployee.io/uk/technology/combine
- https://cloudemployee.io/uk/technology/compose
- https://cloudemployee.io/uk/technology/coredata
- https://cloudemployee.io/uk/technology/csharp-developers
- https://cloudemployee.io/uk/technology/css3
- https://cloudemployee.io/uk/technology/cypress
- https://cloudemployee.io/uk/technology/dagger
- https://cloudemployee.io/uk/technology/dbt
- https://cloudemployee.io/uk/technology/docker
- https://cloudemployee.io/uk/technology/dotnet-developers
- https://cloudemployee.io/uk/technology/express
- https://cloudemployee.io/uk/technology/fastapi-developers
- https://cloudemployee.io/uk/technology/fastlane
- https://cloudemployee.io/uk/technology/figma
- https://cloudemployee.io/uk/technology/firebase-developers
- https://cloudemployee.io/uk/technology/flutter-developers
- https://cloudemployee.io/uk/technology/github-actions
- https://cloudemployee.io/uk/technology/gitlab-ci
- https://cloudemployee.io/uk/technology/glide
- https://cloudemployee.io/uk/technology/google-cloud-developers
- https://cloudemployee.io/uk/technology/graphql
- https://cloudemployee.io/uk/technology/huggingface-developers
- https://cloudemployee.io/uk/technology/iam
- https://cloudemployee.io/uk/technology/ionic-developers
- https://cloudemployee.io/uk/technology/ios
- https://cloudemployee.io/uk/technology/java-android-developers
- https://cloudemployee.io/uk/technology/java-developers
- https://cloudemployee.io/uk/technology/jest
- https://cloudemployee.io/uk/technology/jetpack
- https://cloudemployee.io/uk/technology/jira
- https://cloudemployee.io/uk/technology/jupyter
- https://cloudemployee.io/uk/technology/kotlin-developers
- https://cloudemployee.io/uk/technology/kubeflow
- https://cloudemployee.io/uk/technology/kubernetes
- https://cloudemployee.io/uk/technology/langchain-developers
- https://cloudemployee.io/uk/technology/laravel-developers
- https://cloudemployee.io/uk/technology/llamaindex-developers
- https://cloudemployee.io/uk/technology/make
- https://cloudemployee.io/uk/technology/mlflow
- https://cloudemployee.io/uk/technology/mlops-developers
- https://cloudemployee.io/uk/technology/mongodb
- https://cloudemployee.io/uk/technology/mvvm
- https://cloudemployee.io/uk/technology/n8n
- https://cloudemployee.io/uk/technology/nextjs-developers
- https://cloudemployee.io/uk/technology/nodejs-developers
- https://cloudemployee.io/uk/technology/numpy
- https://cloudemployee.io/uk/technology/openai-developers
- https://cloudemployee.io/uk/technology/pandas
- https://cloudemployee.io/uk/technology/php-developers
- https://cloudemployee.io/uk/technology/pinecone-developers
- https://cloudemployee.io/uk/technology/playwright
- https://cloudemployee.io/uk/technology/posthog-developers
- https://cloudemployee.io/uk/technology/postman
- https://cloudemployee.io/uk/technology/prometheus
- https://cloudemployee.io/uk/technology/python-developers
- https://cloudemployee.io/uk/technology/pytorch
- https://cloudemployee.io/uk/technology/qase
- https://cloudemployee.io/uk/technology/react-developers
- https://cloudemployee.io/uk/technology/react-native-developers
- https://cloudemployee.io/uk/technology/redis
- https://cloudemployee.io/uk/technology/ruby-developers
- https://cloudemployee.io/uk/technology/rust-developers
- https://cloudemployee.io/uk/technology/scikit-learn
- https://cloudemployee.io/uk/technology/selenium
- https://cloudemployee.io/uk/technology/softr
- https://cloudemployee.io/uk/technology/storybook
- https://cloudemployee.io/uk/technology/supabase-developers
- https://cloudemployee.io/uk/technology/swift-developers
- https://cloudemployee.io/uk/technology/swiftui
- https://cloudemployee.io/uk/technology/tailwind
- https://cloudemployee.io/uk/technology/tensorflow-developers
- https://cloudemployee.io/uk/technology/terraform
- https://cloudemployee.io/uk/technology/testrail
- https://cloudemployee.io/uk/technology/typescript-developers
- https://cloudemployee.io/uk/technology/uikit
- https://cloudemployee.io/uk/technology/unity-developers
- https://cloudemployee.io/uk/technology/vector-db-developers
- https://cloudemployee.io/uk/technology/vercel-developers
- https://cloudemployee.io/uk/technology/vertex-ai-developers
- https://cloudemployee.io/uk/technology/weaviate-developers
- https://cloudemployee.io/uk/technology/webflow-developers
- https://cloudemployee.io/uk/technology/xamarin-developers
- https://cloudemployee.io/uk/technology/xano
- https://cloudemployee.io/uk/technology/xcode
- https://cloudemployee.io/uk/technology/zapier

### TOOL

- US count: 3
- UK count: 2

**US URLs:**

- https://cloudemployee.io/hiring-cost-calculator
- https://cloudemployee.io/price-comparison-calculator
- https://cloudemployee.io/tools/culture-match

**UK URLs:**

- https://cloudemployee.io/uk/price-comparison-calculator
- https://cloudemployee.io/uk/tools/culture-match

### VIDEO

- US count: 21
- UK count: 22

**US URLs:**

- https://cloudemployee.io/videos/boost-remote-dev-productivity-with-a-how-to-work-with-me-guide
- https://cloudemployee.io/videos/danis-journey-as-a-front-end-engineer-at-cloud-employee
- https://cloudemployee.io/videos/de-risked-dev-hiring-for-changing-markets
- https://cloudemployee.io/videos/employee-experience
- https://cloudemployee.io/videos/employee-experience-that-keeps-offshore-devs-engaged
- https://cloudemployee.io/videos/hiring-one-dev-backed-by-200
- https://cloudemployee.io/videos/how-cloud-employee-keeps-remote-developers-motivated
- https://cloudemployee.io/videos/how-our-clients-retain-devs-long-term
- https://cloudemployee.io/videos/how-stability-attracts-top-dev-talent-in-the-philippines
- https://cloudemployee.io/videos/how-the-cloud-employee-hiring-engine-works
- https://cloudemployee.io/videos/how-to-build-a-remote-team-that-lasts
- https://cloudemployee.io/videos/how-we-find-the-right-developer-faster
- https://cloudemployee.io/videos/how-we-keep-remote-devs-connected-and-engaged
- https://cloudemployee.io/videos/how-we-retain-97-of-remote-developers
- https://cloudemployee.io/videos/matching-company-values
- https://cloudemployee.io/videos/onboarding-global-dev-teams-with-purpose
- https://cloudemployee.io/videos/onboarding-offshore-devs-that-deliver-fast
- https://cloudemployee.io/videos/peer-forum-building-connections-beyond-work
- https://cloudemployee.io/videos/peer-forums-for-remote-developers
- https://cloudemployee.io/videos/what-connection-looks-like-in-a-global-dev-team
- https://cloudemployee.io/videos/why-the-philippines-is-a-smart-choice-for-growing-your-dev-team

**UK URLs:**

- https://cloudemployee.io/uk/videos/boost-remote-dev-productivity-with-a-how-to-work-with-me-guide
- https://cloudemployee.io/uk/videos/danis-journey-as-a-front-end-engineer-at-cloud-employee
- https://cloudemployee.io/uk/videos/de-risked-dev-hiring-for-changing-markets
- https://cloudemployee.io/uk/videos/employee-experience
- https://cloudemployee.io/uk/videos/employee-experience-that-keeps-offshore-devs-engaged
- https://cloudemployee.io/uk/videos/hiring-one-dev-backed-by-200
- https://cloudemployee.io/uk/videos/how-cloud-employee-keeps-remote-developers-motivated
- https://cloudemployee.io/uk/videos/how-our-clients-retain-devs-long-term
- https://cloudemployee.io/uk/videos/how-stability-attracts-top-dev-talent-in-the-philippines
- https://cloudemployee.io/uk/videos/how-the-cloud-employee-hiring-engine-works
- https://cloudemployee.io/uk/videos/how-to-build-a-remote-team-that-lasts
- https://cloudemployee.io/uk/videos/how-we-find-the-right-developer-faster
- https://cloudemployee.io/uk/videos/how-we-keep-remote-devs-connected-and-engaged
- https://cloudemployee.io/uk/videos/how-we-retain-97-of-remote-developers
- https://cloudemployee.io/uk/videos/matching-company-values
- https://cloudemployee.io/uk/videos/onboarding-global-dev-teams-with-purpose
- https://cloudemployee.io/uk/videos/onboarding-offshore-devs-that-deliver-fast
- https://cloudemployee.io/uk/videos/pair-programming-at-cloud-employee
- https://cloudemployee.io/uk/videos/peer-forum-building-connections-beyond-work
- https://cloudemployee.io/uk/videos/peer-forums-for-remote-developers
- https://cloudemployee.io/uk/videos/what-connection-looks-like-in-a-global-dev-team
- https://cloudemployee.io/uk/videos/why-the-philippines-is-a-smart-choice-for-growing-your-dev-team

### UNKNOWN (see Section 10 for full detail)

Count: 4

- https://cloudemployee.io/cdn-cgi/challenge-platform/scripts/jsd/main.js
- https://cloudemployee.io/haqt6iy0yx2enjczmzi2odmxywjlzdyynjcwntfmytex/a
- https://cloudemployee.io/sitemap.xml
- https://cloudemployee.io/uk/embedding

---

## SECTION 3: GLOBAL COMPONENTS

Source: `ce-global-components.json` — extracted from `https://cloudemployee.io/`.

### Navigation (top bar)

- CTA button: label=`Schedule a Call`, type=`calendly`
- Mobile CTA: label=`Schedule a Call`, type=`calendly`
- Has locale dropdown: `True`

**Top-level links (verbatim):**

| # | Label | Href |
|---|---|---|
| 1 | Services | https://www.cloudemployee.io/services |
| 2 | Our Clients | https://www.cloudemployee.io/our-work |
| 3 | How It Works | https://www.cloudemployee.io/embedding |
| 4 | How It Works | https://www.cloudemployee.io/how-it-works |
| 5 | Resources | https://www.cloudemployee.io/blog |
| 6 | Pricing | https://www.cloudemployee.io/pricing |
| 7 | About Us | https://www.cloudemployee.io/about-us |

**Dropdown sections:**

#### `Services` → https://www.cloudemployee.io/services
- CMS-driven: `True`
- CMS item count: 19
- Hardcoded items in dropdown: 19

| # | Label | Href |
|---|---|---|
| 1 | Software Engineers | https://www.cloudemployee.io/services/software-engineers |
| 2 | Fractional CTOs | https://www.cloudemployee.io/services/fractional-ctos |
| 3 | Mobile Developers | https://www.cloudemployee.io/services/mobile-developers |
| 4 | QA Analysts & Testers | https://www.cloudemployee.io/services/qa-analysts-testers |
| 5 | DevOps Engineers | https://www.cloudemployee.io/services/devops-engineers |
| 6 | Data Scientists | https://www.cloudemployee.io/services/data-scientists |
| 7 | No-Code Developers | https://www.cloudemployee.io/services/no-code-developers |
| 8 | TypeScript Developers | https://www.cloudemployee.io/technology/typescript-developers |
| 9 | AWS Developers | https://www.cloudemployee.io/technology/aws-developers |
| 10 | .NET Developers | https://www.cloudemployee.io/technology/dotnet-developers |
| 11 | React Developers | https://www.cloudemployee.io/technology/react-developers |
| 12 | Node.js Developers | https://www.cloudemployee.io/technology/nodejs-developers |
| 13 | Python Developers | https://www.cloudemployee.io/technology/python-developers |
| 14 | MVP Development | https://www.cloudemployee.io/services/mvp-development |
| 15 | Mobile Apps | https://www.cloudemployee.io/services/mobile-apps |
| 16 | Web-Based Apps | https://www.cloudemployee.io/services/web-based-apps |
| 17 | AI Engineers | https://www.cloudemployee.io/services/ai-engineers |
| 18 | AI Consulting | https://www.cloudemployee.io/services/ai-consulting |
| 19 | AI Product Builds | https://www.cloudemployee.io/services/ai-product-builds |

#### `How It Works` → https://www.cloudemployee.io/embedding
- CMS-driven: `False`
- CMS item count: 0
- Hardcoded items in dropdown: 0

#### `Resources` → https://www.cloudemployee.io/blog
- CMS-driven: `True`
- CMS item count: 6
- Hardcoded items in dropdown: 0

### Footer

- Newsletter form GUID: `deac2450-b51b-4630-b9e2-47017a13da15`
- Copyright text: `© 2026 Cloud Employee. All rights reserved.`
- Has locale dropdown: `True`

**Locale options:**

| Label | Href | hreflang |
|---|---|---|
| United States | https://www.cloudemployee.io/ | en |
| United Kingdom | https://www.cloudemployee.io/uk | en-GB |

**Columns:**

#### Column: `Full-time Staff Augmentation`

| # | Label | Href |
|---|---|---|
| 1 | Software Engineers | https://www.cloudemployee.io/services/software-engineers |
| 2 | AI Engineers | https://www.cloudemployee.io/services/ai-engineers |
| 3 | Fractional CTOs | https://www.cloudemployee.io/services/fractional-ctos |
| 4 | Mobile Developers | https://www.cloudemployee.io/services/mobile-developers |
| 5 | QA Analysts & Testers | https://www.cloudemployee.io/services/qa-analysts-testers |
| 6 | DevOps Engineers | https://www.cloudemployee.io/services/devops-engineers |
| 7 | Data Scientists | https://www.cloudemployee.io/services/data-scientists |
| 8 | No-Code Developers | https://www.cloudemployee.io/services/no-code-developers |

#### Column: `Technology`

| # | Label | Href |
|---|---|---|
| 1 | React | https://www.cloudemployee.io/technology/react-developers |
| 2 | Node.js | https://www.cloudemployee.io/technology/nodejs-developers |
| 3 | Python | https://www.cloudemployee.io/technology/python-developers |
| 4 | TypeScript | https://www.cloudemployee.io/technology/typescript-developers |
| 5 | AWS | https://www.cloudemployee.io/technology/aws-developers |
| 6 | .NET | https://www.cloudemployee.io/technology/dotnet-developers |
| 7 | Java | https://www.cloudemployee.io/technology/java-developers |
| 8 | LATAM Developers | https://www.cloudemployee.io/services/latam-developers |
| 9 | Philippines Developers | https://www.cloudemployee.io/services/philippines-developers |

#### Column: `About`

| # | Label | Href |
|---|---|---|
| 1 | Book a call | # |
| 2 | How it works | https://www.cloudemployee.io/how-it-works |
| 3 | About us | https://www.cloudemployee.io/about-us |
| 4 | Pricing | https://www.cloudemployee.io/pricing |
| 5 | Reviews | https://www.cloudemployee.io/reviews |
| 6 | Careers | https://www.cloudemployee.io/for-developers |

#### Column: `Resources`

| # | Label | Href |
|---|---|---|
| 1 | Customer Stories | https://www.cloudemployee.io/customer-stories |
| 2 | CE vs. Alternatives | https://www.cloudemployee.io/compare |
| 3 | Blogs | https://www.cloudemployee.io/blog |
| 4 | Free Downloads | https://www.cloudemployee.io/downloads |
| 5 | Tools | https://www.cloudemployee.io/tools |
| 6 | Video Library | https://www.cloudemployee.io/videos |

**Legal links:**

| Label | Href |
|---|---|
| Privacy Policy | https://www.cloudemployee.io/legals/privacy-policy |

### Announcement bar

- Present: `True`
- Visible (at source URL at capture time): `False`
- Text: `New Price Comparison Calculator (In-house vs. Cloud Employee)`
- CTA label: `Try it now`
- CTA href: `https://www.cloudemployee.io/archive/old-pricing`

### Clara chat widget

- Present: `True`
- Script src: `https://clara.cloudemployee.io/widget.js`
- Workspace ID: `09aa62df-5af6-4cec-b565-c335e907327d`

### Finsweet attributes

- Present: `True`
- Used for: `list-combine, list`

Hardcoded vs collection-driven summary:
- Nav `Services` dropdown: **CMS-driven** (`isCmsDriven=true`, cmsItemCount=19) but the extract lists all 19 items verbatim above.
- Nav `How It Works` dropdown: **hardcoded** (`isCmsDriven=false`, 0 items listed — it is a single link, not a dropdown in the extract).
- Nav `Resources` dropdown: **CMS-driven** (`isCmsDriven=true`, cmsItemCount=6, 0 items listed in the extract).
- Footer: every link is enumerated verbatim in the extract — no CMS-driven lists are declared in `footer`.

---

## SECTION 4: FORMS

Source: `ce-forms.json`. Portal ID: `22809822`. Forms extracted at `2026-04-21T02:32:42.970Z`. Anomalies: 0. `CLAUDE.md` states: 25 forms exist in the HubSpot portal but only 3 are embedded on live pages (verified via Forms v2 API). The extract lists those 3 forms.

### Form: Start Hiring Request (via cloudemployee.io/start-hiring)

- HubSpot portal ID: `22809822`
- HubSpot form GUID: `24f5bd5f-3532-4c4e-908f-1266809bc897`
- Page URL: https://cloudemployee.io/price-comparison-calculator
- Page path: `/price-comparison-calculator`
- Template type of page: `TOOL` (locale `us`, classification `llm`)
- Detection method: HubSpot Forms v2 API (`apiVerified=true` at `2026-04-21T02:32:41.349Z`)
- Notify emails: `[]`
- Connected workflow IDs: `[]`
- Connected workflow names: `[]`
- Connected list IDs: `[]`
- Connected list names: `[]`
- Raw embed code:
```html
hbspt.forms.create({
    portalId: "22809822",
    formId: "24f5bd5f-3532-4c4e-908f-1266809bc897"
  });
```
**Fields:**

| Name | Label | Field type | Required | Hidden | Options |
|---|---|---|---|---|---|
| `firstname` | Your First Name | text | yes | no | [] |
| `lastname` | Your Last Name | text | yes | no | [] |
| `email` | Your email | text | yes | no | [] |
| `cell_phone` | Mobile Number | number | no | no | [] |
| `company` | Company Name | text | yes | no | [] |
| `information` | Please tell us more about what you need for your dream technical team?&#xa0; | textarea | yes | no | [] |

### Form: New form (November 21, 2024 3:58:36 PM GMT)

- HubSpot portal ID: `22809822`
- HubSpot form GUID: `444bfbf1-2018-456c-b8fd-932d909b0888`
- Page URL: https://cloudemployee.io/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models
- Page path: `/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models`
- Template type of page: `BLOG` (locale `us`, classification `rules`)
- Detection method: HubSpot Forms v2 API (`apiVerified=true` at `2026-04-21T02:32:41.363Z`)
- Notify emails: `[]`
- Connected workflow IDs: `[]`
- Connected workflow names: `[]`
- Connected list IDs: `[]`
- Connected list names: `[]`
- Inline success message: `Thanks for submitting the form.`
- Raw embed code:
```html
hbspt.forms.create({
    portalId: "22809822",
    formId: "444bfbf1-2018-456c-b8fd-932d909b0888"
  });
```
**Fields:**

| Name | Label | Field type | Required | Hidden | Options |
|---|---|---|---|---|---|
| `firstname` | First name | text | no | no | [] |
| `lastname` | Last name | text | no | no | [] |
| `email` | Email | text | yes | no | [] |
| `country` | Location | text | no | no | [] |
| `ctomessage` | Message | textarea | no | no | [] |

### Form: Start Hiring (Part 2/8)

- HubSpot portal ID: `22809822`
- HubSpot form GUID: `1578f9b5-fb43-4772-83df-79c51c120a92`
- Page URL: https://cloudemployee.io/start-hiring/contact-info
- Page path: `/start-hiring/contact-info`
- Template type of page: `BOOK_A_CALL` (locale `us`, classification `llm`)
- Detection method: HubSpot Forms v2 API (`apiVerified=true` at `2026-04-21T02:32:42.970Z`)
- Notify emails: `[]`
- Connected workflow IDs: `[]`
- Connected workflow names: `[]`
- Connected list IDs: `[]`
- Connected list names: `[]`
- Raw embed code:
```html
hbspt.forms.create({
    portalId: "22809822",
    formId: "1578f9b5-fb43-4772-83df-79c51c120a92",
    region: "na1"
  });
```
**Fields:**

| Name | Label | Field type | Required | Hidden | Options |
|---|---|---|---|---|---|
| `company` | Company name | text | yes | no | [] |
| `phone` | Phone number | phonenumber | yes | no | [] |
| `firstname` | First name | text | no | no | [] |
| `email` | Email | text | no | no | [] |

---

## SECTION 5: THIRD-PARTY SCRIPTS

Source: `ce-scripts.json`. Global scripts: 17. Per-page script entries: 261.

**Summary flags (`ce-scripts.json.summary`):**
- hasGTM: `True` — container(s): `['GTM-WL45TCTW']`
- hasGA4: `True` — measurement id(s): `['G-2Q22ZM5PLY']`
- hasLinkedIn: `True` — partner id: `4901289`
- hasCookieConsent: `False`
- hasChat: `True` — provider: `Clara Chat Widget`
- hasHeatmap: `True` — provider: `Hotjar`
- Other scripts flagged: `['GeoTargetly', 'GSAP', 'Swiper.js', 'Calendly Widget', 'Finsweet Attributes']`

### Global scripts (loaded on every page)

SEO-critical scripts are flagged below. Analytics/tag manager scripts (GTM, GA4) are marked SEO-critical because they directly influence Google Search Console data and analytics attribution on the live site.

| # | Name | Identifier | Category | Load location | Source | SEO-critical |
|---|---|---|---|---|---|---|
| 1 | GA4 | `G-2Q22ZM5PLY` | analytics | head | https://www.googletagmanager.com/gtag/js?id=G-2Q22ZM5PLY&gtg_health=1 | yes |
| 2 | Vector Tag | `Vector Tag` | analytics | head | https://cdn.vector.co/pixel.js | yes |
| 3 | Google Tag Manager | `GTM-WL45TCTW` | tag_manager | head | https://www.googletagmanager.com/gtm.js?id=GTM-WL45TCTW | yes |
| 4 | GeoTargetly | `GeoTargetly` | other | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2F404 | no |
| 5 | Facebook Pixel | `Facebook Pixel` | advertising | head | https://connect.facebook.net/en_US/fbevents.js | no |
| 6 | Facebook Pixel | `160820827844254` | advertising | head | (inline) | no |
| 7 | LinkedIn Insight | `4901289` | advertising | head | (inline) | no |
| 8 | Ahrefs Analytics | `Ahrefs Analytics` | analytics | head | https://analytics.ahrefs.com/analytics.js | yes |
| 9 | Hotjar | `Hotjar` | heatmap | head | https://static.hotjar.com/c/hotjar-4985481.js?sv=6 | no |
| 10 | GSAP | `3.12.5` | other | body_start | https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js | no |
| 11 | Swiper.js | `11` | other | body_start | https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js | no |
| 12 | Calendly Widget | `Calendly Widget` | other | body_start | https://assets.calendly.com/assets/external/widget.js | no |
| 13 | HubSpot Tracking | `22809822` | analytics | body_start | https://js.hs-scripts.com/22809822.js | yes |
| 14 | Hotjar | `4985481` | heatmap | inline | (inline) | no |
| 15 | Finsweet Attributes | `2` | other | body_start | https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js | no |
| 16 | Clara Chat Widget | `Clara Chat Widget` | chat | body_start | https://clara.cloudemployee.io/widget.js | no |
| 17 | Cloudflare Insights | `Cloudflare Insights` | analytics | body_start | https://static.cloudflareinsights.com/beacon.min.js/v8c78df7c7c0f484497ecbca7046644da1771523124516 | yes |

### Template-specific / per-page scripts

`ce-scripts.json.perPage` has 261 entries keyed by URL path. Each entry is a list of scripts that were detected on that page after removing the global set. The list below rolls these up by detected **template type** (resolved via `ce-template-map.json`) and deduplicated by `(name, identifier, src)`.

#### Template: BLOG

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| GA4 | `g-developers` | analytics | head | (inline) | 2 | yes |
| GA4 | `g-developers` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fhiring-tips%2Fhiring-developers-in-the-philippines-cost-quality-culture-fit-for-outsourced-software-development | 1 | yes |
| GA4 | `g-distributed` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fmanaging-engineers%2Fmanaging-distributed-teams-a-ctos-2025-playbook | 1 | yes |
| GA4 | `g-engineering` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fmanaging-engineers%2Favoiding-burnout-in-scaling-engineering-teams | 1 | yes |
| GA4 | `g-engineering` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fscaling-teams%2Fleadership-strategies-for-scaling-engineering-teams | 1 | yes |
| GA4 | `g-interviews` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fhiring-tips%2Fhow-to-run-pair-programming-interviews-cloud-employees-hiring-sop | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2F7-benefits-of-outsourcing-web-development-for-startups | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fchoosing-nearshore-or-offshore-software-development-costs-by-country | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Ffreelancers-vs-cloud-employee | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fit-outsourcing-services-scope-slas-2025-costs | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fnearshore-software-development-how-to-choose-the-right-vendor | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fnearshore-vs-offshore-costs-2026-software-development-rates | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fnearshore-vs-offshore-staff-augmentation | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fnearshoring-or-offshoring-the-strategic-choice-for-tech-leaders | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Foffshore-developer-pricing-hourly-vs-monthly | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fwhat-is-it-outsourcing-definition-models-when-to-use-it | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fwhat-is-nearshoring-benefits-and-challenges-for-software-development-teams | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring%2Fwhat-is-offshoring-cost-effective-tech-teams-explained | 1 | yes |
| GA4 | `g-outsourcing` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fstaff-augmentation%2Fstaff-augmentation-vs-consulting-outsourcing-and-managed-services | 1 | yes |
| GSAP | `3` | other | body_start | https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js | 63 | no |
| HubSpot Forms | `22809822` | analytics | inline | (inline) | 36 | yes |
| HubSpot Forms | `HubSpot Forms` | analytics | body_start | https://js.hsforms.net/forms/embed/v2.js | 36 | yes |
| Vimeo Player | `1094751761` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1103337969` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1103339877` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1112622116` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1119662748` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1124188424` | other | inline | (inline) | 1 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 63 | no |

#### Template: BOOK_A_CALL

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmstabs@1/cmstabs.js | 1 | no |
| GA4 | `G-0YuKVH4D38sNW` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-components` | analytics | inline | (inline) | 1 | yes |
| HubSpot Forms | `22809822` | analytics | inline | (inline) | 1 | yes |
| HubSpot Forms | `HubSpot Forms` | analytics | body_start | https://js.hsforms.net/forms/embed/v2.js | 1 | yes |
| OneTrust | `OneTrust` | consent | body_start | https://cdn.cookielaw.org/scripttemplates/202508.2.0/otBannerSdk.js | 1 | no |
| Vimeo Player | `1092726413` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1127889321` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1131836141` | other | inline | (inline) | 2 | no |
| Vimeo Player | `1145433775` | other | inline | (inline) | 1 | no |
| Vimeo Player | `Vimeo Player` | other | body_start | https://player.vimeo.com/api/player.js | 1 | no |
| YouTube Embed | `2KFe657YKdE` | other | inline | (inline) | 1 | no |
| YouTube Embed | `VcTsMI6M-sA` | other | inline | (inline) | 1 | no |
| YouTube Embed | `bqZ90UopRjg` | other | inline | (inline) | 1 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 2 | no |

#### Template: COMPARE

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js | 1 | no |
| GA4 | `g-developers` | analytics | head | (inline) | 2 | yes |
| GSAP | `3` | other | body_start | https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js | 22 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 22 | no |

#### Template: CUSTOMER_STORY

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js | 1 | no |
| GA4 | `G-yegSuON0SKVmR66w0jXUI2LRLt9BMrMhUgaiPE` | analytics | inline | (inline) | 1 | yes |
| Vimeo Player | `1092726413` | other | inline | (inline) | 2 | no |
| Vimeo Player | `1092736875` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1092738250` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1094749643` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1110779695` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1145433775` | other | inline | (inline) | 2 | no |
| YouTube Embed | `VcTsMI6M-sA` | other | inline | (inline) | 1 | no |
| YouTube Embed | `YouTube Embed` | other | head | (inline) | 3 | no |
| YouTube Embed | `bqZ90UopRjg` | other | inline | (inline) | 1 | no |

#### Template: DOWNLOAD

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-modal@1/modal.js | 2 | no |
| GSAP | `3` | other | body_start | https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js | 2 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 2 | no |

#### Template: HOME

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmstabs@1/cmstabs.js | 1 | no |
| Vimeo Player | `1092726413` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1127889321` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1131836141` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1145433775` | other | inline | (inline) | 1 | no |
| Vimeo Player | `Vimeo Player` | other | body_start | https://player.vimeo.com/api/player.js | 1 | no |
| YouTube Embed | `VcTsMI6M-sA` | other | inline | (inline) | 1 | no |
| YouTube Embed | `YouTube Embed` | other | inline | (inline) | 1 | no |
| YouTube Embed | `bqZ90UopRjg` | other | inline | (inline) | 1 | no |

#### Template: SERVICE

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js | 3 | no |
| GA4 | `G-b3L2v2TAxX` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-bdfbYJB82IRhUQQOTDS3n97v92r3fSYk` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-2EUepsjNDZrIUxiJJQc` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-NjsVgPYWPIF1cBOfmhhsc2uU3mFJ9XpSOl3eaVCUpMZL57XZAMu51Nm7ZF` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-PaK4MeHKBDE` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-W3ZxD46dTi2v2TAxj46dTi2v2TAw` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-gLDzF0FklDJVhr36OqY4GSuf184jg611T8M0vtJt01A` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-tLXiO3I7yMQWrA` | analytics | inline | (inline) | 1 | yes |
| Vimeo Player | `1093145565` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1093145816` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1093730675` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1103337299` | other | inline | (inline) | 26 | no |
| Vimeo Player | `1103337969` | other | inline | (inline) | 26 | no |
| Vimeo Player | `1103338492` | other | inline | (inline) | 26 | no |
| Vimeo Player | `1103339234` | other | inline | (inline) | 26 | no |
| Vimeo Player | `1103339877` | other | inline | (inline) | 26 | no |
| Vimeo Player | `1107272631` | other | inline | (inline) | 26 | no |
| Vimeo Player | `1107276324` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1119661505` | other | inline | (inline) | 3 | no |
| Vimeo Player | `1119662748` | other | inline | (inline) | 3 | no |
| Vimeo Player | `1127889321` | other | inline | (inline) | 3 | no |
| Vimeo Player | `1145433775` | other | inline | (inline) | 23 | no |
| Vimeo Player | `1148141041` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1148146778` | other | inline | (inline) | 1 | no |
| Vimeo Player | `Vimeo Player` | other | body_start | https://player.vimeo.com/api/player.js | 3 | no |
| YouTube Embed | `6c8b3c4b90ea40eab279d53c0ef4352c` | other | head | (inline) | 1 | no |
| YouTube Embed | `I5LIlb1KviA` | other | inline | (inline) | 26 | no |
| YouTube Embed | `VcTsMI6M-sA` | other | inline | (inline) | 23 | no |
| YouTube Embed | `YouTube Embed` | other | inline | (inline) | 26 | no |
| YouTube Embed | `e4d3SXq-2_w` | other | inline | (inline) | 26 | no |
| YouTube Embed | `iYFJPzDH5Hs` | other | inline | (inline) | 3 | no |
| YouTube Embed | `pgfwuaxXfqo` | other | inline | (inline) | 3 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 23 | no |

#### Template: STATIC

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-a11y@1/a11y.js | 1 | no |
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js | 1 | no |
| GSAP | `3` | other | body_start | https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js | 1 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 1 | no |

#### Template: TAXONOMY

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| Finsweet Attributes | `Finsweet Attributes` | other | head | https://cdn.jsdelivr.net/npm/@finsweet/attributes-cmsfilter@1/cmsfilter.js | 10 | no |
| GA4 | `g-engineering` | analytics | head | (inline) | 2 | yes |
| GA4 | `g-interviews` | analytics | head | (inline) | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | (inline) | 1 | yes |
| GA4 | `g-offshoring` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fnearshoring-offshoring | 1 | yes |
| Vimeo Player | `1131836141` | other | inline | (inline) | 1 | no |
| Vimeo Player | `1145433775` | other | inline | (inline) | 2 | no |
| Vimeo Player | `Vimeo Player` | other | body_start | https://player.vimeo.com/api/player.js | 1 | no |
| YouTube Embed | `VcTsMI6M-sA` | other | inline | (inline) | 2 | no |
| YouTube Embed | `YouTube Embed` | other | inline | (inline) | 2 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 8 | no |

#### Template: TECHNOLOGY

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| GA4 | `G-83q9rrXiAEQhqejhdv9kwMYhqejhdv9kwM` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-Az98bT9FrftZpBXeaoHkONMs4D4kAnkgCo4` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-E3j4tbYa8ya` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-FSWgjGQ52BLaoAaylXACp65s6z5vOwHPADcNWLIGZareuV9j1noLoaD3OOxXKXwBYDL` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-KkuX9QcMsKXIb1mlKilnlr8` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-Q7EbALWWFRFOa7Ve0S9r7KWKGWIOS7A` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-UwAJDyFTMCzyi3GlMDuNcd` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-Y0oo5BxRRU09ICG3RMdGX5UV5Xyt3iQPio7lQpadbcti9QGmzjet` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-bgVbZmdkn5uBiBWNRtHtv` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-dNj6KMb10iFgcxo6CAmBAMhpaVtuGFfy9usXapobRJnIZE` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-fRhDk9lV4bF9I0wVSd9zNOVRhozVN` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-kA0bekGXGX90tnHNPu65yVTZ79FgwK9` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-o8qjWw0pMz29bnaHUg2k8tjp74VFM` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-otsa8l3fdPIGTiKPxj8ZT0ALBTchmuM` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-r15Y0t1VIP` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-rQ7GyqD1Pk` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-t6ZrQEQxJSLqdv9kwMYxJSLqdv9kwM` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-vaBibQZ64ynW1u9MTdv8tGOC2me3D1V89RfzGpK9Qc0EO76uwdyauGfk4Op9hq70` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-xptXZ3SqaoMi` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-47DLnmQTuXiMs5` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-4fOXlFdEAcI9cMA9XuntjLXsJduF5aafi0` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-8IZ0GZgeurCdKS` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-LeqZcOUMXdu4uMiiA4xR` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-NF7KAQQSKWP0` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-NF7KAQQyw5mU` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-NF7KAQSawfon` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-NF7KAQTd9KR4` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-PhxIdoMUnPRcie7nqiSCiw7gA` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-Z2auAEQgIbWre` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-bpZyVc9WECqE` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-developers` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Ftechnology%2Fposthog-developers | 1 | yes |
| GA4 | `g-fKmqHBl2QBSh8hUwrkU5BIUIi7vy` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-fq8QxUiVEys0isuQG4DRuhaa0UWX` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-g2g78fzDJi0IHqnYGPd` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-hwrFv9nxhTlPf2IO0Dqg` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-jTYSlysBRg0uswLO` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-jY1NTLl9szFys` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-rTUgVs6vhNTdekKDwmWI85bXy8I30LdxFyhEPYdWljDAQMgRJMAOF` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-t0L6ZxQc4MPI82g8nbnR` | analytics | inline | (inline) | 1 | yes |
| Vimeo Player | `1103337299` | other | inline | (inline) | 96 | no |
| Vimeo Player | `1103337969` | other | inline | (inline) | 96 | no |
| Vimeo Player | `1103338492` | other | inline | (inline) | 96 | no |
| Vimeo Player | `1103339234` | other | inline | (inline) | 96 | no |
| Vimeo Player | `1103339877` | other | inline | (inline) | 96 | no |
| Vimeo Player | `1107272631` | other | inline | (inline) | 96 | no |
| Vimeo Player | `1145433775` | other | inline | (inline) | 96 | no |
| YouTube Embed | `I5LIlb1KviA` | other | inline | (inline) | 96 | no |
| YouTube Embed | `VcTsMI6M-sA` | other | inline | (inline) | 96 | no |
| YouTube Embed | `YouTube Embed` | other | inline | (inline) | 96 | no |
| YouTube Embed | `e4d3SXq-2_w` | other | inline | (inline) | 96 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 96 | no |

#### Template: TOOL

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| GSAP | `3` | other | body_start | https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js | 1 | no |
| HubSpot Forms | `22809822` | analytics | inline | (inline) | 1 | yes |
| HubSpot Forms | `HubSpot Forms` | analytics | body_start | https://js.hsforms.net/forms/embed/v2.js | 1 | yes |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 1 | no |

#### Template: VIDEO

| Name | Identifier | Category | Load location | Source | Pages using | SEO-critical |
|---|---|---|---|---|---|---|
| GA4 | `G-xO1CGjkCuXw` | analytics | inline | (inline) | 1 | yes |
| GA4 | `G-yj02Y6Y5hRBLQWbp7` | analytics | inline | (inline) | 1 | yes |
| GA4 | `g-connections` | analytics | head | https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com/&winurl=https%3A%2F%2Fwww.cloudemployee.io%2Fvideos%2Fpeer-forum-building-connections-beyond-work | 1 | yes |
| GA4 | `g-synthetics` | analytics | inline | (inline) | 1 | yes |
| GSAP | `3` | other | body_start | https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js | 21 | no |
| Vimeo Player | `1103337299` | other | inline | (inline) | 11 | no |
| Vimeo Player | `1103337969` | other | inline | (inline) | 11 | no |
| Vimeo Player | `1103338492` | other | inline | (inline) | 11 | no |
| Vimeo Player | `1103339234` | other | inline | (inline) | 11 | no |
| Vimeo Player | `1103339877` | other | inline | (inline) | 11 | no |
| Vimeo Player | `1107272631` | other | inline | (inline) | 11 | no |
| Vimeo Player | `1112621285` | other | inline | (inline) | 6 | no |
| Vimeo Player | `1112622116` | other | inline | (inline) | 6 | no |
| Vimeo Player | `1112622619` | other | inline | (inline) | 6 | no |
| Vimeo Player | `1112622895` | other | inline | (inline) | 6 | no |
| Vimeo Player | `1112623588` | other | inline | (inline) | 6 | no |
| Vimeo Player | `1112624464` | other | inline | (inline) | 6 | no |
| Vimeo Player | `1119661505` | other | inline | (inline) | 11 | no |
| Vimeo Player | `1119662748` | other | inline | (inline) | 11 | no |
| YouTube Embed | `I5LIlb1KviA` | other | inline | (inline) | 11 | no |
| YouTube Embed | `Itq9VzfByJQ` | other | inline | (inline) | 4 | no |
| YouTube Embed | `SaP-44XVqLE` | other | inline | (inline) | 4 | no |
| YouTube Embed | `YouTube Embed` | other | inline | (inline) | 17 | no |
| YouTube Embed | `e4d3SXq-2_w` | other | inline | (inline) | 11 | no |
| YouTube Embed | `glbOCq6CSgw` | other | inline | (inline) | 4 | no |
| YouTube Embed | `iYFJPzDH5Hs` | other | inline | (inline) | 11 | no |
| YouTube Embed | `nxvbKgarALw` | other | inline | (inline) | 4 | no |
| YouTube Embed | `pgfwuaxXfqo` | other | inline | (inline) | 11 | no |
| socks-ui Accordion | `0.2.9` | other | body_start | https://unpkg.com/socks-ui@0.2.9/dist/accordion.js | 21 | no |

---

## SECTION 6: CUSTOM CODE BY TEMPLATE

Source: `ce-template-custom-code-review.json` (789 items). Scope buckets: semi_global=745, template_level=24, unknown=20. SEO-critical flag applied to 31 items. The `semi_global` bucket is known tech debt (`CLAUDE.md` §AUDIT-1 item #7) — those items appear on 80%+ of template types and are really global scripts that the detector missed. They are counted but not listed individually below; the `template_level` and `unknown` buckets contain the items that are genuinely scoped to a single template or couldn't be classified.

### Template: BLOG

- Total custom code items: 41
- `semi_global`: 40 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 1
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models | template_level | no | yes (cloudemployee.io URL) | Large inline script — verify intent | \n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": ",\n  "description": ",\n  "datePublished": ",\n  "dateModified": ",\n  "image": … |

### Template: BOOK_A_CALL

- Total custom code items: 37
- `semi_global`: 34 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 3
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/book-a-call/shawnee | template_level | yes | unknown | SEO-critical script | \n{\n  "@context": "https://schema.org",\n  "@graph": [\n\n    /* ---------- WebPage (Contact/Profile) ---------- */\n    {\n      "@type": ["WebPage","ContactP… |
| 2 | https://cloudemployee.io/book-a-call/shawnee | template_level | no | unknown | Large inline script — verify intent | \n      recaptcha.anchor.Main.init("[\x22ainput\x22,[\x22bgdata\x22,null,null,null,\x22MnDCnMKbw4Fqwq5pw5HCvsKGKkltJsOYP8KDDXvDnQfDicK0wpI+wpFrwpfCq1QqSnXCscKkw… |
| 3 | https://cloudemployee.io/book-a-call/shawnee | template_level | no | unknown | Large inline script — verify intent | \n  // Helper: read UTM params from the current page URL using URLSearchParams\n  function getUTMs() {\n    const p = new URLSearchParams(window.location.search… |

### Template: COMPARE

- Total custom code items: 39
- `semi_global`: 39 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 0
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

- (none)

### Template: CUSTOMER_STORY

- Total custom code items: 37
- `semi_global`: 37 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 0
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

- (none)

### Template: DOWNLOAD

- Total custom code items: 40
- `semi_global`: 39 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 1
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/download/10-ai-prompts | template_level | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://www.loom.com/embed/2bcf0203320b48c4acd03af85b065cb8",\n      "originalUrl": "https://www.loom.com/embed/2bcf020332… |

### Template: HOME

- Total custom code items: 81
- `semi_global`: 74 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 5
- `unknown`: 2
- SEO-critical items flagged: 3

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/ | template_level | no | unknown | Large inline script — verify intent | window.playerConfig = {"cdn_url":"https://f.vimeocdn.com","vimeo_api_url":"api.vimeo.com","request":{"files":{"dash":{"cdns":{"akfire_interconnect_quic":{"avc_u… |
| 2 | https://cloudemployee.io/ | template_level | no | unknown | Large inline script — verify intent | const fullscreenSupported="exitFullscreen"in document\\|\\|"webkitExitFullscreen"in document\\|\\|"webkitCancelFullScreen"in document\\|\\|"mozCancelFullScreen"in doc… |
| 3 | https://cloudemployee.io/ | template_level | no | unknown | Large inline script — verify intent | {"embedUrl":"https://player.vimeo.com/video/1131836141?h=765af4f0eb","thumbnailUrl":"https://i.vimeocdn.com/video/2099032566-6164b24bbc4a6339962e800f8ed1f22cdce… |
| 4 | https://cloudemployee.io/ | template_level | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1127889321?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=1&muted=1&… |
| 5 | https://cloudemployee.io/ | template_level | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1092726413?autoplay=1&muted=1&loop=1",\n      "originalUrl": "https://player.vimeo.com/vide… |
| 6 | https://cloudemployee.io/ | unknown | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context": "https://schema.org",\n  "@graph": [\n    {\n      "@type": ["Organization","ProfessionalService"],\n      "@id": "https://www.cloudemployee.… |
| 7 | https://cloudemployee.io/ | unknown | no | unknown | Large inline script — verify intent | \n// swiper\ndocument.addEventListener("DOMContentLoaded", function() {\n    const swiperTestimony = new Swiper('.swiper.testimonies', {\n        slidesPerView:… |

### Template: REVIEW

- Total custom code items: 35
- `semi_global`: 34 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 1
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/reviews/tidal | template_level | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context":"https://schema.org",\n  "@graph":[\n    {\n      "@type": ["Organization","ProfessionalService"],\n      "@id": "https://www.cloudemployee.io… |

### Template: SERVICE

- Total custom code items: 102
- `semi_global`: 93 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 1
- `unknown`: 8
- SEO-critical items flagged: 4

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/services/full-stack-developers | template_level | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context":"https://schema.org",\n  "@graph":[\n\n    /* ---------- WebPage (container) ---------- */\n    {\n      "@type":["WebPage","CollectionPage"],… |
| 2 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://www.youtube.com/embed/I5LIlb1KviA",\n      "originalUrl": "https://www.youtube.com/embed/I5LIlb1KviA",\n      "wid… |
| 3 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://www.youtube.com/embed/e4d3SXq-2_w",\n      "originalUrl": "https://www.youtube.com/embed/e4d3SXq-2_w",\n      "wid… |
| 4 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103337299",\n      "originalUrl": "https://player.vimeo.com/video/1103337299",\n      "wid… |
| 5 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103337969",\n      "originalUrl": "https://player.vimeo.com/video/1103337969",\n      "wid… |
| 6 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103339234",\n      "originalUrl": "https://player.vimeo.com/video/1103339234",\n      "wid… |
| 7 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1107272631",\n      "originalUrl": "https://player.vimeo.com/video/1107272631",\n      "wid… |
| 8 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103339877",\n      "originalUrl": "https://player.vimeo.com/video/1103339877",\n      "wid… |
| 9 | https://cloudemployee.io/services/full-stack-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103338492",\n      "originalUrl": "https://player.vimeo.com/video/1103338492",\n      "wid… |

### Template: STATIC

- Total custom code items: 36
- `semi_global`: 34 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 2
- `unknown`: 0
- SEO-critical items flagged: 2

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/events | template_level | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context":"https://schema.org",\n  "@graph":[\n    {\n      "@type":["WebPage","CollectionPage"],\n      "@id":"https://www.cloudemployee.io/events#webp… |
| 2 | https://cloudemployee.io/events | template_level | yes | unknown | SEO-critical script | \n(function () {\n  // ---------- helpers ----------\n  const stripHTML = (html) => {\n    if (!html) return '';\n    const div = document.createElement('div');… |

### Template: TAXONOMY

- Total custom code items: 57
- `semi_global`: 56 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 0
- `unknown`: 1
- SEO-critical items flagged: 2

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/services | unknown | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context": "https://schema.org",\n  "@graph": [\n    {\n      "@type": ["Organization","ProfessionalService"],\n      "@id": "https://www.cloudemployee.… |

### Template: TEAM_MEMBER

- Total custom code items: 36
- `semi_global`: 35 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 1
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/team/heather-wood | template_level | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context": "https://schema.org",\n  "@graph": [\n    {\n      "@type": "WebPage",\n      "@id": "https://www.cloudemployee.io/team/heather-wood#webpage"… |

### Template: TECHNOLOGY

- Total custom code items: 105
- `semi_global`: 93 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 3
- `unknown`: 9
- SEO-critical items flagged: 6

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/technology/react-developers | template_level | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context": "https://schema.org",\n  "@graph": [\n    {\n      "@type": ["WebPage","CollectionPage"],\n      "@id": "https://www.cloudemployee.io/technol… |
| 2 | https://cloudemployee.io/technology/react-developers | template_level | yes | yes (cloudemployee.io URL, /uk/ path literal) | SEO-critical script | \nif (window.location.pathname.startsWith('/uk/technology/')) {\n  var link = document.createElement('link');\n  link.rel = 'canonical';\n  link.href = 'https:/… |
| 3 | https://cloudemployee.io/technology/react-developers | template_level | yes | yes (/uk/ path literal) | SEO-critical script | \n(function() {\n  if (!window.location.pathname.startsWith('/uk/')) return;\n\n  var scripts = document.querySelectorAll('script[type="application/ld+json"]');… |
| 4 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://www.youtube.com/embed/I5LIlb1KviA",\n      "originalUrl": "https://www.youtube.com/embed/I5LIlb1KviA",\n      "wid… |
| 5 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://www.youtube.com/embed/e4d3SXq-2_w",\n      "originalUrl": "https://www.youtube.com/embed/e4d3SXq-2_w",\n      "wid… |
| 6 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103337299",\n      "originalUrl": "https://player.vimeo.com/video/1103337299",\n      "wid… |
| 7 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103337969",\n      "originalUrl": "https://player.vimeo.com/video/1103337969",\n      "wid… |
| 8 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103339234",\n      "originalUrl": "https://player.vimeo.com/video/1103339234",\n      "wid… |
| 9 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1107272631",\n      "originalUrl": "https://player.vimeo.com/video/1107272631",\n      "wid… |
| 10 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103339877",\n      "originalUrl": "https://player.vimeo.com/video/1103339877",\n      "wid… |
| 11 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | {\n  "items": [\n    {\n      "url": "https://player.vimeo.com/video/1103338492",\n      "originalUrl": "https://player.vimeo.com/video/1103338492",\n      "wid… |
| 12 | https://cloudemployee.io/technology/react-developers | unknown | no | unknown | Large inline script — verify intent | \n// swiper\ndocument.addEventListener("DOMContentLoaded", function() {\n    const swiperTestimony = new Swiper('.swiper.testimonies', {\n        slidesPerView:… |

### Template: TOOL

- Total custom code items: 44
- `semi_global`: 40 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 4
- `unknown`: 0
- SEO-critical items flagged: 1

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/tools/culture-match | template_level | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context": "https://schema.org",\n  "@graph": [\n    {\n      "@type": "WebPage",\n      "@id": "https://www.cloudemployee.io/tools/culture-match#webpag… |
| 2 | https://cloudemployee.io/tools/culture-match | template_level | no | yes (cloudemployee.io URL, Culture-match API key) | Large inline script — verify intent | \n  document.addEventListener('DOMContentLoaded', function() {\n  const prod = {\n  	api:  'https://api.toolkit.cloudemployee.io',\n    key: 'KYfChpmGNwuaa0jqhT… |
| 3 | https://cloudemployee.io/tools/culture-match | template_level | no | unknown | Large inline script — verify intent | \n  window._LOOM_ = "%7O%22NGYNFFVNA_SRNGHER_TNGRF_NCV_XRL%22%3N%229ro5168p-32r7-4nsp-n17q-pp4oppnr60np%22%2P%22OVYYVAT_ERPNCGPUN_FVGR_XRL%22%3N%226Yq-a7bHNNNNN… |
| 4 | https://cloudemployee.io/tools/culture-match | template_level | no | unknown | Large inline script — verify intent | \n    !function(){var analytics=window.analytics=window.analytics\\|\\|[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.err… |

### Template: VIDEO

- Total custom code items: 99
- `semi_global`: 97 (see AUDIT-1 tech debt #7 — counted as global-ish)
- `template_level`: 2
- `unknown`: 0
- SEO-critical items flagged: 6

**Non-`semi_global` items (verbatim snippet preview + flags):**

| # | URL | Scope | SEO-CRITICAL | HARDCODED-VALUE | Review reason | Snippet (first 160 chars) |
|---|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/videos/how-cloud-employee-keeps-remote-developers-motivated | template_level | yes | yes (cloudemployee.io URL) | SEO-critical script | \n{\n  "@context":"https://schema.org",\n  "@graph":[\n    {\n      "@type":"WebPage",\n      "@id":"https://www.cloudemployee.io/videos/how-cloud-employee-keep… |
| 2 | https://cloudemployee.io/videos/how-cloud-employee-keeps-remote-developers-motivated | template_level | yes | unknown | SEO-critical script | require=function o(r,i,s){function a(e,t){if(!i[e]){if(!r[e]){var n="function"==typeof require&&require;if(!t&&n)return n(e,!0);if(l)return l(e,!0);throw(t=new … |

---

## SECTION 7: UK LOCALE ANALYSIS

The Webflow site has `site.locales = []` (no native localization). UK pages exist as duplicate URL paths under `/uk/…` — see Section 2 URL counts. `ce-field-population-summary.json` reports every collection's `localeStrategy = "single-document"` and `ukOverrideFields = []`, so **no CMS collection has per-locale field overrides**. Some collections have `draftInUk > 0`, meaning some items are marked draft only in the UK site context.

### Per-collection UK presence


| Collection | Total items | localeStrategy | UK override fields | Items drafted in UK |
|---|---|---|---|---|
| Team Members | 28 | single-document | none | 0 |
| Reviews | 26 | single-document | none | 3 |
| Customers / Customer Stories | 18 | single-document | none | 0 |
| -- Client Benefits & Company Values | 9 | single-document | none | 0 |
| Legal pages | 1 | single-document | none | 1 |
| -- Staff Benefits | 6 | single-document | none | 0 |
| Blogs & Guides | 31 | single-document | none | 31 |
| -- Hubs | 6 | single-document | none | 0 |
| Downloads | 5 | single-document | none | 3 |
| -- Lead magnets / Tags | 17 | single-document | none | 0 |
| -- Glassdoor reviews | 10 | single-document | none | 0 |
| Technology Pages | 101 | single-document | none | 5 |
| > Downloads Access Pages | 5 | single-document | none | 0 |
| Services | 23 | single-document | none | 0 |
| Videos | 32 | single-document | none | 10 |
| -- Tags >> Blogs | 8 | single-document | none | 0 |
| -- Tags >> Downloads | 2 | single-document | none | 0 |
| -- Tags >> Tools & Quizzes | 3 | single-document | none | 1 |
| -- Tags >> Video Library | 3 | single-document | none | 0 |
| -- Tags >> Events & Webinars | 2 | single-document | none | 0 |
| Tools & Quizzes | 2 | single-document | none | 0 |
| Book A Call Pages | 6 | single-document | none | 0 |
| Compare Blogs | 29 | single-document | none | 3 |
| -- Tags >> Alternatives | 4 | single-document | none | 0 |
| Events & Webinars | 1 | single-document | none | 1 |
| Staff Augmentation Blogs | 28 | single-document | none | 3 |
| Hiring Tips Blogs | 7 | single-document | none | 1 |
| Nearshoring & Offshoring Blogs | 13 | single-document | none | 0 |
| Managing Engineers Blogs | 7 | single-document | none | 1 |
| Scaling Teams Blogs | 9 | single-document | none | 1 |
| AI in Software Development Blogs | 3 | single-document | none | 0 |
| Insights | 1 | single-document | none | 0 |
| New Blog Templates | 5 | single-document | none | 0 |

### Screenshots with UK URLs (from `ce-screenshots.json`)

- Total screenshot captures: 44
- Failures: 1
- UK URL captures: 14
- US URL captures: 30
- `breakpoint` field is null on every screenshot entry in the extract; instead each entry provides an image path per breakpoint (`mobile`/`tablet`/`desktop`).

**UK screenshot URLs:**

- `HOME` — https://cloudemployee.io/uk
- `SERVICE` — https://cloudemployee.io/uk/services/full-stack-developers
- `TECHNOLOGY` — https://cloudemployee.io/uk/technology/react-developers
- `TAXONOMY` — https://cloudemployee.io/uk/services
- `STATIC` — https://cloudemployee.io/uk/retention
- `BLOG` — https://cloudemployee.io/uk/scaling-teams/building-a-software-development-team-core-roles-dedicated-developers-and-modern-hiring-models
- `TOOL` — https://cloudemployee.io/uk/tools/culture-match
- `REVIEW` — https://cloudemployee.io/uk/reviews/healthpointe
- `TEAM_MEMBER` — https://cloudemployee.io/uk/team/anto-cabraja
- `COMPARE` — https://cloudemployee.io/uk/compare/cloud-employee-vs-bairesdev-reviews
- `VIDEO` — https://cloudemployee.io/uk/videos/pair-programming-at-cloud-employee
- `DOWNLOAD` — https://cloudemployee.io/uk/download/10-ai-prompts
- `BOOK_A_CALL` — https://cloudemployee.io/uk/book-a-call/shawnee
- `CUSTOMER_STORY` — https://cloudemployee.io/uk/customer-story/event-connections

### Per-template US vs UK sample comparison

Each page sample was compared on SEO meta. The extract only carries the *US* URL sample for each of the 18 pages listed in `docs/CE_RAW_EXTRACT.md`. No `/uk/` page samples are included in the extract, so a direct sample-level US-vs-UK content diff **is not possible from this extract alone**. What can be stated from the extract:

- `technology__react-developers` (TECHNOLOGY) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/technology/react-developers`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `technology__python-developers` (TECHNOLOGY) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/technology/python-developers`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `technology__aws-developers` (TECHNOLOGY) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/technology/aws-developers`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `services__full-stack-developers` (SERVICE) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/services/full-stack-developers`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `services__ai-engineers` (SERVICE) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/services/ai-engineers`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `customer-story__virgin` (CUSTOMER_STORY) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/customer-story/virgin`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `customer-story__willo` (CUSTOMER_STORY) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/customer-story/willo`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `compare__cloud-employee-vs-turing` (COMPARE) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/compare/cloud-employee-vs-turing`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `staff-augmentation__what-is-staff-augmentation` (BLOG) — has hreflang tags but no `en-GB` entry; UK variant NOT IN EXTRACT.
- `team__seb-hall` (TEAM_MEMBER) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/team/seb-hall`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `reviews__willo` (REVIEW) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/reviews/willo`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `book-a-call__seb` (BOOK_A_CALL) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/book-a-call/seb`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `download__10-ai-prompts` (DOWNLOAD) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/download/10-ai-prompts`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `tools__culture-match` (TOOL) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/tools/culture-match`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `home` (HOME) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `about-us` (STATIC) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/about-us`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).
- `hiring-cost-calculator` (TOOL) — no hreflang tags on US page. UK variant NOT IN EXTRACT.
- `archive__old-home` (STATIC) — declares `en-GB` hreflang pointing to `https://www.cloudemployee.io/uk/404`. UK page exists at the hreflang target; UK content body NOT IN EXTRACT (only US sample captured).

---

## SECTION 8: SEO FIELDS AUDIT

For each of the 33 Webflow CMS collections, the table below states whether each SEO field exists **as a dedicated CMS field** on that collection. Values come from `ce-inventory.json.collections[].fields`. Webflow's collection schema does not include native OG title / OG description / OG image / canonical URL / robots / JSON-LD fields at the CMS layer — those are page-level template SEO settings in Webflow's Designer and are emitted at render time (see the JSON-LD snippets in `ce-template-custom-code-review.json`). Where those fields are not present in the collection schema, the cell is marked `NOT IN EXTRACT (as CMS field)`.

| Collection | Page title | Meta description | OG title | OG description | OG image | Canonical URL | Slug | Noindex/robots | JSON-LD |
|---|---|---|---|---|---|---|---|---|---|
| Team Members | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Reviews | PRESENT (`name-client` as Webflow name field) | PRESENT (`snippet-for-meta`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Customers / Customer Stories | PRESENT (`customer-story-title` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Client Benefits & Company Values | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Legal pages | PRESENT (`name` as Webflow name field) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Staff Benefits | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Blogs & Guides | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Hubs | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Downloads | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (`meta-thunbnail`) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Lead magnets / Tags | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Glassdoor reviews | PRESENT (`title` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Technology Pages | PRESENT (`technology-name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | PRESENT (`faq-schema-2`) |
| > Downloads Access Pages | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Services | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Videos | PRESENT (`label-short-name-like-talent-retention` as Webflow name field) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Tags >> Blogs | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Tags >> Downloads | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Tags >> Tools & Quizzes | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Tags >> Video Library | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Tags >> Events & Webinars | PRESENT (`singular-name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Tools & Quizzes | PRESENT (`name` as Webflow name field) | PRESENT (`blurbs`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Book A Call Pages | PRESENT (`last-name` as Webflow name field) | PRESENT (`title`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Compare Blogs | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| -- Tags >> Alternatives | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Events & Webinars | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Staff Augmentation Blogs | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Hiring Tips Blogs | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Nearshoring & Offshoring Blogs | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Managing Engineers Blogs | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Scaling Teams Blogs | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| AI in Software Development Blogs | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| Insights | PRESENT (`name` as Webflow name field) | MISSING | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |
| New Blog Templates | PRESENT (`meta-title`) | PRESENT (`meta-description`) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) | PRESENT (Webflow implicit slug) | NOT IN EXTRACT (as CMS field) | NOT IN EXTRACT (as CMS field) |

**Interpretation note (from the extract):** template-level JSON-LD graphs live in `ce-template-custom-code-review.json` with `isSeoCritical=true` — see Section 6. The Technology collection has a dedicated `faq-schema-2` field (PlainText) carrying the FAQ schema payload per item. Customer Stories have `review-snippet-for-google-meta` used as meta description. Book A Call has a field literally named `title` whose `displayName` is `Meta Description`.

---

## SECTION 9: REDIRECT INVENTORY

Sources: `ce-regex-redirects.json` (Webflow-configured regex redirects) and `ce-canonical-urls.json` (Screaming Frog + Firecrawl observed HTTP status codes).

### Webflow regex redirects (verbatim)

Total regex redirect rules in Webflow config: **11**.

| # | Pattern | Target |
|---|---|---|
| 1 | `/media/1222466/dev-1.webp?width=818&height=378` | `/` |
| 2 | `/media/1222470/dev-4.webp?width=914&height=684` | `/` |
| 3 | `/media/1222471/dev-5.jpg?width=864&height=423` | `/` |
| 4 | `/resources/(.*)` | `/blog/%1` |
| 5 | `/customer-stories/(.*)` | `/customer-story/%1` |
| 6 | `/uk/customer-stories/(.*)` | `/uk/customer-story/%1` |
| 7 | `/ph/resources/(.*)` | `/ph/blog/%1` |
| 8 | `/ph/customer-stories/(.*)` | `/ph/customer-story/%1` |
| 9 | `/uk/resources/(.*)` | `/uk/blog/%1` |
| 10 | `/developers/(.*)` | `/technology` |
| 11 | `/tools/price-comparison-calculator(.*)` | `/pricing` |

### Total Webflow redirect count

`ce-regex-redirects.json.count = 11` — this is the **regex** redirect rule count.
`CLAUDE.md` audit-state summary states the broader audit tracked 30 redirects + 11 regex redirects. Observed HTTP 30x responses in `ce-canonical-urls.json.canonicalUrls`: 301 = 29, 302 = 1.

### Observed redirect chains (Screaming Frog + Firecrawl status 30x)

Count: 30

| # | From URL | Status | Redirect target | Locale | Source |
|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/haqt6iy0yx2enjczmzi2odmxywjlzdyynjcwntfmytex/4rnvqpn26ndvruap0ynhxafqlac | 302 | (empty) | us | screaming_frog |
| 2 | https://cloudemployee.io/videos | 301 | (empty) | us | multiple |
| 3 | https://cloudemployee.io/pricing | 301 | (empty) | us | multiple |
| 4 | https://cloudemployee.io/start-hiring/get-started | 301 | /start-hiring/contact-info | us | multiple |
| 5 | https://cloudemployee.io/team | 301 | /about-us | us | screaming_frog |
| 6 | https://cloudemployee.io/tools/price-comparison-calculator | 301 | /pricing | us | multiple |
| 7 | https://cloudemployee.io/staff-augmentation | 301 | (empty) | us | multiple |
| 8 | https://cloudemployee.io/uk/services/mvp-development | 301 | (empty) | uk | multiple |
| 9 | https://cloudemployee.io/uk/reviews | 301 | (empty) | uk | multiple |
| 10 | https://cloudemployee.io/uk/about-us | 301 | (empty) | uk | multiple |
| 11 | https://cloudemployee.io/videos/pair-programming-at-cloud-employee | 301 | (empty) | us | multiple |
| 12 | https://cloudemployee.io/uk/tools/price-comparison-calculator | 301 | (empty) | uk | multiple |
| 13 | https://cloudemployee.io/uk/reviews/willo | 301 | (empty) | uk | multiple |
| 14 | https://cloudemployee.io/compare/arc-dev-alternatives-for-startups-2026-comparison-guide | 301 | (empty) | us | multiple |
| 15 | https://cloudemployee.io/compare/arc-dev-vs-toptal-vs-cloud-employee-which-model-fits-your-runway | 301 | (empty) | us | multiple |
| 16 | https://cloudemployee.io/compare/cloud-employee-vs-arc-dev | 301 | /compare | us | multiple |
| 17 | https://cloudemployee.io/compare/arc-dev-vetting-process-vs-cloud-employees-cto-led-technical-assessment | 301 | (empty) | us | multiple |
| 18 | https://cloudemployee.io/team/ericka-go | 301 | (empty) | us | multiple |
| 19 | https://cloudemployee.io/download/weekly-self-reporting-system | 301 | /downloads | us | screaming_frog |
| 20 | https://cloudemployee.io/download/our-internal-hiring-sop | 301 | https://www.cloudemployee.io | us | screaming_frog |
| 21 | https://cloudemployee.io/uk/staff-augmentation | 301 | (empty) | uk | multiple |
| 22 | https://cloudemployee.io/managing-engineers/software-developer-performance-metrics-for-ctos | 301 | /managing-engineers | us | screaming_frog |
| 23 | https://cloudemployee.io/videos/how-to-hire-top-developers-in-7-days | 301 | /videos | us | screaming_frog |
| 24 | https://cloudemployee.io/team/ezekiel-mariano | 301 | (empty) | us | multiple |
| 25 | https://cloudemployee.io/hiring-tips/how-to-hire-python-developers | 301 | /hiring-tips | us | screaming_frog |
| 26 | https://cloudemployee.io/scaling-teams/scaling-product-development-with-remote-software-developers | 301 | /scaling-teams | us | screaming_frog |
| 27 | https://cloudemployee.io/uk/team/russel-lobrio | 301 | (empty) | uk | multiple |
| 28 | https://cloudemployee.io/uk/customer-stories/salmon-software | 301 | /uk/customer-story/salmon-software | uk | screaming_frog |
| 29 | https://cloudemployee.io/uk/customer-stories/event-connections | 301 | /uk/customer-story/event-connections | uk | screaming_frog |
| 30 | https://cloudemployee.io/reviews/mercato | 301 | /reviews | us | screaming_frog |

---

## SECTION 10: UNKNOWN AND SPECIAL PAGES

### UNKNOWN template URLs

Count: 4 (all classified via LLM review).

- `https://cloudemployee.io/cdn-cgi/challenge-platform/scripts/jsd/main.js`
  - Locale: `us`
  - Classification: `llm`, confidence `high`
  - Requires manual review: `True`
  - LLM reasoning: Cloudflare challenge script, not a page
- `https://cloudemployee.io/sitemap.xml`
  - Locale: `us`
  - Classification: `llm`, confidence `high`
  - Requires manual review: `True`
  - LLM reasoning: XML sitemap, not a page
- `https://cloudemployee.io/uk/embedding`
  - Locale: `uk`
  - Classification: `llm`, confidence `low`
  - Requires manual review: `True`
  - LLM reasoning: Ambiguous path with no title context
- `https://cloudemployee.io/haqt6iy0yx2enjczmzi2odmxywjlzdyynjcwntfmytex/a`
  - Locale: `us`
  - Classification: `llm`, confidence `low`
  - Requires manual review: `True`
  - LLM reasoning: Obfuscated hash path, purpose unclear

### The 4 special pages flagged by `ce-canonical-urls.json.anomalies`

These URLs were detected by Screaming Frog but absent from both the sitemap and Firecrawl crawl.

- **https://cloudemployee.io/cdn-cgi/challenge-platform/scripts/jsd/main.js**
  - Severity: `warning`, category `url`
  - Description: URL found by Screaming Frog but absent from both sitemap and Firecrawl crawl
  - Recommendation: Verify this is not an orphan page. If real, add to canonical list and investigate why it was not crawled.
  - Template map result: `UNKNOWN`
  - Content sample: NOT IN EXTRACT (no `audit-output/pages/cdn-cgi__challenge-platform__scripts__jsd__main.js/` or fallback dir)
- **https://cloudemployee.io/hiring-cost-calculator**
  - Severity: `warning`, category `url`
  - Description: URL found by Screaming Frog but absent from both sitemap and Firecrawl crawl
  - Recommendation: Verify this is not an orphan page. If real, add to canonical list and investigate why it was not crawled.
  - Template map result: `TOOL`
  - Content captured. Title: `Hiring Cost Calculator`. H1: ``. Meta description: ``.
- **https://cloudemployee.io/haqt6iy0yx2enjczmzi2odmxywjlzdyynjcwntfmytex/a**
  - Severity: `warning`, category `url`
  - Description: URL found by Screaming Frog but absent from both sitemap and Firecrawl crawl
  - Recommendation: Verify this is not an orphan page. If real, add to canonical list and investigate why it was not crawled.
  - Template map result: `UNKNOWN`
  - Content captured. Title: ``. H1: ``. Meta description: ``.
- **https://cloudemployee.io/start-hiring/contact-info**
  - Severity: `warning`, category `url`
  - Description: URL found by Screaming Frog but absent from both sitemap and Firecrawl crawl
  - Recommendation: Verify this is not an orphan page. If real, add to canonical list and investigate why it was not crawled.
  - Template map result: `BOOK_A_CALL`
  - Content captured. Title: `Contact Info - Start Hiring with Cloud Employee`. H1: `Contact Information`. Meta description: `Contact us and start building your tech team today.`.

### URLs present in Screaming Frog but not in canonical set elsewhere

Count: 16 — identified as `source = "screaming_frog"` in `ce-canonical-urls.json`.

| # | URL | Status | Locale | In sitemap | In firecrawl |
|---|---|---|---|---|---|
| 1 | https://cloudemployee.io/haqt6iy0yx2enjczmzi2odmxywjlzdyynjcwntfmytex/4rnvqpn26ndvruap0ynhxafqlac | 302 | us | False | False |
| 2 | https://cloudemployee.io/cdn-cgi/challenge-platform/scripts/jsd/main.js | 200 | us | False | False |
| 3 | https://cloudemployee.io/hiring-cost-calculator | 200 | us | False | False |
| 4 | https://cloudemployee.io/team | 301 | us | False | False |
| 5 | https://cloudemployee.io/haqt6iy0yx2enjczmzi2odmxywjlzdyynjcwntfmytex/a | 200 | us | False | False |
| 6 | https://cloudemployee.io/start-hiring/contact-info | 200 | us | False | False |
| 7 | https://cloudemployee.io/download/weekly-self-reporting-system | 301 | us | False | False |
| 8 | https://cloudemployee.io/download/our-internal-hiring-sop | 301 | us | False | False |
| 9 | https://cloudemployee.io/managing-engineers/software-developer-performance-metrics-for-ctos | 301 | us | False | False |
| 10 | https://cloudemployee.io/videos/how-to-hire-top-developers-in-7-days | 301 | us | False | False |
| 11 | https://cloudemployee.io/hiring-tips/how-to-hire-python-developers | 301 | us | False | False |
| 12 | https://cloudemployee.io/scaling-teams/scaling-product-development-with-remote-software-developers | 301 | us | False | False |
| 13 | https://cloudemployee.io/impact | error | us | False | False |
| 14 | https://cloudemployee.io/uk/customer-stories/salmon-software | 301 | uk | False | False |
| 15 | https://cloudemployee.io/uk/customer-stories/event-connections | 301 | uk | False | False |
| 16 | https://cloudemployee.io/reviews/mercato | 301 | us | False | False |

---

## SECTION 11: CONFLICTS AND UNKNOWNS

Every null value, explicit anomaly, and cross-file mismatch surfaced from the extract. Format: `ITEM / SOURCE / VALUES / STATUS`.

- **ITEM:** Webflow site has no native locales configured, yet UK URL variants exist
  - **SOURCE:** `ce-inventory.json.site.locales`, `ce-canonical-urls.json`, `ce-template-map.json`
  - **VALUES:** `locales=[]` but 290 URLs have `locale="uk"` under `/uk/…` paths
  - **STATUS:** UNRESOLVED

- **ITEM:** 4 URL(s) flagged `requiresManualReview=true`
  - **SOURCE:** `ce-template-map.json`
  - **VALUES:** https://cloudemployee.io/cdn-cgi/challenge-platform/scripts/jsd/main.js → UNKNOWN (high); https://cloudemployee.io/sitemap.xml → UNKNOWN (high); https://cloudemployee.io/uk/embedding → UNKNOWN (low); https://cloudemployee.io/haqt6iy0yx2enjczmzi2odmxywjlzdyynjcwntfmytex/a → UNKNOWN (low)
  - **STATUS:** UNRESOLVED

- **ITEM:** Redirect count disagreement between CLAUDE.md summary and extract artefacts
  - **SOURCE:** `CLAUDE.md` audit-state summary vs `ce-regex-redirects.json.count` vs observed 30x in `ce-canonical-urls.json`
  - **VALUES:** CLAUDE.md: 30 redirects + 11 regex redirects; `ce-regex-redirects.json.count`=11; observed 30x URLs=30
  - **STATUS:** UNRESOLVED

- **ITEM:** US/UK locale split disagrees with CLAUDE.md summary
  - **SOURCE:** `CLAUDE.md` vs `ce-canonical-urls.json`
  - **VALUES:** CLAUDE.md: 288 US + 314 UK indexable; extract: 335 US + 301 UK in canonical URL set; `ce-template-map.json`: 312 US + 290 UK
  - **STATUS:** UNRESOLVED

- **ITEM:** Form totals
  - **SOURCE:** `CLAUDE.md` vs `ce-forms.json.forms`
  - **VALUES:** CLAUDE.md: 25 in HubSpot portal, 3 embedded; extract lists 3 embedded with `apiVerified=true`
  - **STATUS:** CONSISTENT (extract carries only embedded subset)

- **ITEM:** Screenshot capture failures
  - **SOURCE:** `ce-screenshots.json.failed`
  - **VALUES:** https://cloudemployee.io/videos/how-cloud-employee-keeps-remote-developers-motivated
  - **STATUS:** UNRESOLVED

- **ITEM:** `/hiring-cost-calculator` page has no SEO metadata
  - **SOURCE:** `audit-output/pages/hiring-cost-calculator/content.json`
  - **VALUES:** metaDescription is empty string; canonicalTag is null; hreflangTags is empty; ogImage is null/empty; h1 is empty; structuredData is empty
  - **STATUS:** UNRESOLVED

- **ITEM:** `/hiring-cost-calculator` has no interactions.json
  - **SOURCE:** `audit-output/pages/hiring-cost-calculator/` directory listing
  - **VALUES:** content.json present; interactions.json absent
  - **STATUS:** UNRESOLVED

- **ITEM:** `home/content.json` has `canonical: null` *and* `canonicalTag: "https://www.cloudemployee.io/"`
  - **SOURCE:** `audit-output/pages/home/content.json`
  - **VALUES:** `canonical`=None; `canonicalTag`='https://www.cloudemployee.io/'; `robots`=None; `hreflang`=None
  - **STATUS:** FIELD NAMING INCONSISTENCY (two similarly-named fields, only one populated)

- **ITEM:** `/archive/old-home` page body is '404' but template map classifies it STATIC
  - **SOURCE:** `ce-template-map-llm-review.json` vs `audit-output/pages/archive__old-home/content.json`
  - **VALUES:** `templateType=STATIC` (llm reasoning: 'Archived page returning Not Found'); page title=`Not Found`; H1=`404`; canonical=`https://www.cloudemployee.io/404`
  - **STATUS:** UNRESOLVED

- **ITEM:** Technology collection uses a PlainText CMS field to carry JSON-LD FAQ schema
  - **SOURCE:** `ce-inventory.json.collections[Technology Pages].fields`
  - **VALUES:** `faq-schema-2` is type=PlainText with displayName='FAQ Schema' — schema is stored as CMS content, not as a structured field
  - **STATUS:** DESIGN DECISION — flagged for downstream schema reconstruction

- **ITEM:** Book A Call `title` field slug has displayName `Meta Description`
  - **SOURCE:** `ce-inventory.json.collections[Book A Call Pages].fields`
  - **VALUES:** slug=`title` type=PlainText required=true displayName=`Meta Description` — slug and displayed label disagree
  - **STATUS:** LIKELY RENAME — slug was not updated when field purpose changed

- **ITEM:** Blogs & Guides: every item is drafted in UK (draftInUk = totalItems)
  - **SOURCE:** `ce-field-population-summary.json[Blogs & Guides]`
  - **VALUES:** totalItems=31, draftInUk=31
  - **STATUS:** UNRESOLVED

- **ITEM:** Legal pages: 1 item, drafted in UK
  - **SOURCE:** `ce-field-population-summary.json[Legal pages]`
  - **VALUES:** totalItems=1, draftInUk=1
  - **STATUS:** UNRESOLVED

- **ITEM:** Events & Webinars: 1 item, drafted in UK
  - **SOURCE:** `ce-field-population-summary.json[Events & Webinars]`
  - **VALUES:** totalItems=1, draftInUk=1
  - **STATUS:** UNRESOLVED

- **ITEM:** `/customer-story/virgin` meta description literally says 'Customer story in progress...'
  - **SOURCE:** `audit-output/pages/customer-story__virgin/content.json`
  - **VALUES:** title=`Virgin Experience Days x Cloud Employee Customer Story | Results & Review`; metaDescription=`Customer story in progress... - learn more about Cloud Employee and the impact we've had for customers like Virgin Experience Days.`; h1=`Customer story in progress...`
  - **STATUS:** UNRESOLVED

- **ITEM:** `/staff-augmentation/what-is-staff-augmentation` has a non-standard hreflang count
  - **SOURCE:** `audit-output/pages/staff-augmentation__what-is-staff-augmentation/content.json`
  - **VALUES:** hreflangTags length=2 (other sampled pages have length 3); values=[{"lang": "x-default", "href": "https://www.cloudemployee.io/staff-augmentation/what-is-staff-augmentation"}, {"lang": "en", "href": "https://www.cloudemployee.io/staff-augmentation/what-is-staff-augmentation"}]
  - **STATUS:** UNRESOLVED

- **ITEM:** Custom-code detector flagged 745 `semi_global` items — AUDIT-1 tech debt #7
  - **SOURCE:** `ce-template-custom-code-review.json` + `CLAUDE.md` tech debt table
  - **VALUES:** Scope threshold (global = on 100% of templates) is too strict; 745 items appear on 80%+ of templates but get marked semi_global instead of global.
  - **STATUS:** KNOWN TECH DEBT — fix deferred to MYGRATR-CONTENT-1

- **ITEM:** Ahrefs baseline is empty
  - **SOURCE:** `audit-output/ce-ahrefs-baseline.json` + `CLAUDE.md` tech debt #4
  - **VALUES:** {"capturedAt": "2026-04-21T02:12:52.204Z", "domain": "cloudemployee.io", "domainRating": null, "referringDomains": null, "organicKeywords": 0, "estimatedMonthlyTraffic": 0, "topKeywords": [], "topPages": [], "notes": ["Could not fetch organic keywords: Error: Ahrefs API /site-explorer/organic-keywords returned 400: { \"error\": \"missing argument date\" }", "Could not fetch top pages: Error: Ahrefs API /site-explorer/top-pages returned 400: { \"error\": \"missing argument date\" }"]}
  - **STATUS:** KNOWN TECH DEBT — Ahrefs plan doesn't cover cloudemployee.io; fix deferred to MONITOR-1

- **ITEM:** Every form has empty `connectedWorkflowIds` / `connectedWorkflowNames`
  - **SOURCE:** `ce-forms.json.forms[*]` + `CLAUDE.md` tech debt #8
  - **VALUES:** 3/3 forms have empty connected workflow arrays
  - **STATUS:** KNOWN TECH DEBT — HubSpot token lacks `automation` scope; fix deferred to CONTENT-1

- **ITEM:** Page `title` field concatenates embedded video titles on several template types
  - **SOURCE:** `audit-output/pages/*/content.json[*].title`
  - **VALUES:**
    - `technology__react-developers`: `React Developers for Hire | Cloud EmployeeHow We Retain Offshore Developers with a Culture-First Strategy - YouTube97% Developer Retention in Remote Teams | Her…`
    - `technology__python-developers`: `Python Developers for Hire | Cloud EmployeeHow We Retain Offshore Developers with a Culture-First Strategy - YouTube97% Developer Retention in Remote Teams | He…`
    - `technology__aws-developers`: `AWS Developers for Hire | Cloud EmployeeHow We Retain Offshore Developers with a Culture-First Strategy - YouTube97% Developer Retention in Remote Teams | Here’…`
    - `services__full-stack-developers`: `Hire Full-Stack Developers with Cloud Employee | Staff AugmentationHow We Retain Offshore Developers with a Culture-First Strategy - YouTube97% Developer Retent…`
    - `services__ai-engineers`: `Hire AI Engineers with Cloud Employee | Staff AugmentationHow We Retain Offshore Developers with a Culture-First Strategy - YouTube97% Developer Retention in Re…`
    - `customer-story__willo`: `Willo® x Cloud Employee Customer Story | Results & ReviewHow Willo Scaled Their Dev Team Globally - Without Ever Flying Overseas from Cloud Employee on Vimeo`
    - `home`: `Hire Nearshore Engineers That Feel In-House | Cloud EmployeeHire Nearshore Developers That Feel In-House From Day One | UK from Cloud Employee on VimeoWhy This …`
  - **STATUS:** EXTRACTION ARTEFACT — page `<title>` likely clean; captured field pulls titles from iframes too

- **ITEM:** Total CMS item count — CLAUDE.md vs sum of per-collection counts
  - **SOURCE:** `CLAUDE.md` vs `ce-inventory.json.collections[].itemCount`
  - **VALUES:** CLAUDE.md: 451 total; sum of collection itemCounts in extract = 451
  - **STATUS:** CONSISTENT

---

## SECTION 12: PAGE SAMPLE FINDINGS

18 page samples captured in the extract. Content extraction summary: attempted=23, completed=23, failed=0. Interaction analysis: 312 pages analysed, 308 have interactions, 5560 content-affecting elements and 2021 cosmetic elements across the site.

### Template: BLOG

- Pages sampled: staff-augmentation__what-is-staff-augmentation

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, externalLinks, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogTitle, rawHtml, structuredData, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, ogImage, robots

**Interactions (content-affecting + cosmetic counts from the extract):**
- `staff-augmentation__what-is-staff-augmentation` — 18 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- no `en-GB` hreflang found on any sample of this template

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| staff-augmentation__what-is-staff-augmentation | https://cloudemployee.io/staff-augmentation/what-is-staff-augmentation | Staff Augmentation Guide: Process, Benefits & Costs | Staff augmentation means hiring dedicated external developers who work full time… | https://www.cloudemployee.io/staff-augmentation/what-is-staff-augmentation | null | 2 | 1 |

### Template: BOOK_A_CALL

- Pages sampled: book-a-call__seb

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogImage, ogTitle, rawHtml, title, url

**Consistently empty/null fields across samples in this template:**
canonical, externalLinks, hreflang, robots, structuredData

**Interactions (content-affecting + cosmetic counts from the extract):**
- `book-a-call__seb` — 2 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: book-a-call__seb
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| book-a-call__seb | https://cloudemployee.io/book-a-call/seb | Schedule a call with Seb Hall \| Cloud Employee Calendly reCAPTCHAStripeM-Inner | Book a call with Seb Hall at Cloud Employee today. Schedule instantly through ou… | https://www.cloudemployee.io/book-a-call/seb | https://d3v0px0pttie1i.cloudfront.net/uploads/branding/logo/… | 3 | 0 |

### Template: COMPARE

- Pages sampled: compare__cloud-employee-vs-turing

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogImage, ogTitle, rawHtml, title, url

**Consistently empty/null fields across samples in this template:**
canonical, externalLinks, hreflang, robots, structuredData

**Interactions (content-affecting + cosmetic counts from the extract):**
- `compare__cloud-employee-vs-turing` — 20 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: compare__cloud-employee-vs-turing
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| compare__cloud-employee-vs-turing | https://cloudemployee.io/compare/cloud-employee-vs-turing | Cloud Employee vs Turing \| Embedded Engineers vs AI-Powered Talent Platform | Compare Cloud Employee vs Turing: we examine how Cloud Employee’s embedded, full… | https://www.cloudemployee.io/compare/cloud-employee-vs-turing | https://cdn.prod.website-files.com/673326831abed6267051fa18/… | 3 | 0 |

### Template: CUSTOMER_STORY

- Pages sampled: customer-story__virgin, customer-story__willo

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogTitle, rawHtml, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, robots

**Interactions (content-affecting + cosmetic counts from the extract):**
- `customer-story__virgin` — 2 interactions
- `customer-story__willo` — 4 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: customer-story__virgin, customer-story__willo
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| customer-story__virgin | https://cloudemployee.io/customer-story/virgin | Virgin Experience Days x Cloud Employee Customer Story \| Results & Review | Customer story in progress... - learn more about Cloud Employee and the impact w… | https://www.cloudemployee.io/customer-story/virgin | null | 3 | 0 |
| customer-story__willo | https://cloudemployee.io/customer-story/willo | Willo® x Cloud Employee Customer Story \| Results & ReviewHow Willo Scaled Their … | How VC-backed Willo® grew a development team in the Philippines without ever vis… | https://www.cloudemployee.io/customer-story/willo | https://cdn.prod.website-files.com/673326831abed6267051fa18/… | 3 | 1 |

### Template: DOWNLOAD

- Pages sampled: download__10-ai-prompts

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, externalLinks, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogImage, ogTitle, rawHtml, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, robots, structuredData

**Interactions (content-affecting + cosmetic counts from the extract):**
- `download__10-ai-prompts` — 20 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: download__10-ai-prompts
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| download__10-ai-prompts | https://cloudemployee.io/download/10-ai-prompts | 10 AI Prompts for Engineers 2025 \| Cloud Employee | Get Cloud Employee’s 10 AI Prompts Worth Building Into Your Stack. Practical, te… | https://www.cloudemployee.io/download/10-ai-prompts | https://cdn.prod.website-files.com/673326831abed6267051fa18/… | 3 | 0 |

### Template: HOME

- Pages sampled: home

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, externalLinks, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogImage, ogTitle, rawHtml, structuredData, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, robots

**Interactions (content-affecting + cosmetic counts from the extract):**
- `home` — 23 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: home
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| home | https://cloudemployee.io/ | Hire Nearshore Engineers That Feel In-House \| Cloud EmployeeHire Nearshore Devel… | We build dev teams in LATAM—sourced, embedded, and retained. Plugged into your t… | https://www.cloudemployee.io/ | https://cdn.prod.website-files.com/673326831abed6267051fa11/… | 3 | 2 |

### Template: REVIEW

- Pages sampled: reviews__willo

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogTitle, rawHtml, structuredData, title, url

**Consistently empty/null fields across samples in this template:**
canonical, externalLinks, hreflang, ogImage, robots

**Interactions (content-affecting + cosmetic counts from the extract):**
- `reviews__willo` — 5 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: reviews__willo
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| reviews__willo | https://cloudemployee.io/reviews/willo | Willo® Review \| Cloud Employee Client Quote | "We actually hired the whole team remotely, having never met them.” — Euan Camer… | https://www.cloudemployee.io/reviews/willo | null | 3 | 1 |

### Template: SERVICE

- Pages sampled: services__full-stack-developers, services__ai-engineers

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, externalLinks, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogTitle, rawHtml, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, ogImage, robots, structuredData

**Interactions (content-affecting + cosmetic counts from the extract):**
- `services__full-stack-developers` — 55 interactions
- `services__ai-engineers` — 57 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: services__full-stack-developers, services__ai-engineers
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| services__full-stack-developers | https://cloudemployee.io/services/full-stack-developers | Hire Full-Stack Developers with Cloud Employee \| Staff AugmentationHow We Retain… | Front to back-end delivery. Get Full-Stack Developers via Staff Augmentation wit… | https://www.cloudemployee.io/services/full-stack-developers | null | 3 | 0 |
| services__ai-engineers | https://cloudemployee.io/services/ai-engineers | Hire AI Engineers with Cloud Employee \| Staff AugmentationHow We Retain Offshore… | Insights, models & experimentation. Get AI Engineers via Staff Augmentation with… | https://www.cloudemployee.io/services/ai-engineers | null | 3 | 0 |

### Template: STATIC

- Pages sampled: about-us, archive__old-home

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, h1, headings, hreflangTags, images, internalLinks, ogTitle, rawHtml, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, robots, structuredData

**Interactions (content-affecting + cosmetic counts from the extract):**
- `about-us` — 36 interactions
- `archive__old-home` — 1 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: about-us, archive__old-home
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| about-us | https://cloudemployee.io/about-us | Cloud Employee - About us | Transform how you build and scale your tech team, by widening access to the top … | https://www.cloudemployee.io/about-us | https://cdn.prod.website-files.com/673326831abed6267051fa11/… | 3 | 0 |
| archive__old-home | https://cloudemployee.io/archive/old-home | Not Found |  | https://www.cloudemployee.io/404 | null | 3 | 0 |

### Template: TEAM_MEMBER

- Pages sampled: team__seb-hall

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, externalLinks, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogImage, ogTitle, rawHtml, structuredData, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, robots

**Interactions (content-affecting + cosmetic counts from the extract):**
- `team__seb-hall` — 2 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: team__seb-hall
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| team__seb-hall | https://cloudemployee.io/team/seb-hall | Seb Hall – Co-Founder & CEO \| Cloud Employee | Read the complete profile of Seb Hall and their experience at Cloud Employee for… | https://www.cloudemployee.io/team/seb-hall | https://cdn.prod.website-files.com/673326831abed6267051fa18/… | 3 | 1 |

### Template: TECHNOLOGY

- Pages sampled: technology__react-developers, technology__python-developers, technology__aws-developers

**Consistently populated fields across samples in this template:**
bodyText, canonicalTag, customHeadCode, externalLinks, h1, headings, hreflangTags, images, internalLinks, metaDescription, ogDescription, ogTitle, rawHtml, structuredData, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, ogImage, robots

**Interactions (content-affecting + cosmetic counts from the extract):**
- `technology__react-developers` — 35 interactions
- `technology__python-developers` — 34 interactions
- `technology__aws-developers` — 37 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: technology__react-developers, technology__python-developers, technology__aws-developers
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| technology__react-developers | https://cloudemployee.io/technology/react-developers | React Developers for Hire \| Cloud EmployeeHow We Retain Offshore Developers with… | Hire vetted React developers to scale your team fast. Nearshore/offshore talent … | https://www.cloudemployee.io/technology/react-developers | null | 3 | 1 |
| technology__python-developers | https://cloudemployee.io/technology/python-developers | Python Developers for Hire \| Cloud EmployeeHow We Retain Offshore Developers wit… | Hire vetted Python developers to scale your team fast. Nearshore/offshore talent… | https://www.cloudemployee.io/technology/python-developers | null | 3 | 1 |
| technology__aws-developers | https://cloudemployee.io/technology/aws-developers | AWS Developers for Hire \| Cloud EmployeeHow We Retain Offshore Developers with a… | Hire vetted AWS developers to scale your team fast. Nearshore/offshore talent th… | https://www.cloudemployee.io/technology/aws-developers | null | 3 | 1 |

### Template: TOOL

- Pages sampled: tools__culture-match, hiring-cost-calculator

**Consistently populated fields across samples in this template:**
bodyText, customHeadCode, headings, images, rawHtml, title, url

**Consistently empty/null fields across samples in this template:**
canonical, hreflang, robots

**Interactions (content-affecting + cosmetic counts from the extract):**
- `tools__culture-match` — 38 interactions
- `hiring-cost-calculator` — 0 interactions

**Hardcoded content indicators detected in rawHtml:**
- Calendly link/script inline
- Clara widget URL inline
- GA4 measurement id in inline script
- GTM container id in inline script
- GeoTargetly tracker URL inline
- HubSpot portal id 22809822 inline
- LinkedIn partner id in inline script

**UK variant exists (per hreflang `en-GB` tag):**
- yes, on samples: tools__culture-match
- UK page content body: NOT IN EXTRACT (only US URL captured for each sample)

**Per-sample SEO metadata:**

| Sample | URL | Title | metaDescription | canonicalTag | ogImage | hreflang count | structuredData count |
|---|---|---|---|---|---|---|---|
| tools__culture-match | https://cloudemployee.io/tools/culture-match | Culture Match \| Cloud Employee Free ResourcesWalkthrough: Free Psychometric Test… | A bad hire doesn’t just miss expectations, it slows everything down.‍ Culture Ma… | https://www.cloudemployee.io/tools/culture-match | https://cdn.prod.website-files.com/673326831abed6267051fa18/… | 3 | 1 |
| hiring-cost-calculator | https://cloudemployee.io/hiring-cost-calculator | Hiring Cost Calculator |  | null | null | 0 | 0 |

---

*This document was generated from `docs/CE_RAW_EXTRACT.md` / `audit-output/*.json` only. No other sources consulted. Where the extract is silent, the body above says `NOT IN EXTRACT`.*
