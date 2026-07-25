import { defineStaticPage } from './_factories'

export default defineStaticPage({
  name: 'referralsPage',
  title: 'Referrals',
  route: '/referrals',
  description:
    'Singleton for /referrals, the Client Referral Program page. A design exists at docs/raw-html/Referral.html, so this one gets built against the design rather than cloned from live.',
})
