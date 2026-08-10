// HAND-MAINTAINED. Backlink reclaims approved by Jake on 10 Aug 2026 from the
// SEO session S8 decision list (`docs/seo/S8_BACKLINK_DECISION_LIST.md`).
//
// These are dead URLs that other sites still link to. Every one of them was
// already a 404 or a redirect-to-hub BEFORE the 3 Aug cutover: CE unpublished
// the posts years ago and, where a rule exists at all, pointed it at /blog.
// This is inherited Webflow link rot, not migration damage.
//
// WHY A HUB REDIRECT IS NOT GOOD ENOUGH. Sending a specific article to a
// general hub tells Google the content is gone, so it treats the redirect as a
// soft 404 and passes nothing. The fix is not "a redirect", it is "a redirect
// to a page that genuinely covers the same subject". Every destination below
// was curl-confirmed a live 200 on production before it was written here, and
// S9's rule is that an honest 404 beats a redirect to a page that does not
// answer the visitor's reason for clicking.
//
// WHY THIS FILE IS SPREAD FIRST IN ./index.ts. `/blog/it-outsourcing/
// why-philippines-for-business` already has a generated rule pointing at /blog,
// emitted into ./webflow-redirects.ts from data/webflow/webflow-redirects.csv.
// Next.js fires the FIRST matching rule, so a reclaim placed after the
// generated table would be shadowed and silently do nothing. Spreading this
// file ahead of the generated rules is what makes the override real. The stale
// /blog rule stays where it is, unreachable and harmless, because
// webflow-redirects.ts is regenerated from the CSV and hand-edits there are
// destroyed on the next extract.
//
// Rows deliberately NOT here, so nobody re-litigates them later:
//   - `/r/remote-r-developer` (DR 53). S8 offered it conditionally, on there
//     being an R page to point at. There is not: /technology/r-developers,
//     /technology/r and /technology/r-programming are all 404 and the live
//     sitemap has no R page. Accepted as a loss.
//   - The three WRITE/RESTORE rows (coding-resources DR 76, the NDA post
//     DR 75, the GitHub-portfolio post DR 73). No honest target exists, so the
//     only non-soft-404 reclaim is to publish the content. Open decision.
import type { Redirect } from 'next/dist/lib/load-custom-routes'

export const backlinkReclaims: Redirect[] = [
  // 20 referring domains, DR 76. The biggest reclaim in the set that has an
  // honest live target. Overrides the generated rule to /blog. Both the
  // category-less and category-prefixed Webflow forms of this URL exist in the
  // export; only the category-prefixed one carries the links.
  {
    source: '/blog/it-outsourcing/why-philippines-for-business',
    destination:
      '/hiring-tips/hiring-developers-in-the-philippines-cost-quality-culture-fit-for-outsourced-software-development',
    permanent: true,
  },

  // DR 30. Same subject, same target as above: an India-versus-Philippines
  // outsourcing comparison belongs on the Philippines hiring article.
  // NOT /why-the-philippines, which 308s to /how-it-works and would rebuild a
  // chain (S8 flagged this explicitly).
  {
    source:
      '/blog/it-outsourcing/neck-and-neck-the-it-outsourcing-rivalry-between-india-and-the-philippines',
    destination:
      '/hiring-tips/hiring-developers-in-the-philippines-cost-quality-culture-fit-for-outsourced-software-development',
    permanent: true,
  },

  // DR 37. A how-to-hire-React-Native article to the React Native hire page.
  {
    source: '/blog/it-outsourcing/how-to-hire-react-native-developer-step-by-step-guide',
    destination: '/technology/react-native-developers',
    permanent: true,
  },

  // DR 59. AUTH-06's cleanest mechanical win: an exact topical match, and the
  // source has no generated rule at all, so it was serving a bare 404.
  {
    source: '/web-developer',
    destination: '/services/web-developers',
    permanent: true,
  },
]
