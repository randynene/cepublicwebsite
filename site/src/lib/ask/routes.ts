// Ask Clara — route constants.
//
// The root layout needs to know whether the request is for /ask so it can leave
// off the sitewide header and footer. Keeping the test here (rather than inline
// in layout.tsx) means the path and its UK mirror are declared once, and adding a
// locale later is a one-line change.

import { stripLocalePrefix } from '@/lib/locale-path'

export const ASK_PATH = '/ask'
export const FOR_DEVELOPERS_PATH = '/for-developers'
export const BOOK_A_CALL_PATH = '/book-a-call'

/** True for /ask and every locale mirror of it (/uk/ask). */
export function isAskPath(pathname: string): boolean {
  const withoutLocale = stripLocalePrefix(pathname.split('?')[0])
  return withoutLocale === ASK_PATH || withoutLocale === `${ASK_PATH}/`
}

/** True for /for-developers and every locale mirror (/uk/for-developers). */
export function isForDevelopersPath(pathname: string): boolean {
  const withoutLocale = stripLocalePrefix(pathname.split('?')[0])
  return (
    withoutLocale === FOR_DEVELOPERS_PATH ||
    withoutLocale === `${FOR_DEVELOPERS_PATH}/`
  )
}

/** True for /book-a-call, /book-a-call/[slug], and their locale mirrors. */
export function isBookACallPath(pathname: string): boolean {
  const withoutLocale = stripLocalePrefix(pathname.split('?')[0])
  return (
    withoutLocale === BOOK_A_CALL_PATH ||
    withoutLocale.startsWith(`${BOOK_A_CALL_PATH}/`)
  )
}
