import { defineHireEngineersMarketPage } from './_hire-engineers-market-factory'

// hireUkEngineersPage singleton.
//
// Backs BOTH /services/hire-uk-engineers (en-US) and
// /uk/services/hire-uk-engineers (en-GB): market and locale are different
// axes, so one document serves the UK-market page to both audiences.
//
// Seeded from site/src/components/templates/hire-engineers-market/content.uk.ts,
// which stays as the fallback when this document is absent or fails validation.
export default defineHireEngineersMarketPage({
  name: 'hireUkEngineersPage',
  title: 'Hire UK Engineers Page',
  market: 'uk',
})
