import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'bookACallPage',
  title: 'Book A Call',
  route: '/book-a-call',
  description:
    'Singleton for /book-a-call. The hub above the /book-a-call/<slug> per-person pages: a general "schedule a call with us" page with a Calendly embed, not a listing of the individual reps.',
})
