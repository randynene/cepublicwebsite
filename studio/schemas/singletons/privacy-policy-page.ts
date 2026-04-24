import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'privacyPolicyPage',
  title: 'Privacy Policy',
  route: '/legals/privacy-policy',
  description:
    'Singleton for /legals/privacy-policy. Migrates from Webflow `Legal pages` collection (1 item); legals-content becomes a single richTextSection in sections (§7.14).',
})
