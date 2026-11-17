/**
 * By-hand equivalent of the Sanity webhook hitting `/api/redirects/sync` —
 * calls the exact same `syncRedirects()` in src/lib/redirects.ts directly,
 * so there's one code path for both, not two to keep in sync.
 *
 * Run with: npm run redirects:sync
 */
import {syncRedirects} from '../src/lib/redirects'

async function run() {
  const {count, dropped, map} = await syncRedirects()

  console.log(`Synced ${count} redirect(s) to Vercel Global Config.`)
  if (Object.keys(map).length > 0) {
    console.log('')
    for (const [source, entry] of Object.entries(map)) {
      console.log(`  ${source}  →  ${entry.destination}  (${entry.permanent ? '308' : '307'})`)
    }
  }

  if (dropped.length > 0) {
    console.log('')
    console.log(`Dropped ${dropped.length} redirect(s):`)
    for (const d of dropped) {
      console.log(`  ${d.source} — ${d.reason}`)
    }
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
