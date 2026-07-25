import { CardMarquee } from '@/components/social-proof/card-marquee'
import { GLASSDOOR_SUMMARY, type GlassdoorCard } from '@/lib/sanity/queries/social-proof'
import { UI_STRINGS } from '@/lib/ui-strings'

// The "What our engineers say" band. On the live site this is a distinct teal panel;
// here it is a lime-tinted elevated surface so it still reads as a set-apart section
// in the dark system (the design's dark-mode equivalent of the teal).
//
// The cards are `glassdoorReview` docs (role + body + category tag). The "4.8 / 187
// reviews" summary has no Sanity source yet, so it is hardcoded from live and flagged
// for Seb to make a site setting (Tech Debt).

function GlassdoorReviewCard({ card }: { card: GlassdoorCard }) {
  return (
    <article className="flex h-full w-[300px] flex-col rounded-[16px] bg-white p-5 text-[#0A1628]">
      {card.role ? (
        <h3 className="text-[16px] font-semibold leading-snug">{card.role}</h3>
      ) : null}
      <p className="mt-3 flex-1 text-[13px] leading-[20px] text-[#0A1628]/70">{card.body}</p>
      {card.category ? (
        <span className="mt-4 inline-flex w-fit items-center rounded-md bg-[#0A1628]/5 px-2.5 py-1 text-[12px] font-medium text-[#0A1628]/70">
          {card.category}
        </span>
      ) : null}
    </article>
  )
}

function RatingBadge() {
  return (
    <div className="mx-auto flex w-fit items-center gap-3 rounded-[14px] bg-white px-5 py-3 text-[#0A1628]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0CAA41] text-[15px] font-bold text-white">
        {UI_STRINGS['socialProof.glassdoorInitial']}
      </span>
      <span>
        <span className="block text-[11px] font-medium uppercase tracking-wide text-[#0A1628]/60">
          {UI_STRINGS['socialProof.ourRating']}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-bold tabular-nums">{GLASSDOOR_SUMMARY.rating}</span>
          <span aria-hidden="true" className="text-[13px] text-[#F5B400]">
            {UI_STRINGS['socialProof.stars']}
          </span>
        </span>
      </span>
      <span className="border-l border-[#0A1628]/10 pl-3 text-[12px] text-[#0A1628]/60">
        {UI_STRINGS['socialProof.totalReviews'].replace('{n}', String(GLASSDOOR_SUMMARY.total))}
      </span>
    </div>
  )
}

export function GlassdoorBand({ cards }: { cards: GlassdoorCard[] }) {
  if (cards.length === 0) return null

  return (
    <section
      aria-labelledby="engineers-say"
      className="rounded-[24px] border border-brand-primary/20 bg-brand-primary/[0.06] px-5 py-14 lg:px-10"
    >
      <div className="mx-auto mb-10 max-w-[720px] text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[1.6px] text-brand-primary">
          {UI_STRINGS['socialProof.engineersEyebrow']}
        </p>
        <h2 id="engineers-say" className="mt-3 text-[36px] font-semibold leading-tight text-text-default">
          {UI_STRINGS['socialProof.engineersHeading']}
        </h2>
      </div>

      <CardMarquee items={cards.map((c) => <GlassdoorReviewCard key={c._id} card={c} />)} />

      <div className="mt-10">
        <RatingBadge />
      </div>
    </section>
  )
}
