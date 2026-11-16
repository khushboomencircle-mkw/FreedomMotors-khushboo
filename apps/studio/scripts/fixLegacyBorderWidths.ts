/**
 * One-off fix for documents saved before Heading/Description Border switched
 * from an ad-hoc `{enabled, width: <number>, color}` shape to the shared
 * `borderConfig` object (`{show, width: <string>, color, radius, sides,
 * fullWidth}`, width now one of '1px'/'2px'/'3px'/'4px').
 *
 * A document with the old shape still sitting in `headingStroke`/
 * `descriptionStroke` now fails Studio's built-in type check — `width` is
 * declared a string but the stored value is a number — and a document with a
 * validation error can't be published. This showed up on every section of
 * several pages (confirmed live: homePage, ourStoryPage, commercialPage,
 * vehiclesPage, vehicleDetailPage, one customPage — 26 fields across 8
 * documents as of the scan that prompted this script).
 *
 * This walks every document, finds any object that has a numeric `width`
 * alongside `enabled`/`show`/`color` (i.e. looks like a border config), and:
 *   - maps the number to the nearest valid bucket (1→'1px' … 4px ceiling)
 *   - carries `enabled` over to `show` when `show` isn't already set, so a
 *     border someone had actually turned on keeps working (now as a real box
 *     border instead of the old, barely-visible text-stroke) instead of
 *     silently reverting to off
 *   - removes the now-unused `enabled` key
 * `radius`/`sides`/`fullWidth` are left alone — unset, they already render
 * correctly as "all 4 edges, square corners" (see getBorderStyles in
 * apps/web/src/components/PageSection.tsx), so there's nothing to backfill.
 *
 * Dry run by default — prints every change it would make without touching
 * the dataset. Add --write to actually apply them.
 *
 * Run with:
 *   npx sanity exec scripts/fixLegacyBorderWidths.ts --with-user-token
 *   npx sanity exec scripts/fixLegacyBorderWidths.ts --with-user-token -- --write
 */
import {getCliClient} from 'sanity/cli'

const WRITE = process.argv.includes('--write')

type JSONValue = string | number | boolean | null | JSONValue[] | {[key: string]: JSONValue}

interface Patch {
  docId: string
  docType: string
  path: string
  before: Record<string, JSONValue>
  setFields: Record<string, JSONValue>
  unsetPaths: string[]
}

function widthBucket(n: number): string {
  if (n <= 1) return '1px'
  if (n === 2) return '2px'
  if (n === 3) return '3px'
  return '4px'
}

function isPlainObject(v: unknown): v is Record<string, JSONValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Walks a document's JSON, collecting a patch for every legacy border-shaped object found. */
function findPatches(doc: Record<string, JSONValue>): Patch[] {
  const patches: Patch[] = []

  function walk(node: JSONValue, path: string) {
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        const key = isPlainObject(item) && typeof item._key === 'string' ? `[_key=="${item._key}"]` : `[${i}]`
        walk(item, `${path}${key}`)
      })
      return
    }
    if (!isPlainObject(node)) return

    if (typeof node.width === 'number' && ('enabled' in node || 'show' in node || 'color' in node)) {
      const setFields: Record<string, JSONValue> = {[`${path}.width`]: widthBucket(node.width)}
      const unsetPaths: string[] = []
      if (!('show' in node) && 'enabled' in node) {
        setFields[`${path}.show`] = node.enabled === true
        unsetPaths.push(`${path}.enabled`)
      }
      patches.push({
        docId: doc._id as string,
        docType: doc._type as string,
        path,
        before: node,
        setFields,
        unsetPaths,
      })
    }

    for (const key of Object.keys(node)) {
      if (key === 'width') continue
      walk(node[key], path ? `${path}.${key}` : key)
    }
  }

  walk(doc, '')
  return patches
}

async function main() {
  const client = getCliClient({apiVersion: '2024-01-01'})
  const docs = await client.fetch<Record<string, JSONValue>[]>('*[]')

  const allPatches = docs.flatMap(findPatches)
  if (allPatches.length === 0) {
    console.log('No legacy border widths found. Nothing to do.')
    return
  }

  console.log(`Found ${allPatches.length} legacy border field(s) across ${new Set(allPatches.map((p) => p.docId)).size} document(s):\n`)
  for (const p of allPatches) {
    console.log(`[${p.docType} ${p.docId}] ${p.path}`)
    console.log(`  before: ${JSON.stringify(p.before)}`)
    console.log(`  set:    ${JSON.stringify(p.setFields)}`)
    if (p.unsetPaths.length) console.log(`  unset:  ${JSON.stringify(p.unsetPaths)}`)
  }

  if (!WRITE) {
    console.log('\nDry run only — no changes made. Re-run with --write to apply.')
    return
  }

  const byDoc = new Map<string, Patch[]>()
  for (const p of allPatches) {
    byDoc.set(p.docId, [...(byDoc.get(p.docId) ?? []), p])
  }

  let fixedDocs = 0
  for (const [docId, patches] of byDoc) {
    const setFields = Object.assign({}, ...patches.map((p) => p.setFields))
    const unsetPaths = patches.flatMap((p) => p.unsetPaths)
    let tx = client.patch(docId).set(setFields)
    if (unsetPaths.length) tx = tx.unset(unsetPaths)
    await tx.commit()
    fixedDocs += 1
    console.log(`Patched ${docId} (${patches.length} field${patches.length === 1 ? '' : 's'}).`)
  }

  console.log(`\nDone. Patched ${fixedDocs} document(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
