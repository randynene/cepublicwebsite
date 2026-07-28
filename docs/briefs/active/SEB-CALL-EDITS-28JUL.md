# Seb call - consolidated edit list (28 Jul 2026)

> Source: `Meet-f169f595-fa1f.pdf`, Jake + Seb page-by-page review, 28 Jul 2026.
>
> **STATUS: the CLEAR items are BUILT (28 Jul).** See §9 for exactly what
> shipped, what still needs a Sanity patch run by Jake, and what is still
> waiting on an answer. The AMBIGUOUS / UNDECIDED / BLOCKED rows below are
> untouched and still need §7 answered.
>
> Every row is mapped to a real file, verified against the codebase on 28 Jul.
> Where the call left something genuinely undecided it is tagged AMBIGUOUS and
> written as a question, not a task. Guessing on those is how we build the wrong
> thing twice.

---

## 0. How to read the tags

| Tag | Meaning |
|---|---|
| **CLEAR** | Unambiguous. Can be briefed and built as written. |
| **AMBIGUOUS** | Seb's intent is not recoverable from the transcript. Needs one question answered. |
| **UNDECIDED** | Both of them raised it and neither landed on an answer. Needs a decision, not a clarification. |
| **BLOCKED** | Waiting on Seb, Caitlin, Anto or a filmed asset. Not a code task. |
| **ALREADY DONE** | Already ships. Verify with Seb before spending anything. |
| **PUSHBACK** | I think this is the wrong call. Reasoning in section 6. |
| **GARBLED** | Transcription noise. Not recoverable. Seb must re-point at it. |

---

## 1. Home page

| # | Item | Where it lives | Tag |
|---|---|---|---|
| H1 | Hero accent word "engineers": drop the scramble/decrypt reveal, replace with a typewriter effect that types E-N-G-I-N-E-E-R-S | `site/src/components/motion/decrypt-text.tsx` (used by `templates/home/index.tsx` Hero) | CLEAR |
| H2 | Apply the same typing effect to the lime accent word in **every** page hero | Every `DecryptText` call site | CLEAR intent, **scope question** - see Q1 |
| H3 | "See more" affordance under the hero: more spacing, make it a standalone element | `templates/home/index.tsx` Hero | AMBIGUOUS - see Q2 |
| H4 | At any browser zoom, the first screen shows only headline + hero image | `templates/home/index.tsx` Hero | CLEAR (testable) |
| H5 | Seb's 90-second video: make the on-card text overlays bigger | `templates/home/process-video.tsx` | CLEAR |
| H6 | Make the "Watch the 90-second overview" CTA pill bigger | `templates/home/process-video.tsx` | CLEAR |
| H7 | Video eager-loads on page load rather than on scroll | `process-video.tsx` (Vimeo `1131836141`) | **NO ACTION** - Seb accepted for V1 |
| H8 | Count the stats up (the `8`, the `40%`) | `templates/home/index.tsx` `Testimonials`, `motion/count-up.tsx` | **ALREADY DONE** - see Q3 |
| H9 | Make the "You" and "Us" labels larger in What's Included | `templates/home/index.tsx` `Included` (currently 12px eyebrow) | CLEAR |
| H10 | Port the Location-page "what's included" style onto Home | - | **REJECTED by Seb** ("looks like a form", "too busy"). Keep current design. |
| H11 | Calculator CTA: "Get matched at this rate" becomes an AI CTA ("Ask our AI", "Talk to our AI") | `templates/home/content.ts` `calculator.cta` | CLEAR intent, **wording undecided** - Q4 |
| H12 | That button currently just scrolls to `#process` (the video). It does not do what it says on any page. | `templates/home/calculator-card.tsx` line ~185 | **BUG** - fix regardless of H11 |
| H13 | "Four more profiles of real people" with new headshots | Hero card already has 4 (`profile-card.tsx`); the marquee below has 3 (`RealEngineers`) | AMBIGUOUS + BLOCKED - Q5 |
| H14 | Skills "bubbles": use the shape/dimensions from the How It Works page version | `templates/how-it-works/` vs home skills chips | AMBIGUOUS - Q6 |
| H15 | Client logos: Seb prefers the moving carousel over the static row | Home uses static `TrustedBy`; shared `social-proof/logo-marquee.tsx` exists | CLEAR |

---

## 2. Hire Engineers (`/services/software-engineers`)

| # | Item | Where it lives | Tag |
|---|---|---|---|
| S1 | Widen the sub-paragraph under the H1 ("Tell us the role. We send two engineers...") | `templates/hire-engineers/index.tsx` + `hire-engineers.css` | CLEAR |
| S2 | Add a third engineer card to the hero shortlist | `hero.card` | UNDECIDED - Seb: "maybe two is fine". Park. |
| S3 | Whether to show the rate numbers at all | hero shortlist | UNDECIDED - tangled with X1 below |
| S4 | Role icons do not match the roles. AI/ML should carry an AI mark; Security is wrong. | `ROLE_ICONS` array in `hire-engineers/index.tsx` - **positional, not keyed by role name** | CLEAR, needs a per-role icon list - Q7 |
| S5 | Kill the dark/lighter section alternation. One dark blue the whole page. | `--navy: #0a1628` bands in `hire-engineers.css` | CLEAR for this page, **scope question** - Q8 |
| S6 | Vetting graphic ("two people, not 200 CVs"): polish. Also `psychometrics` -> `psychometric`. | vetting section | CLEAR (small) |
| S7 | "Explore a real profile" becomes an AI CTA | vetting/proof section | CLEAR intent |
| S8 | A section looks bare, add photos / company logos | unspecified section | AMBIGUOUS - Q9 |
| S9 | The "Ask our AI anything" CTA on this page is `<a href="#">` - it goes nowhere | `hire-engineers/index.tsx` ~821 | **BUG** |

