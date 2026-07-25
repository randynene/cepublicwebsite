# V0.dev Prompt — REVIEW template

> Worked example of `docs/V0_PROMPT_TEMPLATE.md` filled in for the
> REVIEW template (page-level reviews listing). Locked at
> MYGRATR-DESIGN-1 Brief A §5.2.
>
> **Template slug:** `reviews`
> **Output path:** `site/src/components/templates/reviews/index.tsx`
> **Live URL pattern:** `https://cloudemployee.io/reviews` (UK mirror
> at `/uk/reviews`)
> **Sanity doc type:** `review` (**11 published** in production today; 26
> migrated in CONTENT-1B; 15 deleted in CONTENT-1D drift cleanup — not
> drafts, removed from dataset)
>
> **NB — distinct from the testimonial-swiper-global Tier-1
> component.** That component (specced at
> `docs/design/components/testimonial-swiper-global.md`) is the
> autoplaying carousel embedded on home / services / etc. pages. THIS
> template is the page-level listing at `/reviews`. Both consume the
> `review` doc type but render differently.

---

## Section 1 — Design system constraints

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §1. See canonical template.]

## Section 2 — Primitive components available

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §2. Storybook visual reference:
<https://mygratr-cloud-employee-storybook.vercel.app>.]

## Section 3 — Visual reference

**Live URL:** `https://cloudemployee.io/reviews` — page-level listing
of all customer reviews.

**Screenshots:** TBD-pending-Step-7. Capture 4–6 screenshots at desktop
(1440×900), tablet (768×1024), and mobile (375×667), covering: page
header (title + intro); reviews grid / list; per-review card detail;
empty state (if relevant — though 26 docs means the page is always
populated for CE customer 1); footer CTA. Save to
`docs/templates/reviews/_assets/screenshots/`.

**Field-to-UI map:** TBD-pending-Step-7. Expected per-review-card
mapping (the page renders one card per Review doc):

| Card region | Sanity field |
|---|---|
| Customer setting photo | `thumbnailImage` (rendered via `<Image fill>`) |
| Company logo | `companyLogo` (rendered via `<Image>`) |
| Author headshot | `memberImage` (rendered via `<Image>`) |
| Author name | `nameClient` (rendered via `<Text size="default">` with `font-medium`) |
| Author title / role | `position` (rendered via `<Text size="small">`) |
| Quote (short form) | `testimonyShort` (rendered via `<Text size="large">`) |
| Quote (long form, alternative) | `testimonyParagraph` (PortableText — render via `<PortableText>` if `testimonyShort` is absent) |
| Star rating | hardcoded 5-star asset — see Schema-vs-reality finding below |

## Section 4 — Sanity data shape

```ts
// site/../src/types/sanity/documents/review.ts
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

export const ReviewSchema = SanityBaseDocumentSchema.extend({
  _type: z.literal('review'),
  nameClient: z.string(),
  slug: SanitySlugSchema,
  position: z.string().optional(),
  order: z.number().optional(),
  testimonyShort: z.string().optional(),
  testimonyParagraph: PortableTextSchema.optional(),
  testimonyFullPage: PortableTextSchema.optional(),
  snippetForMeta: z.string().optional(),
  memberImage: SanityImageSchema.optional(),
  companyLogo: SanityImageSchema.optional(),
  thumbnailImage: SanityImageSchema.optional(),
  additionalInfo: PortableTextSchema.optional(),
  locale: LocaleSchema,
})
  .merge(MetaFieldsNoOgSchema)
  .merge(MetaSourceFieldsSchema)
  .merge(SourceTrackingFieldsCarryoverSchema)
export type Review = z.infer<typeof ReviewSchema>
```

**Notes for v0.dev:**
- **`MetaFieldsNoOgSchema` (NOT `MetaFieldsSchema`)** — reviews don't
  have `openGraphImage`. `generateMetadata` for the listing page can
  use a brand-default OG image.
- `nameClient` is the **only required** review field. Everything else
  is optional — the card layout must gracefully handle missing
  `companyLogo`, `memberImage`, `thumbnailImage`, `position`,
  `testimonyShort`, etc.
- **`testimonyShort` vs `testimonyParagraph`:** prefer `testimonyShort`
  for grid-card display (single-line snippet); fall back to
  `testimonyParagraph` (PortableText) when `testimonyShort` is empty.
  `testimonyFullPage` is reserved for a future per-review detail page
  (TEMPLATE-REVIEW-DETAIL — out of scope for this template).
- `order` is the curatorial sort key — the GROQ query orders by
  `coalesce(order, 9999) asc` so curator-pinned reviews surface first.
- This is a **listing page** — the GROQ query returns an ARRAY of
  reviews, not a single doc. Section 6 below shows the listing-shape
  query.

**GROQ query shape (listing page):**

