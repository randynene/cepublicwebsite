import { CHROME_CONTENT_BAND } from '@/components/layout/chrome-band'
import { cn } from '@/components/ui/_utils/cn'
import { UI_STRINGS } from '@/lib/ui-strings'
import { fetchFooter } from '@/lib/sanity/queries/footer'

import { FOOTER_PAD_MOBILE_X, FOOTER_PAD_Y, FOOTER_SHELL } from './_parts'
import { FooterBottomBar } from './bottom-bar'
import { FooterLinkGrid } from './link-grid'
import { FooterSubscribe } from './subscribe'
import { FooterTopCta } from './top-cta'
import type { Locale } from '@/lib/locale-path'

// MYGRATR-STATIC-3 Step 5 — Footer rebuild (Footer.html export + topCtaBlock).

export default async function Footer({ locale }: { locale: Locale }) {
  const data = await fetchFooter()

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
      <FooterTopCta block={data.topCtaBlock} locale={locale}/>
      {/* 64px to match CHROME_H_PAD and the top-CTA band above; `lg:px-16`
          resolved to 128px under this project's 0.5rem spacing scalar. */}
      <div className={cn(FOOTER_PAD_MOBILE_X, 'lg:px-[64px]', FOOTER_PAD_Y)}>
        <div className={CHROME_CONTENT_BAND}>
          <FooterLinkGrid sections={data.sections} talentLocations={data.talentLocations} locale={locale}/>
          <FooterSubscribe subscribe={data.subscribe} />
          <FooterBottomBar bottomBar={data.bottomBar} locale={locale}/>
        </div>
      </div>
    </footer>
  )
}
