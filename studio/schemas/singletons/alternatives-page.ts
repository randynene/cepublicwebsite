import { defineCollectionHub } from './_factories'

// /alternatives is a HUB, not a static page.
//
// It lists the same compareBlog documents as /compare, under a different frame:
// "Featured alternatives" and "All alternatives". Capturing it as prose produced
// an empty page, because there is almost no prose on it — it is a card grid.
//
// Two hubs over one collection is what the live site does, and both rank: Search
// Console has /alternatives at position 9.1 on 1,363 impressions and /compare at
// 25.9. The weaker-ranking one is the one we already had. An earlier redirect rule
// would have 301'd /alternatives into /compare and deleted the better page.
export default defineCollectionHub({
  name: 'alternativesHub',
  title: 'Alternatives Hub',
  route: '/alternatives',
  featuredTypes: ['compareBlog'],
})
