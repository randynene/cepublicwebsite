import 'server-only'

// XSS-safe JSON-LD serialization. Sanity-authored values can contain
// `</script>` or similar control sequences that would break out of the
// <script type="application/ld+json"> wrapper and inject HTML/JS into
// the rendered page. Any CMS field is in scope for this XSS vector —
// no "safe field" carve-outs.
//
// Pattern per CMA F4 v1.3 (TEMPLATE-BLOG brief §4.6a):
//   - <  / >  / &     escaped as Unicode escapes (< / > / &)
//   - U+2028 / U+2029 escaped (JS-only line terminators that break
//     JSON.parse on some clients)
//
// Apply uniformly to every JSON-LD emission site sitewide.

// U+2028 / U+2029 regexes built via constructor so the source contains
// readable escape sequences rather than the invisible characters themselves.
const LINE_SEPARATOR = new RegExp('\\u2028', 'g')
const PARAGRAPH_SEPARATOR = new RegExp('\\u2029', 'g')

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR, '\\u2029')
}
