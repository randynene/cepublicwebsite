import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'cookiePolicyPage',
  title: 'Cookie Policy',
  route: '/legals/cookie-policy',
  description:
    'Singleton for /legals/cookie-policy. Net-new (Aug 2026) - there is no Webflow original, because the legacy site had no cookie notice. Body is a single richTextSection, same shape as privacyPolicyPage. The cookie table inside it must be kept in step with the vendors actually loaded by site/src/components/consent/gated-scripts.tsx; an inaccurate table is its own compliance problem.',
})
