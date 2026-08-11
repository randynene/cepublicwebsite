import type { ReactNode } from 'react'

// The centered hero shared by both social-proof hubs: eyebrow + H1 with its LAST word
// set in Source Serif 4 Italic lime, as the design draws it ("Our Customer *Stories*",
// "Cloud Employee *Reviews*").
//
// The accent word is split off the H1 text rather than stored separately, so a single
// `title` string from Sanity drives both the plain part and the accent. Exactly one
// <h1> per page.

function AccentTitle({ title }: { title: string }): ReactNode {
  const words = title.trim().split(/\s+/)
  if (words.length < 2) return title
  const last = words[words.length - 1]
  const head = words.slice(0, -1).join(' ')
  return (
    <>
      {head}{' '}
      <span className="font-serif italic font-normal text-brand-primary">{last}</span>
    </>
  )
}

export function HubHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string | null
  title: string
  /** Optional sub-line under the H1 (e.g. the trusted-by line on Reviews). */
  children?: ReactNode
}) {
  return (
    <header className="mx-auto flex max-w-[820px] flex-col items-center gap-5 py-14 text-center lg:py-[72px]">
      {eyebrow ? (
        <p className="text-[12px] font-semibold uppercase tracking-[1.8px] text-brand-primary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-marketing-hero text-text-default">
        <AccentTitle title={title} />
      </h1>
      {children}
    </header>
  )
}
