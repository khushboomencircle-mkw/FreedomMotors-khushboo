/**
 * One-off migration for the "Text field -> Rich Text" schema change.
 *
 * 16 fields across the schema changed from a plain `text` string to a rich
 * text (Portable Text) array: `pageDescription` (every page document),
 * `sectionDescription` (the shared Subtitle field used by banner/cards
 * grid/link list/accordion/feature grid sections), and `description` on
 * bannerSection, accordionSection, cardItem, featureCardItem, linkListItem,
 * and the `vehicle` document.
 *
 * Changing a field's type doesn't convert data already saved under the old
 * shape — a document with a plain string still sitting in one of these
 * fields now fails Studio's type check for that field (declared `array`,
 * stored `string`), the same way the border-width legacy shape did in
 * fixLegacyBorderWidths.ts. This wraps each such string into a single
 * Portable Text paragraph block, so it opens normally in the new rich text
 * editor with its existing text intact (now editable/formattable, not lost).
 *
 * `pageDescription` and `sectionDescription` are unambiguous field names —
 * only ever used by the fields this migration targets — so any string found
 * under either name, anywhere in the dataset, is converted. `description` is
 * reused by several OTHER fields this migration must leave alone (SEO Meta
 * Description, the mega menu's own feature-card description, Vehicle's
 * Options/Conversion Warranty, etc.), so it's only converted on an object
 * whose `_type` is in DESCRIPTION_TYPES below — every other `description` is
 * left untouched.
 *
 * Dry run by default — prints every change it would make without touching
 * the dataset. Add --write to actually apply them.
 *
 * Run with:
 *   npx sanity exec scripts/migrateTextFieldsToRichText.ts --with-user-token
 *   npx sanity exec scripts/migrateTextFieldsToRichText.ts --with-user-token -- --write
 */
import {getCliClient} from 'sanity/cli'

const WRITE = process.argv.includes('--write')

const DESCRIPTION_TYPES = new Set([
  'bannerSection',
  'accordionSection',
  'cardItem',
  'featureCardItem',
  'linkListItem',
  'vehicle',
])

type JSONValue = string | number | boolean | null | JSONValue[] | {[key: string]: JSONValue}

interface Patch {
  docId: string
  docType: string
  path: string
  fieldName: string
  before: string
}

function isPlainObject(v: unknown): v is Record<string, JSONValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function randomKey(): string {
  return Math.random().toString(36).slice(2, 14).padEnd(12, '0')
}

/** Wraps a plain string into a one-block, one-span Portable Text value. */
function toPortableText(text: string): JSONValue {
  return [
    {
      _type: 'block',
      _key: randomKey(),
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: randomKey(), text, marks: []}],
    },
  ]
}

/** Walks a document's JSON, collecting a patch for every legacy plain-string value found in a now-rich-text field. */
function findPatches(doc: Record<string, JSONValue>): Patch[] {
  const patches: Patch[] = []

  function walk(node: JSONValue, path: string, parentType?: string) {
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        const key = isPlainObject(item) && typeof item._key === 'string' ? `[_key=="${item._key}"]` : `[${i}]`
        walk(item, `${path}${key}`)
      })
      return
    }
    if (!isPlainObject(node)) return

    const thisType = typeof node._type === 'string' ? node._type : parentType

    for (const key of Object.keys(node)) {
      const value = node[key]
      const fieldPath = path ? `${path}.${key}` : key

      if (typeof value === 'string') {
        const isUnambiguous = key === 'pageDescription' || key === 'sectionDescription'
        const isScopedDescription = key === 'description' && thisType != null && DESCRIPTION_TYPES.has(thisType)
        if (isUnambiguous || isScopedDescription) {
          patches.push({
            docId: doc._id as string,
            docType: doc._type as string,
            path: fieldPath,
            fieldName: key,
            before: value,
          })
          continue
        }
      }

      walk(value, fieldPath, thisType)
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
    console.log('No legacy plain-text values found in rich text fields. Nothing to do.')
    return
  }

  console.log(
    `Found ${allPatches.length} legacy string value(s) across ${new Set(allPatches.map((p) => p.docId)).size} document(s):\n`,
  )
  for (const p of allPatches) {
    const preview = p.before.length > 70 ? `${p.before.slice(0, 70)}…` : p.before
    console.log(`[${p.docType} ${p.docId}] ${p.path}`)
    console.log(`  "${preview}"`)
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
    const setFields = Object.assign({}, ...patches.map((p) => ({[p.path]: toPortableText(p.before)})))
    await client.patch(docId).set(setFields).commit()
    fixedDocs += 1
    console.log(`Patched ${docId} (${patches.length} field${patches.length === 1 ? '' : 's'}).`)
  }

  console.log(`\nDone. Patched ${fixedDocs} document(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
