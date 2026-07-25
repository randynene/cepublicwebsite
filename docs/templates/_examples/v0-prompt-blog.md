# V0.dev Prompt — BLOG template

> Worked example of `docs/V0_PROMPT_TEMPLATE.md` filled in for the BLOG
> template (per-blog-post detail page). Locked at MYGRATR-DESIGN-1
> Brief A §5.2.
>
> **Template slug:** `blog`
> **Output path:** `site/src/components/templates/blog/index.tsx`
> **Live URL pattern:** `https://cloudemployee.io/blog/{slug}` (UK
> mirror at `/uk/blog/{slug}`)
> **Sanity doc type:** `blogPost` (74 docs migrated in CONTENT-1C across
> 7 source collections)

---

## Section 1 — Design system constraints

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §1 — colors, typography,
spacing, radii, shadows, motion, breakpoints. See canonical template.]

## Section 2 — Primitive components available

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §2 — full primitive inventory
with import paths. See canonical template. Storybook visual reference:
<https://mygratr-cloud-employee-storybook.vercel.app>.]

## Section 3 — Visual reference

**Live URL:** `https://cloudemployee.io/blog/{slug}` — sample slug
**TBD-pending-capture** (Step 7 will publish a representative slug list
in `docs/templates/blog/REFERENCE.md`). Probable candidate slugs from
CONTENT-1C migrated set: any of the 74 blogPost docs published in the
last 12 months.

**Screenshots:** TBD-pending-Step-7. Capture 4–6 screenshots at desktop
(1440×900), tablet (768×1024), and mobile (375×667) breakpoints, ideally
covering: hero / title / metadata strip; first body paragraph + inline
image; pull-quote / blockquote section; FAQ accordion (if present); footer
CTA. Save to `docs/templates/blog/_assets/screenshots/`.

**Field-to-UI map:** TBD-pending-Step-7 (see
`docs/templates/blog/REFERENCE.md` once authored). Expected mapping:

| UI region | Sanity field |
|---|---|
| Page `<h1>` | `title` (rendered via `<Heading as="h1">`) |
| Author byline | `author` (ref → `teamMember.name`) |
| Publication date | `date` |
| Hero / thumbnail | `thumbnailImage` (rendered via `<Image>` with `priority` for LCP) |
| Category tag | `category` (ref → `blogCategory.title`, rendered via routable `<Tag href>`) |
| Topic tags | `tags` (refs → `tag.title`, rendered via routable `<Tag href>`) |
| TL;DR section (if present) | `tldrSection` (PortableText) |
| Body content | `content` (PortableText — rendered via `<PortableText>` primitive) |
| FAQs (if present, max 6) | `faqs` array → `<Accordion type="single" collapsible>` |
| OG image | `openGraphImage` from `MetaFieldsSchema` |

## Section 4 — Sanity data shape

```ts
// site/../src/types/sanity/documents/blog-post.ts
import { z } from 'zod'

import {
  FaqItemSchema,
  LocaleSchema,
  MetaFieldsSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanityRefSchema,
  SanitySlugSchema,
  SourceTrackingFieldsSchema,
} from '../shared'

export const BlogPostSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('blogPost'),
  title: z.string(),
  slug: SanitySlugSchema,
  category: SanityRefSchema,                  // → blogCategory doc
  tags: z.array(SanityRefSchema).min(1),      // → tag docs
  author: SanityRefSchema,                    // → teamMember doc
  date: z.string(),
  thumbnailImage: SanityImageSchema,
  tldrSection: PortableTextSchema.optional(),
  content: PortableTextSchema,
  resourceDescription: z.string().optional(),
  featured: z.boolean(),
  faqs: z.array(FaqItemSchema).max(6).optional(),
  locale: LocaleSchema,
})
  .merge(MetaFieldsSchema)
  .merge(SourceTrackingFieldsSchema)
export type BlogPost = z.infer<typeof BlogPostSchema>
```

**Notes for v0.dev:**
- `category` and `tags` are `SanityRefSchema` references — the GROQ query
  must dereference them (`category->{title, slug}`, `tags[]->{title, slug}`)
  to resolve the underlying docs.
- `author` is a `teamMember` reference — dereference for `name` + `slug`
  (and optionally `teamMemberImage` for an author headshot).
- `content` and `tldrSection` are Portable Text — render via the
  `<PortableText>` primitive from `@/components/ui/portable-text`. Image
  blocks inside Portable Text already route through `<Image>` via the
  default renderer.
- `MetaFieldsSchema` includes `openGraphImage` (BLOG template uses
  full meta — `MetaFieldsSchema`, NOT `MetaFieldsNoOgSchema`).
- `featured` is a curatorial flag (boolean) — not rendered on the
  detail page; consumed by listing pages to surface featured posts.

**GROQ query shape (single doc by slug):**

```groq
*[_type == "blogPost" && slug.current == $slug && locale == $locale][0]{
  _id,
  title,
  slug,
  date,
  thumbnailImage,
  tldrSection,
  content,
  faqs,
  resourceDescription,
  locale,
  metaTitle,
  metaDescription,
  openGraphImage,
  category->{ _id, title, slug },
  tags[]->{ _id, title, slug },
  author->{ _id, name, slug, teamMemberImage }
}
```

Pass `slug` and `locale` (`'default' | 'uk'`) as GROQ params. Use
`notFound()` if the result is null.

## Section 5 — Constraints

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §5. Key call-outs for BLOG:]

- **Heading hierarchy:** page `<h1>` for `title` exactly once. Section
  headings inside `content` PortableText render via the default block
  renderers (h2/h3/h4 → `<Heading>`).
- **LCP target:** `thumbnailImage` rendered with `priority` is the
  expected LCP candidate. No other above-the-fold image should set
  `priority`.
- **Locale-aware URLs:** when rendering links to other blog posts (e.g.
  related posts strip), prefix `/uk/` for `locale === 'uk'` posts.
  Use the locale helper from `@/lib/locale`.
- **SEO:** `generateMetadata` reads `metaTitle` (fallback to `title`),
  `metaDescription`, `openGraphImage`. **NOT** hardcoded.
- **No FAQ rendering when `faqs` is absent** — collapse the section
  entirely; do not render an empty Accordion shell.

## Section 6 — Output format

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §6. Specifics for BLOG:]

- **Output path:** `site/src/components/templates/blog/index.tsx`
- **Async server component** — no `'use client'`; PortableText renders
  server-side, and any interactive hover states are CSS-only.
- **`sanityFetch` from `@/lib/sanity/live`** for both the metadata
  fetch and the page-render fetch (or share via a single fetch — your
  call). Visual Editing wires through this helper at Step 8.

---

*End of v0-prompt-blog.md — Brief A §5.2 worked example #1.*
