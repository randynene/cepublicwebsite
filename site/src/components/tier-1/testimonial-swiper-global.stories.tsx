// Story placeholder — Tier-1 composite component not yet implemented (lands
// at TEMPLATE-* phases per Step 3 brief HALT 1 lock L4). Story renders
// primitive decomposition per §3 Tech stack with mock data per §6 Data
// binding. NO library wiring per Brief A Hard Rule #7. Update at
// TEMPLATE-REVIEW phase to reflect actual implementation.
//
// Spec: docs/design/components/testimonial-swiper-global.md
// §3 Tech stack: Swiper 11 + A4 Card / B1 Heading / B2 Text / E1 Image.
// §4 Timing (library-mediated, source-extracted):
//   autoplay.delay 6000ms, slide transition 300ms cubic-bezier(.65,0,.35,1),
//   bullet click 300ms.
// Schema-vs-reality: installed Swiper is 12.1.4, not 11 (Brief A v1.2 C3) —
// patch testimonial-swiper-global.md §3 at TEMPLATE-REVIEW.
//
// Scaffold deviation: Swiper init is library wiring. This story renders ONE
// composed testimonial slide statically + a non-functional pagination row
// to communicate the carousel shape. Multi-slide autoplay + drag/touch +
// keyboard arrow navigation land at TEMPLATE-REVIEW.

import type { Meta, StoryObj } from '@storybook/nextjs'

import { Card, CardContent } from '../ui/card'
import { Image } from '../ui/image'
import { Text } from '../ui/text'

const meta = {
  title: 'Tier-1/testimonial-swiper-global',
} satisfies Meta

export default meta
type Story = StoryObj

function ScaffoldNote() {
  return (
    <div className="rounded-md border border-brand-tertiary/20 bg-brand-tertiary/5 p-4 text-body-sm text-text-default">
      <p className="font-medium">Scaffold-stage preview — TEMPLATE-REVIEW pending.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Library: Swiper 12.1.4 (installed) — wraps the slide group below.</li>
        <li>autoplay.delay: 6000ms · slide transition: 300ms cubic-bezier(.65,0,.35,1).</li>
        <li>GROQ: <code>*[_type == &quot;review&quot;] | order(coalesce(order, 9999) asc)[0..9]</code>.</li>
        <li>5-star rating asset hardcoded in interim (review.rating field deferred to STATIC-1 / SCHEMA-2).</li>
      </ul>
    </div>
  )
}

const sampleReview = {
  nameClient: 'Sample Author Name',
  position: 'Sample Title, Sample Company',
  testimonyShort:
    'Sample testimonial body text — generic placeholder copy used in lieu of real CE marketing strings.',
  thumbnailImage: { src: '/og-default.png' },
  companyLogo: { src: '/next.svg' },
  memberImage: { src: '/og-default.png' },
}

export const Default: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-col gap-4 p-6">
      <ScaffoldNote />
      <Card tone="muted">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative aspect-video overflow-hidden rounded-md bg-brand-tertiary/5">
              <Image
                src={sampleReview.thumbnailImage.src}
                alt="Sample setting photo"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-brand-secondary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} aria-hidden="true">
                    ★
                  </span>
                ))}
                <span className="sr-only">5 out of 5 stars</span>
              </div>
              <Image
                src={sampleReview.companyLogo.src}
                alt="Sample company logo"
                width={120}
                height={32}
              />
              <Text size="large">&ldquo;{sampleReview.testimonyShort}&rdquo;</Text>
              <div className="mt-auto flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-brand-primary/10">
                  <Image
                    src={sampleReview.memberImage.src}
                    alt=""
                    fill
                    sizes="40px"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-text-default">
                    {sampleReview.nameClient}
                  </span>
                  <Text size="small">{sampleReview.position}</Text>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div
        className="flex items-center justify-center gap-2"
        aria-label="Pagination preview (non-functional in scaffold)"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={
              i === 0
                ? 'h-2 w-6 rounded-full bg-brand-primary'
                : 'h-2 w-2 rounded-full bg-brand-tertiary/30'
            }
          />
        ))}
      </div>
    </div>
  ),
}
