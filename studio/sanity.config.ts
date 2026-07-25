import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { defineLocations, presentationTool } from 'sanity/presentation'

import { schemaTypes } from './schemas'
import { deskStructure, SINGLETON_TYPES } from './schemas/structure'

// Hosted Studio reads this at deploy time. Staging is the source of truth
// for the designed site until cloudemployee.io cutover.
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_URL_ORIGIN ??
  process.env.SANITY_STUDIO_PREVIEW_URL ??
  'https://staging.jakevibes.dev'

const projectId = process.env.SANITY_PROJECT_ID || 'lzbhll1u'
const dataset = process.env.SANITY_DATASET || 'production'

export default defineConfig({
  name: 'mygratr',
  title: 'Cloud Employee',
  projectId,
  dataset,

  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool(),
    presentationTool({
      resolve: {
        locations: {
          homePage: defineLocations({
            select: { title: 'title' },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Home',
                  href: '/',
                },
              ],
            }),
          }),
        },
      },
      previewUrl: {
        origin: previewOrigin,
        previewMode: { enable: '/api/draft-mode/enable' },
        draftMode: { enable: '/api/draft-mode/enable' },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !SINGLETON_TYPES.includes(schemaType)),
  },

  document: {
    actions: (input, context) =>
      SINGLETON_TYPES.includes(context.schemaType)
        ? input.filter(({ action }) => action !== 'duplicate' && action !== 'delete')
        : input,
  },
})
