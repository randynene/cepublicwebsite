import { headers } from 'next/headers'

import { CHROME_CONTENT_BAND } from '@/components/layout/chrome-band'
import { cn } from '@/components/ui/_utils/cn'
import { isBookACallPath, isForDevelopersPath } from '@/lib/ask/routes'
import { UI_STRINGS } from '@/lib/ui-strings'
import { fetchFooter } from '@/lib/sanity/queries/footer'

import { FOOTER_PAD_MOBILE_X, FOOTER_PAD_Y, FOOTER_SHELL } from './_parts'
import { FooterBottomBar } from './bottom-bar'
import { FooterLinkGrid } from './link-grid'
import { FooterTopCta } from './top-cta'
import type { Locale } from '@/lib/locale-path'

// MYGRATR-STATIC-3 Step 5 — Footer rebuild (Footer.html export + topCtaBlock).
// The newsletter subscribe block was retired Aug 2026: CE is not using the
// HubSpot newsletter form any more. `footer.subscribe` is still in the schema
// and still populated in the dataset, just no longer read.

export default async function Footer({ locale }: { locale: Locale }) {
  const data = await fetchFooter()
  // Book-a-call is already the booking surface; for-developers is a talent page
  // that ends on "View Live jobs". The "Ready to hire…" band is a hiring CTA, so
  // it stays off both.
  const pathname = (await headers()).get('x-pathname') ?? '/'
  const showTopCta = !isBookACallPath(pathname) && !isForDevelopersPath(pathname)

  if (!data) {
    return (
      <footer role="contentinfo" className={FOOTER_SHELL}>
        <div className={cn(FOOTER_PAD_MOBILE_X, 'lg:px-[64px]', FOOTER_PAD_Y)}>
          <div className={CHROME_CONTENT_BAND}>
            <p className="text-[14px] text-[#7F8CA0]">
              {UI_STRINGS['footer.fallbackCopyright'].replace(
                '{year}',
                String(new Date().getFullYear()),
              )}
            </p>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer role="contentinfo" className={FOOTER_SHELL}>
      {showTopCta ? <FooterTopCta block={data.topCtaBlock} locale={locale} /> : null}
      {/* 64px to match CHROME_H_PAD and the top-CTA band above; `lg:px-16`
          resolved to 128px under this project's 0.5rem spacing scalar. */}
      <div className={cn(FOOTER_PAD_MOBILE_X, 'lg:px-[64px]', FOOTER_PAD_Y)}>
        <div className={CHROME_CONTENT_BAND}>
          <FooterLinkGrid sections={data.sections} talentLocations={data.talentLocations} locale={locale}/>
          <FooterBottomBar bottomBar={data.bottomBar} locale={locale}/>
        </div>
      </div>
    </footer>
  )
}
