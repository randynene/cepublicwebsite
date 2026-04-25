'use client'
import { createContext, useContext } from 'react'
import type { Locale } from '@/lib/locale'

const LocaleContext = createContext<Locale>('en-US')
export const useLocale = () => useContext(LocaleContext)

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}
