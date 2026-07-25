import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'thankYouNowBookACallPage',
  title: 'Thank You - Now Book A Call',
  route: '/thank-you-now-book-a-call',
  description:
    'Singleton for /thank-you-now-book-a-call. Same copy as /thank-you-for-your-message on the live site, but a separate URL and a separate redirect target, so it stays a separate document.',
})
