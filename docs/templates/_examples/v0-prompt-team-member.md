# V0.dev Prompt — TEAM_MEMBER template

> Worked example of `docs/V0_PROMPT_TEMPLATE.md` filled in for the
> TEAM_MEMBER template (per-team-member detail page). Locked at
> MYGRATR-DESIGN-1 Brief A §5.2.
>
> **Template slug:** `team-member`
> **Output path:** `site/src/components/templates/team-member/index.tsx`
> **Live URL pattern:** `https://cloudemployee.io/team/{slug}` (UK
> mirror at `/uk/team/{slug}`; the listing page lives at
> `/about-us#team` and is a separate template handled in
> TEMPLATE-ABOUT)
> **Sanity doc type:** `teamMember` (28 docs migrated in CONTENT-1B)

---

## Section 1 — Design system constraints

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §1. See canonical template.]

## Section 2 — Primitive components available

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §2. Storybook visual reference:
<https://mygratr-cloud-employee-storybook.vercel.app>.]

## Section 3 — Visual reference

**Live URL:** `https://cloudemployee.io/team/{slug}` — sample slug
**TBD-pending-capture** (Step 7 will publish a representative slug in
`docs/templates/team-member/REFERENCE.md`). All 28 migrated team-member
slugs are valid; typical candidate would be a senior team-member with
populated `aboutContent` + `areasOfExpertise`.

**Screenshots:** TBD-pending-Step-7. Capture 4–6 screenshots at desktop
(1440×900), tablet (768×1024), and mobile (375×667), covering: hero
photo + name + position; about-content body; areas-of-expertise list;
LinkedIn / book-a-call CTA strip. Save to
`docs/templates/team-member/_assets/screenshots/`.

**Field-to-UI map:** TBD-pending-Step-7. Expected mapping:

| UI region | Sanity field |
|---|---|
| Hero photo | `teamMemberImage` (rendered via `<Image>` with `priority` for LCP) |
| Name | `name` (rendered via `<Heading as="h1">`) |
| Position / role | `position` (rendered via `<Text size="lead">` if present; collapse if absent) |
| Time at Cloud Employee | `timeAtCloudEmployee` (rendered as a small metadata line if present) |
| About body | `aboutContent` (PortableText — rendered via `<PortableText>`) |
| Areas of expertise | `areasOfExpertise` (PortableText — typically a bullet list) |
| LinkedIn link | `linkedinLink` (rendered via `<Link external>` with `<Icon name="linkedin">`) |
| Book-a-call CTA | `bookACallLink` (rendered via `<Button variant="primary-teal">` wrapping a `<Link>`) |

## Section 4 — Sanity data shape

```ts
// site/../src/types/sanity/documents/team-member.ts
import { z } from 'zod'

import {
  LocaleSchema,
  MetaFieldsNoOgSchema,
  MetaSourceFieldsSchema,
  PortableTextSchema,
  SanityBaseDocumentSchema,
  SanityImageSchema,
  SanitySlugSchema,
  SourceTrackingFieldsCarryoverSchema,
} from '../shared'

// Pre-CONTENT-1D docs have source: undefined despite initialValue. See Finding F18.

export const TeamMemberSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('teamMember'),
  name: z.string(),
  slug: SanitySlugSchema,
  order: z.number().optional(),
  position: z.string().optional(),
  teamMemberImage: SanityImageSchema,
  aboutContent: PortableTextSchema.optional(),
  timeAtCloudEmployee: z.string().optional(),
  areasOfExpertise: PortableTextSchema.optional(),
  linkedinLink: z.string().url().optional(),
  bookACallLink: z.string().url().optional(),
  hideFromTeamAboutPage: z.boolean(),
  locale: LocaleSchema,
})
  .merge(MetaFieldsNoOgSchema)
  .merge(MetaSourceFieldsSchema)
  .merge(SourceTrackingFieldsCarryoverSchema)
export type TeamMember = z.infer<typeof TeamMemberSchema>
```

**Notes for v0.dev:**
- **`MetaFieldsNoOgSchema` (NOT `MetaFieldsSchema`)** — team-member pages
  have `metaTitle` + `metaDescription` only; `openGraphImage` is NOT in
  the schema. `generateMetadata` should fall back to a brand-default OG
  image (`/og-default.png` or equivalent).
- `aboutContent` and `areasOfExpertise` are both **optional** PortableText.
  Render the section only when the field is non-empty; do not show
  empty section headers.
- `position` is optional — collapse the metadata line entirely if absent.
- `linkedinLink` and `bookACallLink` are independently optional. Render
  whatever is populated; collapse the CTA strip if both are absent.
- `hideFromTeamAboutPage` is a curatorial flag consumed by the LISTING
  template (TEMPLATE-ABOUT), NOT this detail template. The detail page
  renders for any team-member slug regardless of this flag — although
  listing-page logic should match (consider whether the detail page
  should `notFound()` for hidden members; surface to Jake at TEMPLATE-
  TEAM-MEMBER design time).
- No `featured` / `category` / `tags` / `author` fields — team-member
  is a flat doc shape compared to blogPost.

**GROQ query shape (single doc by slug):**

```groq
*[_type == "teamMember" && slug.current == $slug && locale == $locale][0]{
  _id,
  name,
  slug,
  position,
  teamMemberImage,
  aboutContent,
  timeAtCloudEmployee,
  areasOfExpertise,
  linkedinLink,
  bookACallLink,
  hideFromTeamAboutPage,
  locale,
  metaTitle,
  metaDescription
}
```

Pass `slug` and `locale` as GROQ params. Use `notFound()` if the result
is null.

## Section 5 — Constraints

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §5. Key call-outs for
TEAM_MEMBER:]

- **Heading hierarchy:** page `<h1>` for `name` exactly once.
  PortableText `aboutContent` and `areasOfExpertise` render their own
  internal heading hierarchy (h2/h3/h4 via the default renderers).
- **LCP target:** `teamMemberImage` rendered with `priority` is the
  expected LCP candidate.
- **No OG image** — use a brand-default OG asset in `generateMetadata`
  (do not invent a Sanity field).
- **Locale-aware URLs:** when rendering inter-team links, prefix `/uk/`
  for `locale === 'uk'` profiles.
- **External-link safety:** `linkedinLink` is always external — pass
  `external` prop to `<Link>` so `target="_blank" rel="noopener
  noreferrer"` are set.

## Section 6 — Output format

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §6. Specifics for TEAM_MEMBER:]

- **Output path:** `site/src/components/templates/team-member/index.tsx`
- **Async server component** — no `'use client'`; the page is purely
  data-driven, no interactive state.
- **`sanityFetch` from `@/lib/sanity/live`** for the page fetch.

---

*End of v0-prompt-team-member.md — Brief A §5.2 worked example #2.*
