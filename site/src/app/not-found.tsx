import type { Metadata } from 'next'

import { Container } from '@/components/ui/container'
import { Heading } from '@/components/ui/heading'
import { MegaMenuPillLabel } from '@/components/ui/mega-menu-pill-label'
import { PortableText } from '@/components/ui/portable-text'
import {
  fetchNotFoundPage,
  findCtaSection,
} from '@/lib/sanity/queries/not-found-page'
import { toInternalHref } from '@/lib/url'
import { UI_STRINGS } from '@/lib/ui-strings'

// MYGRATR-STATIC-1 Step 2 — 404 page, re-skinned to the dark/lime design
// system (22 Jul 2026). Was a plain STATIC-1 centered layout on the retired
// `primary-teal` button; now matches the sitewide hero pattern (radial wash,
// big lime "404", H1, body, lime CTA pill).
//
// Content still comes from the Sanity `notFoundPage` singleton (title,
// heroDescription, ctaSection). Returned HTTP status is 404 per the App
// Router convention; the explicit metadata.robots noindex belt-and-suspenders
// the framework default so it survives future changes and is visible in
// static analysis.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const HERO_BG =
  'bg-[radial-gradient(120%_60%_at_50%_0%,#0c1830_0%,#070D18_60%)]'

function NotFoundShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className={HERO_BG}>
      <Container
        as="section"
        width="narrow"
        className="flex min-h-[68vh] flex-col items-center justify-center py-[80px] text-center lg:py-[120px]"
      >
        <p className="mb-[8px] text-[110px] font-semibold leading-none tracking-[-4px] text-brand-primary lg:text-[150px]">
          {UI_STRINGS['notFound.code']}
        </p>
        {children}
      </Container>
    </main>
  )
}

function PrimaryCta({
  href,
  isExternal,
  label,
}: {
  href: string
  isExternal: boolean
  label: string
}) {
  return (
    <MegaMenuPillLabel
      as="a"
      href={href}
      external={isExternal}
      variant="pill-green"
      size="cta"
      leadingArrow
      label={label}
    />
  )
}

function FallbackPage() {
  return (
    <NotFoundShell>
      <Heading
        as="h1"
        size="h1"
        className="mb-[20px] text-[36px] font-semibold leading-[42px] tracking-[-1.2px] text-white lg:text-[52px] lg:leading-[58px] lg:tracking-[-1.8px]"
      >
        {UI_STRINGS['notFound.fallbackTitle']}
      </Heading>
      <p className="mb-[36px] max-w-[520px] text-[18px] font-normal leading-[28px] tracking-[-0.1px] text-text-secondary">
        {UI_STRINGS['notFound.fallbackBody']}
      </p>
      <PrimaryCta href="/" isExternal={false} label={UI_STRINGS['notFound.homeCta']} />
    </NotFoundShell>
  )
}

export default async function NotFound() {
  const page = await fetchNotFoundPage()
  if (!page) return <FallbackPage />

  const cta = findCtaSection(page)
  const ctaHref = cta ? toInternalHref(cta.buttonLink) : null
  const hasBody = Boolean(page.heroDescription && page.heroDescription.length > 0)

  return (
    <NotFoundShell>
      <Heading
        as="h1"
        size="h1"
        className="mb-[20px] text-[36px] font-semibold leading-[42px] tracking-[-1.2px] text-white lg:text-[52px] lg:leading-[58px] lg:tracking-[-1.8px]"
      >
        {page.title}
      </Heading>

      <div className="mb-[36px] max-w-[520px] text-[18px] font-normal leading-[28px] tracking-[-0.1px] text-text-secondary [&_a]:text-brand-primary [&_a]:underline [&_p]:mb-[12px] [&_p:last-child]:mb-0">
        {hasBody ? (
          <PortableText
            value={
              page.heroDescription as Parameters<typeof PortableText>[0]['value']
            }
          />
        ) : (
          <p>{UI_STRINGS['notFound.fallbackBody']}</p>
        )}
      </div>

      {cta && ctaHref ? (
        <div className="flex flex-col items-center gap-[16px]">
          {cta.heading ? (
            <Heading
              as="h2"
              size="h4"
              className="text-[22px] font-semibold leading-[28px] tracking-[-0.5px] text-white"
            >
              {cta.heading}
            </Heading>
          ) : null}
          {cta.description ? (
            <p className="max-w-[480px] text-[16px] leading-[24px] text-text-secondary">
              {cta.description}
            </p>
          ) : null}
          <PrimaryCta
            href={ctaHref.href}
            isExternal={ctaHref.isExternal}
            label={cta.buttonText}
          />
        </div>
      ) : (
        <PrimaryCta href="/" isExternal={false} label={UI_STRINGS['notFound.homeCta']} />
      )}
    </NotFoundShell>
  )
}
