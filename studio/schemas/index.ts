import type { SchemaTypeDefinition } from 'sanity'

import { objectTypes } from './objects'

export const schemaTypes: SchemaTypeDefinition[] = [...objectTypes]
