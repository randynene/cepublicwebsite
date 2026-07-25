import type { ReactNode } from 'react'

import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { PortableText } from '@/components/ui/portable-text'
import { cn } from '@/components/ui/_utils/cn'
import type { Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type {
  Fold,
  Service,
  ServiceType,
} from '@/types/sanity/documents/service'

export interface ServiceTemplateProps {
  service: Service
  locale: Locale
}

// Layout follows the CE service-detail reference (docs/re-design/screenshots/
// catalog-details/service-detail__{desktop,mobile}.png) re-skinned onto the
// dark/lime D2 design system. Content imagery is per-service (Sanity
// fold.featuredImage); the hero photo + floating UI card are FIXED design
// furniture shared across every service page (site/public/design/services/*).
//
// Export architecture: sibling sections inside a 1280px frame, each with its
// OWN single 64px horizontal padding layer (band 1280 − 2×64 = 1152 content).
// All spacing utilities are ARBITRARY px because tokens.css sets
// `--spacing: 0.5rem` (8px/unit), which would double any scale utility.
const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'
const READING_CLASS = 'max-w-[780px]'

// Fixed design-furniture assets (identical on every service page).
const HERO_IMAGE = '/design/services/hero.avif'
const HERO_UI_CARD = '/design/services/ui-card.webp'
const DECOR_IMAGES = [
  '/design/services/candid-1.png',
  '/design/services/candid-2.avif',
  '/design/services/candid-3.avif',
]

// Card surface — dark elevated (#101B30) + border (#22314D) + 20px radius.
const CARD_CLASS = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'

// Fold eyebrow — 11.5px / 600 / 1.68px tracking / uppercase / lime. leading-none
// so the line-height computes to 11.5px (export target: foldEyebrow).
const EYEBROW_CLASS =
  'text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-brand-primary'

// Hero category eyebrow — 13px / 500 / lh13 / -0.08px / lime (heroCategoryEyebrow).
const HERO_EYEBROW_CLASS =
  'text-[13px] font-medium leading-none tracking-[-0.08px] text-brand-primary'

// Standard fold H2 — 46/600/lh56/-1.4/white desktop (foldH2Standard).
const FOLD_H2_STANDARD_CLASS =
  'text-[32px] font-semibold leading-[38px] tracking-[-1px] text-white lg:text-[46px] lg:leading-[56px] lg:tracking-[-1.4px]'

// paragraphSection H2 — 40/600/lh48/-1.2/white desktop (foldH2Paragraph).
const FOLD_H2_PARAGRAPH_CLASS =
  'text-[30px] font-semibold leading-[38px] tracking-[-1px] text-white lg:text-[40px] lg:leading-[48px] lg:tracking-[-1.2px]'

// headerOnly statement H2 — 54/600/lh60/-1.6/white desktop (foldH2Statement).
const FOLD_H2_STATEMENT_CLASS =
  'text-[36px] font-semibold leading-[42px] tracking-[-1.2px] text-white lg:text-[54px] lg:leading-[60px] lg:tracking-[-1.6px]'

// headerIntro paragraph body — 18/400/lh28/-0.08/#B8C2D1 (foldIntroParagraph).
const introParagraphComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-[16px] text-[18px] font-normal leading-[28px] tracking-[-0.08px] text-text-secondary last:mb-0">
        {children}
      </p>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <Heading
        as="h3"
        size="h4"
        className="mb-[12px] mt-[24px] text-[22px] font-semibold leading-[30px] tracking-[-0.6px] text-white first:mt-0"
      >
        {children}
      </Heading>
    ),
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-[16px] flex flex-col gap-[10px] last:mb-0">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <li className="flex items-start gap-[12px] text-[18px] leading-[28px] tracking-[-0.08px] text-text-secondary">
        <TickGlyph />
        <span>{children}</span>
      </li>
    ),
  },
}

// paragraphSection body — 18/400/lh29/-0.08/#B8C2D1 (foldParagraphSectionBody).
const paragraphSectionComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-[18px] text-[18px] font-normal leading-[29px] tracking-[-0.08px] text-text-secondary last:mb-0">
        {children}
      </p>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <Heading
        as="h3"
        size="h4"
        className="mb-[12px] mt-[24px] text-[22px] font-semibold leading-[30px] tracking-[-0.6px] text-white first:mt-0"
      >
        {children}
      </Heading>
    ),
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-[18px] flex flex-col gap-[10px] last:mb-0">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <li className="flex items-start gap-[12px] text-[18px] leading-[29px] tracking-[-0.08px] text-text-secondary">
        <TickGlyph />
        <span>{children}</span>
      </li>
    ),
  },
}

