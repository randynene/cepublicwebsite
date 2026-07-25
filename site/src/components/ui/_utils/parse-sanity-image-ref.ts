// Sanity asset _ref parser — extracted from E1 Image (TEMPLATE-BLOG HALT 2)
// so server components (B3 PortableText) can call it without crossing the
// client boundary that E1 now sits on.
//
// Format: image-{hash}-{W}x{H}-{format}. Returns null on edge cases (legacy
// uploads with non-standard ref shapes); consumer falls back to explicit
// width/height props when this returns null.
export function parseSanityImageRef(
  ref: string | undefined | null,
): { width: number; height: number; format: string } | null {
  if (!ref) return null
  const m = ref.match(/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/)
  if (!m) return null
  return {
    width: parseInt(m[2], 10),
    height: parseInt(m[3], 10),
    format: m[4],
  }
}
