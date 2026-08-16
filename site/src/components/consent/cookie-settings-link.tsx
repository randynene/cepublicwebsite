'use client'

import { UI_STRINGS } from '@/lib/ui-strings'

import { useConsent } from './consent-provider'

/**
 * Permanent footer control that reopens the preferences panel.
 *
 * Not optional decoration: withdrawing consent has to be as easy as giving it,
 * which means there must be a way back to the choice on every page, forever.
 * Without this the banner is a one-time gate and the consent is not withdrawable.
 */
export function CookieSettingsLink() {
  const { openSettings } = useConsent()

  return (
    <button
      type="button"
      onClick={openSettings}
      className="text-[14px] leading-none text-[#B8C2D1] transition duration-reveal ease-reveal hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring motion-reduce:transition-none"
    >
      {UI_STRINGS['cookie.settingsLink']}
    </button>
  )
}
