// Sanity schema registry — populated in SCHEMA-1 Step 6.
// Every document/singleton/global/object schema file default-exports a
// defineType() result; this file collects them into a single array.
import type { SchemaTypeDefinition } from 'sanity'

export const schemaTypes: SchemaTypeDefinition[] = []
