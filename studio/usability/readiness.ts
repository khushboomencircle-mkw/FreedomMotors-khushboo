/**
 * Publish-readiness checks, in plain language.
 *
 * These are WARNINGS, never errors: they show next to the section in the Studio ("Card 2 is empty …") but never stop
 * anyone from publishing. Each message says what is wrong, why it matters, and how to fix it. Pictures without a
 * description (alt text) are not checked here: that is already a required field.
 *
 * Pure functions (no Studio imports), so every message is unit-tested.
 */

type Block = {children?: {text?: string}[]}
type Row = Record<string, unknown> & {_key?: string}

/** True when a Portable Text value has any real words in it. */
export function hasText(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (!Array.isArray(value)) return false
  return (value as Block[]).some((b) => (b.children ?? []).some((c) => (c.text ?? '').trim()))
}

const hasString = (v: unknown) => typeof v === 'string' && v.trim().length > 0
const hasPicture = (v: unknown) =>
  Boolean(((v as {image?: {asset?: unknown}} | undefined)?.image ?? {}).asset)
const hasFile = (v: unknown) => Boolean((v as {asset?: unknown} | undefined)?.asset)

/** "Card 2", "Cards 2 and 4", "Cards 1, 3 and 5". */
export function listItems(noun: string, numbers: number[]): string {
  if (numbers.length === 1) return `${noun} ${numbers[0]}`
  const head = numbers.slice(0, -1).join(', ')
  return `${noun}s ${head} and ${numbers[numbers.length - 1]}`
}

/** 1-based positions of the rows for which `isProblem` is true. */
const positions = (rows: unknown, isProblem: (row: Row) => boolean): number[] =>
  (Array.isArray(rows) ? (rows as Row[]) : []).flatMap((row, i) =>
    isProblem(row ?? {}) ? [i + 1] : [],
  )

const emptyCard = (c: Row) =>
  !hasString(c.title) &&
  !hasString(c.eyebrow) &&
  !hasString(c.badge) &&
  !hasText(c.description) &&
  !hasPicture(c.image) &&
  !hasFile(c.videoFile) &&
  !hasString(c.videoUrl)

const emptyFeature = (f: Row) =>
  !hasString(f.title) &&
  !hasText(f.description) &&
  !hasPicture(f.image) &&
  !hasFile(f.videoFile) &&
  !hasString(f.videoUrl)

/** One check: its id, and the message to show (or undefined when all is well). */
export interface Check {
  id: string
  run: (section: Record<string, unknown>) => string | undefined
}

/** The checks for each section type. */
export const SECTION_CHECKS: Record<string, Check[]> = {
  cardsGridSection: [
    {
      id: 'empty-cards',
      run: (s) => {
        const n = positions(s.cards, emptyCard)
        return n.length
          ? `${listItems('Card', n)} ${n.length === 1 ? 'is' : 'are'} empty and will show as blank boxes on the page. Add a title or a picture, or delete ${n.length === 1 ? 'it' : 'them'}.`
          : undefined
      },
    },
  ],
  featureGridSection: [
    {
      id: 'empty-features',
      run: (s) => {
        const n = positions(s.features, emptyFeature)
        return n.length
          ? `${listItems('Feature card', n)} ${n.length === 1 ? 'is' : 'are'} empty and will show as blank boxes on the page. Add a title or a picture, or delete ${n.length === 1 ? 'it' : 'them'}.`
          : undefined
      },
    },
  ],
  accordionSection: [
    {
      id: 'empty-questions',
      run: (s) => {
        const n = positions(s.items, (i) => !hasString(i.question))
        return n.length
          ? `${listItems('Question', n)} ${n.length === 1 ? 'has' : 'have'} no question text. Type the question, or delete the item.`
          : undefined
      },
    },
    {
      id: 'empty-answers',
      run: (s) => {
        const n = positions(s.items, (i) => hasString(i.question) && !hasText(i.answer))
        return n.length
          ? `${listItems('Question', n)} ${n.length === 1 ? 'has' : 'have'} no answer. Visitors will open it and see nothing. Add the answer.`
          : undefined
      },
    },
  ],
  linkListSection: [
    {
      id: 'empty-links',
      run: (s) => {
        const n = positions(s.listItems, (i) => !hasString(i.title))
        return n.length
          ? `${listItems('Row', n)} ${n.length === 1 ? 'has' : 'have'} no title. Add a title, or delete the row.`
          : undefined
      },
    },
  ],
  vehicleCarouselSection: [
    {
      id: 'no-vehicles',
      run: (s) =>
        Array.isArray(s.vehicles) && s.vehicles.length > 0
          ? undefined
          : 'No vehicles are chosen, so this section stays hidden on the live site. Add at least one vehicle.',
    },
  ],
  googleReviewsSection: [
    {
      id: 'no-widget',
      run: (s) =>
        hasString(s.trustindexWidgetId)
          ? undefined
          : 'Add your Trustindex widget ID. Without it this section shows nothing on the page.',
    },
  ],
}

