/**
 * One-off migration for the "inline image+alt -> shared photoWithAlt type"
 * schema change (objects/photoWithAlt.ts), per the platform compliance
 * audit's NEEDS APPROVAL finding.
 *
 * 7 field locations change shape from a flat `{_type:'image', asset, alt}`
 * to a nested `{_type:'photoWithAlt', image:{_type:'image', asset}, alt}`:
 *   - cardItem.image, featureCardItem.image, linkListSection.image,
 *     containerConfig.backgroundImage, vehicle.mainImage — simple fields.
 *   - vehicle.gallery[] — array items that ARE the image value directly.
 *   - bannerSection.images[] — array items that are an image EXTENDED with
 *     other fields (overlayTitle, overlayDescription, linkUrl, openInNewTab,
 *     imageRadius, plus assorted orphaned legacy fields no longer in the
 *     schema at all — imagePadding/image_padding/paddingTop etc., confirmed
 *     present on real documents, in several different historical shapes).
 *     These become `{_type:'object', photo:{_type:'photoWithAlt', ...}, ...}`
 *     — image+alt nest under a new `photo` key, every OTHER existing key on
 *     the item (current-schema or orphaned) is carried through unchanged via
 *     object spread, since there is no single fixed list of "the extra
 *     fields" — different items have different legacy leftovers.
 *
 * Confirmed directly against the live dataset before writing this (not
 * assumed): every one of these 7 locations currently has an EMPTY `alt` on
 * every single document — 0 of ~81 populated image values across all 7
 * fields have any alt text today. Migrated values keep `alt: ''` rather than
 * inventing text; since photoWithAlt's `alt` field is `rule.required()`,
 * every migrated item will show a "required" validation warning in Studio
 * until an editor fills it in. That's a real, visible consequence of this
 * migration — not a bug in it.
 *
 * An empty slot (no `asset` at all) still gets normalized, not skipped —
 * an earlier version of this script left those alone, which is exactly
 * what kept causing "Invalid clipboard item" paste errors afterward: the
 * slot was still the OLD `_type:'image'` shape, just with nothing in it,
 * so it never stopped mismatching the new schema. A gallery/vehicle item
 * with no asset is removed entirely (nothing else lives on it worth
 * keeping). A banner images[] slot with no asset keeps its `_type` fixed
 * to `'object'` and keeps every other existing key (overlayTitle, link,
 * etc. — there's content worth keeping there even without a photo yet),
 * just with no `photo` key, same as a slot that was never touched at all.
 *
 * Dry run by default — prints every change it would make without touching
 * the dataset. Add --write to actually apply them.
 *
 * Run with:
 *   npx sanity exec studio/scripts/migrateImagesToPhotoWithAlt.ts --with-user-token
 *   npx sanity exec studio/scripts/migrateImagesToPhotoWithAlt.ts --with-user-token -- --write
 */
import {getCliClient} from 'sanity/cli'

const WRITE = process.argv.includes('--write')

type JSONValue = string | number | boolean | null | JSONValue[] | {[key: string]: JSONValue}

interface Patch {
  docId: string
  docType: string
  path: string
  label: string
  before: JSONValue
  kind: 'set' | 'unset'
  after?: JSONValue
}

function isPlainObject(v: unknown): v is Record<string, JSONValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Only the OLD raw shape needs touching — anything already `photoWithAlt` is left alone. */
function isUnmigratedImage(v: JSONValue): v is Record<string, JSONValue> {
  return isPlainObject(v) && v._type === 'image'
}

/**
 * Real data turned out to have a THIRD shape, not just the flat
 * `{_type:'image', asset, alt}` this script originally assumed: most
 * existing values are already `{_type:'image', alt, image:{_type:'image',
 * asset}}` — correctly nested one level deep, just with the outer `_type`
 * never updated to `photoWithAlt`. Confirmed by dumping `before` on every
 * flagged item: 30 of 31 "empty slot" guesses in an earlier version of
 * this script were actually real, uploaded photos with real alt text that
 * would have been DELETED. Always prefer the already-nested `image` value
 * untouched (keeps hotspot/crop data if any) over reconstructing one from
 * a top-level `asset`.
 */
function hasNestedImage(
  v: Record<string, JSONValue>,
): v is Record<string, JSONValue> & {image: Record<string, JSONValue>} {
  return isPlainObject(v.image) && Boolean((v.image as Record<string, JSONValue>).asset)
}

/** True if there's an actual photo to keep, in either the flat or nested shape. */
function hasRealImage(v: Record<string, JSONValue>): boolean {
  return hasNestedImage(v) || Boolean(v.asset)
}

/** -> `{_type:'photoWithAlt', image:{...}, alt}`. Caller guarantees there's real image data (nested or flat) to use. */
function reshapeSimpleImage(img: Record<string, JSONValue>): Record<string, JSONValue> {
  return {
    _type: 'photoWithAlt',
    image: hasNestedImage(img) ? img.image : {_type: 'image', asset: img.asset},
    alt: typeof img.alt === 'string' ? img.alt : '',
  }
}

