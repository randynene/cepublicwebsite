# Visual Editing — how Seb edits the site

Plain-English guide for editing Cloud Employee content in Sanity Studio
with the Presentation preview.

Studio: https://mygratr-cloudemployee.sanity.studio/  
Preview site (source of truth): https://staging.jakevibes.dev/

---

## What works today

1. Open Studio and sign in (you need an **Editor** role, not Viewer).
2. Click **Presentation** in the top bar (the preview icon).
3. Open a page document (e.g. **Home Page**).
4. Confirm the preview loads **staging.jakevibes.dev** (the designed site).
5. Click text in the preview → edit the field → **Publish**.
6. Preview should update within a few seconds.

Staging is the designed Cloud Employee site. Live `cloudemployee.io` stays
on Webflow until cutover.

---

## If Publish is grey / blocked / “doesn’t go through”

Look for a red or yellow warning at the bottom of the document. Common causes:

| Message / feeling | Fix |
|---|---|
| Missing Locale | Set **Locale** to **Default (US)** (or UK), then Publish. |
| Missing Meta title / Meta description | Fill Meta title (≤60 chars) and Meta description (140–160 chars). |
| Account feels read-only | Ask Jake to set your Sanity project role to **Editor** (or Admin). |
| Preview is blank or wrong site | Studio preview origin should be `https://staging.jakevibes.dev`. |

---

## Two round-trips

**A — Click-to-edit (~10s):** click text/image in the preview → Studio focuses that field.

**B — Publish-to-preview (~5s):** edit → Publish → preview refreshes via Sanity Live.

---

## Jake checklist (ops)

1. Confirm Seb’s Sanity role is **Editor** or **Administrator**.
2. Vercel project serves staging content from the designed branch / `main` after lock-in.
3. Redeploy Studio with preview origin set when needed:

```bash
cd studio
SANITY_STUDIO_PREVIEW_URL_ORIGIN=https://staging.jakevibes.dev \
  npx sanity deploy
```

4. Sanity CORS includes `https://staging.jakevibes.dev` (Allow credentials ON).
5. Smoke test: Presentation → edit a visible field → Publish → staging updates.

---

## Note on live cloudemployee.io

Publishing in Sanity updates the **new** Next.js + Sanity stack on staging.
It does **not** change the current live Webflow site until cutover (LAUNCH).
