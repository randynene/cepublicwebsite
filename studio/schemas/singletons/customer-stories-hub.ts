import { defineCollectionHub } from './_factories'

export default defineCollectionHub({
  name: 'customerStoriesHub',
  title: 'Customer Stories Hub',
  route: '/customer-stories',
  featuredTypes: ['customerStory'],
})
