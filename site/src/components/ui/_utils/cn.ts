import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Extend tailwind-merge to recognize our custom --text-* tokens as
// font-size utilities. Without this, twMerge sees `text-h4` and
// `text-text-default` together and treats both as conflicting `text-*`
// classes (font-size vs text-color), silently stripping one. Our
// `--text-{name}` namespace generates font-size utilities; the
// `--color-text-{name}` namespace generates text-color utilities.
// Register the font-size names explicitly so twMerge keeps both.
//
// Verified bug pre-Step-2.19b: <blockquote> in B3 PortableText was
// rendering at body 16px instead of text-h4 24px because twMerge
// stripped `text-h4` when paired with `text-text-default`.
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'h1',
            'h1-desktop',
            'h2',
            'h2-desktop',
            'h4',
            'h5',
            'body',
            'body-sm',
            'body-lead',
            'body-large',
            'eyebrow',
            'display',
            'display-tablet',
            'display-mobile',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs))
}
