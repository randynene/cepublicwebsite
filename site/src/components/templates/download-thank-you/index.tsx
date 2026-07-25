import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { Link } from '@/components/ui/link'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { buildLocalePath, type Locale } from '@/lib/locale'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { DownloadAccess } from '@/types/sanity/documents/download-access'

export interface DownloadThankYouTemplateProps {
  download: DownloadAccess
  locale: Locale
}

// Success check glyph — decorative SVG (not a text literal, passes UI_STRINGS gate).
function CheckGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="h-[14px] w-[14px]"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5l3.2 3.2L13 4.5" />
    </svg>
  )
}

// Download (down-into-tray) glyph for the primary CTA leading circle.
function DownloadGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="h-[11px] w-[11px]"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2.5v7.5M4.5 6.5L8 10l3.5-3.5M3 13h10" />
    </svg>
  )
}

// Decorative file glyph in the resource card.
function FileGlyph() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-brand-primary/25 bg-brand-primary/10 text-brand-primary"
    >
      <svg
        className="h-[22px] w-[22px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
    </span>
  )
}

export default function DownloadThankYouTemplate({
  download,
  locale,
}: DownloadThankYouTemplateProps) {
  const resourcesHref = buildLocalePath('/downloads', locale)

  return (
    <article>
      <Container width="default" className="pt-[48px] pb-[96px] lg:pt-[72px]">
        <div className="mx-auto max-w-[640px]">
          <p className="mb-[18px] inline-flex items-center gap-[8px] text-[11.5px] font-semibold uppercase leading-none tracking-[1.68px] text-brand-primary">
            <CheckGlyph />
            {UI_STRINGS['downloadThankYou.eyebrow']}
          </p>

          <Heading
            as="h1"
            size="h1"
            className="mb-[22px] text-[40px] font-semibold leading-[44px] tracking-[-1.2px] text-white lg:text-[58px] lg:leading-[61px] lg:tracking-[-1.7px]"
          >
            {UI_STRINGS['downloadThankYou.heading']}
          </Heading>

          <p className="mb-[38px] max-w-[560px] text-[19px] font-normal leading-[28.5px] tracking-[-0.08px] text-text-secondary">
            {UI_STRINGS['downloadThankYou.message']}
          </p>

          <div className="mb-[30px] flex max-w-[560px] flex-col gap-[20px] rounded-[20px] border border-[#22314D] bg-[#101B30] p-[26px] sm:flex-row sm:items-center sm:gap-[24px]">
            <FileGlyph />
            <div className="min-w-0 flex-1">
              <p className="mb-[8px] text-[11px] font-semibold uppercase leading-none tracking-[1px] text-[#7F8CA0]">
                {UI_STRINGS['downloadThankYou.badge']}
              </p>
              <p className="text-[19px] font-semibold leading-[24.7px] tracking-[-0.3px] text-white">
                {download.name}
              </p>
            </div>
            <MegaMenuPillLabel
              as="a"
              href={download.downloadFileLink}
              external
              variant="pill-green"
              size="cta"
              leadingArrow
              leadingGlyph={<DownloadGlyph />}
              label={UI_STRINGS['downloadThankYou.downloadCta']}
              className="shrink-0 self-start sm:self-auto"
            />
          </div>

          <Link
            href={resourcesHref}
            className="inline-flex items-center gap-[8px] text-[15px] font-semibold leading-none text-brand-primary transition-colors hover:text-brand-primary/90"
          >
            {UI_STRINGS['downloadThankYou.backLink']}
            <svg
              aria-hidden="true"
              className="h-[12px] w-[12px]"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </Container>
    </article>
  )
}
