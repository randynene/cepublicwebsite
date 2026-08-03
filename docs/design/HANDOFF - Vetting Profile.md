# Execution prompt - Vetting Profile section (Claude Code)

Paste everything below into Claude Code.

---

## Task

Add a new marketing section, **"Vetting Profile"**, to the Cloud Employee site. It must appear in two places:

1. **/services/software-engineers** - it **replaces** the existing "You see two people, not 200 CVs" vetting block entirely. Delete the old markup, do not leave it hidden.
2. **/hire-engineers** - the same section, same component, placed in the page's proof/vetting position (after the intro/value block, before the CTA). Identical content for now; no page-specific variant.

Reference implementation (design source of truth): `Vetting Profile.html` (self-contained, opens in a browser). Read it first and match it exactly - colours, spacing, type scale, animation timings, copy. Do not redesign or "improve" it.

## What the section is

A two-column section (`.85fr / 1.15fr`, stacks to one column under ~980px):

- **Left:** eyebrow "Vetting", headline "You see two people - not 200 CVs.", a bordered explainer card with the line *"Every tab is a stage a candidate has to clear. Six of them, all run by our own internal engineers at Cloud Employee, before you see a name."*, plus the sub-line about AI cross-checking consistency, never deciding the shortlist.
- **Right:** a dark candidate card - photo, name, role line (Senior AI Engineer · Python · LLM systems · 6 yrs · Manila GMT+8), `$42`/hr, availability, then a pill tab bar with six tabs:
  `Overview · CV · Tech interview · Coding test · Psychometric · Soft skills`
  Tab panels render evidence per stage (score bars, interview notes, a diff-style code block, psychometric bars, reference quote). Footer strip: "This is what you receive - not a CV." + link **"Ask our AI anything →"**.

## Behaviour (must be preserved)

- **Autoplay:** on mount, the card cycles tabs in order Overview → CV → Tech interview → Coding test → Psychometric → Soft skills → loop, ~5s per tab, with a sweep progress fill animating across the active pill.
- **Click stops autoplay permanently.** Any tab click sets the tab and cancels the timer/sweep for the rest of the page life.
- **Panel entrance:** on every tab change, the panel's rows/blocks stagger in (`vpIn` keyframe, `.4-.7s cubic-bezier(.16,1,.3,1)`, delays ~0.1s → 0.72s). Keep the staggered reveal - it is the point of the section.
- Respect `prefers-reduced-motion`: skip the sweep and the stagger, keep tabs clickable.
- Do not autoplay while the section is off-screen; start on first intersection (IntersectionObserver, `rootMargin: 0px 0px -20%`), and clear the interval on unmount/navigation.

## Implementation notes

- Build it as a single reusable component in the site's existing stack and conventions (same folder, naming, and styling approach as neighbouring marketing sections - do **not** introduce a new CSS framework, and do not inline a second copy for the second page). One component, imported twice.
- Content (candidate, tabs, panel copy) should be a single data object/props at the top of the component so marketing can edit it without touching layout.
- Fonts used: Inter (UI), Source Serif 4 italic (accent numerals/quotes), JetBrains Mono (dates, code). Use the site's existing font loading - only add a family if it is genuinely missing.
- Palette: bg `#070D18`, card `#0B1424` / `#060F1E`, borders `#22314D` / `#1E2C46`, body text `#DCE3EC`, muted `#7F8CA0` / `#5F6C82`, accent `#D4FF3C`.
- **Photo:** `pricing_assets/candidate.png` in the source. Move it into the site's asset pipeline, serve responsive/optimised (AVIF/WebP + fallback), `width/height` set, `loading="lazy"`, `alt="Lucas M., vetted Senior AI Engineer"`. Keep `object-position:52% 22%`.
- The "Ask our AI anything →" link currently points at `#` - wire it to the correct destination (confirm with the team) and keep the hover gap animation.
- No layout shift: reserve the panel's min-height so cycling tabs doesn't jump the page.

## Accessibility

- Tab bar = real `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-selected`, roving tabindex, left/right arrow key support.
- Autoplay must pause on keyboard focus or hover within the card and stop on interaction.
- All bars/scores need text equivalents (they already have visible numbers - ensure they are not `aria-hidden`).

## Acceptance criteria

- /services/software-engineers and /hire-engineers both render the section, from one shared component.
- Old vetting block on the software-engineers page is fully removed.
- Autoplay cycles all six tabs, stops on click, and never runs off-screen.
- Matches the reference at 1440, 1024, 768 and 390px wide, with no horizontal scroll.
- Lighthouse: no CLS regression, image served optimised.
