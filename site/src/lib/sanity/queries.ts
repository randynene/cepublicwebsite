import 'server-only'
import { sanityClient } from './client'

export async function getSiteSettings() {
  return sanityClient.fetch(`*[_type == "siteSettings"][0]`)
}
