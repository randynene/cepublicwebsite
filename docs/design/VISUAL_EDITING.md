# Visual Editing — how Seb edits the site

Plain-English guide for editing Cloud Employee content in Sanity Studio
with the Presentation preview.

Studio: https://mygratr-cloudemployee.sanity.studio/

---

## What works today (Seb unblock)

1. Open Studio and sign in (you need an **Editor** role, not Viewer).
2. Click **Presentation** in the top bar (the preview icon).
3. Open **Home Page** (or use the location link to `/`).
4. In the preview, click the big headline.
5. Change the **Title** field on the left.
6. Press **Publish**.
7. The preview headline should update within a few seconds.

This is a smoke page — it only shows the Home Page title for now.
Full page templates come later (TEMPLATE-* phases).

---

## If Publish is grey / blocked / “doesn’t go through”

Look for a red warning at the top of the document. Common causes:

| Message / feeling | Fix |
|---|---|
| Missing Meta title / Meta description | Fill Meta title (≤60 chars) and Meta description (140–160 chars), then Publish again. |
| Account feels read-only | Ask Jake to set your Sanity project role to **Editor**. |
| Preview is blank or errors | Jake needs to point Studio’s preview URL at the live Vercel site and redeploy Studio. |

Home Page **Sections** are optional — an empty Sections list must not block Publish.

---

## Two round-trips (for later full Visual Editing)

**A — Click-to-edit (~10s):** click text/image in the preview → Studio focuses that field.

**B — Publish-to-preview (~5s):** edit → Publish → preview refreshes via Sanity Live.

---

## Jake checklist (one-time ops)

1. Confirm Seb’s Sanity role is **Editor** (manage.sanity.io → project → members).
2. In Vercel project env (Production + Preview):
   - `NEXT_PUBLIC_SANITY_PROJECT_ID=lzbhll1u`
   - `NEXT_PUBLIC_SANITY_DATASET=production`
   - `NEXT_PUBLIC_SANITY_STUDIO_URL=https://mygratr-cloudemployee.sanity.studio`
   - `NEXT_PUBLIC_SITE_URL=<stable Vercel production URL>`
   - `SANITY_API_READ_TOKEN=<viewer read token>`
3. Redeploy the Next.js site after env is set.
4. Redeploy Studio with preview origin set:

```bash
cd studio
SANITY_STUDIO_PREVIEW_URL_ORIGIN=https://YOUR-STABLE-VERCEL-URL \
  npx sanity deploy
```

5. In Sanity project CORS, allow the Studio host and the Vercel site origin.
6. Smoke test: Presentation → click Home headline → edit Title → Publish → preview updates.

---

## Note on live cloudemployee.io

Publishing in Sanity updates the **new** Next.js + Sanity stack.
It does **not** change the current live Webflow site until cutover (LAUNCH).
