/**
 * Field integrity: the guard behind one strict rule of the Studio work.
 *
 *   NO existing field is ever removed, and no field's key (its `name`) ever changes.
 *
 * The website's queries (GROQ) read content by those names, and every saved document stores its values under them.
 * Remove or rename one and content silently disappears from the site or shows up as "Unknown field" in the Studio.
 * Everything in studio/usability may change how fields are TITLED, ORDERED, GROUPED and SHOWN — never what they are.
 *
 * This file only describes the schema as a flat list of "path :: type" lines so two versions can be compared. It is
 * pure (no Studio imports). The checks that use it live in fieldLock.test.ts.
 */

interface FieldLike {
  name?: string
  type?: string
  of?: MemberLike[]
  fields?: FieldLike[]
}
interface MemberLike {
  type?: string
  name?: string
  fields?: FieldLike[]
}
export interface TypeLike {
  name: string
  type?: string
  fields?: unknown[]
}

/** How a field's type reads in the list, e.g. `string`, `photoWithAlt`, `array<cardItem>`. */
function typeLabel(field: FieldLike): string {
  const base = field.type ?? 'unknown'
  if (base !== 'array') return base
  const members = (field.of ?? []).map((m) => m.type ?? 'unknown')
  return `array<${members.join(',')}>`
}

/**
 * Every field of every type, at every depth, as sorted `path :: type` lines.
 *
 *   cardsGridSection.cards :: array<cardItem>
 *   cardItem.title :: string
 *   bannerSection.images[object].photo :: photoWithAlt
 *
 * A registered type (a card, an image-with-alt, a typography block) is listed ONCE, under its own name, so a change
 * inside it shows up there and the list stays small. Objects and array rows that are written inline inside a field are
 * followed in place.
 */
export function describeSchema(types: TypeLike[]): string[] {
  const lines = new Set<string>()

  const walkFields = (fields: unknown[] | undefined, prefix: string) => {
    for (const raw of (fields ?? []) as FieldLike[]) {
      if (!raw.name) continue
      const path = `${prefix}.${raw.name}`
      lines.add(`${path} :: ${typeLabel(raw)}`)
      if (raw.fields) walkFields(raw.fields, path) // an inline object
      if (raw.type === 'array') {
        for (const member of raw.of ?? []) {
          if (member.fields) walkFields(member.fields, `${path}[${member.type ?? 'object'}]`) // an inline row
        }
      }
    }
  }

  for (const type of types) {
    if (Array.isArray(type.fields)) walkFields(type.fields, type.name)
  }
  return [...lines].sort()
}

/** What is wrong between a locked list and the current one: fields that vanished or changed type. */
export function compareToLock(
  locked: string[],
  current: string[],
): {missing: string[]; changed: string[]} {
  const now = new Map(current.map((l) => l.split(' :: ') as [string, string]))
  const missing: string[] = []
  const changed: string[] = []
  for (const line of locked) {
    const [path, type] = line.split(' :: ') as [string, string]
    if (!now.has(path)) missing.push(path)
    else if (now.get(path) !== type) changed.push(`${path}: was ${type}, now ${now.get(path)}`)
  }
  return {missing, changed}
}

/**
 * The properties a Studio-only change is allowed to alter on a field. Anything else (name, type, options, validation,
 * initial value, references …) is the field's identity and must stay exactly as it was.
 */
export const PRESENTATION_PROPS = new Set([
  'title',
  'description',
  'group',
  'fieldset',
  'hidden',
  'components',
  'placeholder',
  'icon',
])

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype

/** Same value? Plain objects and arrays are compared by content; functions, components and everything else by identity. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => sameValue(x, b[i]))
  if (isPlain(a) && isPlain(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return [...keys].every((k) => sameValue(a[k], b[k]))
  }
  return false
}

/** The names of the properties that differ between two versions of the same field, ignoring presentation ones. */
export function identityChanges(before: object, after: object): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const changed: string[] = []
  for (const key of keys) {
    if (PRESENTATION_PROPS.has(key)) continue
    if (
      !sameValue((before as Record<string, unknown>)[key], (after as Record<string, unknown>)[key])
    ) {
      changed.push(key)
    }
  }
  return changed
}
