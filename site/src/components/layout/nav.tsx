import { getSiteSettings } from '@/lib/sanity/queries'

// Server component. Fetches the navigation singleton via the siteSettings
// stub. TEMPLATE-* replaces this with a full Sanity-driven nav.
//
// Tech Debt #5 — `ce-global-components.json` has the Technology dropdown
// merged into Services due to an AUDIT-1 selector issue. Do not use that
// JSON to build the link structure here. The final nav is sourced from
// the Sanity `navigation` global in TEMPLATE-NAV.
export default async function Nav() {
  const settings = await getSiteSettings()
  if (!settings) {
    // TODO(TEMPLATE-NAV): render full nav from Sanity navigation global
    return (
      <nav aria-label="Main navigation">
        {/* Scaffold placeholder — populated in TEMPLATE-NAV */}
      </nav>
    )
  }

  // TODO(TEMPLATE-NAV): when settings exists, render real nav
  return (
    <nav aria-label="Main navigation">
      {/* Scaffold placeholder — populated in TEMPLATE-NAV */}
    </nav>
  )
}
