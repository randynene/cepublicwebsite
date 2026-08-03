// Mounts the real quick hiring form as a standalone page so every step can be
// clicked through and photographed without running the Next app.
//
// The app needs .env.local, which holds live credentials and is a hard no-touch
// rule, so a dev server is not an option here. This bundles the ACTUAL component
// with esbuild against the ACTUAL tokens, which means the states in the
// screenshots are the states that ship, not a reconstruction of them.

import { createRoot } from 'react-dom/client'

import { LeadFormSection } from '../../src/components/lead-form/section'

const container = document.getElementById('root')
if (!container) throw new Error('no #root')

createRoot(container).render(
  <>
    <div className="h-24 bg-bg-primary" />
    <LeadFormSection sourcePage="/technology/react-developers" />
    <div className="h-24 bg-bg-primary" />
  </>,
)
