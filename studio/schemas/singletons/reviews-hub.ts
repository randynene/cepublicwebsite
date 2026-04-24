import { defineCollectionHub } from './_factories'

export default defineCollectionHub({
  name: 'reviewsHub',
  title: 'Reviews Hub',
  route: '/reviews',
  featuredTypes: ['review'],
})
