import type { ConsentState } from '@/lib/consent/types'

// Google Consent Mode v2 default state.
//
// THIS MUST RENDER BEFORE <GtmHeadScript />. It is a raw <script>, not
// next/script, for exactly that reason: next/script has no strategy that
// guarantees "synchronously, right here, before the next tag", and a consent
// default that lands after the tag manager it is supposed to gate has done
// nothing at all. VisitorCountryScript upstream uses a raw tag for the same
// ordering reason.
//
// `wait_for_update` gives our own banner a moment to push an `update` before
// GTM decides how to behave on the first pageview, so a returning visitor who
// already accepted does not lose that first hit to a race.
//
// Consent Mode alone does NOT cover Hotjar, Meta, LinkedIn or HubSpot - none of
// them read Google's signals. Those are hard-gated in GatedScripts instead.
// Removing that gate on the assumption that "consent mode handles it" would
// silently reopen the hole this whole change exists to close.
export function ConsentModeScript({ consent }: { consent: ConsentState | null }) {
  const analytics = consent?.analytics ? 'granted' : 'denied'
  const marketing = consent?.marketing ? 'granted' : 'denied'

  // No visitor-supplied data reaches this string: both values are picked from
  // two literals above, so there is nothing here to inject.
  const js = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{'ad_storage':'${marketing}','ad_user_data':'${marketing}','ad_personalization':'${marketing}','analytics_storage':'${analytics}','functionality_storage':'granted','security_storage':'granted','wait_for_update':500});`

  return <script id="consent-mode-default" dangerouslySetInnerHTML={{ __html: js }} />
}
