// OG override convention for TEMPLATE-* phases:
//   Any generateMetadata() that has an openGraphImage field from Sanity
//   should override the fallback. Pattern:
//     openGraph: {
//       images: doc.openGraphImage
//         ? [urlFor(doc.openGraphImage).width(1200).height(630).url()]
//         : ['/og-default.png'],
//     }
//   /og-default.png is a 1×1 placeholder — Seb replaces with the real
//   1200×630 brand asset before launch.

import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from 'next/font/google'
import { draftMode, headers } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'

import { env } from '@/lib/env'
import { isAskPath } from '@/lib/ask/routes'
import Footer from '@/components/layout/footer'
import Nav from '@/components/layout/nav'
import { MotionReady } from '@/components/motion/motion-ready'
import { SanityLive } from '@/lib/sanity/live'
import { getLocaleFromPath } from '@/lib/locale'
import { SiteJsonLd } from '@/lib/seo/site-json-ld'
import {
  GeoTargetlyScript,
  GlobalScripts,
  GtmHeadScript,
  GtmNoScript,
} from '@/components/third-party-scripts'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'

import './globals.css'

// D2 token re-extract: fonts swapped to the new design (spec §2). Inter for
// UI / headings / body; Source Serif 4 Italic for the lime accent word +
// process numerals only (italic-only load). Old Poppins (teal era) removed.
// Material Symbols icon font is handled separately (see <head> below).
const inter = Inter({
  subsets: ['latin'],
  // 800 added for the For Engineers page big stats (design uses Inter 800).
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

// Source Serif 4 is loaded italic-only (D2 spec §2): it is used exclusively
// for the lime accent word in headings + the process numerals. All white
// display/heading text is Inter semibold (sans), not serif.
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['italic'],
  variable: '--font-source-serif',
  display: 'swap',
})

// ASK-CLARA P1 — the /ask design uses IBM Plex Mono for its micro-labels
// ("WHILE WE TALK", "TECH STACK", the elapsed-time readout). Nothing else on the
// site loads it, so it is scoped to the `font-plex` utility (tokens.css) rather
// than being made the global `font-mono`, which would restyle every <code> block
// in portable text.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'Cloud Employee',
    template: '%s | Cloud Employee',
  },
  robots: { index: true, follow: true },
  openGraph: {
    images: ['/og-default.png'],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isDraftMode = (await draftMode()).isEnabled
  const pathname = (await headers()).get('x-pathname') ?? '/'
  const lang = getLocaleFromPath(pathname)
  // ASK-CLARA — /ask keeps the standard sitewide header (Jake, 29 Jul: "the same
  // header that is on every single page"), which supersedes the minimal
  // logo-plus-CTA chrome the execution plan originally specified.
  //
  // The footer stays off. /ask is a full-height app surface that sizes itself to
  // the viewport below the sticky header; a footer underneath would add a second
  // scroll region with nothing above it worth scrolling past. App Router cannot
  // subtract a parent's chrome from a nested layout, so the opt-out is decided
  // here, off the pathname the middleware already surfaces.
  const isAskPage = isAskPath(pathname)

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <GeoTargetlyScript />
        <GtmHeadScript />
        {/* STATIC-3 — Material Symbols web font for discriminated icon
         * shape (`source: 'material-font'`) used by the Resources
         * mega-menu (download / calculate / video_library /
         * event_upcoming, plus any future ligature Seb picks in
         * Studio). CDN load for Step 1 substrate; Risk R#2 measures
         * perf at Step 4 gate — self-host the 4-glyph subset if TTFB
         * regresses or Lighthouse Performance drops below 80. */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Sitewide motion-layer gate — see globals.css motion-layer block.
         * Adds `motion-ready` to <html> on mount so reveal/pulse CSS never
         * activates before hydration or without JS. Renders no DOM. */}
        <MotionReady />
        <SiteJsonLd />
        <GtmNoScript />
        {/* Layout-root providers per COMPONENTS.md front-matter §1.
         * TooltipProvider wraps once for the entire tree; delayDuration=300
         * overrides Radix's 700ms default. ToastProvider hosts the toast
         * stack; ToastViewport renders the fixed-position container. */}
        <ToastProvider>
          <TooltipProvider delayDuration={300}>
            {/* `lang` is the locale derived from the request path. The chrome
              * needs it too: without it the header, mega-menus, announcement bar
              * and footer render US links on every UK page, throwing the visitor
              * out of their locale on any nav click and pointing ~290 UK pages'
              * navigation at the US cluster. */}
            <Nav locale={lang} />
            {children}
            {!isAskPage && <Footer locale={lang} />}
          </TooltipProvider>
          <ToastViewport />
        </ToastProvider>
        {/* SanityLive refresh helpers use next/dynamic({ ssr: false }) and emit
         * BAILOUT_TO_CLIENT_SIDE_RENDERING on published pages when left at
         * library defaults. Scope focus/reconnect to draft mode only; live
         * EventSource revalidation still runs on published content. */}
        <SanityLive
          refreshOnFocus={isDraftMode}
          refreshOnReconnect={isDraftMode}
        />
        {isDraftMode && <VisualEditing />}
        <GlobalScripts suppressChatWidget={isAskPage} />
      </body>
    </html>
  )
}
