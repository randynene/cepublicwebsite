import { cva, type VariantProps } from 'class-variance-authority'

import type { IconName } from '../_icons/icon-names'
import { cn } from '../_utils/cn'

// Sprite served as a static asset from `site/public/icons/sprite.svg`.
// Brief §2.1d shows `import sprite from '../_icons/sprite.svg'` + `${sprite}#${name}`
// — that path returns a Next.js StaticImport object under Turbopack/webpack,
// and template-string coercion produces "[object Object]#name" (broken).
// The static-public-asset path here is the working equivalent under Next.js 16.
// Source-of-truth sprite lives at `site/src/components/ui/_icons/sprite.svg`;
// `scripts/design/emit-icon-sprite.mjs` copies it to `public/icons/sprite.svg`.
const SPRITE_URL = '/icons/sprite.svg'

const iconVariants = cva('inline-block', {
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    },
  },
  defaultVariants: { size: 'md' },
})

export interface IconProps extends VariantProps<typeof iconVariants> {
  name: IconName
  className?: string
  // Required for standalone icons (icon-only buttons, decorative-but-meaningful).
  // Omit for purely decorative icons (chevrons next to "Read more" etc.) where
  // the surrounding text carries the meaning.
  ariaLabel?: string
}

export function Icon({ name, size, className, ariaLabel }: IconProps) {
  return (
    <svg
      {...(ariaLabel
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      className={cn(iconVariants({ size }), className)}
    >
      <use href={`${SPRITE_URL}#${name}`} />
    </svg>
  )
}

// STATIC-3 — Material Symbols font branch. Renders a Google Material
// Symbols ligature; pairs with the stylesheet link in layout.tsx.
// The Sanity `resourcesMegaMenu.leftColumn.items[].icon` field uses a
// discriminated `source: 'material-font' | 'asset'` shape (per STATIC-2
// schema). Seeded ligatures today: download / calculate / video_library
// / event_upcoming. Sizing scales the font-size to match the sprite
// branch's box dimensions.
type IconSize = 'sm' | 'md' | 'lg' | 'xl'

const materialIconSize: Record<IconSize, string> = {
  sm: 'text-[1rem] w-4 h-4',
  md: 'text-[1.25rem] w-5 h-5',
  lg: 'text-[1.5rem] w-6 h-6',
  xl: 'text-[2rem] w-8 h-8',
}

export interface MaterialIconProps {
  // Material Symbols ligature name (e.g. 'download'). See
  // https://fonts.google.com/icons for the catalogue.
  name: string
  size?: IconSize
  className?: string
  ariaLabel?: string
}

export function MaterialIcon({
  name,
  size = 'md',
  className,
  ariaLabel,
}: MaterialIconProps) {
  return (
    <span
      {...(ariaLabel
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      className={cn(
        'material-symbols-outlined inline-block leading-none align-middle',
        materialIconSize[size],
        className,
      )}
      // Material Symbols ligature — the font replaces the text content
      // with the icon glyph. Keep as text so it remains copy-safe and
      // selectable-tolerant.
      style={{ fontFeatureSettings: '"liga"' }}
    >
      {name}
    </span>
  )
}

// STATIC-3 — Asset-mode icon. Used when the Sanity icon discriminator
// is `source: 'asset'`. Consumer composes the asset URL (via
// `urlFor(...).url()`) and passes it as `src`. `alt` is required by
// the schema's `Rule.custom()` when source = asset; the type enforces it.
export interface AssetIconProps {
  src: string
  alt: string
  size?: IconSize
  className?: string
}

export function AssetIcon({
  src,
  alt,
  size = 'md',
  className,
}: AssetIconProps) {
  // Plain <img> — these are decorative small glyphs (24×24 typical).
  // next/image would add unnecessary overhead for sprite-scale assets.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(iconVariants({ size }), 'object-contain', className)}
    />
  )
}

export default Icon
