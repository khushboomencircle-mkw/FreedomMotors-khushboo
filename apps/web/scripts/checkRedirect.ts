/**
 * Looks up a path against the live Vercel Global Config redirect map —
 * exactly what proxy.ts reads at request time — so this answers "does this
 * redirect actually work in production right now", not just "is it in
 * Sanity".
 *
 * Run with: npm run redirects:check -- /old-path/
 */
import {get} from '@vercel/global-config'
import {GLOBAL_CONFIG_REDIRECTS_KEY, normalizePath, type RedirectMap} from '../src/lib/redirects'

async function run() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npm run redirects:check -- /old-path/')
    process.exit(1)
  }

  const pathname = normalizePath(input)
  const map = await get<RedirectMap>(GLOBAL_CONFIG_REDIRECTS_KEY)
  const entry = map?.[pathname]

  if (!entry) {
    console.log(`"${input}" (normalized: "${pathname}") has no redirect. It would be served normally.`)
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
