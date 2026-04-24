import type { SchemaTypeDefinition } from 'sanity'

import { documentTypes } from './documents'
import { objectTypes } from './objects'
import { singletonTypes } from './singletons'

export const schemaTypes: SchemaTypeDefinition[] = [
  ...objectTypes,
  ...documentTypes,
  ...singletonTypes,
]
