// Canonical talent-profile roster.
//
// One person = one entry here. Every surface that shows an engineer's face
// (home hero cards, home "Real engineers" marquee, the three hero cards on each
// location page) reads from this list, so a name, flag, role or skill set is
// written ONCE.
//
// Why this exists: the same photo used to appear under three different names
// and three different flags across the site, and one woman was listed twice
// under two names because she was photographed in two poses.
//
// THE HOME HERO CARDS NAMED FOUR OF THESE PEOPLE FIRST, so the roster follows
// the hero rather than the other way round: Petra K., Marcelo P., Gabriel K.
// and Kyla T. carry the hero's name, role and flag. Change them here and the
// hero changes with them - it reads from this list too.
//
// Photos: crops at /design/talent/<slug>.jpg, generated from Jake's source
// folder by scripts/static/build-talent-photos.mjs. Slug here === file name.
//
// Naming rule per region: Eastern Europe uses Croatian / Serbian names, LATAM
// uses Latin American names, Philippines and Africa keep the names supplied
// with the source photos.
//
// `role` is the bare title. The card shapes compose it differently:
//   hero + marquee  -> "Senior Data Engineer · 9 yrs"
//   placed-engineer -> "Senior Data Engineer · Buenos Aires"
// so the two never drift apart.

// CE-30 (Aug 2026): 'africa' retired. Grace O. was its only member and moved to
// 'latam'; an empty region in the marquee cycle is dead config.
export type TalentRegion = 'eastern-europe' | 'latam' | 'philippines'

export interface TalentProfile {
  /** Photo file name at /design/talent/<slug>.jpg. */
  slug: string
  name: string
  /** Bare job title, no years and no city. */
  role: string
  /** Years of experience. */
  years: number
  /** Home city, shown on the "Engineers we've placed from ..." cards. */
  city: string
  /** Emoji flag of the country the engineer works from. */
  flag: string
  /** Three skills. The first renders as the lime chip. */
  tags: [string, string, string]
  region: TalentRegion
  /**
   * Fourth chip on the home HERO cards only - a working-style trait rather
   * than a skill. The hero card design carries four chips; everywhere else
   * shows the three skills.
   */
  heroTrait?: string
  /** Two-sentence background, for the "placed engineer" cards. */
  bio: string
}

const PHOTO_DIR = '/design/talent'

/** Portrait 4:5 crop - home marquee and location hero cards. */
export function talentPhoto(slug: string): string {
  return `${PHOTO_DIR}/${slug}.jpg`
}

/**
 * Wider crop for the shorter, landscape-ish "Engineers we've placed from ..."
 * card. Using the 4:5 crop there over-zooms it into a head with no shoulders.
 */
export function talentPhotoWide(slug: string): string {
  return `${PHOTO_DIR}/${slug}-wide.jpg`
}

/**
 * Landscape crop matching the home ProfileCard photo area (488x280). Used by
 * the Eastern Europe hero slideshow — the portrait crop truncates faces when
 * forced into that frame with object-cover.
 */
export function talentPhotoSlide(slug: string): string {
  return `${PHOTO_DIR}/${slug}-slide.jpg`
}

/** "Senior Data Engineer · 9 yrs" - hero cards and the home marquee. */
export function roleWithYears(p: TalentProfile): string {
  return `${p.role} · ${p.years} yrs`
}

/** "Senior Data Engineer · Buenos Aires" - the placed-engineer grid. */
export function roleWithCity(p: TalentProfile): string {
  return `${p.role} · ${p.city}`
}

