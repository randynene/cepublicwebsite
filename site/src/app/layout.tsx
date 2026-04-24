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
import { Inter } from 'next/font/google'

import { env } from '@/lib/env'
import Footer from '@/components/layout/footer'
import Nav from '@/components/layout/nav'
import {
  GeoTargetlyScript,
  GlobalScripts,
  GtmHeadScript,
  GtmNoScript,
} from '@/components/third-party-scripts'

import './globals.css'

// CE uses Inter (300/400/500/600/700) — confirmed via WebFont.load call in
// audit-output/pages/home/content.json customHeadCode. Material Symbols
// icon font is also referenced; deferred to TEMPLATE-* once we know which
// templates need it.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <GeoTargetlyScript />
        <GtmHeadScript />
      </head>
      <body className="min-h-full flex flex-col">
        <GtmNoScript />
        <Nav />
        {children}
        <Footer />
        <GlobalScripts />
      </body>
    </html>
  )
}