---

## 3. Fractional CTO (`/services/fractional-ctos`)

| # | Item | Where it lives | Tag |
|---|---|---|---|
| F1 | Widen the hero sub-text | `fractional-cto.css` `.mp` / hero grid | CLEAR |
| F2 | One dark blue the whole page (same as S5) | `--navy` bands in `fractional-cto.css` | CLEAR |
| F3 | Remove the video section until Seb films one | section 3, `.video#how` - currently a **placeholder tile, no real video** | CLEAR |
| F4 | Add the real "trusted by" company-logo strip from the engineers page | Page currently has a **text-name** marquee, not image logos | CLEAR |
| F5 | The CTA section is inconsistent with other pages, make it match | `.final` / CTA section | AMBIGUOUS - Q10 |
| F6 | "There's too much here almost... get rid of this for now" | one of 11 sections | AMBIGUOUS - Q11 |
| F7 | "Get rid of the... Danny, these sound familiar, just switch it off" | - | **GARBLED**. No audio/sound exists anywhere in the codebase. Seb must re-point. |
| F8 | Replace the multi-step match form with an AI CTA | `.matchform#match` - form is **client-side only, submits nowhere** | CLEAR intent |
| F9 | The two "Ask our AI anything" pills are plain `<button>`s wired to nothing | `fractional-cto/index.tsx` ~424, ~511 | **BUG** |

---

## 4. Navigation, footer, sitewide

| # | Item | Where it lives | Tag |
|---|---|---|---|
| N1 | Locations dropdown order -> Eastern Europe, Latin America, Philippines (currently LATAM, Philippines, Eastern Europe) | Sanity `navigation.locationsDropdown` | CLEAR (Sanity edit, no code) |
| N2 | Does the footer "Talent Locations" list reorder too? | Sanity `footer.talentLocations.items` | AMBIGUOUS - Q12 |
| N3 | Hide "Product delivery" + "AI services" at launch, keep them visible on staging | Sanity `navigation.servicesDropdown` | **CONFLICT** - staging and production read the *same* Sanity dataset. Cannot be done editorially. - Q13 |
| N4 | Add GDPR, Modern Slavery, Cookie Policy to the footer (modelled on furza.co.uk) | Sanity `footer.bottomBar.links`; only `/legals/privacy-policy` and `/legals/general-terms` exist as routes | **BLOCKED + PUSHBACK** - section 6.2 |
| N5 | LLM info page (`llms.txt`) so AI crawlers get a clean breakdown | Does not exist. Logged as Tech Debt #47 P1-2. | CLEAR, cheap |
| N6 | Point the whole site's conversion funnel at the AI chat | Clara widget is already sitewide | **STRATEGIC** - section 6.1 |

---

## 5. Other pages

| # | Item | Tag |
|---|---|---|
| L1 | Location page cards are "too busy". Maybe adopt the Pricing card layout, maybe just swap the images. Seb wavered and did not land. | UNDECIDED - Q14 |
| P1 | Pricing "looks a bit off, needs to be higher" | AMBIGUOUS - Q15 |
| C1 | Case studies: Seb will supply content. Jake to add images and animate the video cards. | BLOCKED on Seb |
| C2 | "Can AI crawl these / will the moving cards be indexed?" | **ANSWER: yes.** The marquees and bubbles are real DOM elements moved by CSS. The text is in the server HTML and is indexable. Same for the decrypt/typewriter word - the final string ships in server HTML. No action. |
| X4 | Product Delivery pricing model (free consult -> $5k scoping -> delivery) | BLOCKED on Seb + Anto |

---

## 6. Where I would push back

### 6.1 "Everything points at the AI" - the cheap 80% is available now

Seb asked for this on Home, Hire Engineers and Fractional CTO. The bespoke
ChatGPT-style page with voice input is a two-week build by Jake's own estimate,
so it is not a V1 item.

But the Clara widget **already loads on every page**, and `ChatLink` /
`ChatPill` already exist to open it. The problem is that several "Ask our AI"
CTAs were built as decoration and never wired:

- Home `readyToFind.talkCtas` - rendered as non-clickable `<span>`s
- Hire Engineers `talkAi` - `<a href="#">`
- Fractional CTO `aiPill` / `pillAi` - plain `<button>`s
- Home calculator CTA - scrolls to the video instead of doing anything

**Recommendation:** wire all of these to open Clara for V1. That delivers most
of what Seb asked for this week at near-zero cost, and the bespoke chat page
later becomes a change of target, not a rebuild. Do this before any cosmetic
edit on the list.

### 6.2 Do not ship AI-reworded legal documents

The plan on the call was to take furza.co.uk's footer policies and have AI
"switch them up". Two problems:

1. **Copyright.** Their policy text is their copyright. Rewording it is still
   derivative.
2. **A Modern Slavery statement is a statutory document**, not marketing copy.
   Under s.54 of the UK Modern Slavery Act it only applies above £36m turnover,
   it has prescribed content, and it must be board-approved and
   director-signed. Check whether CE is even in scope before spending anything.

**Recommendation:** buy proper templates or have CE's counsel supply the text.
Separately: **do not add the footer links until the pages exist**, or we ship
four 404s into the launch and fail the parity gate. Seb already said "do it for
next week", so this is post-launch by his own scheduling.

### 6.3 IP-based currency switching - I would not do this

Seb wants a UK visitor to see £ automatically on the same URL. Three problems:

1. **His premise is wrong for this site.** He said "there isn't a UK link and an
   American link". There is: every page has a `/uk/` mirror, and that is
   exactly what hreflang and our canonical architecture are built on.
