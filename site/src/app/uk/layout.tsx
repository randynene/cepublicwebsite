import { LocaleProvider } from '@/components/locale-provider'

export default function UkLayout({ children }: { children: React.ReactNode }) {
  return <LocaleProvider locale="en-GB">{children}</LocaleProvider>
}
