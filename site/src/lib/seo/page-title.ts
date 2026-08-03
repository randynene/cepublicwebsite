import type { Metadata } from 'next'

/**
 * A meta title from the CMS is the WHOLE title. Always absolute.
 *
 * This used to append the layout's `%s | Cloud Employee` template to any title
 * that did not already name the brand, which made the rendered title a function
 * of whether the editor happened to type "Cloud Employee". That is unpredictable
 * for an editor and, more seriously, it made exact parity with the live site
 * unreachable: live serves titles like "Staff Augmentation | IT Staff
 * Augmentation Services" with no brand in them, and no stored value could
 * reproduce that while the suffix was being bolted on.
 *
 * The brand suffix is now part of the stored string wherever it belongs, which
 * means what Seb types in Studio is exactly what Google sees. The layout default
 * still covers a page with no title at all.
 */
export function resolvePageTitle(
  title: string | null | undefined,
): NonNullable<Metadata['title']> | undefined {
  if (typeof title !== 'string') return undefined

  // A doubled suffix is an editing slip, not an intention. Collapse it rather
  // than shipping "… | Cloud Employee | Cloud Employee" to the SERP.
  const collapsed = title
    .trim()
    .replace(/(\s*\|\s*Cloud Employee\s*)+$/i, ' | Cloud Employee')
    .trim()

  if (!collapsed) return undefined

  return { absolute: collapsed }
}