```groq
*[_type == "review" && locale == $locale] | order(coalesce(order, 9999) asc) {
  _id,
  nameClient,
  position,
  slug,
  testimonyShort,
  testimonyParagraph,
  thumbnailImage,
  companyLogo,
  memberImage,
  order,
  locale
}
```

Pass `locale` only (`'default' | 'uk'`). No slug param — listing fetches
the full set. If the array is empty, render a "no reviews yet"
empty-state via the `EMPTY_RESULTS` `UI_STRINGS` enum.

## Section 5 — Constraints

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §5. Key call-outs for REVIEW:]

- **Heading hierarchy:** page `<h1>` for the listing title (e.g. "What
  customers say"); each review card uses `<Text>` for `nameClient`
  (NOT a heading — review cards aren't sections under the page outline).
- **LCP target:** the first card's `thumbnailImage` (or `companyLogo`
  if no thumbnail) is the LCP candidate. Subsequent cards lazy-load.
- **No OG image** — fall back to brand default in `generateMetadata`.
- **Optional-field discipline:** every review-card UI region must
  conditionally render — missing fields collapse cleanly (no "undefined"
  text, no broken image squares).
- **Routability:** if individual reviews link to detail pages
  (TEMPLATE-REVIEW-DETAIL pending — see Sub-finding 2 below), wrap
  cards via `<Link href={`/reviews/${slug.current}`}>` per the locale
  prefix. If no detail page exists yet, render cards as inert (no
  outer `<a>` wrap).

## Section 6 — Output format

[Pasted from `docs/V0_PROMPT_TEMPLATE.md` §6. Specifics for REVIEW:]

- **Output path:** `site/src/components/templates/reviews/index.tsx`
- **Async server component** — listing is data-driven, no interactivity.
- **`sanityFetch` from `@/lib/sanity/live`** for the listing fetch.
- **No params on the page route** — `/reviews` is a flat path; no
  `[slug]` segment.

---

## Schema-vs-reality findings carried forward

> Per Brief A v1.2 §5.2: the REVIEW template example must surface
> findings already logged in `docs/design/components/testimonial-swiper-global.md`
> Schema-vs-reality section. Two findings cross-cut between the
> Tier-1 testimonial-swiper component AND this listing template:

### Finding 1 — Hardcoded 5-star rating, no `review.rating` field

**Status:** deferred to STATIC-1 / SCHEMA-2 mini-phase per Step-3 brief
Hard Rule #5 (no schema modification in DESIGN-1). The live CE markup
hardcodes a `_stars.png` 5-star asset on every testimonial because
there is no `review.rating` field in the schema. CE's curatorial reality
is that every featured testimonial is 5-star; the field addition is a
safety hatch for future non-5-star reviews.

**v0.dev guidance:** render a hardcoded 5-star visual on each card in
the interim — a `<div>` containing 5 star icons, NOT a Sanity-driven
field read. When `review.rating` lands at SCHEMA-2, swap to
`<StarRating value={review.rating} />` (a primitive that doesn't yet
exist; deferred). Do NOT invent a `review.rating` projection in the
GROQ query — the field is not in the schema.

### Finding 2 — Sibling Swiper variant `.swiper.testimonies` distinct from this listing

**Status:** decision-needed at TEMPLATE-REVIEW (this template) vs
TEMPLATE-COMPONENT-TESTIMONIAL-SWIPER (the Tier-1 component used on
home / services pages).

CE has TWO Swiper-driven testimonial surfaces:

1. `.swiper.company-testimonies` — the autoplaying carousel embedded on
   home + services + 2 other template types. Specced at Tier-1
   (`testimonial-swiper-global.md`); has bullet-only pagination,
   `autoplay.delay: 6000`, looping.
2. `.swiper.testimonies` — the variant on this `/reviews` listing
   page. Has prev/next arrow navigation
   (`.swiper-btn-next-testimony`/`.swiper-btn-prev-testimony`),
   `dynamicBullets: true`, **no autoplay**, `spaceBetween: 24`.

**v0.dev guidance for THIS prompt (REVIEW listing):** treat the listing
as a **grid of cards** rather than a Swiper carousel. The Swiper variant
decision is a TEMPLATE-REVIEW concern that will be settled at
implementation time — either (a) reuse the `testimonial-swiper-global`
Tier-1 component with overridden props (autoplay off + arrows on +
dynamicBullets on), or (b) author a separate `testimonial-swiper-listing`
Tier-1 spec for the listing variant. Until that decision lands, v0.dev
should produce a card grid (CSS Grid `grid-cols-1 md:grid-cols-2
lg:grid-cols-3`), NOT an embedded carousel. The Tier-1 component swap
happens post-v0.dev at TEMPLATE-REVIEW phase.

---

*End of v0-prompt-review.md — Brief A §5.2 worked example #3.*
