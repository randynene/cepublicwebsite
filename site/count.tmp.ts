import { allRedirects } from './src/lib/redirects'
const prefixes = ['/blog/','/uk/blog/','/ph/blog/','/customer-story/','/uk/customer-story/','/ph/customer-story/']
for (const p of prefixes) {
  const n = allRedirects.filter(r => r.source.startsWith(p) && !r.source.includes(':')).length
  console.log(p, n)
}
