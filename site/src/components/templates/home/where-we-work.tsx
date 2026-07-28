import { HubPanels } from '@/components/shared/hub-panels'

import { WHERE_WE_WORK, type WhereWeWorkContent } from './content'
import './where-we-work.css'

// "Where we work" — expanding-hub section (sits just above the FAQ; replaces
// the old Locations marquee). The panel row itself is the shared HubPanels
// component (also used by the Philippines location page); this file owns the
// section shell and heading block.
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
    // The section is full width and only the HEADING is banded, so the panel
    // strip can run edge to edge and off both sides of the screen — the
    // customer.io capabilities pattern Jake pointed at. Bleeding this way
    // (rather than with negative `100vw` margins) means no risk of the page
    // itself gaining a horizontal scrollbar.
    <section className="ww">
      <div className="ww-band">
        <div className="ww-head">
          <div className="ww-eb">{eyebrow}</div>
          <h2 className="ww-title">
            {titleLead} <span className="ww-ser">{titleAccent}</span>
          </h2>
          <p className="ww-sub">{paragraph}</p>
        </div>
      </div>

      <HubPanels panels={hubs} />
    </section>
  )
}
