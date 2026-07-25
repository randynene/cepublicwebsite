import Link from 'next/link'

import { WHERE_WE_WORK, type WhereWeWorkContent } from './content'
import './where-we-work.css'

// "Where we work" — expanding-hub section (sits just above the FAQ; replaces
// the old Locations marquee). Six tall image panels on a #070D18 ground: at
// rest each wears a dark-navy veil showing only the city name + a "+" button;
// on hover (>=900px) the panel widens accordion-style, the veil fades to reveal
// the photo, and the button flips to a lime "→". Below 900px the row becomes a
// scroll-snap carousel. The whole interaction is pure CSS (see where-we-work.css,
// scoped under .ww) so this stays a stateless server component.
//
// Content comes from homePage.whereWeWork (Sanity) with WHERE_WE_WORK as the
// static fallback. Each panel links to its hub's location page.
export function WhereWeWork({
  content = WHERE_WE_WORK,
}: {
  content?: WhereWeWorkContent
}) {
  const { eyebrow, titleLead, titleAccent, paragraph, hubs } = content
  return (
    <section className="ww">
      <div className="ww-head">
        <div className="ww-eb">{eyebrow}</div>
        <h2 className="ww-title">
          {titleLead} <span className="ww-ser">{titleAccent}</span>
        </h2>
        <p className="ww-sub">{paragraph}</p>
      </div>

      <div className="ww-row">
        {hubs.map((hub) => (
          <Link key={hub.name} href={hub.href} className="ww-panel">
            <div
              className="ww-img"
              style={{ backgroundImage: `url('${hub.image}')` }}
              aria-hidden
            />
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
            </div>
            <div className="ww-cap">
              <div className="ww-name">{hub.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