2. **It breaks the speed Jake is proud of.** Pages are prerendered and served
   from the CDN edge cache. Making the price depend on the visitor's IP forces
   either dynamic rendering on every request, or a client-side swap that flashes
   the wrong currency first.
3. **It risks cache poisoning** - the first visitor's currency getting cached
   and served to everyone else.

**Recommendation instead:** make every calculator default its currency from the
locale of the URL. `/uk/*` opens on £, `/` opens on $. The price-comparison
calculator **already does this**; the pricing and hiring-cost calculators do
not. That is a small change per calculator, zero SEO risk, and it satisfies the
actual intent. If Seb still wants IP detection afterwards, layer it as a
client-side nudge that never touches server HTML or indexed content.

### 6.4 The "all dark, no alternation" change needs a scope boundary

Seb is overriding his own Figma here, which is fine - but the light/dark
alternation only exists on the two bespoke service pages
(`hire-engineers.css`, `fractional-cto.css`). Home, the hubs and the detail
templates are already single-ground dark. Applying this "sitewide" would mean
re-touching pages that are already signed off. See Q8.

### 6.5 Friday launch vs the blocked items

The call assumed Friday go-live. Five items on this list are blocked on people
who are not Jake: headshots (Caitlin), case study content (Seb), the filmed
Fractional CTO video (Seb), the product-delivery pricing model (Anto), and the
legal documents. The honest position is to launch Friday with those items
either **removed** or **left as they are**, not to move the date.

---

## 7. OPEN QUESTIONS - Seb must answer before build

| Q | Question |
|---|---|
| **Q1** | The typing effect on lime accent words: every page hero, or just Home? Does it also apply to the mid-page section headings that use the same effect today? |
| **Q2** | The hero "see more": is it (a) just more spacing and a standalone treatment, or (b) a two-step scroll where the first click goes to the quote and the second continues down? The transcript has both. |
| **Q3** | The stat count-up you asked for already ships (the `8`, the `5`, the `40%` all animate from zero when scrolled to). Did it not fire for you, or did you mean a different number? |
| **Q4** | Exact wording for the calculator CTA. Candidates from the call: "Ask our AI", "Talk to our AI", "Chat to our AI", "Get a more accurate cost". Pick one, it is used in four places. |
| **Q5** | "Four more profiles": the hero card already cycles 4 people; the strip below the calculator has 3. Which one, and how many total? |
| **Q6** | Skills bubbles: do you want the How It Works bubble *shape* everywhere, or the whole component swapped? |
| **Q7** | Role icons: send the list of role -> icon you want, or approve me choosing one per role. The icons are currently assigned by position in the list, which is why they drifted. |
| **Q8** | The all-dark change: Hire Engineers + Fractional CTO only, or does anything else need it? Nothing else currently alternates. |
| **Q9** | Which section on Hire Engineers looked bare? |
| **Q10** | Fractional CTO CTA section: which page's CTA should it copy? |
| **Q11** | Fractional CTO "too much here": which section do you want removed? There are 11. |
| **Q12** | Locations reorder: nav dropdown only, or the footer list too? |
| **Q13** | Product Delivery / AI Services: (a) hide from the nav only, leaving the pages live and indexable, or (b) also noindex or unpublish the pages? And note staging and production read the same Sanity dataset, so "visible on staging, hidden on live" needs a code switch, not a Studio edit. Cheapest option is to gate it on the same hostname flag that already guards indexing. |
| **Q14** | Location page cards: adopt the Pricing layout, or just swap the images and re-look? You went both ways. |
| **Q15** | Pricing "looks a bit off, needs to be higher": which element? |
| **Q16** | Confirm the Friday date holds given the five blocked items in 6.5. |

---

## 8. Suggested build order (once decisions land)

1. **Dead CTAs + calculator CTA target** (section 6.1). Highest value, lowest cost, unblocks Seb's whole funnel ask.
2. **Locations reorder** (N1). Sanity edit, no deploy.
3. **Typography and sizing batch**: H5, H6, H9, S1, F1. All small, all safe.
4. **All-dark pass**: S5, F2, once Q8 is answered.
5. **Typewriter effect**: H1, H2, once Q1 is answered.
6. **Fractional CTO subtractions**: F3, F6, once Q11 is answered.
7. **Calculator currency by locale** (6.3).
8. **`llms.txt`** (N5).
9. Everything else waits on answers or on Seb.

---

## 9. BUILD RECORD - 28 Jul 2026

Branch `cursor/seb-call-edit-consolidation-2b4c`. `tsc` clean; `npm run lint` at
the exact pre-existing baseline (30 errors / 47 warnings, all Tech Debt #36 -
zero added); `npm run build` clean at 707 pages; runtime smoke test against
`next start`.

### Shipped in code

