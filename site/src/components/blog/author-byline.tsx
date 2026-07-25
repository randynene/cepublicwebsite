import { Image } from '@/components/ui/image'
import { cn } from '@/components/ui/_utils/cn'

// Author byline. Spec §0: one atom, two densities.
//
//   card     28px avatar, name + date
//   article  44px avatar, name + role + date
//
// NO TRUNCATION. The name previously clipped to "Seb..." because it carried `truncate`
// on a `min-w-0` flex child - and a byline that hides the author's name is a byline
// that has failed at its only job. It wraps instead.
//
// THE DEGRADE RULE IS LOAD-BEARING, not politeness (spec §2). Only 39 of the 74 blog
// posts have an author at all, so on nearly half the cards this renders with no name:
// a naive version leaves a floating avatar, or a separator with nothing on either side
// of it. Both look like bugs rather than absences.

export type BylineAuthor = {
  name?: string | null
  teamMemberImage?: unknown
}

export type AuthorBylineProps = {
  author?: BylineAuthor | null
  role?: string | null
  date?: string | null
  size?: 'card' | 'article'
  className?: string
}

/**
 * Initials for the avatar fallback. "Petar Kovac" -> "PK".
 *
 * Two words at most: a three-letter monogram in a 28px circle is illegible, and names
 * arrive from a CMS where nobody promised us two words.
 */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const AVATAR = {
  card: { box: 'h-[28px] w-[28px]', text: 'text-[11px]', px: 28 },
  article: { box: 'h-[44px] w-[44px]', text: 'text-[15px]', px: 44 },
} as const

export function AuthorByline({
  author,
  role,
  date,
  size = 'card',
  className,
}: AuthorBylineProps) {
  // Narrowed to a real string rather than truthiness-checked: a whitespace-only name
  // from the CMS is "truthy" and would give us an avatar with no initials in it.
  const name = author?.name?.trim() ? author.name.trim() : null
  const dateLabel = date?.trim() ? date.trim() : null

  // Nothing to say. Render nothing - not an empty row, and not a rule with no content
  // under it. The caller checks the same condition before drawing the top border.
  if (!name && !dateLabel) return null

  const av = AVATAR[size]
  const photo = (author?.teamMemberImage ?? null) as { asset?: unknown } | null
  const hasPhoto = !!photo?.asset

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {name ? (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
              'border border-[#22314D] bg-[#16223A] font-semibold text-brand-primary',
              av.box,
              av.text,
            )}
          >
            {hasPhoto ? (
              <Image
                source={photo as Record<string, unknown>}
                alt=""
                width={av.px}
                height={av.px}
                className="h-full w-full object-cover"
              />
            ) : (
              // Lime initials. This is the common path: none of the 28 team members
              // has alt text and many have no photo at all.
              <span aria-hidden="true">{initials(name)}</span>
            )}
          </span>

          {/* No truncate, no min-w-0, no width cap. It wraps if it must. */}
          <span className="text-[13px] font-semibold text-text-default">{name}</span>

          {role && size === 'article' ? (
            <span className="text-[13px] text-text-default/60">{role}</span>
          ) : null}
        </div>
      ) : (
        // No author, but there IS a date. Hold the left slot so a dateless card and an
        // authorless card do not look like two different card designs.
        <span aria-hidden="true" />
      )}

      {dateLabel ? (
        <span className="shrink-0 text-[13px] text-text-default/50">{dateLabel}</span>
      ) : null}
    </div>
  )
}

/** Does this card have a footer at all? Callers use it to decide on the top rule. */
export function hasByline(name?: string | null, date?: string | null): boolean {
  return !!name?.trim() || !!date?.trim()
}