// Lime tick glyph rendered as an SVG (not a text literal) so it passes the
// UI_STRINGS jsx-no-literals gate — mirrors the customer-story TickGlyph.
function TickGlyph() {
  return (
    <span
      aria-hidden="true"
      className="mt-[2px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-brand-primary/25 bg-brand-primary/10 text-brand-primary"
    >
      <svg
        className="h-[13px] w-[13px]"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  )
}

// Category label for the hero eyebrow + JSON-LD serviceType. UI_STRINGS-backed.
const SERVICE_TYPE_LABEL_KEYS: Record<
  ServiceType,
  keyof typeof UI_STRINGS
> = {
  staffAugmentation: 'service.categoryStaffAugmentation',
  productBuilds: 'service.categoryProductBuilds',
  consultingServices: 'service.categoryConsultingServices',
}

export function serviceCategoryLabel(type: ServiceType): string {
  return UI_STRINGS[SERVICE_TYPE_LABEL_KEYS[type]]
}

function FoldEyebrow({ label }: { label?: string | null }) {
  const trimmed = label?.trim()
  if (!trimmed) return null
  return <p className={cn(EYEBROW_CLASS, 'mb-[16px]')}>{trimmed}</p>
}

// Per-service content image (Sanity fold.featuredImage), styled as a rounded
// framed photo with a soft lime glow behind it (echoes the hero blob motif).
function FoldFeaturedImage({
  fold,
  serviceName,
}: {
  fold: Fold
  serviceName: string
}) {
  if (!fold.featuredImage?.asset) return null
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -bottom-[24px] -left-[24px] h-[160px] w-[160px] rounded-full bg-brand-primary/25 blur-[64px]"
      />
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-[#22314D] bg-[#101B30]">
        <Image
          source={fold.featuredImage}
          alt={fold.featuredImage.alt?.trim() || serviceName}
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  )
}

// headerIntro — eyebrow + H2 + intro paragraph + optional featuredImage.
// Alternating image side (imageSide) mirrors the reference layout rhythm.
function HeaderIntroFold({
  fold,
  serviceName,
  imageSide,
}: {
  fold: Fold
  serviceName: string
  imageSide: 'left' | 'right'
}) {
  const hasHeader = Boolean(fold.header?.trim())
  const hasParagraph =
    Array.isArray(fold.paragraph) && fold.paragraph.length > 0
  const hasImage = Boolean(fold.featuredImage?.asset)
  if (!hasHeader && !hasParagraph && !hasImage && !fold.label?.trim()) {
    return null
  }

  const textBlock = (
    <div>
      <FoldEyebrow label={fold.label} />
      {hasHeader && (
        <Heading as="h2" className={cn(FOLD_H2_STANDARD_CLASS, 'mb-[20px]')}>
          {fold.header}
        </Heading>
      )}
      {hasParagraph && (
        <PortableText
          value={fold.paragraph!}
          components={introParagraphComponents}
        />
      )}
    </div>
  )

  if (hasImage) {
    return (
      <div className="grid grid-cols-1 items-center gap-[40px] lg:grid-cols-2 lg:gap-[64px]">
        {imageSide === 'left' ? (
          <>
            <div className="order-2 lg:order-1">
              <FoldFeaturedImage fold={fold} serviceName={serviceName} />
            </div>
            <div className="order-1 lg:order-2">{textBlock}</div>
          </>
        ) : (
          <>
            {textBlock}
            <FoldFeaturedImage fold={fold} serviceName={serviceName} />
          </>
        )}
      </div>
    )
  }

  return <div className={READING_CLASS}>{textBlock}</div>
}

