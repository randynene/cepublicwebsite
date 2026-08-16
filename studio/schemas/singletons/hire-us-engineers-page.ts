import { defineHireEngineersMarketPage } from './_hire-engineers-market-factory'

// hireUsEngineersPage singleton.
//
// Backs BOTH /services/hire-us-engineers (en-US) and
// /uk/services/hire-us-engineers (en-GB): market and locale are different
// axes, so one document serves the US-market page to both audiences.
//
// Seeded from site/src/components/templates/hire-engineers-market/content.us.ts,
// which stays as the fallback when this document is absent or fails validation.
export default defineHireEngineersMarketPage({
  name: 'hireUsEngineersPage',
  title: 'Hire US Engineers Page',
  market: 'us',
})
