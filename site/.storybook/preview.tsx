import type { Preview } from '@storybook/nextjs'

// Render stories with the live CE design system. globals.css imports
// tailwindcss + tokens.css — both layers are required (tokens.css is
// @theme-only and does not bring Tailwind's utility CSS by itself).
//
// next/image, next/link, and next/font are not mocked here. The
// @storybook/nextjs framework handles all three automatically via
// its preset (image-context + image stub, link.mock, and a webpack
// loader for next/font/{local,google}). Authoring decorators for
// them would be redundant and would not work for next/font (a
// compile-time transform, not a runtime React boundary).
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
