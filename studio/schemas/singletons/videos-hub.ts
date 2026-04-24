import { defineCollectionHub } from './_factories'

export default defineCollectionHub({
  name: 'videosHub',
  title: 'Videos Hub',
  route: '/videos',
  featuredTypes: ['video'],
  descriptionRequired: true,
})
