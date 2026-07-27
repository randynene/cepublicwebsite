import Link from 'next/link'

import './hub-panels.css'

// The expanding-hub panel row: tall image panels wearing a dark-navy veil that
// shows only the caption, which widen accordion-style on hover (>=900px) to
// reveal the photo. Below 900px the row becomes a scroll-snap carousel.
//
// Used by the home "Where we work" section and by the Philippines location
// page's three-region strip. The interaction is pure CSS (hub-panels.css), so
// this stays a stateless server component.
//
// A panel with an `href` is a link and its hover glyph is an arrow; one without
// is a plain div whose glyph becomes an "×", because an arrow on something that
// does not navigate is a lie.

export interface HubPanel {
  /** City / hub name shown in the caption. */
  name: string
  /** Optional second caption line. */
  note?: string
  /** Destination. Omit for a non-clickable panel. */
  href?: string
  /** Panel photo — portrait, roughly 800x1100 or larger, rendered cover. */
  image: string
}

function PanelBody({ panel }: { panel: HubPanel }) {
  return (
    <>
      <div className="ww-img" style={{ backgroundImage: `url('${panel.image}')` }} aria-hidden />
      <div className="ww-veil" aria-hidden />
      <div className="ww-scrim" aria-hidden />
      <div className="ww-fab" aria-hidden>
        <svg
          className="ww-plus"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        {panel.href ? (
          <svg
            className="ww-arr"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        ) : null}
      </div>
      <div className="ww-cap">
        <div className="ww-name">{panel.name}</div>
        {panel.note ? <p className="ww-note">{panel.note}</p> : null}
      </div>
    </>
  )
}

export function HubPanels({ panels }: { panels: HubPanel[] }) {
  return (
    <div className="ww-row">
      {panels.map((panel) =>
        panel.href ? (
          <Link key={panel.name} href={panel.href} className="ww-panel">
            <PanelBody panel={panel} />
          </Link>
        ) : (
          <div key={panel.name} className="ww-panel is-static">
            <PanelBody panel={panel} />
          </div>
        ),
      )}
    </div>
  )
}

export default HubPanels
