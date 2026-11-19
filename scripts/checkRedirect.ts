/**
 * Looks up a path in the redirects the site uses right now — the published, active Studio redirects, flattened
 * exactly as src/proxy.ts does — so this answers "would this path redirect", not just "is it in Sanity".
 * (The site keeps its copy for up to 30 seconds, so a redirect published a moment ago may take that long.)
 *
 * Run with: npm run redirects:check -- /old-path/
 */
import {getRedirectMap, normalizePath} from '../src/lib/redirects'

async function run() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npm run redirects:check -- /old-path/')
    process.exit(1)
  }

  const pathname = normalizePath(input)
  const map = await getRedirectMap()
  const entry = map[pathname]

  if (!entry) {
    console.log(
      `"${input}" (normalized: "${pathname}") has no redirect. It would be served normally.`,
    )
    return
  }

  console.log(
    `"${input}" (normalized: "${pathname}") → "${entry.destination}" ` +
      `(${entry.permanent ? '308 Permanent' : '307 Temporary'})`,
  )
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
