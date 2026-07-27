// Sanity `technology` slug -> fallback glyph in public/icons/tech-sprite.svg.
//
// This map is the exception list, not the icon set. Real brand logos come from
// Sanity (`technology.techLogo`, populated on 99 of 101 docs) and TechBadge
// renders those first. Only these two have no logo anywhere, because both are
// architecture concepts rather than products.
//
// A slug absent from this map is not an error: the badge falls back to the
// technology's two letters. `npm run verify:tech-icons` reports which docs are
// in that state, and the fix is almost always to upload the logo in Studio.
export const TECH_ICON_BY_SLUG: Record<string, string> = {
  iam: 'glyph-iam',
  mvvm: 'glyph-mvvm',
}
