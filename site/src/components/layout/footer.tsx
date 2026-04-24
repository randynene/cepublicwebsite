import { getSiteSettings } from '@/lib/sanity/queries'

// Server component. Footer singleton fetched from Sanity in TEMPLATE-FOOTER.
export default async function Footer() {
  const settings = await getSiteSettings()
  if (!settings) {
    // TODO(TEMPLATE-FOOTER): render full footer from Sanity footer global
    return (
      <footer>
        {/* Scaffold placeholder — populated in TEMPLATE-FOOTER */}
      </footer>
    )
  }

  return (
    <footer>
      {/* Scaffold placeholder — populated in TEMPLATE-FOOTER */}
    </footer>
  )
}
