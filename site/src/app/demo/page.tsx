import { notFound } from 'next/navigation'

import DemoClient from './_demo-client'

// Step 2.18 — Kitchen-sink demo route (HALT 10 visual eyeball).
//
// Production-safety guard (mandatory per Brief §Step 2.18) — this route
// MUST 404 in production deployments. Visual eyeball is dev-only.
export default function DemoPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return <DemoClient />
}

export const metadata = {
  title: 'Design system kitchen-sink demo',
  robots: { index: false, follow: false },
}
