'use client'

import Script from 'next/script'

import { useConsent } from './consent-provider'

// Third-party scripts that may only load once the visitor has granted the
// matching category. Moved here out of <GlobalScripts>, where they used to load
// unconditionally on every page for every visitor.
//
// Google Consent Mode does not reach any of these vendors, so gating them by
// rendering is the only thing that actually stops them. next/script loads a
// script when its element mounts, so an unmounted <Script> makes no request at
// all - and Next guarantees it loads only once when it does appear.
//
// IDs live here rather than being imported from third-party-scripts.tsx: that
// module reads next/headers at the top level and cannot be pulled into a client
// component. Keep the two lists in step.

const LINKEDIN_PARTNER_ID = '4901289'
const HOTJAR_SITE_ID = 4985481
const FACEBOOK_PIXEL_ID = '160820827844254'
const HUBSPOT_PORTAL_ID = '22809822'

export function GatedScripts() {
  const { consent } = useConsent()

  // Undecided is not "no". Both read as "do not load", which is the same
  // outcome, and is why the null case needs no branch of its own.
  const analytics = consent?.analytics === true
  const marketing = consent?.marketing === true

  return (
    <>
      {/* MARKETING */}

      {marketing && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`_linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
(function(l) { if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]} var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script"); b.type = "text/javascript"; b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);`}
        </Script>
      )}

      {marketing && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FACEBOOK_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
      )}

      {/* HubSpot's tracker sets hubspotutk, which the lead forms read for source
        * attribution, so it is marketing rather than analytics. Expect HubSpot
        * attribution coverage to fall by roughly the share of visitors who
        * reject: that is the gate working, not a bug. */}
      {marketing && (
        <Script
          id="hubspot-tracking"
          src={`https://js.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`}
          strategy="afterInteractive"
        />
      )}

      {/* ANALYTICS */}

      {/* The US/GB country gate is retained from the original: Hotjar bills per
        * recorded session and CE only wants the two markets they sell into.
        * Consent is now an additional condition, not a replacement for it. */}
      {analytics && (
        <Script id="hotjar" strategy="afterInteractive">
          {`(function(){
if (window.VISITOR_COUNTRY !== "US" && window.VISITOR_COUNTRY !== "GB") return;
(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
h._hjSettings={hjid:${HOTJAR_SITE_ID},hjsv:6};
a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;
r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
})();`}
        </Script>
      )}
    </>
  )
}