// featureBullets — eyebrow + H2 + optional intro paragraph + bullet list.
function FeatureBulletsFold({
  fold,
  serviceName,
  imageSide,
}: {
  fold: Fold
  serviceName: string
  imageSide: 'left' | 'right'
}) {
  const hasHeader = Boolean(fold.header?.trim())
  const hasParagraph =
    Array.isArray(fold.paragraph) && fold.paragraph.length > 0
  const bullets = Array.isArray(fold.bullets)
    ? fold.bullets.map((b) => b?.trim()).filter((b): b is string => Boolean(b))
    : []
  const hasBullets = bullets.length > 0
  const hasImage = Boolean(fold.featuredImage?.asset)
  if (!hasHeader && !hasParagraph && !hasBullets && !fold.label?.trim()) {
    return null
  }

  const textBlock = (
    <div>
      <FoldEyebrow label={fold.label} />
      {hasHeader && (
        <Heading as="h2" className={cn(FOLD_H2_STANDARD_CLASS, 'mb-[20px]')}>
          {fold.header}
        </Heading>
      )}
      {hasParagraph && (
        <div className="mb-[28px]">
          <PortableText
            value={fold.paragraph!}
            components={introParagraphComponents}
          />
        </div>
      )}
      {hasBullets && (
        <ul className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
          {bullets.map((bullet, index) => (
            <li
              key={`${index}-${bullet.slice(0, 12)}`}
              className="flex items-start gap-[12px]"
            >
              <TickGlyph />
              <span className="text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary">
                {bullet}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  if (hasImage) {
    return (
      <div className="grid grid-cols-1 items-center gap-[40px] lg:grid-cols-2 lg:gap-[64px]">
        {imageSide === 'left' ? (
          <>
            <div className="order-2 lg:order-1">
              <FoldFeaturedImage fold={fold} serviceName={serviceName} />
            </div>
            <div className="order-1 lg:order-2">{textBlock}</div>
          </>
        ) : (
          <>
            {textBlock}
            <FoldFeaturedImage fold={fold} serviceName={serviceName} />
          </>
        )}
      </div>
    )
  }
  return textBlock
}

// itemList — eyebrow + H2 + numbered item cards (lime badge + header + desc).
function ItemListFold({ fold }: { fold: Fold }) {
  const hasHeader = Boolean(fold.header?.trim())
  const items = Array.isArray(fold.items)
    ? fold.items.filter(
        (item) => item.header?.trim() || item.description?.trim(),
      )
    : []
  const hasItems = items.length > 0
  if (!hasHeader && !hasItems && !fold.label?.trim()) return null

  return (
    <div>
      <FoldEyebrow label={fold.label} />
      {hasHeader && (
        <Heading as="h2" className={cn(FOLD_H2_STANDARD_CLASS, 'mb-[36px]')}>
          {fold.header}
        </Heading>
      )}
      {hasItems && (
        <ol className="grid grid-cols-1 gap-[20px] md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li key={item._key ?? index} className={cn(CARD_CLASS, 'p-[28px]')}>
              <span className="mb-[18px] flex h-[36px] w-[36px] items-center justify-center rounded-full bg-brand-primary text-[16px] font-semibold leading-none text-[#060F1E]">
                {index + 1}
              </span>
              {item.header?.trim() && (
                <p className="mb-[10px] text-[19px] font-semibold leading-[24.7px] tracking-[-0.4px] text-white">
                  {item.header}
                </p>
              )}
              {item.description?.trim() && (
                <p className="text-[14.5px] font-normal leading-[22px] tracking-[-0.08px] text-text-secondary">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// paragraphSection — eyebrow + H2 (40px) + paragraph PortableText.
function ParagraphSectionFold({ fold }: { fold: Fold }) {
  const hasHeader = Boolean(fold.header?.trim())
  const hasParagraph =
    Array.isArray(fold.paragraph) && fold.paragraph.length > 0
  if (!hasHeader && !hasParagraph && !fold.label?.trim()) return null

  return (
    <div className={READING_CLASS}>
      <FoldEyebrow label={fold.label} />
      {hasHeader && (
        <Heading as="h2" className={cn(FOLD_H2_PARAGRAPH_CLASS, 'mb-[20px]')}>
          {fold.header}
        </Heading>
      )}
      {hasParagraph && (
        <PortableText
          value={fold.paragraph!}
          components={paragraphSectionComponents}
        />
      )}
    </div>
  )
}

// headerOnly — large statement rendered as a distinct dark panel band with a
// lime accent rule (echoes the reference's dark statement sections).
function HeaderOnlyFold({ fold }: { fold: Fold }) {
  const hasHeader = Boolean(fold.header?.trim())
  if (!hasHeader && !fold.label?.trim()) return null

  return (
    <div className="rounded-[28px] border border-[#22314D] bg-[radial-gradient(120%_140%_at_0%_0%,#101B30_0%,#0B1424_100%)] px-[28px] py-[40px] lg:px-[56px] lg:py-[64px]">
      <div className="max-w-[920px]">
        <span
          aria-hidden="true"
          className="mb-[24px] block h-[3px] w-[56px] rounded-full bg-brand-primary"
        />
        <FoldEyebrow label={fold.label} />
        {hasHeader && (
          <Heading as="h2" className={FOLD_H2_STATEMENT_CLASS}>
            {fold.header}
          </Heading>
        )}
      </div>
    </div>
  )
}

function FoldSection({
  fold,
  serviceName,
  imageSide,
}: {
  fold: Fold
  serviceName: string
  imageSide: 'left' | 'right'
}) {
  switch (fold.type) {
    case 'headerIntro':
      return (
        <HeaderIntroFold
          fold={fold}
          serviceName={serviceName}
          imageSide={imageSide}
        />
      )
    case 'featureBullets':
      return (
        <FeatureBulletsFold
          fold={fold}
          serviceName={serviceName}
          imageSide={imageSide}
        />
      )
    case 'itemList':
      return <ItemListFold fold={fold} />
    case 'paragraphSection':
      return <ParagraphSectionFold fold={fold} />
    case 'headerOnly':
      return <HeaderOnlyFold fold={fold} />
    default:
      return null
  }
}

// Fixed decorative photo band — three lifestyle shots shared across every
// service page (design furniture, not per-service content). Purely visual, so
// images carry empty alt and the row is aria-hidden.
function DecorPhotoBand() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-3 gap-[12px] sm:gap-[20px]"
    >
      {DECOR_IMAGES.map((src, index) => (
        <div
          key={src}
          className={cn(
            'relative aspect-[3/4] overflow-hidden rounded-[20px] border border-[#22314D] bg-[#101B30]',
            index === 1 ? 'translate-y-[24px]' : '',
          )}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, 33vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}

export default function ServiceTemplate({ service }: ServiceTemplateProps) {
  const eyebrow = serviceCategoryLabel(service.type)
  const tagline = service.tagline?.trim()
  const folds = Array.isArray(service.folds) ? service.folds : []

  // Alternate the image side across folds that actually carry an image.
  // Pure: a fold's side is decided by how many image-bearing folds precede it
  // (no render-time mutable counter — satisfies react-hooks/immutability).
  const isImageFold = (fold: Fold): boolean =>
    (fold.type === 'headerIntro' || fold.type === 'featureBullets') &&
    Boolean(fold.featuredImage?.asset)
  const imageSideFor = (index: number, fold: Fold): 'left' | 'right' => {
    if (!isImageFold(fold)) return 'right'
    const priorImageFolds = folds.slice(0, index).filter(isImageFold).length
    return priorImageFolds % 2 === 0 ? 'right' : 'left'
  }

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          {/* Hero — two-column: text left, fixed furniture photo + floating UI
              card right. Hero CTAs omitted (no schema-backed target).
              Breadcrumbs omitted visually; BreadcrumbList JSON-LD remains. */}
          <header
            className={cn(
              'bg-[radial-gradient(120%_70%_at_50%_0%,#0c1830_0%,#070D18_60%)]',
              BAND_PX_CLASS,
              'pt-[48px] pb-[24px] lg:pt-[72px] lg:pb-[40px]',
            )}
          >
            <div className="grid grid-cols-1 items-center gap-[40px] lg:grid-cols-[1fr_520px] lg:gap-[64px]">
              <div className="text-center lg:text-left">
                <p className={cn(HERO_EYEBROW_CLASS, 'mb-[18px]')}>{eyebrow}</p>
                <Heading
                  as="h1"
                  size="h1"
                  className="mx-auto max-w-[560px] text-[40px] font-semibold leading-[46px] tracking-[-1.6px] text-white lg:mx-0 lg:text-[64px] lg:leading-[68px] lg:tracking-[-2.4px]"
                >
                  {service.name}
                </Heading>
                {tagline && (
                  <p className="mx-auto mt-[22px] max-w-[520px] text-[19px] font-normal leading-[28.5px] tracking-[-0.08px] text-text-secondary lg:mx-0">
                    {tagline}
                  </p>
                )}
              </div>

              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="relative aspect-[1599/1299] w-full overflow-hidden rounded-[28px]">
                  <Image
                    src={HERO_IMAGE}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-[20px] left-[16px] w-[220px] overflow-hidden rounded-[16px] border border-[#E6EBF2] bg-white shadow-[0_18px_40px_rgba(2,8,20,0.45)] sm:w-[248px]">
                  <Image
                    src={HERO_UI_CARD}
                    alt=""
                    width={716}
                    height={304}
                    sizes="248px"
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Folds — rendered in array order, one section per fold. */}
          <div className="pt-[56px] pb-[80px]">
            {folds.map((fold, index) => (
              <section
                key={fold._key ?? index}
                className={cn(BAND_PX_CLASS, 'py-[40px] lg:py-[56px]')}
              >
                <FoldSection
                  fold={fold}
                  serviceName={service.name}
                  imageSide={imageSideFor(index, fold)}
                />
              </section>
            ))}

            {/* Fixed decorative photo band (design furniture). */}
            <section className={cn(BAND_PX_CLASS, 'pt-[24px] pb-[8px]')}>
              <DecorPhotoBand />
            </section>
          </div>
        </div>
      </Container>
    </article>
  )
}
