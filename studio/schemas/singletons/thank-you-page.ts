import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'thankYouPage',
  title: 'Thank You',
  route: '/thank-you',
  description:
    'Singleton for /thank-you. The generic post-form-submission page. HubSpot forms redirect here, so it must exist at cutover or every form on the site ends on a 404.',
})
