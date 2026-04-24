import { defineCollectionHub } from './_factories'

export default defineCollectionHub({
  name: 'toolsHub',
  title: 'Tools Hub',
  route: '/tools',
  featuredTypes: ['tool'],
  descriptionRequired: true,
})
