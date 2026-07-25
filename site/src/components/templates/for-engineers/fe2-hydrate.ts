// Hydrate the tokenised frozen-export body (fe2-body.ts) from the content object.
//
// The export body is stored with unique tokens (U+27E6 path U+27E7) at every
// editable text node, and the original .fig-asset background classes at every
// photo. This function:
//   1. replaces each text token with the matching (HTML-escaped) content value;
//   2. for each photo, when the content provides a non-empty image URL, appends
//      an inline background-image override so Seb's uploaded photo shows in the
//      exact box; when empty, the baked .fig-asset placeholder is left untouched.
//
// Byte-identical parity: with the static defaults (all image fields empty),
// hydrate(template, FOR_ENGINEERS_CONTENT) reproduces the original export
// byte-for-byte. This is asserted at build time by scripts/static/verify-fe2-parity.
//
// Author voice: no em/en dashes - hyphens only.
import type { ForEngineersContent } from './content'

// .fig-asset class -> content path (image URL). Order-independent.
const PHOTO_MAP: Record<string, string> = {
  'fig-asset-a3fc3e3eca4dbe49': 'hero.card.image',
  'fig-asset-b44c608574a94621': 'how.steps.two.camYouImage',
  'fig-asset-c785f78cb666a48d': 'how.steps.two.camEngImage',
  'fig-asset-8165165c9b13b738-2f197fb6': 'benefits.photos.0.image',
  'fig-asset-06b14d14be3942d7-a2dbb718': 'benefits.photos.1.image',
  'fig-asset-5656f86462754e63-4fc95868': 'benefits.photos.2.image',
  'fig-asset-8f1066200d444094-72cc5769': 'tests.videoImage',
  'fig-asset-7b8a81ca08fbac3f': 'tests.quotes.0.image',
  'fig-asset-5f69556e7b65b3a6': 'tests.quotes.1.image',
  'fig-asset-0602740c6b8ea99e-2817dee1': 'tests.quotes.2.image',
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function hydrateFe2(template: string, content: ForEngineersContent): string {
  // 1. text tokens
  let out = template.replace(/\u27E6([^\u27E7]+)\u27E7/g, (_m, path: string) => {
    const v = getPath(content, path)
    return typeof v === 'string' ? esc(v) : ''
  })

  // 2. photos: override only when a non-empty URL is provided (else leave baked)
  for (const [cls, path] of Object.entries(PHOTO_MAP)) {
    const url = getPath(content, path)
    if (typeof url === 'string' && url.trim() !== '') {
      out = out.replace(
        new RegExp(`class="${cls}" style="([^"]*)"`),
        (_m, style: string) =>
          `class="${cls}" style="${style};background-image:url(&quot;${escAttr(url)}&quot;);background-position:center;background-size:cover;background-repeat:no-repeat"`,
      )
    }
  }
  return out
}
