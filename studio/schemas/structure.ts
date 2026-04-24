// Studio structure config — surfaces singletons as direct nav entries and
// hides them from the "new document" menu. Populated in SCHEMA-1 Step 6.
import type { StructureResolver } from 'sanity/structure'

export const SINGLETON_TYPES: string[] = []

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([...S.documentTypeListItems()])
