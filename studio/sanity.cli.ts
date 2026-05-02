import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_PROJECT_ID || 'lzbhll1u',
    dataset: process.env.SANITY_DATASET || 'production',
  },
  // Hosted Studio at https://mygratr-cloudemployee.sanity.studio/
  // First deploy: 2026-05-02 (CONTENT-1D Step 0a). appId returned by the
  // sanity CLI; pinning it here so subsequent `sanity deploy` runs skip
  // the application-id prompt.
  deployment: {
    appId: 'd5ohi4btklbv9gr4ew7da04j',
  },
})
