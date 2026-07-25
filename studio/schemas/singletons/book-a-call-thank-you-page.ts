import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'bookACallThankYouPage',
  title: 'Book A Call Thank You',
  route: '/book-a-call-thank-you',
  description:
    'Singleton for /book-a-call-thank-you. Distinct from /book-a-call-confirmed - both exist on the live site with different copy, and both are redirect targets, so neither can be collapsed into the other.',
})