| # | Item | Where |
|---|---|---|
| 1-4 | **Every dead AI CTA is now live.** Home `talkCtas` were non-clickable `<span>`s, Hire Engineers `talkAi`/`talkBook` were `href="#"`, Fractional CTO `aiPill`/`pillAi`/`pillBook` were handler-less `<button>`s. All now render `ChatLink`, which is a real anchor to `/book-a-call` that upgrades the click to the Clara widget when it is mounted. No CTA can be dead again by construction. | `home/index.tsx`, `hire-engineers/index.tsx`, `fractional-cto/index.tsx` |
| 12 | Home calculator CTA opens the chat instead of scrolling to the video, and gained the trailing arrow Seb asked for. | `home/calculator-card.tsx` |
| 5-6 | **`TypewriterText`** replaces the decrypt/scramble reveal on the hero accent word, and is rolled out to all 11 heroes that have one: home, how-it-works, pricing, about-us, contact, our-work, services hub, technology hub, location, hire-engineers, fractional-cto. Same SSR contract as the effect it replaces - the real word ships in the server HTML (verified: `<h1>` reads "Hire engineers vetted by engineers" with no JS), `aria-label` carries the phrase, zero layout shift, static under reduced motion. The two mid-page home headings that used the scramble now render plain, per the "one text effect per page" call. | `motion/typewriter-text.tsx`, `globals.css`, 11 templates |
| 7-8 | Home video card: caption 13 -> 16/19px, name 22 -> 26/30px, CTA pill 14 -> 16/18px with more padding. | `home/process-video.tsx` |
| 9 | "You" / "Us" labels 12px eyebrow -> 22/28px bold. | `home/index.tsx` |
| 10 | Home client logos: static row -> moving marquee. | `home/index.tsx` |
| 11 | **Home hero fits the first screen at any zoom.** Zooming in shrinks the viewport in CSS pixels, so the fit is driven off viewport height: the hero claims `100svh` minus chrome, and the headline and profile card step down at 900 / 760 / 620px of height. Nothing changes at a normal desktop zoom, so the signed-off design is untouched. | `globals.css` `.home-hero`, `home/index.tsx` |
| 13, 18 | Hero sub-paragraph widened: Hire Engineers 40 -> 58ch, Fractional CTO 36 -> 56ch. | both `.css` files |
| 14, 19 | **One dark ground per page.** `--navy` (`#0a1628`) now resolves to `--bg` (`#070d18`) on both service pages, killing the dark/lighter banding. Section separation is carried by the existing 1px borders. Kept as a token so it is one line to restore. | both `.css` files |
| 15 | **Role icons are keyed by role name, not list position.** This was the actual bug: two positional arrays indexed by `i`, so icons drifted as copy changed (DevOps had a plus sign, Data Engineers a monitor, Fractional CTOs a star, Backend a sun). Now a matcher with a neutral arrow fallback, covering backend / frontend / full-stack / DevOps / QA / mobile / data / AI-ML / CTO / security. AI/ML gets the sparkle mark Seb asked for by name. Applies to both the roles grid and the form's step-0 options. | `hire-engineers/index.tsx` |
| 17 | "Explore a real profile" -> "Tell our AI what you need", opening the chat. The widget itself is untouched - Seb liked it. | `hire-engineers/index.tsx` + content |
| 20 | Fractional CTO video section removed. It was a placeholder tile with no video behind it. `id="how"` moved to the next section so the hero's "see how it works" link still lands. Dead `VideoTile` / `fctoEmbedSrc` / `PlayTri` deleted. | `fractional-cto/index.tsx` |
| 21 | **Shared `ClientLogoStrip`.** Fractional CTO rendered the seven companies as text names while home had real images. There is now one component and one logo list, used by home, Fractional CTO and Hire Engineers. | `social-proof/client-logo-strip.tsx` |
| 22 | Fractional CTO match-form reassurance pills wired to chat / book-a-call. | `fractional-cto/index.tsx` |
| 24 | **`/llms.txt`** - the plain-text brief for AI assistants, answering the questions Seb listed (cost, fee structure, timeline, differentiation) plus the authoritative page list. Hostname-gated exactly like `robots.ts`, so staging returns 404. Deliberately NOT prerendered: a static build would bake in whichever side of the gate was true at build time. Verified 200 with the canonical host set, 404 without. | `app/llms.txt/route.ts` |

**Also done, beyond the 24-item list:** Seb asked on the call to "add this bit
here to the engineers page - the trusted by". Hire Engineers had no logo strip
at all, so one was added under the hero using the same shared component. Flagged
because it adds a section rather than editing one.

**Locale correctness:** both service templates now take a `locale` prop, so the
UK mirrors point at `/uk/book-a-call` rather than the US page. Verified in the
rendered HTML.

### Needs Jake to run (no write token in the agent environment)

Two idempotent scripts, dry-run by default, `--apply` to write:

