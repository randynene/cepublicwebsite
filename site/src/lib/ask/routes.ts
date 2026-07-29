// Ask Clara — route constants.
//
// The root layout needs to know whether the request is for /ask so it can leave
// off the sitewide header and footer. Keeping the test here (rather than inline
// in layout.tsx) means the path and its UK mirror are declared once, and adding a
// locale later is a one-line change.

import { stripLocalePrefix } from '@/lib/locale-path'

export const ASK_PATH = '/ask'

/** True for /ask and every locale mirror of it (/uk/ask). */
export function isAskPath(pathname: string): boolean {
  const withoutLocale = stripLocalePrefix(pathname.split('?')[0])
  return withoutLocale === ASK_PATH || withoutLocale === `${ASK_PATH}/`
}
