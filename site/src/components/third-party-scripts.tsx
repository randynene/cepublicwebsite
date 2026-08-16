import { headers } from 'next/headers'
import Script from 'next/script'

import { isCanonicalSite } from '@/lib/canonical-host'

// Global third-party scripts confirmed in audit-output/ce-scripts.json.
// Container/partner/measurement IDs come from the audit summary — never
// hardcode a guessed value. If an ID is unconfirmed, render null.
//
// GA4 is loaded via GTM (G-2Q22ZM5PLY) — do not add a separate GA4 tag.
// Calendly is loaded globally for scaffold simplicity; TEMPLATE-* may
// optimise to load only on Book A Call pages.

// CONSENT (Aug 2026): LinkedIn, Hotjar, Facebook and HubSpot moved OUT of this
// module to src/components/consent/gated-scripts.tsx, where they render only
// once the visitor has granted the matching category. Their IDs moved with
// them. Do not reinstate them here - anything mounted in this file loads for
// everyone, unconditionally, which is exactly what PECR reg 6 forbids for
// non-essential cookies.
//
// GTM stays here and still loads for everyone: its tags are held by Google
// Consent Mode v2, defaulted to denied in <ConsentModeScript /> before this
// snippet runs. See site/src/components/consent/consent-mode-script.tsx.
const GTM_ID = 'GTM-WL45TCTW'
const CLARA_WORKSPACE_ID = '09aa62df-5af6-4cec-b565-c335e907327d'
const MARKER_PROJECT_ID = '6a607cb9bba82be8b774fc61'

// `window.VISITOR_COUNTRY` — the visitor's two-letter country code, exposed to
// client scripts. Read by the Hotjar gate below, exactly as on the live site.
//
// On Webflow this came from a Cloudflare Worker (`country-check`) that injected the
// value off Cloudflare's CF-IPCountry header. That Worker only runs on PROXIED
// traffic, and Vercel requires the Cloudflare proxy to be OFF for its own records,
// so the Worker stops firing at cutover. Vercel supplies the same information
// natively in `x-vercel-ip-country`, so we emit the tag ourselves and drop the
// dependency on Cloudflare entirely.
//
// "XX" mirrors the Worker's fallback for an unknown country.
export async function VisitorCountryScript() {
  const country = (await headers()).get('x-vercel-ip-country') ?? 'XX'
  // Country codes are two ASCII letters. Anything else is not going in a script tag.
  const safe = /^[A-Z]{2}$/.test(country) ? country : 'XX'
  return <script dangerouslySetInnerHTML={{ __html: `window.VISITOR_COUNTRY="${safe}"` }} />
}

// GeoTargetly is GONE. Session S5 (Aug 2026) replaced it with a server-side
// decision in site/src/proxy.ts, off the same x-vercel-ip-country header
// VisitorCountryScript reads above. See docs/seo/GEO_ROUTING.md section 4.7.
//
// What left with it: a <style>body{opacity:0.0 !important;}</style> injected
// into <head> before anything was known about the visitor, and a hardcoded
// 5,000 ms wait before visibility was restored whenever a redirect fired. Every
// visitor from every country paid that, and the vendor's own Googlebot bypass
// did not spare crawlers because the hide was already in the document by the
// time the bypass was evaluated. Do not reintroduce a body-hide here.
//
// VisitorCountryScript stays. It is a separate thing and still gates Hotjar.

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
export async function GlobalScripts({
  // ASK-CLARA P1: /ask IS the Clara conversation, full-page. Loading the floating
  // widget there would offer a second, separate Clara chat on the same screen and
  // park its launcher on top of the composer. Only the chat widget is skipped -
  // GTM, LinkedIn, Hotjar, Facebook and HubSpot tracking all still load, so the
  // page is measured like every other.
  suppressChatWidget = false,
}: {
  suppressChatWidget?: boolean
} = {}) {
  // Marker.io is a review/bug-report widget for the staging review waves - it must
  // NOT render for real visitors on the live domain. Off on the real live domain,
  // on everywhere else (staging, previews). This used to compare two build-time
  // env vars to each other and got the answer wrong on www.cloudemployee.io,
  // showing paying customers a bug-report button; it now shares robots.ts's
  // request-host check.
  const showMarker = !(await isCanonicalSite())

  return (
    <>
      {showMarker && (
        <Script id="marker-io" strategy="afterInteractive">
          {`window.markerConfig = { project: '${MARKER_PROJECT_ID}', source: 'snippet' };
!function(e,r,a){if(!e.__Marker){e.__Marker={};var t=[],n={__cs:t};["show","hide","isVisible","capture","cancelCapture","unload","reload","isExtensionInstalled","setReporter","clearReporter","setCustomData","on","off"].forEach(function(e){n[e]=function(){var r=Array.prototype.slice.call(arguments);r.unshift(e),t.push(r)}}),e.Marker=n;var s=r.createElement("script");s.async=1,s.src="https://edge.marker.io/latest/shim.js";var i=r.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i)}}(window,document);`}
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

      {/* Hotjar, Facebook Pixel and HubSpot tracking used to sit here. They are
        * now in consent/gated-scripts.tsx. Hotjar's US/GB country gate moved
        * with it and still applies on top of consent. */}

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
