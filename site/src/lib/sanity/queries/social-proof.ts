import 'server-only'

import { z } from 'zod'

import { sanityFetch } from '@/lib/sanity/live'
import { NOT_RETIRED } from '@/lib/sanity/queries/_filters'

// Data for the two social-proof hubs: Customer Stories (`/customer-stories`) and
// Reviews (`/reviews`). Bespoke, not the generic renderHub, because the design is
// rich (featured cards, logo marquee, testimonial grid, Glassdoor band) and none of
// it maps onto the generic card grid.
//
// SCHEMA MAPPING - the design spec assumed `testimonial` / `client` doc types we do
// not have. The real mapping:
//   spec `testimonial`            -> our `review` doc
//     .authorPhoto                -> review.memberImage
//     .authorName                 -> review.nameClient
//     .authorTitle                -> review.position
//     .quote                      -> review.testimonyShort (else snippetForMeta)
//     .companyLogo                -> review.companyLogo
//   spec `client` (marquee logos) -> customerStory.companyLogo (the "trusted by"
//                                    logos ARE our customer-story companies)
//   customerStory.heroImage       -> companyProductImage (else companyPeopleImage)
//   customerStory.featured        -> featuredOnCustomerStoriesPage
//
// EVERY asset is a field on the SAME document it renders, so imagery can never
// mismatch its content (spec's hard requirement).

const ImageSchema = z
  .object({
    asset: z.object({ _ref: z.string().optional() }).passthrough().optional(),
    alt: z.string().nullable().optional(),
  })
  .passthrough()
  .nullable()
  .optional()

// ── Customer story card ─────────────────────────────────────────────────────
const StoryCardSchema = z.object({
  _id: z.string(),
  slug: z.string(),
  title: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  companyLogo: ImageSchema,
  image: ImageSchema, // companyProductImage, else companyPeopleImage
})
export type StoryCard = z.infer<typeof StoryCardSchema>

// ── Review / testimonial card ───────────────────────────────────────────────
const ReviewCardSchema = z.object({
  _id: z.string(),
  slug: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  photo: ImageSchema,
  companyLogo: ImageSchema,
  quote: z.string().nullable().optional(),
})
export type ReviewCard = z.infer<typeof ReviewCardSchema>

// ── Glassdoor review card ───────────────────────────────────────────────────
const GlassdoorCardSchema = z.object({
  _id: z.string(),
  title: z.string().nullable().optional(),
  role: z.string().nullable().optional(), // clientName is the job role on these docs
  category: z.string().nullable().optional(), // workField -> the tag
  body: z.string().nullable().optional(),
})
export type GlassdoorCard = z.infer<typeof GlassdoorCardSchema>

// ── Hub singleton hero fields ───────────────────────────────────────────────
const HubHeroSchema = z.object({
  title: z.string(),
  eyebrow: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
})
export type HubHero = z.infer<typeof HubHeroSchema>

// A story counts as "real" (shown on the hub, matching live) when its title is not
// the migration's "Customer story in progress..." placeholder. 7 of 17 qualify; the
// other 10 are unwritten drafts that do not appear on the live site.
const REAL_STORY = /* groq */ `!(customerStoryTitle match "*in progress*")`

// companyProductImage first, companyPeopleImage as the fallback. Verified against
// live for all 7 published stories: the card photo on cloudemployee.io is the
// product image in every case (byte-identical assets, matching dimensions), while
// companyPeopleImage is a second, usually portrait, shot. The detail template
// already resolves its hero the same way.
const STORY_PROJECTION = /* groq */ `{
  _id,
  "slug": slug.current,
  "title": customerStoryTitle,
  companyName,
  companyLogo,
  "image": coalesce(companyProductImage, companyPeopleImage)
}`

const REVIEW_PROJECTION = /* groq */ `{
  _id,
  "slug": slug.current,
  "name": nameClient,
  position,
  "photo": memberImage,
  companyLogo,
  "quote": coalesce(testimonyShort, snippetForMeta)
}`

// ── Customer Stories page ───────────────────────────────────────────────────
export type CustomerStoriesData = {
  hero: HubHero
  featured: StoryCard[]
  grid: StoryCard[]
  marqueeLogos: StoryCard[]
  testimonials: ReviewCard[]
}

