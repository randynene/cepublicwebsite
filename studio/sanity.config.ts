import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

import { schemaTypes } from './schemas'
import { deskStructure, SINGLETON_TYPES } from './schemas/structure'

const projectId = process.env.SANITY_PROJECT_ID || 'lzbhll1u'
const dataset = process.env.SANITY_DATASET || 'production'

export default defineConfig({
  name: 'mygratr',
  title: 'Mygratr — Cloud Employee',
  projectId,
  dataset,

  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool(),
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
