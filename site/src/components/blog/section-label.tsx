import type { ReactNode } from 'react'

// The lime uppercase section label with its trailing rule. Spec §7:
//
//   "Section labels ('Featured', 'All articles') and the long-form headings are
//    <h2>/<h3> - not styled spans - so the outline is machine-readable."
//
// So this is a real <h2>. It looks like a small lime kicker, and it would have been
// very easy to draw as a styled <span> and lose nothing visually - and lose the
// document outline entirely. A page whose only heading is the H1 gives a crawler and
// a screen-reader user no structure to move through, on precisely the pages whose job
// is to be found.
export function SectionLabel({
  children,
  id,
  as: As = 'h2',
}: {
  children: ReactNode
  id?: string
  as?: 'h2' | 'h3'
}) {
  return (
    <div className="flex items-center gap-4">
      <As
        id={id}
        className="shrink-0 text-[12px] font-semibold uppercase leading-none tracking-[1.6px] text-brand-primary"
      >
        {children}
      </As>
      <span aria-hidden="true" className="h-px flex-1 bg-[#22314D]" />
    </div>
  )
}
