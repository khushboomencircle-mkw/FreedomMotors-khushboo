import {cloneWithFreshKeys} from './cloneWithFreshKeys'
import {publishedIdOf} from './queries'

/**
 * Pure helpers (no Sanity client, no React) that turn template documents into what the Studio needs.
 * Kept separate so they are unit-tested on their own.
 */

export interface TemplateCard {
  _id: string
  title?: string
  description?: string
  category?: string
  isActive?: boolean
  previewUrl?: string
  sectionCount?: number
}

export interface TemplateContent {
  _id: string
  title?: string
  isActive?: boolean
  sections?: unknown[]
  seo?: unknown
  showHeader?: boolean
  showFooter?: boolean
}

const isDraft = (id: string) => id.startsWith('drafts.')

/** One entry per template, using its draft when there is one ("latest version including drafts"). `_id` becomes the published id. */
export function latestVersions<T extends {_id: string}>(docs: T[]): T[] {
  const byPublishedId = new Map<string, T>()
  for (const doc of docs) {
    const id = publishedIdOf(doc._id)
    const existing = byPublishedId.get(id)
    // A draft always wins over the published copy; between two of the same kind keep the first.
    if (!existing || (isDraft(doc._id) && !isDraft(existing._id))) byPublishedId.set(id, doc)
  }
  return [...byPublishedId.entries()].map(([id, doc]) => ({...doc, _id: id}))
}

/** The templates an editor may pick: active ones only (judged on the latest version), grouped by category then name. */
export function activeTemplateCards(docs: TemplateCard[]): TemplateCard[] {
  return latestVersions(docs)
    .filter((t) => t.isActive === true)
    .sort(
      (a, b) =>
        (a.category || '').localeCompare(b.category || '') ||
        (a.title || '').localeCompare(b.title || ''),
    )
}

export class TemplateUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TemplateUnavailableError'
  }
}

/** The latest version of the template, or an explanation of why it can't be used (missing, or switched off). */
export function pickUsableTemplate(docs: TemplateContent[]): TemplateContent {
  const [template] = latestVersions(docs)
  if (!template)
    throw new TemplateUnavailableError(
      'That template no longer exists. Pick another one from the template list.',
    )
  if (template.isActive !== true) {
    throw new TemplateUnavailableError(
      `The template "${template.title || 'Untitled'}" is switched off. Switch it on in Page Templates, or pick another one.`,
    )
  }
  return template
}

/**
 * The starting value of a new Landing Page made from a template: a full, independent COPY of the template's
 * sections, SEO and header/footer switches, with fresh keys everywhere.
 *
 * Deliberately not copied: the page title and slug (each page needs its own, and slugs must be unique), Custom CSS and
 * navigation settings. No reference to the template is stored, so later changes to, or deletion of, the template never touch
 * the page. Display Order (`sequence`) is copied exactly as authored.
 */
export function buildPageFromTemplate(template: TemplateContent) {
  const copy = cloneWithFreshKeys({
    sections: template.sections ?? [],
    ...(template.seo ? {seo: template.seo} : {}),
  })
  return {
    _type: 'customPage' as const,
    isActive: true,
    showHeader: template.showHeader !== false,
    showFooter: template.showFooter !== false,
    sections: copy.sections,
    ...(copy.seo ? {seo: copy.seo} : {}),
  }
}

/**
 * Display Order (`sequence`) is what orders sections on the live page — NOT their position in the list. So a template
 * whose sections have no number, or share a number, would put its sections in an unpredictable order. Used for a Studio
 * warning on the template (never an error, and never changes the data).
 */
export function findDisplayOrderProblems(sections: unknown[] | undefined): string[] {
  const problems: string[] = []
  const seen = new Map<number, number>()
  ;(sections ?? []).forEach((section, index) => {
    const seq = (section as {sequence?: unknown} | null)?.sequence
    if (typeof seq !== 'number') {
      problems.push(`Section ${index + 1} has no Display Order number.`)
    } else if (seen.has(seq)) {
      problems.push(`Sections ${seen.get(seq)! + 1} and ${index + 1} share Display Order ${seq}.`)
    } else {
      seen.set(seq, index)
    }
  })
  return problems
}
