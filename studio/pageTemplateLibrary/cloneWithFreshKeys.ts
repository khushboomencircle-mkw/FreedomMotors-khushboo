import {randomKey} from '@sanity/util/content'

/**
 * Deep-copies a template's content for a NEW page, giving every keyed object a fresh `_key`.
 *
 * Why a dedicated function: a page created from a template must be fully independent, and Sanity needs array items to have
 * keys that are unique within their array. Copying a template's keys would make every page made from it share them.
 *
 * What it guarantees (each one is covered by cloneWithFreshKeys.test.ts):
 *  - every object that has a `_key` gets a new one, and all new keys are unique across the whole copy;
 *  - rich-text links stay intact: a Portable Text block lists its links in `markDefs` (each with a `_key`) and its spans point
 *    at them by key in `marks`. A link's new key is applied to both places together; plain decorators ("strong", "em") are
 *    not keys and are left alone;
 *  - references are untouched: `_ref`, `_weak`, `_type` and uploaded-file references are copied as-is;
 *  - objects that never had a `_key` do not get one (that would add fields the schema doesn't expect);
 *  - document-level system fields (`_id`, `_rev`, `_createdAt`, `_updatedAt`) are dropped from the root;
 *  - the input is never modified.
 */

const ROOT_SYSTEM_FIELDS = new Set(['_id', '_rev', '_createdAt', '_updatedAt', '_originalId'])

type KeyMaker = () => string
type Json = unknown
type MarkMap = ReadonlyMap<string, string>

export function cloneWithFreshKeys<T extends Json>(
  value: T,
  makeKey: KeyMaker = () => randomKey(12),
): T {
  const used = new Set<string>()
  // Never hand out the same key twice, even if the generator repeats itself.
  const freshKey = () => {
    let key = makeKey()
    while (used.has(key)) key = makeKey()
    used.add(key)
    return key
  }

  const cloneNode = (node: Json, marks: MarkMap | undefined, isRoot: boolean): Json => {
    if (Array.isArray(node)) return node.map((item) => cloneNode(item, marks, false))
    if (node === null || typeof node !== 'object') return node

    const source = node as Record<string, Json>

    // A Portable Text block: decide the new key of each link up front, so the spans can follow it.
    let scopeMarks = marks
    if (Array.isArray(source.markDefs)) {
      const map = new Map<string, string>(marks)
      for (const def of source.markDefs) {
        const key = (def as Record<string, Json> | null)?._key
        if (typeof key === 'string') map.set(key, freshKey())
      }
      scopeMarks = map
    }

    const out: Record<string, Json> = {}
    for (const [field, fieldValue] of Object.entries(source)) {
      if (isRoot && ROOT_SYSTEM_FIELDS.has(field)) continue

      if (field === '_key' && typeof fieldValue === 'string') {
        // A link definition reuses the key already chosen for it above; everything else gets a new one.
        out._key =
          scopeMarks?.get(fieldValue) && isMarkDef(source)
            ? scopeMarks.get(fieldValue)!
            : freshKey()
      } else if (field === 'marks' && Array.isArray(fieldValue)) {
        out.marks = fieldValue.map((mark) =>
          typeof mark === 'string' && scopeMarks?.has(mark) ? scopeMarks.get(mark)! : mark,
        )
      } else {
        out[field] = cloneNode(fieldValue, scopeMarks, false)
      }
    }
    return out
  }

  return cloneNode(value, undefined, true) as T
}

/**
 * An object is a link definition (an item of `markDefs`) when it is not a block/span itself and carries a `_type`.
 * Used so a link keeps the key chosen for it, while a span with the same old key text (never the case in real data) would not.
 */
function isMarkDef(obj: Record<string, Json>): boolean {
  return typeof obj._type === 'string' && obj._type !== 'span' && obj._type !== 'block'
}
