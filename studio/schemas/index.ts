import type { SchemaTypeDefinition } from 'sanity'

import { documentTypes } from './documents'
import { globalTypes } from './globals'
import { objectTypes } from './objects'
import { singletonTypes } from './singletons'

export const schemaTypes: SchemaTypeDefinition[] = [
  ...objectTypes,
  ...documentTypes,
  ...singletonTypes,
  ...globalTypes,
]
