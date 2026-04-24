import { defineCollectionHub } from './_factories'

export default defineCollectionHub({
  name: 'compareHub',
  title: 'Compare Hub',
  route: '/compare',
  featuredTypes: ['compareBlog'],
})
