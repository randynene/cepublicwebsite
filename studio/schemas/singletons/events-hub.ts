import { defineCollectionHub } from './_factories'

export default defineCollectionHub({
  name: 'eventsHub',
  title: 'Events Hub',
  route: '/events',
  featuredTypes: ['event'],
  descriptionRequired: true,
})
