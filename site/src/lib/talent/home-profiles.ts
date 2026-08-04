// The two roster-derived card lists the home page renders.
//
// These live here rather than in templates/home/content.ts because the Sanity
// patch script imports them with tsx, and that file also pulls in a React
// component. Keeping them beside the roster keeps the script's import graph to
// plain data.
//
// Shape is structurally the HomeProfile in templates/home/content.ts, which
// re-exports both of these.

import {
  marqueeOrder,
  roleWithYears,
  talentBySlug,
  talentPhoto,
  type TalentProfile,
} from './roster'

export interface TalentCard {
  name: string
  role: string
  flag: string
  tags: string[]
  image: string
  objectPosition?: string
}

// Hero slideshow — six people from the roster. The first four were named by
// the hero first, so the roster carries their name, role and flag and this
// list just picks them and points at their dedicated 488x280 hero crops, a
// wider shape than the roster's own photos.
//
// The card auto-cycles on `profiles.length`, so this list can grow or shrink
// without touching the component.
const HERO_CARD_DIR = '/design/home/engineers/hero-card'

function heroCard(slug: string, imageFile: string): TalentCard {
  const p: TalentProfile = talentBySlug(slug)
  return {
    name: p.name,
    role: `${roleWithYears(p)} | Remote`,
    flag: p.flag,
    // The hero card design carries four chips: three skills plus a
    // working-style trait.
    tags: p.heroTrait ? [...p.tags, p.heroTrait] : [...p.tags],
    image: `${HERO_CARD_DIR}/${imageFile}`,
    objectPosition: 'center',
  }
}

export const HERO_SLIDESHOW_PROFILES: TalentCard[] = [
  heroCard('kyla-t', 'kyla.jpg'),
  heroCard('marcelo-p', 'marcello.jpg'),
  heroCard('petra-k', 'petra.jpg'),
  // Added 3 Aug so the rotation carries more faces. Straight crops with real
  // headroom — see build-talent-photos.mjs.
  //
  // Rafael was tried here and pulled: his source is framed with the crown
  // flush to the top edge, so this landscape card clipped his head whatever
  // the crop. Gabriel's earlier rejection was the old hand-made hero asset,
  // which had blurred side strips baked in; his photo itself is fine.
  //
  // Grace was removed from the hero on Seb's request (CE-38, Aug 2026). She
  // remains in the REAL_ENGINEER_PROFILES marquee below.
  heroCard('gabriel-k', 'gabriel.jpg'),
  heroCard('russel-d', 'russel.jpg'),
]

// "Real engineers, real backgrounds" marquee — the whole roster, interleaved
// so no two neighbouring cards come from the same region.
export const REAL_ENGINEER_PROFILES: TalentCard[] = marqueeOrder().map((p) => ({
  name: p.name,
  role: roleWithYears(p),
  flag: p.flag,
  tags: [...p.tags],
  image: talentPhoto(p.slug),
}))
