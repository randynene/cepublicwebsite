import type { ReactNode } from 'react'

import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'
import { PortableText } from '@/components/ui/portable-text'
import { cn } from '@/components/ui/_utils/cn'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { Fold, Technology } from '@/types/sanity/documents/technology'

export interface TechnologyTemplateProps {
  technology: Technology
  locale: Locale
}

// Export architecture: sibling sections inside a 1280px frame, each with its
// OWN single 64px horizontal padding layer (band 1280 − 2×64 = 1152 content).
// tokens.css sets `--spacing: 0.5rem` (8px/unit) so all fidelity spacing is
// ARBITRARY px. Fold renderers mirror the Service template (identical export
// design — Step 0 confirmed the 5 fold types share Service's computed values).
const BAND_CLASS = 'mx-auto max-w-[1280px]'
const BAND_PX_CLASS = 'px-[22px] sm:px-[32px] lg:px-[64px]'
const READING_CLASS = 'max-w-[780px]'

const CARD_CLASS = 'rounded-[20px] border border-[#22314D] bg-[#101B30]'

// Fold eyebrow — 11.5px / 600 / 1.68px tracking / uppercase / lime.
const EYEBROW_CLASS =
  'text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-brand-primary'

// Hero category eyebrow — 13px / 500 / lh13 / -0.08px / lime.
const HERO_EYEBROW_CLASS =
  'text-[13px] font-medium leading-none tracking-[-0.08px] text-brand-primary'

// Standard fold H2 — 46/600/lh56/-1.4/white desktop.
const FOLD_H2_STANDARD_CLASS =
  'text-[32px] font-semibold leading-[38px] tracking-[-1px] text-white lg:text-[46px] lg:leading-[56px] lg:tracking-[-1.4px]'

// paragraphSection H2 — 40/600/lh48/-1.2/white desktop.
const FOLD_H2_PARAGRAPH_CLASS =
  'text-[30px] font-semibold leading-[38px] tracking-[-1px] text-white lg:text-[40px] lg:leading-[48px] lg:tracking-[-1.2px]'

// headerOnly statement H2 — 54/600/lh60/-1.6/white desktop.
const FOLD_H2_STATEMENT_CLASS =
  'text-[36px] font-semibold leading-[42px] tracking-[-1.2px] text-white lg:text-[54px] lg:leading-[60px] lg:tracking-[-1.6px]'

// headerIntro paragraph body — 18/400/lh28/-0.08/#B8C2D1.
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

// paragraphSection body — 18/400/lh29/-0.08/#B8C2D1. Inline links (e.g. the
// "About {tech}" block's info@cloudemployee.io) route through the primitive's
// default mark handler.
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
// UI_STRINGS jsx-no-literals gate.
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

function FoldEyebrow({ label }: { label?: string | null }) {
  const trimmed = label?.trim()
  if (!trimmed) return null
  return <p className={cn(EYEBROW_CLASS, 'mb-[16px]')}>{trimmed}</p>
}

function FoldFeaturedImage({
  fold,
  fallbackAlt,
}: {
  fold: Fold
  fallbackAlt: string
}) {
  if (!fold.featuredImage?.asset) return null
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border border-[#22314D] bg-[#101B30]">
      <Image
        source={fold.featuredImage}
        alt={fold.featuredImage.alt?.trim() || fallbackAlt}
        fill
        sizes="(min-width: 1024px) 560px, 100vw"
        className="object-cover"
      />
    </div>
  )
}

function HeaderIntroFold({
  fold,
  fallbackAlt,
}: {
  fold: Fold
  fallbackAlt: string
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
      <div className="grid grid-cols-1 items-center gap-[40px] lg:grid-cols-2 lg:gap-[56px]">
        {textBlock}
        <FoldFeaturedImage fold={fold} fallbackAlt={fallbackAlt} />
      </div>
    )
  }

  return <div className={READING_CLASS}>{textBlock}</div>
}

function FeatureBulletsFold({
  fold,
  fallbackAlt,
}: {
  fold: Fold
  fallbackAlt: string
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
      <div className="grid grid-cols-1 items-center gap-[40px] lg:grid-cols-2 lg:gap-[56px]">
        {textBlock}
        <FoldFeaturedImage fold={fold} fallbackAlt={fallbackAlt} />
      </div>
    )
  }
  return textBlock
}

function ItemListFold({ fold }: { fold: Fold }) {
  const hasHeader = Boolean(fold.header?.trim())
  const items = Array.isArray(fold.items)
    ? fold.items.filter((item) => item.header?.trim() || item.description?.trim())
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

function HeaderOnlyFold({ fold }: { fold: Fold }) {
  const hasHeader = Boolean(fold.header?.trim())
  if (!hasHeader && !fold.label?.trim()) return null

  return (
    <div className="max-w-[920px]">
      <FoldEyebrow label={fold.label} />
      {hasHeader && (
        <Heading as="h2" className={FOLD_H2_STATEMENT_CLASS}>
          {fold.header}
        </Heading>
      )}
    </div>
  )
}

function FoldSection({
  fold,
  fallbackAlt,
}: {
  fold: Fold
  fallbackAlt: string
}) {
  switch (fold.type) {
    case 'headerIntro':
      return <HeaderIntroFold fold={fold} fallbackAlt={fallbackAlt} />
    case 'featureBullets':
      return <FeatureBulletsFold fold={fold} fallbackAlt={fallbackAlt} />
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

export default function TechnologyTemplate({
  technology,
  locale,
}: TechnologyTemplateProps) {
  const eyebrow = UI_STRINGS['technology.heroCategory']
  const tagline = technology.tagline?.trim()
  const folds = Array.isArray(technology.folds) ? technology.folds : []

  return (
    <article>
      <Container width="full" className="pt-0">
        <div className={BAND_CLASS}>
          {/* Hero — text-only radial wash (eyebrow + H1 + optional tagline).
              Hero CTAs omitted (no schema-backed target). techLogo present in
              data but not placed in the desktop export hero -> not rendered.
              Breadcrumbs omitted visually; BreadcrumbList JSON-LD remains. */}
          <header
            className={cn(
              'bg-[radial-gradient(120%_60%_at_50%_0%,#0c1830_0%,#070D18_60%)]',
              BAND_PX_CLASS,
              'pt-[48px] pb-[8px] text-center lg:pt-[72px]',
            )}
          >
            <p className={cn(HERO_EYEBROW_CLASS, 'mb-[18px]')}>{eyebrow}</p>
            <Heading
              as="h1"
              size="h1"
              className="mx-auto max-w-[900px] text-[40px] font-semibold leading-[46px] tracking-[-1.6px] text-white lg:text-[64px] lg:leading-[68px] lg:tracking-[-2.4px]"
            >
              {technology.technologyName}
            </Heading>
            {tagline && (
              <p className="mx-auto mt-[22px] max-w-[680px] text-[19px] font-normal leading-[28.5px] tracking-[-0.08px] text-text-secondary">
                {tagline}
              </p>
            )}
          </header>

          {/* Folds — rendered in array order, one section per fold. */}
          <div className="pt-[56px] pb-[80px]">
            {folds.map((fold, index) => (
              <section
                key={fold._key ?? index}
                className={cn(BAND_PX_CLASS, 'py-[40px] first:pt-0 lg:py-[56px]')}
              >
                <FoldSection
                  fold={fold}
                  fallbackAlt={technology.technologyName}
                />
              </section>
            ))}
          </div>
        </div>
      </Container>
    </article>
  )
}
