import { defineCollectionHub } from './_factories'

export default defineCollectionHub({
  name: 'downloadsHub',
  title: 'Downloads Hub',
  route: '/downloads',
  featuredTypes: ['download'],
  descriptionRequired: true,
})