const CUSTOMER_STORIES_QUERY = /* groq */ `{
  "hero": *[_id == "customerStoriesHub"][0]{ title, eyebrow, metaTitle, metaDescription },
  "featured": *[_type == "customerStory" && ${NOT_RETIRED} && ${REAL_STORY} && featuredOnCustomerStoriesPage == true]
    | order(order asc) ${STORY_PROJECTION},
  "grid": *[_type == "customerStory" && ${NOT_RETIRED} && ${REAL_STORY} && featuredOnCustomerStoriesPage != true]
    | order(order asc) ${STORY_PROJECTION},
  "marqueeLogos": *[_type == "customerStory" && ${NOT_RETIRED} && defined(companyLogo.asset)]
    | order(order asc) ${STORY_PROJECTION},
  "testimonials": *[_type == "review" && ${NOT_RETIRED} && defined(memberImage.asset)]
    | order(order asc) ${REVIEW_PROJECTION}
}`

// ── Our Work page bento tiles ───────────────────────────────────────────────
// Same story projection plus videoUrl, so the bento grid can flag which tiles are
// videos (play button) versus plain images - never hardcoded per company.
const BentoTileSchema = StoryCardSchema.extend({
  videoUrl: z.string().nullable().optional(),
})
export type BentoTile = z.infer<typeof BentoTileSchema>

const OUR_WORK_BENTO_QUERY = /* groq */ `
*[_type == "customerStory" && ${NOT_RETIRED} && ${REAL_STORY} && (defined(companyPeopleImage) || defined(companyProductImage))]
  | order(order asc)[0...6]{
    _id,
    "slug": slug.current,
    "title": customerStoryTitle,
    companyName,
    companyLogo,
    "image": coalesce(companyProductImage, companyPeopleImage),
    videoUrl
  }`

export async function fetchOurWorkBento(): Promise<BentoTile[]> {
  const { data } = await sanityFetch({ query: OUR_WORK_BENTO_QUERY })
  return z.array(BentoTileSchema).parse(data ?? [])
}

export async function fetchCustomerStoriesData(): Promise<CustomerStoriesData | null> {
  const { data } = await sanityFetch({ query: CUSTOMER_STORIES_QUERY })
  if (!data) return null
  return {
    hero: HubHeroSchema.parse(data.hero),
    featured: z.array(StoryCardSchema).parse(data.featured ?? []),
    grid: z.array(StoryCardSchema).parse(data.grid ?? []),
    marqueeLogos: z.array(StoryCardSchema).parse(data.marqueeLogos ?? []),
    testimonials: z.array(ReviewCardSchema).parse(data.testimonials ?? []),
  }
}

// ── Reviews page ────────────────────────────────────────────────────────────
export type ReviewsData = {
  hero: HubHero
  reviews: ReviewCard[] // all; template splits first 6 grid + rest "more reviews"
  stories: StoryCard[] // 3 in-depth story cards
  glassdoor: GlassdoorCard[]
  marqueeLogos: StoryCard[]
}

const REVIEWS_QUERY = /* groq */ `{
  "hero": *[_id == "reviewsHub"][0]{ title, eyebrow, metaTitle, metaDescription },
  "reviews": *[_type == "review" && ${NOT_RETIRED}] | order(order asc) ${REVIEW_PROJECTION},
  "stories": *[_type == "customerStory" && ${NOT_RETIRED} && ${REAL_STORY} && (defined(companyProductImage.asset) || defined(companyPeopleImage.asset))]
    | order(featuredOnCustomerStoriesPage desc, order asc)[0...3] ${STORY_PROJECTION},
  "glassdoor": *[_type == "glassdoorReview"] | order(_createdAt asc){
    _id, title, "role": clientName, "category": workField, "body": reviewDescription
  },
  "marqueeLogos": *[_type == "customerStory" && ${NOT_RETIRED} && defined(companyLogo.asset)]
    | order(order asc) ${STORY_PROJECTION}
}`

export async function fetchReviewsData(): Promise<ReviewsData | null> {
  const { data } = await sanityFetch({ query: REVIEWS_QUERY })
  if (!data) return null
  return {
    hero: HubHeroSchema.parse(data.hero),
    reviews: z.array(ReviewCardSchema).parse(data.reviews ?? []),
    stories: z.array(StoryCardSchema).parse(data.stories ?? []),
    glassdoor: z.array(GlassdoorCardSchema).parse(data.glassdoor ?? []),
    marqueeLogos: z.array(StoryCardSchema).parse(data.marqueeLogos ?? []),
  }
}

// The Glassdoor summary badge. No Sanity source yet (Tech Debt #47-adjacent) -
// hardcoded from live so the design renders, flagged for Seb to make a site setting.
export const GLASSDOOR_SUMMARY = { rating: '4.8', total: 187 } as const
