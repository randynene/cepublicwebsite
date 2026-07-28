# Seb call - consolidated edit list (28 Jul 2026)

> Source: `Meet-f169f595-fa1f.pdf`, Jake + Seb page-by-page review, 28 Jul 2026.
> Status: INVENTORY. Nothing here is approved for build yet. Jake decides in/out
> per row, and answers the OPEN QUESTIONS block before anything ships.
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
