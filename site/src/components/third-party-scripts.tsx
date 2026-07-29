import Script from 'next/script'

// Global third-party scripts confirmed in audit-output/ce-scripts.json.
// Container/partner/measurement IDs come from the audit summary — never
// hardcode a guessed value. If an ID is unconfirmed, render null.
//
// GA4 is loaded via GTM (G-2Q22ZM5PLY) — do not add a separate GA4 tag.
// Calendly is loaded globally for scaffold simplicity; TEMPLATE-* may
// optimise to load only on Book A Call pages.

const GTM_ID = 'GTM-WL45TCTW'
const LINKEDIN_PARTNER_ID = '4901289'
const HOTJAR_SITE_ID = 4985481
const CLARA_WORKSPACE_ID = '09aa62df-5af6-4cec-b565-c335e907327d'
const FACEBOOK_PIXEL_ID = '160820827844254'
const HUBSPOT_PORTAL_ID = '22809822'
const MARKER_PROJECT_ID = '6a607cb9bba82be8b774fc61'
const GEOTARGETLY_SRC =
  'https://g10498469755.co/gr?id=-OJz6mUkL51tX4CyQPmd&refurl=https://www.google.com'

// Marker.io is a review/bug-report widget for the staging review waves — it must
// NOT render for real visitors on the live domain. This mirrors robots.ts: the
// real site is the one whose serving host matches NEXT_PUBLIC_CANONICAL_HOST
// (only set on cloudemployee.io at cutover). Everywhere else (staging, previews)
// is "not the real site", so the widget shows there.
function isCanonicalProductionSite(): boolean {
  const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST
  let servingHost: string | null = null
  try {
    servingHost = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').host
  } catch {
    servingHost = null
  }
  return !!canonicalHost && !!servingHost && canonicalHost === servingHost
}

// GeoTargetly — must fire before render to redirect at the edge.
// Inline strategy="beforeInteractive" works only inside the root layout.
export function GeoTargetlyScript() {
  return (
    <Script
      id="geotargetly"
      src={GEOTARGETLY_SRC}
      strategy="beforeInteractive"
    />
  )
}

// Google Tag Manager — head + body snippet pair.
// GA4 is fired through GTM, not loaded directly here.
export function GtmHeadScript() {
  return (
    <Script id="gtm-head" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  )
}

export function GtmNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}

// Remaining global scripts. Each renders only when its identifier is
// confirmed from audit output.
export function GlobalScripts({
  // ASK-CLARA P1: /ask IS the Clara conversation, full-page. Loading the floating
  // widget there would offer a second, separate Clara chat on the same screen and
  // park its launcher on top of the composer. Only the chat widget is skipped -
  // GTM, LinkedIn, Hotjar, Facebook and HubSpot tracking all still load, so the
  // page is measured like every other.
  suppressChatWidget = false,
}: {
  suppressChatWidget?: boolean
} = {}) {
  // Off on the real live domain, on everywhere else (staging review waves).
  const showMarker = !isCanonicalProductionSite()

  return (
    <>
      {showMarker && (
        <Script id="marker-io" strategy="afterInteractive">
          {`window.markerConfig = { project: '${MARKER_PROJECT_ID}', source: 'snippet' };
!function(e,r,a){if(!e.__Marker){e.__Marker={};var t=[],n={__cs:t};["show","hide","isVisible","capture","cancelCapture","unload","reload","isExtensionInstalled","setReporter","clearReporter","setCustomData","on","off"].forEach(function(e){n[e]=function(){var r=Array.prototype.slice.call(arguments);r.unshift(e),t.push(r)}}),e.Marker=n;var s=r.createElement("script");s.async=1,s.src="https://edge.marker.io/latest/shim.js";var i=r.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i)}}(window,document);`}
        </Script>
      )}

      {LINKEDIN_PARTNER_ID && (
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

      {CLARA_WORKSPACE_ID && !suppressChatWidget && (
        <Script
          id="clara-chat"
          src="https://clara.cloudemployee.io/widget.js"
          data-workspace-id={CLARA_WORKSPACE_ID}
          strategy="afterInteractive"
        />
      )}

      {HOTJAR_SITE_ID && (
        <Script id="hotjar" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
h._hjSettings={hjid:${HOTJAR_SITE_ID},hjsv:6};
a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;
r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      )}

      {FACEBOOK_PIXEL_ID && (
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

      {HUBSPOT_PORTAL_ID && (
        <Script
          id="hubspot-tracking"
          src={`https://js.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`}
          strategy="afterInteractive"
        />
      )}

      <Script
        id="gsap"
        src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
        strategy="afterInteractive"
      />

      <Script
        id="swiper"
        src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"
        strategy="afterInteractive"
      />

      <Script
        id="finsweet-attributes"
        src="https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js"
        strategy="afterInteractive"
        type="module"
      />

      {/* Calendly is loaded globally for scaffold simplicity. TEMPLATE-BAC
          may scope to Book A Call pages once those templates exist. */}
      <Script
        id="calendly"
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />

      {/* Vector Tag, Ahrefs Analytics, and Cloudflare Insights are present
          in audit but not configured with tracking IDs from CE — left out
          of scaffold. CONTENT-1 confirms whether to migrate them. */}
    </>
  )
}
