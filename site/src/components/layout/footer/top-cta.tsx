import type { ReactNode } from 'react'

import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { cn } from '@/components/ui/_utils/cn'
import { UI_STRINGS } from '@/lib/ui-strings'
import type { TopCtaBlock } from '@/lib/sanity/queries/footer'
import type { Locale } from '@/lib/locale-path'
import { toInternalHref } from '@/lib/url'

import { FOOTER_DIVIDER, warnMissingFooterUrl } from './_parts'

// Video.html closing CTA + footer reference — 2-col band on #0A1628.

const BODY_MUTED_CLASS =
  'text-[16px] font-normal leading-[25px] tracking-[-0.08px] text-text-secondary'

function accentHeadingWord(heading: string): ReactNode {
  const match = heading.match(/^(.*?)(\bhire\b)([\s\S]*)$/i)
  if (!match) return heading
  const [, before, hire, after] = match
  return (
    <>
      {before}
      <span className="font-serif italic font-normal text-brand-primary">{hire}</span>
      {after}
    </>
  )
}

function FooterCtaPill({
  label,
  url,
  variant,
  context,
  locale,
}: {
  label?: string | null
  url?: string | null
  variant: 'primary' | 'secondary'
  context: string
  locale: Locale
}) {
  if (!label || !url) {
    if (label) warnMissingFooterUrl(context, label)
    return null
  }
  const { href, isExternal } = toInternalHref(url, locale)

  if (variant === 'primary') {
    return (
      <MegaMenuPillLabel
        as="a"
        href={href}
        variant="pill-green"
        size="cta"
        leadingArrow
        leadingGlyph="→"
        label={label}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      />
    )
  }

  return (
    <MegaMenuPillLabel
      as="a"
      href={href}
      variant="pill-outline-dark"
      size="cta"
      label={label}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    />
  )
}

export function FooterTopCta({ block, locale }: { block: TopCtaBlock; locale: Locale }) {
  if (block?.enabled === false) return null
  if (!block?.heading && !block?.primaryCta?.label && !block?.secondaryCta?.label) {
    return null
  }

  return (
    <section
      aria-labelledby="footer-top-cta-heading"
      className="border-t border-[#22314D] bg-[#0A1628]"
    >
      <div className="mx-auto max-w-[1280px] px-[22px] py-[48px] sm:px-[32px] lg:px-[64px] lg:py-[80px]">
        <div className="grid grid-cols-1 gap-[48px] lg:grid-cols-2 lg:items-center">
          <div>
            {block.heading ? (
              <h2
                id="footer-top-cta-heading"
                className="mb-[22px] text-[34px] font-semibold leading-[38px] tracking-[-1.2px] text-white sm:text-[46px] sm:leading-[50px] sm:tracking-[-1.4px] lg:text-[58px] lg:leading-[61px] lg:tracking-[-1.7px]"
              >
                {accentHeadingWord(block.heading)}
              </h2>
            ) : null}
            <p className={cn(BODY_MUTED_CLASS, 'max-w-[520px]')}>
              {UI_STRINGS['footer.topCtaDescription']}
            </p>
          </div>

          <div>
            <div className="mb-[20px] flex flex-wrap gap-[14px]">
              <FooterCtaPill
                label={block.primaryCta?.label}
                url={block.primaryCta?.url}
                variant="primary"
                context="topCtaBlock.primaryCta"
locale={locale}/>
              <FooterCtaPill
                label={block.secondaryCta?.label}
                url={block.secondaryCta?.url}
                variant="secondary"
                context="topCtaBlock.secondaryCta"
locale={locale}/>
            </div>
            {block.statRow ? (
              <p className="text-[14px] font-semibold leading-none tracking-[-0.08px] text-brand-primary">
                {block.statRow}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className={cn('mx-auto max-w-[1280px] px-[22px] sm:px-[32px] lg:px-[64px]')}>
        <div className={FOOTER_DIVIDER} aria-hidden="true" />
      </div>
    </section>
  )
}
