import type { Metadata } from 'next'

/**
 * Resolve a document/page title against the root layout template
 * (`%s | Cloud Employee`).
 *
 * Sanity meta titles often already end with "| Cloud Employee". Passing those
 * through as a plain string double-brands the tab/SERP title. If the string
 * already names the brand, return `{ absolute }` so the layout template is
 * skipped. Also collapse an accidental double suffix.
 */
export function resolvePageTitle(
  title: string | null | undefined,
): NonNullable<Metadata['title']> | undefined {
  if (typeof title !== 'string') return undefined
  const trimmed = title.trim()
  if (!trimmed) return undefined

  const collapsed = trimmed
    .replace(/\s*\|\s*Cloud Employee\s*\|\s*Cloud Employee\s*$/i, ' | Cloud Employee')
    .trim()

  if (/cloud employee/i.test(collapsed)) {
    return { absolute: collapsed }
  }

  return collapsed
}