export const TALENT_ROSTER: TalentProfile[] = [
  // ── Eastern Europe ────────────────────────────────────────────────────
  {
    slug: 'ivana-m',
    name: 'Ivana M.',
    role: 'Senior Full-Stack Engineer',
    years: 8,
    city: 'Zagreb',
    flag: '🇭🇷',
    tags: ['React', 'Node.js', 'TypeScript'],
    region: 'eastern-europe',
    bio: 'Previously at a Croatian product scale-up. Placed with a US fintech for 2 years. Overlaps EU days and US mornings.',
  },
  {
    slug: 'petra-k',
    name: 'Petra K.',
    role: 'Senior AI Engineer',
    years: 7,
    city: 'Zagreb',
    flag: '🇭🇷',
    tags: ['RAG', 'LangChain', 'AWS'],
    region: 'eastern-europe',
    heroTrait: 'Product-minded',
    bio: 'Built the retrieval layer for a Croatian legal-tech product. Placed with a US SaaS for 18 months.',
  },
  // Anto C. removed on Jake's instruction (3 Aug) — off the Eastern Europe hero
  // slideshow and off the home marquee. Marcelo takes his slot here.
  //
  // Marcelo's source photo is europe/EU 3.png, so he was always an Eastern
  // European face carrying an Argentine flag. Moved region, flag and city to
  // match the photo (Jake, 3 Aug); the name stays as the home hero named him.
  {
    slug: 'marcelo-p',
    name: 'Marcelo P.',
    role: 'Senior Data Engineer',
    years: 9,
    city: 'Belgrade',
    flag: '🇷🇸',
    tags: ['Python', 'Snowflake', 'Airflow'],
    region: 'eastern-europe',
    heroTrait: 'Async-first',
    bio: 'Built the analytics warehouse for a Serbian marketplace. Placed with a US data team for 2 years.',
  },

  // ── Latin America ─────────────────────────────────────────────────────
  // Rafael replaces Marcelo on the LATAM page (Jake, 3 Aug) - same skills as
  // the card mock. The LATAM hero stack is pinned in HERO_TRIO_SLUGS rather
  // than taken from this order, so the marquee can be re-ordered freely.
  {
    slug: 'rafael-s',
    name: 'Rafael S.',
    role: 'Senior Full-Stack Engineer',
    years: 9,
    city: 'São Paulo',
    flag: '🇧🇷',
    tags: ['TypeScript', 'NestJS', 'PostgreSQL'],
    region: 'latam',
    // LATAM pages + marquee only. Off the home hero slideshow: his source photo
    // is framed with the crown flush to the top, which the landscape hero card
    // clips (3 Aug).
    heroTrait: 'Ships weekly',
    bio: 'Previously at a Brazilian marketplace at scale. Placed with a US commerce team for 2 years.',
  },
  {
    slug: 'gabriel-k',
    name: 'Gabriel K.',
    role: 'DevOps Engineer',
    years: 10,
    city: 'Rio de Janeiro',
    flag: '🇧🇷',
    tags: ['Kubernetes', 'Docker', 'AWS'],
    region: 'latam',
    heroTrait: 'Mentors juniors',
    bio: 'A decade on cloud infrastructure for Brazilian scale-ups. Placed with a US platform team for 2 years.',
  },

  // ── Philippines ───────────────────────────────────────────────────────
  {
    slug: 'kyla-t',
    name: 'Kyla T.',
    role: 'Senior Backend Engineer',
    years: 6,
    city: 'Makati',
    flag: '🇵🇭',
    tags: ['Node.js', 'Python', 'AWS'],
    region: 'philippines',
    heroTrait: 'Owns end-to-end',
    bio: 'Previously at a Philippine fintech. Placed with a UK SaaS for 2 years. Works UK hours.',
  },
  {
    slug: 'ericka-n',
    name: 'Ericka N.',
    role: 'Senior Data Engineer',
    years: 8,
    city: 'Cebu',
    flag: '🇵🇭',
    tags: ['Python', 'Spark', 'Databricks'],
    region: 'philippines',
    bio: 'Built the reporting warehouse for a regional bank. Placed with an AU analytics team for 18 months.',
  },
  {
    slug: 'ros-v',
    name: 'Ros V.',
    role: 'Senior AI Engineer',
    years: 7,
    city: 'Manila',
    flag: '🇵🇭',
    tags: ['RAG', 'Python', 'Pinecone'],
    region: 'philippines',
    bio: 'Shipped an internal LLM assistant for a Philippine insurer. Placed with a UK product team for 14 months.',
  },
  {
    slug: 'russel-d',
    name: 'Russel D.',
    role: 'Senior Full-Stack Engineer',
    years: 9,
    city: 'Clark',
    flag: '🇵🇭',
    tags: ['Laravel', 'Vue.js', 'AWS'],
    region: 'philippines',
    heroTrait: 'Fast to ramp',
    bio: 'Nine years across Philippine agency and product teams. Placed with a UK e-commerce brand for 2 years.',
  },
  {
    slug: 'stephen-l',
    name: 'Stephen L.',
    role: 'Senior Backend Engineer',
    years: 10,
    city: 'Makati',
    flag: '🇵🇭',
    tags: ['.NET', 'Azure', 'SQL'],
    region: 'philippines',
    bio: 'A decade on enterprise .NET for banking clients. Placed with an AU insurer for 2 years. Works AU hours.',
  },

  {
    slug: 'grace-o',
    name: 'Grace O.',
    role: 'Senior AI Engineer',
    years: 8,
    // CE-30 (Aug 2026): relocated from Lagos, Nigeria to Bogota, Colombia on
    // Seb's request. The flag was the reported issue, but city, region and bio
    // all carried the Nigerian origin, so changing the flag alone would have
    // left her a Lagos-based engineer flying a Colombian flag.
    city: 'Bogota',
    flag: '🇨🇴',
    tags: ['Python', 'TensorFlow', 'AWS'],
    region: 'latam',
    heroTrait: 'Ships weekly',
    bio: 'Previously at a Colombian payments company. Placed with a US data team for 18 months.',
  },
  // Last of the LATAM group on purpose (Jake, 13 Aug): marqueeOrder() round-
  // robins the regions in roster order, so his position here is what pushes him
  // late in the home "Real engineers" marquee instead of third card in.
  {
    slug: 'mateo-r',
    name: 'Mateo R.',
    role: 'Senior Full-Stack Engineer',
    years: 8,
    city: 'Buenos Aires',
    flag: '🇦🇷',
    tags: ['React', 'Node.js', 'AWS'],
    region: 'latam',
    bio: 'Previously at an Argentine fintech. Placed with a US SaaS for 2 years. Works US Eastern hours.',
  },
]

