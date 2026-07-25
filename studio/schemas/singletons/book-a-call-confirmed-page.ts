import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'bookACallConfirmedPage',
  title: 'Book A Call Confirmed',
  route: '/book-a-call-confirmed',
  description:
    'Singleton for /book-a-call-confirmed. Post-booking confirmation. A visitor only reaches it after booking, but it must exist: the URL is live and Calendly redirects to it.',
})
