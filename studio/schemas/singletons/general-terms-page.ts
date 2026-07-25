import { defineStaticPage } from './_factories'

// The second of the two Webflow `Legal pages` items. It had no singleton and no
// route, and nothing had noticed: /legals/general-terms is a live 200 page in
// both locales, but it has no backlinks, no rankings and is absent from the
// sitemap — so the April crawl, the redirect export, Search Console and Ahrefs
// were all blind to it. It surfaced only when the parity corpus started reading
// the page list out of Webflow directly.
//
// Terms and conditions are not a page you want to discover you have lost.
export default defineStaticPage({
  name: 'generalTermsPage',
  title: 'General Terms',
  route: '/legals/general-terms',
  description:
    'Singleton for /legals/general-terms. Migrates from the Webflow `Legal pages` collection (slug: general-terms); legals-content becomes a single richTextSection in sections (§7.14), same shape as privacyPolicyPage.',
})