/** Everyone in one region, in roster order. */
export function talentByRegion(region: TalentRegion): TalentProfile[] {
  return TALENT_ROSTER.filter((p) => p.region === region)
}

/** Look a person up by slug. Throws rather than silently rendering nothing. */
export function talentBySlug(slug: string): TalentProfile {
  const found = TALENT_ROSTER.find((p) => p.slug === slug)
  if (!found) throw new Error(`Unknown talent slug: ${slug}`)
  return found
}

/**
 * Explicit hero-stack order per region when the roster order is wrong for the
 * stack. Maps to slots: [0] back, [1] middle, [2] front (main / largest face).
 *
 * Philippines (Jake, 3 Aug): Russel + Stephen + Kyla (keep one woman, Kyla as
 * the front card). Default for other regions = first three in roster order.
 *
 * LATAM is pinned to the trio it has always shown; it used to fall out of
 * roster order, which stopped being safe once Mateo moved down the list for
 * the home marquee (13 Aug).
 */
const HERO_TRIO_SLUGS: Partial<Record<TalentRegion, readonly [string, string, string]>> = {
  philippines: ['russel-d', 'stephen-l', 'kyla-t'],
  latam: ['mateo-r', 'rafael-s', 'gabriel-k'],
}

/**
 * The three faces in a location page's hero card stack.
 * Order maps to the stack slots: [0] back, [1] middle, [2] front (main face).
 *
 * The "Engineers we've placed from ..." grid further down each location page
 * is still on stock photography for regions without spare roster faces.
 */
export function heroTrio(region: TalentRegion): TalentProfile[] {
  const slugs = HERO_TRIO_SLUGS[region]
  if (slugs) return slugs.map(talentBySlug)
  return talentByRegion(region).slice(0, 3)
}

// Region cycle for the home marquee. Jake's rule: no two neighbours from the
// same place - one European, one Filipino, one Latin American, and so on.
const REGION_CYCLE: TalentRegion[] = [
  'eastern-europe',
  'philippines',
  'latam',
]

/**
 * The roster reordered so neighbouring cards come from different regions,
 * including across the loop seam where the last card meets the first.
 *
 * Round-robins the region cycle, then swaps out any same-region neighbour the
 * uneven region sizes leave behind. Written as an algorithm rather than a
 * hand-sorted list so it stays correct when photos are added.
 */
export function marqueeOrder(): TalentProfile[] {
  const queues = REGION_CYCLE.map((r) => talentByRegion(r))
  const out: TalentProfile[] = []
  while (out.length < TALENT_ROSTER.length) {
    for (const q of queues) {
      const next = q.shift()
      if (next) out.push(next)
    }
  }

  for (let i = 1; i < out.length; i++) {
    if (out[i].region !== out[i - 1].region) continue
    // Pull forward the next person from a different region.
    const swap = out.findIndex(
      (p, j) =>
        j > i &&
        p.region !== out[i - 1].region &&
        (j + 1 >= out.length || out[j + 1].region !== out[i].region),
    )
    if (swap !== -1) [out[i], out[swap]] = [out[swap], out[i]]
  }
  return out
}
