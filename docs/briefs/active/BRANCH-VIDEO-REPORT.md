# Branch report - customer story video (CE-69 + CE-62)

Branch: `fix/story-video`, cut fresh from `origin/main` (`103952e`).
Not merged, no PR, nothing pushed to `main`.

## What shipped

Two commits.

| Commit | What |
|---|---|
| `88af13c` | CE-62 play button + 16:9 frame. Cherry-picked, unchanged in substance. |
| `504f20f` | CE-69 Vimeo privacy hash carried through to the embed. New work. |

### Step 1 - untangling `fix/marker-ce62-story-video`

That branch held 5 commits. Only ONE was video work.

**Taken (1):**
- `f875e31` CE-62: give the customer story video a play button, and a frame that fits it

**Left behind (4), all pricing / Hire Engineers, another agent owns them:**
- `ebabaad` Hire Engineers hero: put the headline back on the site's own type scale
- `ea0b995` Hero polish, Marcus's photo, and the step rail off every form
- `603d70e` Hire Engineers: vetting card into the hero, sharper proof photos, no step rail
- `eda54a9` Move the pricing hero up, add the logo band, and build the email gate

The cherry-pick hit one conflict, in `tools/eslint/ui-strings.json`, and it was
noise: a `reconciled_at` timestamp on both sides. Kept main's newer stamp. The
actual payload of that hunk, the `customerStory.playVideo` key, applied cleanly
and is present in both the JSON source of truth and the generated
`site/src/lib/ui-strings.ts`.

### Step 2 - the CE-69 bug

The SQR video was never missing. It is unlisted, so its Sanity `videoUrl`
carries a Vimeo privacy hash, and the old `parseVimeoId()` kept only the digits.
The embed src was rebuilt from the id alone, Vimeo refused it, and the frame
rendered empty.

`parseVimeoRef()` now returns the id AND the hash, and both the ambient loop and
the sound-on player append it. Checked against the production dataset rather
than assumed:

- 17 customer stories, 6 carry a `videoUrl`
- exactly one, `sqr`, carries a hash (`h=031795f3d1`)
- the other five are public and produce byte-identical srcs to before

Nothing is hardcoded to SQR. The hash is read off whatever URL Sanity holds, and
both of Vimeo's spellings are accepted: the `h` query param, which is what SQR
has, and the second-path-segment form (`vimeo.com/<id>/<hash>`). The next
unlisted upload works with no code change.

### Step 3 - the behaviour, on all six stories

Not one page. The component is the shared customer story hero, so all six get it.

- Ambient muted loop autoplays on landing (`background=1`, muted, looping).
- A lime play button sits over it at all times until clicked.
- Clicking mounts a fresh player iframe with `autoplay=1` and no mute, so it
  starts from zero with sound rather than taking over the loop mid-way.
- `prefers-reduced-motion: reduce` hides the ambient loop; the play button stays
  and click-to-play still works.

## Step 4 - verification

Against a production build (`npm run build` then `npm start`), driven with a real
headless Chromium, all six pages:

| Slug | HTTP | Play button | Frame | Hash on src |
|---|---|---|---|---|
| sqr | 200 | visible | 1150x646 (1.780) | yes |
| salmon-software | 200 | visible | 1150x646 (1.780) | no (public) |
| willo | 200 | visible | 1150x646 (1.780) | no (public) |
| cleanlink | 200 | visible | 1150x646 (1.780) | no (public) |
| mercato | 200 | visible | 1150x646 (1.780) | no (public) |
| travel-tech-client | 200 | visible | 1150x646 (1.780) | no (public) |

Clicking the button was driven for real on each page, and each one swapped to a
player src with `background=1` and `muted` both gone. Reduced motion checked
both ways on `sqr`.

`npx tsc --noEmit` clean. `npx eslint` on the touched folder clean.
`npm run build` clean.

## Judgement calls

1. **Cherry-picked `f875e31` as-is rather than rewriting it.** It already
   implements the CE-62 spec exactly, including the restart-from-the-start
   decision. Only its inputs changed, to take the hash.
2. **Accepted both hash spellings, not just the `h` param.** Only the query form
   exists in the data today; the path form costs one regex group and is the form
   Vimeo's own share dialog produces.
3. **Kept the reduced-motion behaviour as a hidden loop, not a still frame.** A
   still would need a poster asset that does not exist for these videos, and the
   dark frame plus play button reads correctly without one.
4. **Fixed one pre-existing em-dash** in a comment I was already editing. No
   other unrelated cleanup.
5. **Left the repo-wide lint errors alone.** `npm run lint` reports 34 errors
   across the site, all pre-existing and logged as Tech Debt #36. Zero of them
   are in `customer-story/`; eslint exits 0 on that folder.

## Blocked / needs one look on production

**Vimeo playback itself could not be confirmed on this machine.** Every request
to `player.vimeo.com` is intercepted on this network and 301s to
`internet-positif.info`, an ISP content-filter block page. It hits the public
videos identically, so it is not related to the hash or to this change, and the
same interception is why `curl` needed `-k` and why a CLI probe of Vimeo's
oEmbed API returned a Cloudflare challenge for all three test URLs.

So what is proven here is that the correct src is constructed, requested, and
swapped on click, on all six pages. What still needs a human eye, once this is
on a preview deployment, is that the SQR picture actually appears. That is the
one thing this environment cannot answer. The original CE-62 commit hit the same
wall and said so.

## Note on the working tree

Another agent stashed the uncommitted pricing work mid-session
(`stash@{0}`, "pre-fix/forms: uncommitted pricing calculator-gate work"). It was
not touched here and is not lost, it is in that stash.
