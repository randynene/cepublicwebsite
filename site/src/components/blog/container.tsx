import type { ReactNode } from 'react'

import { CHROME_CONTENT_BAND, CHROME_H_PAD } from '@/components/layout/chrome-band'
import { cn } from '@/components/ui/_utils/cn'

// The blog content band.
//
// It IMPORTS the header's own constants rather than restating them, which is the whole
// point: the brief asked for `max-w-[1280px] px-6 lg:px-16` to "match the header's
// actual max-width and gutters", but the header is 1440px, not 1280px. Hardcoding 1280
// would have looked like it was following the instruction while producing exactly the
// misalignment the instruction was written to fix.
//
// Bound to CHROME_CONTENT_BAND + CHROME_H_PAD, the grid's left edge lines up with the
// logo and its right edge with the Schedule-a-Call button by construction, and it stays
// aligned if the chrome ever changes width. There is no number here to get wrong.
export function BlogBand({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(CHROME_H_PAD, className)}>
      <div className={CHROME_CONTENT_BAND}>{children}</div>
    </div>
  )
}
