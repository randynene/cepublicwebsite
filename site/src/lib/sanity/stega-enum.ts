import { stegaClean } from '@sanity/client/stega'
import { z } from 'zod'

// No `server-only` guard: `stegaClean` is isomorphic and some schema files that
// use `stegaEnum` (e.g. types/sanity/shared.ts) are imported by client bundles.

// Stega-tolerant enum for values parsed out of `sanityFetch` results.
//
// In Sanity draft / Presentation mode, `sanityFetch` injects invisible stega
// metadata into every string so Visual Editing overlays can map a rendered
// pixel back to its source field. That metadata makes a value like
// "pill-green" no longer strictly equal to "pill-green", so a plain
// `z.enum([...])` rejects it with `invalid_value` and 500s the whole page —
// which stops `<VisualEditing />` mounting and shows Studio "Unable to connect".
//
// These enum fields (sectionLabelStyle, dropdownType, icon source, cta type, …)
// are logic / style selectors, never click-to-edit display text, so stripping
// stega from them before matching loses nothing. Display strings keep their
// stega and overlays still work. See CONVENTIONS.md "Stega-tolerant enums".
export function stegaEnum<const T extends readonly [string, ...string[]]>(
  values: T,
) {
  return z.preprocess(
    (v) => (typeof v === 'string' ? stegaClean(v) : v),
    z.enum(values),
  )
}
