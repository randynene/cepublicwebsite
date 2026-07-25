import type { ReactNode } from 'react'

import { cn } from '@/components/ui/_utils/cn'

/** Horizontal padding shared by Header shell + Footer (Header.html / Footer.html: 64px desktop). */
export const CHROME_H_PAD = 'px-4 lg:px-16'

/**
 * Shared max content width for Header nav + Footer link grid so left/right
 * edges align with the 1440px home content band. Updated Jul 2026 from 1152px.
 */
export const CHROME_CONTENT_BAND = 'mx-auto w-full max-w-[1440px]'

/** Desktop header row — logo left, nav cluster centred, CTA right. */
export const CHROME_HEADER_ROW = 'flex w-full items-center'

export function ChromeContentBand({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(CHROME_CONTENT_BAND, className)}>{children}</div>
}
