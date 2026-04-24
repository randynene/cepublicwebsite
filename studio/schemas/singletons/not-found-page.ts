import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'notFoundPage',
  title: '404 Page',
  route: '/404',
  description:
    'Singleton for /404. Delivery mechanism (static generation vs ISR vs hardcoded fallback) deferred to SCAFFOLD-1 — Next.js App Router not-found page cannot make async data fetches in the standard pattern (§6 of brief).',
})
