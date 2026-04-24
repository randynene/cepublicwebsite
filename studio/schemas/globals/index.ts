import siteSettings from './site-settings'
import navigation from './navigation'
import footer from './footer'

export const globalTypes = [siteSettings, navigation, footer]

export const GLOBAL_TYPE_NAMES = globalTypes.map((t) => t.name)
