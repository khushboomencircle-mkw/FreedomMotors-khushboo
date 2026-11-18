/**
 * The fixed pages: Home, Vehicles, Commercial … Each one is a single page on the website (/commercial, /contact …), so
 * the Studio must never offer a second copy of it. Landing Pages are the opposite — as many as you like — and are not
 * listed here.
 *
 * What "single" means in the Studio:
 *   - the sidebar opens the one document directly (no list, so no "+" button inside it),
 *   - the "+ New document" menus do not offer these types,
 *   - Duplicate and Delete are not available on them (a duplicate is a second page; deleting leaves the site empty).
 *
 * Pure helpers (no Studio imports) so they are unit-tested on their own.
 */

export interface SingletonPage {
  /** The schema type name. */
  type: string
  /** The name shown in the sidebar. */
  title: string
}

export const SINGLETON_PAGES: SingletonPage[] = [
  {type: 'homePage', title: 'Home Page'},
  {type: 'vehiclesPage', title: 'Vehicle Page'},
  {type: 'vehicleDetailPage', title: 'Vehicle Detail Page'},
  {type: 'convertVehicle2Page', title: 'Convert Your Vehicle'},
  {type: 'driver', title: 'Driver Page'},
  {type: 'commercialPage', title: 'Commercial Page'},
  {type: 'ourStoryPage', title: 'Our Story Page'},
  {type: 'contactPage', title: 'Contact Page'},
  {type: 'educationalPage', title: 'Educational Page'},
]

const SINGLETON_TYPES = new Set(SINGLETON_PAGES.map((p) => p.type))
export const isSingletonType = (type: string | undefined): boolean =>
  type !== undefined && SINGLETON_TYPES.has(type)

/** Actions that would create a second page or remove the only one. */
const BLOCKED_ACTIONS = new Set(['duplicate', 'delete'])

/** Removes Duplicate and Delete from a fixed page's actions; every other type keeps all of its actions. */
export function withoutSingletonActions<A extends {action?: string}>(
  actions: A[],
  schemaType: string,
): A[] {
  return isSingletonType(schemaType)
    ? actions.filter((a) => !a.action || !BLOCKED_ACTIONS.has(a.action))
    : actions
}

/** Removes the fixed pages from a "new document" menu (the + buttons), keeping every other entry. */
export function withoutSingletonCreateOptions<O extends {templateId?: string; schemaType?: string}>(
  options: O[],
): O[] {
  return options.filter((o) => !isSingletonType(o.schemaType) && !isSingletonType(o.templateId))
}

/** A document as listed by the id lookup. */
export interface DocumentStub {
  _id: string
  _createdAt?: string
}

const DRAFT_PREFIX = 'drafts.'

/**
 * Which document the sidebar opens for a fixed page. If the page already exists, the OLDEST one (the original, not a
 * stray copy); if nothing exists yet, the type name itself, so the first save creates it with a stable id.
 * Draft ids are mapped back to their published id (Studio opens the published id and shows its draft).
 */
export function pickSingletonId(documents: DocumentStub[], type: string): string {
  const published = documents
    .map((d) => ({
      ...d,
      _id: d._id.startsWith(DRAFT_PREFIX) ? d._id.slice(DRAFT_PREFIX.length) : d._id,
    }))
    .filter((d) => !d._id.startsWith('versions.'))
    .sort((a, b) => (a._createdAt ?? '').localeCompare(b._createdAt ?? ''))
  return published[0]?._id ?? type
}