/** Same reshape, but for a bannerSection.images[] item: nests under `photo`, carries every other existing key through unchanged (current-schema or orphaned legacy — there's no fixed list). */
function reshapeBannerImage(img: Record<string, JSONValue>): Record<string, JSONValue> {
  const {_key, _type, asset, alt, image, ...rest} = img
  const hasRealImage = hasNestedImage(img) || Boolean(asset)
  return {
    _key,
    _type: 'object',
    ...(hasRealImage
      ? {
          photo: {
            _type: 'photoWithAlt',
            image: hasNestedImage(img) ? image : {_type: 'image', asset},
            alt: typeof alt === 'string' ? alt : '',
          },
        }
      : {}),
    ...rest,
  }
}

/** Named simple-image fields, keyed by `${parentType}.${fieldName}`. */
const SIMPLE_IMAGE_FIELDS = new Set([
  'cardItem.image',
  'featureCardItem.image',
  'linkListSection.image',
  'containerConfig.backgroundImage',
  'vehicle.mainImage',
])

function findPatches(doc: Record<string, JSONValue>): Patch[] {
  const patches: Patch[] = []

  function walk(node: JSONValue, path: string, parentType?: string) {
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        const key =
          isPlainObject(item) && typeof item._key === 'string' ? `[_key=="${item._key}"]` : `[${i}]`
        walk(item, `${path}${key}`, parentType)
      })
      return
    }
    if (!isPlainObject(node)) return

    const thisType = typeof node._type === 'string' ? node._type : parentType

    for (const key of Object.keys(node)) {
      const value = node[key]
      const fieldPath = path ? `${path}.${key}` : key

      // vehicle.gallery[] — array items ARE the image value directly.
      if (thisType === 'vehicle' && key === 'gallery' && Array.isArray(value)) {
        value.forEach((item, i) => {
          if (!isUnmigratedImage(item)) return
          const itemKey = typeof item._key === 'string' ? `[_key=="${item._key}"]` : `[${i}]`
          if (hasRealImage(item)) {
            patches.push({
              docId: doc._id as string,
              docType: doc._type as string,
              path: `${fieldPath}${itemKey}`,
              label: 'vehicle.gallery[]',
              before: item,
              kind: 'set',
              after: {...reshapeSimpleImage(item), _key: item._key},
            })
          } else {
            // Empty slot, nothing to carry forward — remove it outright.
            patches.push({
              docId: doc._id as string,
              docType: doc._type as string,
              path: `${fieldPath}${itemKey}`,
              label: 'vehicle.gallery[] (empty slot, removed)',
              before: item,
              kind: 'unset',
            })
          }
        })
        continue // don't also generically recurse into gallery items below
      }

      // bannerSection.images[] — array items get the richer restructure.
      if (thisType === 'bannerSection' && key === 'images' && Array.isArray(value)) {
        value.forEach((item, i) => {
          if (!isUnmigratedImage(item)) return
          const itemKey = typeof item._key === 'string' ? `[_key=="${item._key}"]` : `[${i}]`
          patches.push({
            docId: doc._id as string,
            docType: doc._type as string,
            path: `${fieldPath}${itemKey}`,
            label: hasRealImage(item)
              ? 'bannerSection.images[]'
              : 'bannerSection.images[] (empty slot, type fixed)',
            before: item,
            kind: 'set',
            after: reshapeBannerImage(item),
          })
        })
        continue
      }

      // Named simple-image fields.
      if (thisType && isUnmigratedImage(value) && SIMPLE_IMAGE_FIELDS.has(`${thisType}.${key}`)) {
        if (hasRealImage(value)) {
          patches.push({
            docId: doc._id as string,
            docType: doc._type as string,
            path: fieldPath,
            label: `${thisType}.${key}`,
            before: value,
            kind: 'set',
            after: reshapeSimpleImage(value),
          })
        } else {
          // Empty slot, nothing to carry forward — remove it outright.
          patches.push({
            docId: doc._id as string,
            docType: doc._type as string,
            path: fieldPath,
            label: `${thisType}.${key} (empty slot, removed)`,
            before: value,
            kind: 'unset',
          })
        }
        continue // this value's own sub-tree doesn't need generic walking
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
    console.log('No matching image fields found. Nothing to do.')
    return
  }

  const byLabel = new Map<string, number>()
  for (const p of allPatches) byLabel.set(p.label, (byLabel.get(p.label) ?? 0) + 1)

  console.log(
    `Found ${allPatches.length} image value(s) to migrate across ${new Set(allPatches.map((p) => p.docId)).size} document(s):\n`,
  )
  for (const [label, count] of byLabel) {
    console.log(`  ${label}: ${count}`)
  }
  console.log()

  for (const p of allPatches) {
    console.log(`[${p.docType} ${p.docId}] ${p.path} (${p.label})`)
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
    const setPatches = patches.filter((p) => p.kind === 'set')
    const unsetPatches = patches.filter((p) => p.kind === 'unset')
    let tx = client.patch(docId)
    if (setPatches.length > 0) {
      tx = tx.set(Object.assign({}, ...setPatches.map((p) => ({[p.path]: p.after}))))
    }
    if (unsetPatches.length > 0) {
      tx = tx.unset(unsetPatches.map((p) => p.path))
    }
    await tx.commit()
    fixedDocs += 1
    console.log(`Patched ${docId} (${patches.length} field${patches.length === 1 ? '' : 's'}).`)
  }

  console.log(
    `\nDone. Patched ${fixedDocs} document(s), ${allPatches.length} image value(s) total.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
