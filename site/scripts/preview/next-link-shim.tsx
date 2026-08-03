// Stands in for next/link in the standalone preview bundle.
//
// The preview runs outside Next, so next/link's router context does not exist.
// The component only uses Link for two ordinary navigations (the privacy policy
// and the Clara handoff), so an anchor is a faithful substitute. Nothing about
// the form's appearance or behaviour depends on client-side routing.

import type { AnchorHTMLAttributes, ReactNode } from 'react'

export default function Link({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}