/** All the problems in one section, as plain messages. */
export function sectionWarnings(sectionType: string, section: Record<string, unknown> | undefined) {
  if (!section) return []
  return (SECTION_CHECKS[sectionType] ?? []).flatMap((c) => c.run(section) ?? [])
}

// ── Page level ────────────────────────────────────────────────────────────────

/** Warnings for a page's SEO block. Without a title the site shows its default title instead of the page's own. */
export function seoWarnings(seo: {title?: string; description?: string} | undefined): string[] {
  const out: string[] = []
  if (!hasString(seo?.title)) {
    out.push(
      'This page has no SEO title, so Google and the browser tab show the site’s default title. Open the SEO group and add one.',
    )
  }
  if (!hasString(seo?.description)) {
    out.push(
      'This page has no SEO description, so Google picks its own snippet. Add one (about 150 characters) in the SEO group.',
    )
  }
  return out
}

// ── Wiring into the schema ───────────────────────────────────────────────────

interface RuleLike {
  custom: (fn: (value: unknown) => unknown) => RuleLike
  warning: (message?: string) => RuleLike
}
type ValidationFn = (rule: RuleLike) => unknown
interface TypeLike {
  name: string
  fields?: unknown[]
  validation?: unknown
}

/** Combines a type's own validation (a function, an array of functions, or nothing) with extra rules. */
export function mergeValidation(existing: unknown, extra: ValidationFn): ValidationFn {
  return (rule) => {
    const own: unknown[] = []
    const add = (fn: unknown) => {
      if (typeof fn === 'function') {
        const result = fn(rule)
        if (Array.isArray(result)) own.push(...result)
        else if (result) own.push(result)
      }
    }
    if (Array.isArray(existing)) existing.forEach(add)
    else add(existing)
    const added = extra(rule)
    return [...own, ...(Array.isArray(added) ? added : [added])]
  }
}

/** One warning rule per check, so each shows as its own plain message. */
const warningRules =
  (
    messagesFor: (value: Record<string, unknown> | undefined) => (() => string | undefined)[],
  ): ValidationFn =>
  (rule) =>
    Array.from({length: 6}, (_unused, i) =>
      rule
        .custom((value) => messagesFor(value as Record<string, unknown> | undefined)[i]?.() ?? true)
        .warning(),
    )

/** A section type with its plain-language checks added (validation it already has is kept). */
export function withReadinessChecks<T extends TypeLike>(type: T): T {
  const checks = SECTION_CHECKS[type.name]
  if (!checks) return type
  const extra = warningRules((value) => checks.map((c) => () => c.run(value ?? {})))
  return {...type, validation: mergeValidation(type.validation, extra)}
}

/** A page type (one with an `seo` field) with SEO warnings added. */
export function withSeoWarnings<T extends TypeLike>(type: T): T {
  const hasSeo = ((type.fields ?? []) as {name?: string}[]).some((f) => f.name === 'seo')
  if (!hasSeo) return type
  const extra = warningRules((doc) => {
    const messages = seoWarnings(doc?.seo as {title?: string; description?: string} | undefined)
    return [() => messages[0], () => messages[1]]
  })
  return {...type, validation: mergeValidation(type.validation, extra)}
}