1. `npx tsx scripts/static/reorder-locations.ts --apply`
   Item 23. Reorders `navigation.locationsDropdown` and `footer.talentLocations`
   to Eastern Europe / Latin America / Philippines. It **reorders the existing
   items** rather than rewriting them, so any label or subtitle Seb has edited in
   Studio survives. `patch-nav-simple-dropdowns.ts` was updated to the same order
   so re-running the older seed cannot undo it (the Tech Debt #37 lesson).

   **NOTE (28 Jul, third pass):** the rendered order is now also pinned in code,
   because the dropdown was still showing the old order on the preview and the
   agent has no write token. `orderLocations()` in
   `site/src/lib/sanity/queries/navigation.ts` sorts by URL slug and is applied
   in both `fetchNavigation()` and `fetchFooter()`, so the header and the footer
   cannot disagree. Unknown entries keep their authored position, after the three
   known regions. Once the script above has run the sort is a no-op; delete it
   if Seb should be free to reorder these in Studio.

2. `npx tsx scripts/static/patch-seb-copy-edits.ts --apply`
   **Three copy changes that a code edit alone does not deliver.** Home and Hire
   Engineers read their copy from Sanity and only fall back to `content.ts` when
   the doc is missing. Both docs exist, so the Sanity value wins. Confirmed at
   runtime: the home calculator button still rendered "Get matched at this rate"
   after the code change. The script patches `homePage.calculator.cta`,
   `homePage.process.steps[1].body` (psychometrics -> psychometric testing) and
   `hireEngineersPage.vet.profile.openBtn`, and skips any field Seb has since
   edited in Studio rather than overwriting it.

---

## 9b. HERO BAND PASS - 28 Jul, second round

Jake reviewed the preview and sent annotated screenshots of the Hire Engineers
hero: arrows pointing outward on the headline, the shortlist card and the
trusted-by row ("too internal"), and "FIX" on the logo strip ("all squished and
crammed in"). The instruction was to make every main marketing page land like
Hire Engineers: headline left, visual right, trusted-by far left, rotating logos
in the middle, Ask-our-AI far right, See more underneath, all on the first
screen. Verified by rendering each page at 1920x1080 in a headless browser
rather than by eye.

### Two real bugs behind what Jake saw

1. **The bands were too narrow.** Hire Engineers and Fractional CTO were on a
   1200px band with 40px padding, so at 1920 the content sat between x=360 and
   x=1560 with 360px of dead margin each side. All marketing pages are now on
   the same 1440/64 band as home (content 240 to 1680).

2. **`.he, .he *` sets `margin: 0; padding: 0`.** That reset has the SAME
   specificity as a single-class Tailwind utility and loads after it, so every
   Tailwind margin and padding class is silently dead inside `.he` and `.fcto`.
   The logo spacing was in the HTML and in the compiled CSS and still computed
   to `margin: 0px` - measured gap between logos was **1px**. This is a trap for
   anything dropped into those two pages; the shared components now avoid
   margin and padding utilities entirely and carry their own two-class rules in
   globals.css.

### Shipped

| Item | Detail |
|---|---|
| `HeroTrustBar` | New shared component: label, rotating logos, Ask-our-AI CTA, and a centred See-more button. Now on Home, Hire Engineers, Fractional CTO, How It Works and all three location pages. Styling lives in a `.hero-trust-bar` block in globals.css so it renders identically inside scoped-CSS pages. |
| `ClientLogoStrip` rebuilt | Spacing from fixed 188px cells rather than margins (reset-proof), per-logo optical caps plus a 132px width cap so one wide mark cannot dominate, and gradient masks at each end so logos no longer hard-cut mid-wordmark. |
| Travelex asset | `travelex.png` is a scraped screenshot of a two-tone card, not a logo. Under the line-art filter it rendered as a solid white rectangle in the middle of the row. `travelex-wordmark.png` is that wordmark lifted onto transparency, generated from the original (which is untouched). |
| Logo normalisation | Home and the location pages hold their own Sanity-editable logo lists, served as CDN URLs, so a path match could not reach them. `normalise()` matches on logo NAME and applies the canonical treatment; unrecognised logos pass through so a new client added in Studio still renders. |
| `.hero-screen` | Wraps hero + trust bar and claims exactly one screen, so the next section starts off-frame and See more is the scroll affordance. |
| Zoom fit | Driven off viewport HEIGHT, since zooming in is what makes the window short. Values are pushed down as CSS custom properties (`--hero-h1-size`, `--hero-pad-top/bottom`) which the page stylesheets consume, because `.he .hero h1` outranks anything `.hero-screen`-prefixed. Measured: fits at 1920x1080, 1600x900, 1440x820, 1280x760 and 1280x700. At 1152x620 (about 175% zoom) it still overflows by ~35px and the page scrolls, which is the documented limit. |
| Headline wrap bug | The typewriter made every character an inline-block, so a wrapping headline could break mid-word - Fractional CTO rendered "Matche / d in days". Characters are now grouped into nowrap word boxes, so breaks only happen at spaces. |
| Duplicate renderers removed | Two hand-copied logo renderers in `home/index.tsx` and `home/client-story.tsx` now use the shared `ClientLogoImage`. |

Net lint effect: **one fewer warning than `main`** (30 errors / 46 warnings vs
the 30 / 47 baseline). tsc clean, build clean.

### 9c. Third pass - See more removed, For Engineers added

Jake's follow-up after reviewing the preview: drop the "See more" button
everywhere. The hero and the logo strip ARE the whole first screen, at any zoom
level, and the logos are the bottom of the hero rather than something you scroll
past a button to reach. Also add the logo strip to For Engineers, but without
the Ask-our-AI CTA.

| Change | Detail |
|---|---|
| See more removed | Gone from `HeroTrustBar` and from all six call sites. For Engineers had its own separate `fe2-seemore` button with a bobbing chevron; that and its CSS are gone too. |
| For Engineers | Now closes its hero with the shared strip. `HeroTrustBar` gained `showAi` (default true); this page passes `false`, because the assistant is a buyer-side tool and that page speaks to candidates. Banded to the same 1440/64 width inside the page's fixed 1920px Figma canvas. |
| Better fit as a result | Losing the button freed ~70px of vertical budget. Generic compression added on top: `.hero-screen > section` padding now comes from the shared custom properties, and hero visuals carry a `hero-visual` class that scales with `zoom`. |
| `zoom`, not `transform: scale` | A transform shrinks the pixels but leaves the original box in the layout, so the page keeps the height it was trying to save. The earlier `.home-hero-card` rule had this flaw; it is now the shared `.hero-visual`. |

**Measured first-screen fit** (trust bar bottom vs viewport, headless, six
viewport sizes):

| Page | 1920x1080 | 1600x900 | 1440x820 | 1280x760 | 1280x700 | 1152x620 |
|---|---|---|---|---|---|---|
| Hire Engineers | fit | fit | fit | fit | fit | fit |
| Fractional CTO | fit | fit | fit | fit | fit | fit |
| Home | fit | fit | fit | fit | fit | fit |
| For Engineers | fit | fit | fit | fit | fit | fit |
| How It Works | fit | fit | fit | fit | +5px | +69px |
| Locations | fit | fit | fit | fit | +14px | +69px |

1152x620 is roughly 175% browser zoom. Those two pages have the most fixed
content in the hero (How It Works flanks its headline with two profile cards;
the location pages carry a three-card parallax stack), so they run out of budget
first and the page scrolls rather than clipping.

### 9d. Home calculator CTA + the Clara context blocker (28 Jul)

Jake's ask: after someone sets role / region / seniority and sees the estimate,
the CTA should read something like "Discuss further with AI", and clicking it
should take them to the assistant already knowing what they picked, so it can
talk about THAT estimate and keep qualifying the role.

**Shipped:** label is now "Discuss further with AI" (code fallback + the Sanity
patch script, which now accepts either of the two previous values so it works
whether or not the earlier run happened). The button opens the chat.

**BLOCKED, and it is external.** The context handoff cannot be built today.
Probed the live widget rather than assuming:

| Probe | Result |
|---|---|
| `window.ClaraWidget` API surface | `open()`, `close()`, `destroy()` only. No way to pass a message. |
| Chat iframe URL | `https://clara.cloudemployee.io/chat/<workspace>` with only a `mode` param. |
| `?message=` / `?q=` / `?prompt=` / `?initial_message=` on the chat URL | All load, all ignored — the input renders empty in a real browser. |
| `postMessage` into the widget | Only inbound type handled is `clara-close`. |

So the visitor currently arrives at the assistant cold and has to retype what
they just selected, which is worse than Jake is picturing.

**What would unblock it — one of:**
1. Clara accepts an opening message, either as `ClaraWidget.open({ message })`
   or as a `?message=` param on the chat URL. This is a small change on Clara's
   side and Seb owns that product. It is the cheapest path by a distance.
2. The bespoke chat page Jake already scoped on the call (his own estimate: a
   couple of weeks). Owning the chat surface means owning the handoff, and the
   calculator state can be passed straight into it.

**Not built deliberately:** Jake also floated stepping the visitor through
defining the role before the handoff. That is a new funnel stage, not a tweak
to an existing one, so it is an architecture decision for a brief rather than
something to invent mid-build.

### 9e. "Where we work" strip reshaped to the customer.io pattern (28 Jul)

Jake's reference: the capabilities strip on customer.io. Our panels were tall
narrow rectangles sitting apart; his ask was one spread-out, more-square band,
and horizontal scrolling instead of squashing on narrow screens.

Two things carried it, both in `components/shared/hub-panels/hub-panels.css`:

| Change | Before | After |
|---|---|---|
| Band proportion | 1312 x 620 (2.1:1) | 1312 x 400 (**3.28:1**, matching customer.io's ~3.2:1) |
| Panel at rest | 262 x 620 (1:2.4 portrait) | 262 x 400 (1:1.5) |
| Panel gaps | 6px gutters, 6px radius per panel | flush, hairline inset divider, 12px radius on the STRIP so it reads as one object |
| Below 1024px | panels stretched to 76% of viewport — stopped reading as a strip | fixed 240px (200px under 600px) panels, row scrolls sideways, hover-expand dropped |

Height is a single `--ww-h` custom property, stepped 400 / 340 / 300 / 260 down
the breakpoints, so the band stays landscape everywhere.

**Both consumers changed**, because they are the same visual element and two
different heights would be the odd outcome: the home "Where we work" section and
the Philippines location page's three-region strip. Verified at 1920, 900 and
420 wide plus the hover state. Say so if the Philippines one should stay tall.

**Second pass on the same component.** Jake: "it should be more positioned like
customer.io". The proportions from the first pass were already right; what was
wrong was the POSITIONING. Measured the live reference at a 1512px viewport
instead of eyeballing the screenshot:

| | customer.io | Ours (first pass) |
|---|---|---|
| Scroller | 1512 wide, starts at x=0, `overflow-x: auto` | 1312, inset in the content band |
| Row inside it | **1560 — wider than the screen** | fits exactly, no scroll |
| Panels | 5 x 299 x 500, all equal, no gap, no radius | 5 x 262 x 400, accordion on hover |

Three things followed, none of which were true of ours:

1. **Full bleed.** `.ww` is now a full-width section and only the heading is
   banded (`.ww-band`), so the strip runs edge to edge. Done structurally rather
   than with negative `100vw` margins, which risk giving the page its own
   sideways scrollbar.
2. **Always a sideways scroller**, at desktop too — that is the affordance, not
   a mobile fallback.
3. **Equal fixed-width panels; the width accordion is gone.** `flex: 1 0 300px`
   means panels share the space when there is room (so the strip fills a wide
   monitor) and clamp at their minimum when there is not (so it overflows and
   scrolls), with no breakpoint choosing between the two. Widening a panel
   inside a horizontal scroller shifts everything to its right mid-gesture,
   which is why the reference does not do it either. Hover still fades the veil,
   un-zooms the photo and flips the glyph to the lime arrow.

Measured after: 1920 -> 5 x 384, fills, no scroll. 1512 -> 5 x 302, fills.
1024 -> 5 x 300, scrolls. 420 -> 5 x 200, scrolls. No page-level horizontal
scroll at 1920 / 1512 / 1024 / 768 / 420 / 360.

**Two pre-existing overflow bugs found and fixed while verifying this**, both of
which made the whole page draggable sideways:

- `components/motion/spotlight.tsx` set its glow overlay to `inset: -320px`, so
  the overlay was 640px wider than its section. Home could be scrolled 320px
  sideways. Now bleeds vertically only, with the X offset mapping 1:1 — exactly
  what `home/client-story.tsx` (the section Spotlight was generalised from)
  always did and documented.
- The hero trust bar could not fit label + logos + CTA on one line below ~760px
  and overflowed a 420px viewport by 23px. It now wraps to label / logos /
  CTA stacked.

Corner radius: the strip is now full-bleed so it carries no radius, matching the
reference.

### 9f. Fractional CTO hero spacing + card size (28 Jul)

Jake: "space these out on the Fractional CTO page to be positioned better, and
the YOUR MATCH card should maybe be a better size to fit the page." Measured
before changing anything, at 1512x950:

| | Fractional CTO (before) | Hire Engineers |
|---|---|---|
| Hero grid | `1.05fr 480px` -> 776 / **480** | `1.05fr 0.95fr` -> 657 / **595** |
| Match card | 480 x 360, capped by `max-width: 480px` | 595 x 288, uncapped |
| Dead space in the hero band | **79px above, 135px below** (214px of the first screen unused) | 70 / 126 |

Two fixes:

1. **The card was pinned.** Fractional CTO's right column was a fixed 480px
   while the text column took 776px, so the card read as an afterthought beside
   it. Grid is now `1.05fr 0.95fr` and the `max-width: 480px` cap is gone, which
   puts it at 597 x 342 — the same balance as Hire Engineers. Both pages now
   compute to the same column widths (659/597 vs 657/595).

2. **`.hero-screen` is `justify-content: space-between`, not `center`.** Centring
   left ~200px of unused screen split above and below the content, which is the
   bunched-in-the-middle look Jake's two arrows were pointing at. Spreading puts
   the hero at the top of the first screen and the logo strip at the bottom; each
   section's own padding still supplies the breathing room, so nothing sits hard
   against an edge. Applies to all six `.hero-screen` pages, because the same
   dead space existed on all of them. Degrades to flex-start when content
   genuinely overflows, so the short-viewport fit table above is unchanged.

**Found and fixed while verifying:** the How It Works "Stages" H2 forced
`whitespace-nowrap` at 52px from `lg` (1024px) upward, but that line needs
~1114px of content width — so between 1024 and 1280 it was held on one line that
did not fit and gave the whole page a 90px sideways scroll. Moved to `xl`
(1280px). Pre-existing, unrelated to this work, caught by the overflow sweep.

Swept every page for page-level horizontal scroll at 1920x1080, 1440x900,
1280x760, 1152x620, 1024x900, 768x900 and 420x800: all clean.

### 9g. Strip banded to the header, panels squarer (28 Jul, third pass)

Jake: "in line with the header, the boxes should be in line with the header logo
and Schedule-a-Call CTA, but a little bit over past the logo and CTA, and the
shape needs to be more square-like, slightly rectangle."

The previous pass went too far: full-bleed edge to edge. Measuring the reference
at a WIDE viewport (1920, which is the state Jake's screenshots show) gives the
banded version, and the exact relationship:

```
customer.io @1920   strip 120..1800 (1680)   header logo 152, CTA right 1768
                    -> the strip sits 32px past the header on BOTH sides
                    panel 323 x 500 = 1.55 height:width
```

Our header is a 1440px CONTENT band plus 64px padding, so it measures 1440 wide
at >=1568 viewport and `viewport - 128` below. `.ww-strip-band` mirrors that
geometry with 32px of padding instead of 64, which lands the 32px overhang at
every width. Verified:

| Viewport | Strip | Header | Overhang | Panel | Scrolls |
|---|---|---|---|---|---|
| 1920 | 208..1712 (1504) | 240..1680 (1440) | **L32 R32** | 301x440 = 1.46 | no |
| 1680 | 88..1592 (1504) | 120..1560 (1440) | **L32 R32** | 301x440 = 1.46 | no |
| 1512 | 32..1480 (1448) | 64..1448 (1384) | **L32 R32** | 290x440 = 1.52 | no |
| 1440 | 32..1408 (1376) | 64..1376 (1312) | **L32 R32** | 275x440 = 1.60 | no |
| 1366 | 32..1334 (1302) | 64..1302 (1238) | **L32 R32** | 270x440 = 1.63 | yes |
| 1280 | 32..1248 (1216) | 64..1216 (1152) | **L32 R32** | 270x440 = 1.63 | yes |

Panel geometry is `440px` tall with a `270px` minimum width, chosen so the ratio
brackets the reference's 1.55 across the desktop range rather than matching at a
single width, and so the strip still FILLS its band down to 1440 (a common laptop)
before it starts clamping and scrolling. No page-level horizontal scroll at any
width.

The heading stays inside the header band, so it is indented 32px from the strip —
which is how the reference reads too.

Location pages keep the strip inside their own section band (no `.ww-strip-band`
wrapper), since that section is centre-aligned and an overhang there would look
like a mistake.

### 9h. Hero group perfectly centred at any zoom (28 Jul, supersedes 9f spacing)

Jake, after seeing the spread version at three zoom levels: "make the main hero
section perfectly centered no matter zoom is on it." `space-between` (9f) put the
hero at the top and the logos at the bottom, which reads well at 1080 tall and
turns into a void in the middle when zoomed out. Reverted to centred — but
properly this time, because `justify-content: center` alone was never enough:

**Why the earlier centred version still looked off-centre.** It centred the
BOX while the children kept unequal padding of their own — 92px on top of the
hero, 56px under the trust bar — so the content read 36px low. Measured before:
79px above / 135px below on Fractional CTO.

Three changes make it exact:

1. `justify-content: center` with `gap: var(--hero-gap)`. The gap sits INSIDE the
   group, so it spaces the hero from the logos without affecting the centring.
2. All vertical padding stripped off the children — `--hero-pad-*` and
   `--hero-trust-pad-*` zeroed for the scoped-stylesheet pages (`.he`, `.fcto`),
   and `.hero-screen > section, .hero-screen > div { padding-block: 0 }` for the
   Tailwind ones.
3. `.hero-screen.hero-screen { padding-block: 0 }` for How It Works, where
   `.hero-screen` IS the hero section rather than a wrapper and carried
   `lg:pt-[120px] lg:pb-[88px]` itself. Doubled class for (0,2,0) so it beats the
   utility outright instead of relying on source order. This was the last 32px.

`--hero-gap` steps down with the window (72 / 48 / 34 / 28 / 22) alongside the
headline and hero-visual scaling, so the group keeps fitting one screen as you
zoom in and stays centred rather than starting to overflow.

**Verified — space above vs space below, at six viewport sizes:**

| Page | 1920x1080 | 1512x950 | 1440x820 | 1280x760 | 1280x700 | 1152x620 |
|---|---|---|---|---|---|---|
| Home | 192/192 | 127/127 | 106/106 | 107/107 | 80/80 | 34/34 |
| Hire Engineers | 213/213 | 148/148 | 106/106 | 91/91 | 66/66 | 19/19 |
| Fractional CTO | 222/222 | 157/157 | 115/115 | 84/84 | 59/59 | 12/12 |
| How It Works | 181/181 | 116/116 | 91/91 | 68/68 | 44/44 | 15/15 |
| Locations | 161/161 | 96/96 | 54/54 | 40/40 | 15/15 | 0/0 |
| For Engineers | 97/97 | 112/112 | 62/62 | 63/63 | 33/33 | 19/19 |

Exact on all six at every size. For Engineers needed its own fix — the
`padding-bottom: 64px` on `.fe2-hero-vh` was making it bottom-heavy. No
page-level horizontal scroll on any of the six at 1920x1080, 1440x900, 1280x760,
1152x620, 1024x900 or 420x800.

### 9i. Logo strip anchored low, hero centred above it (28 Jul, supersedes 9h)

Jake, on the exactly-centred version: "that's good but the logos should be lower
down on the page."

**These two asks are geometrically exclusive and that is worth writing down.**
With the hero and the strip centred as one group, the strip can never get lower
than the vertical centre plus half the group. Solving for "logos 150px off the
bottom" on a 1080 screen needs a 394px gap between hero and logos, which is
absurd. Increasing the gap moves the logos down by only HALF the amount added,
because the group re-centres.

So the strip is now anchored at the bottom (44px clear) and the hero is centred
in the space above it, via auto margins on the hero rather than
`flex: 1` + `justify-content: center` — **that alternative needs `display: flex`
on the hero, and the location pages' hero IS a two-column grid, which overriding
display would have flattened.** Confirmed intact afterwards: `display: grid`,
`600px 656px`.

Consequence to be aware of: the hero's optical centre sits ~80px above the band's
true centre on a 1080 screen, because the strip and its clearance sit below it.
It reads as centred-with-a-footer, which is the standard pattern, but it is not
the same as 9h's exact centring. If the void between hero and logos ever looks
too big, the lever is `--hero-gap`.

**Three separate specificity traps hit in this one change**, all the same root
cause — `.he`, `.fcto` and `.fe2` each open with `.x, .x * { margin: 0; padding: 0 }`,
which ties with a single-class rule and wins on source order:

- `.hero-screen { padding-bottom: 44px }` was zeroed, so the strip sat flush
  against the fold on the two service pages.
- `margin-block: auto` on the hero was zeroed, so nothing centred.
- Both fixed by doubling the class (`.hero-screen.hero-screen`) for (0,2,0).

Also fixed: a backtick inside a CSS comment I added to `fe2-styles.ts` terminated
the template literal that file is built from, breaking the build. Caught by tsc.

**Verified:** strip bottom is a consistent 44px off the fold at 1920x1080,
1512x950, 1440x900, 1440x790, 1280x760 and 1280x700 on all six pages. Location
hero grid intact. No page-level horizontal scroll at any of nine sizes. The strip
falls below the fold at 420x800 by design — the whole `.hero-screen` treatment is
`min-width: 1024px`, and on mobile the hero scrolls normally.

### Outstanding from this pass

- **Upload `travelex-wordmark.png` to Sanity.** Sanity's Travelex asset is the
  same broken screenshot, so there is a named exception in
  `client-logo-strip.tsx` (`ASSET_OVERRIDE`) that substitutes the local clean
  file. Remove the exception once Studio holds a proper transparent wordmark.
- **Which other pages get the bar.** It is now on seven: Home, Hire Engineers,
  Fractional CTO, How It Works, the three location pages, and For Engineers.
  Pricing, Services hub, Technology hub, About Us, Contact and Our Work have
  CENTRED heroes with no right-hand visual, so the pattern does not transfer
  without a layout decision. Flagged rather than guessed.
- `forEngineersPage.hero.seeMore` is now an unused field on the content type and
  in Sanity. Left in place so the Sanity contract is unchanged; drop it at the
  next schema pass on that page.

---

### Found while building, not fixed (not on the approved list)

- **Two more dead links on Hire Engineers**, both pre-existing and unrelated to
  the AI CTAs: "See our full process" (`.how-more`) is `href="#"`, and the
  90-second tour link falls back to `href="#"` because `vet.tourVideoUrl` is
  empty. Same bug class as items 1-4. Worth a follow-up.
- **Fractional CTO's match form still submits nowhere.** Item 22 wired its
  reassurance pills; the multi-step form itself is still client-side only. That
  is Q11 / F8 territory - whether the form survives at all is undecided.
- The other three "Get matched at this rate" buttons (Hire Engineers, Pricing,
  Location) were left alone: unlike the home one they point at real destinations
  (`#find`, `/start-hiring`), so they are not broken. Worth a consistency
  decision alongside Q4.
