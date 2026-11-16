/**
 * Custom Page — Document
 *
 * Lets a content editor create a brand-new page from Sanity Studio without
 * a developer. It uses the exact same section builder (banner, cards grid,
 * accordion) with every styling tab that the pre-built pages use, and can
 * optionally be added to the site header navigation with a redirect endpoint.
 *
 * The client calls these "landing pages" — the Studio-visible title below,
 * and the structure list item's title in sanity.config.ts, say "Landing
 * Page(s)" accordingly. The underlying schema/document type name stays
 * `customPage`: every already-saved document has `_type: "customPage"`,
 * and renaming the type would break all of them until a dataset migration
 * runs (same class of risk as any live-field rename).
 */
import { defineField, defineType, type SlugIsUniqueValidator, type ValidationContext } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { allSectionMembers } from './sections'
import NavLinkPickerInput from './components/NavLinkPickerInput'
import { isReservedSlug } from './navConstants'
import { pageChromeFieldsets } from './fields/pageChrome'
import { sectionsArrayValidation } from './fields/sectionFields'
import { richTextOf } from './fields/richText'

/**
 * Walks a page template's seeded `sections` value and collects every string
 * that still starts with "Replace with" — the placeholder-text convention
 * used by pageTemplates.ts. Returns every match (path + text), not just a
 * yes/no, so an editor sees exactly what's left to fill in.
 */
function findPlaceholderStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') {
    return value.startsWith('Replace with') ? [`${path || '(root)'}: "${value}"`] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findPlaceholderStrings(item, `${path}[${i}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) =>
      findPlaceholderStrings(v, path ? `${path}.${key}` : key),
    )
  }
  return []
}

const normalizeSlug = (slug?: string) => (slug || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase()

// True when no OTHER custom page (draft or published) already uses this slug.
async function isSlugFreeAcrossCustomPages(
  slug: string,
  documentId: string | undefined,
  getClient: ValidationContext['getClient'],
) {
  const id = (documentId || '').replace(/^drafts\./, '')
  const count = await getClient({ apiVersion: '2024-01-01' }).fetch(
    `count(*[_type == "customPage" && lower(slug.current) == $slug && !(_id in [$draft, $published])])`,
    { slug: normalizeSlug(slug), draft: `drafts.${id}`, published: id },
  )
  return count === 0
}

const isUniqueAcrossCustomPages: SlugIsUniqueValidator = (slug, context) =>
  isSlugFreeAcrossCustomPages(slug, context.document?._id, context.getClient)

export const customPage = defineType({
  name: 'customPage',
  title: 'Landing Page',
  type: 'document',
  icon: DocumentTextIcon,
  components: { input: NavLinkPickerInput },
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'navigation', title: 'Navigation' },
    { name: 'seo', title: 'SEO' },
  ],
  fieldsets: [...pageChromeFieldsets],
  fields: [
    // ── Content ──
    defineField({
      name: 'isActive',
      title: 'Page Active',
      type: 'boolean',
      group: 'content',
      description: 'Show this page in header/footer navigation.',
      options: { layout: 'switch' },
      initialValue: true,
    }),
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      group: 'content',
      // Hidden from default form — displayed read-only by NavLinkPickerInput
      hidden: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      // Hidden from default form — displayed read-only by NavLinkPickerInput
      hidden: true,
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: isUniqueAcrossCustomPages,
      },
      validation: (Rule) =>
        // The slug field is hidden and set by the nav picker, so Sanity's own isUnique check never
        // runs on it. Both rules are enforced here instead, on every save and publish.
        Rule.required().custom(async (value, context) => {
          const slug = normalizeSlug(value?.current)
          if (!slug) return true
          if (isReservedSlug(slug)) {
            return `"/${slug}" is already a built-in page on the website. Please choose a different URL.`
          }
          if (!(await isSlugFreeAcrossCustomPages(slug, context.document?._id, context.getClient))) {
            return `"/${slug}" is already used by another page. Please choose a different URL.`
          }
          return true
        }),
    }),
    defineField({
      name: 'pageDescription',
      title: 'Page Description',
      type: 'array',
      of: richTextOf,
      group: 'content',
      fieldset: 'pageInfo',
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      group: 'content',
      description:
        'Add sections in any order. Each section is ordered by its sequence number. ' +
        'Starting from a template? A template only applies when creating a new page — ' +
        "it can't be applied to an existing page, it can't change colors or fonts " +
        "(that's the Theme feature, not built yet), and it can't create new section " +
        'designs — for a new design, use a section template (not built yet) or a ' +
        'Custom HTML Section.',
      of: allSectionMembers,
      validation: (Rule) =>
        sectionsArrayValidation(Rule)
          .custom((sections: unknown[] | undefined) => {
            const hits = findPlaceholderStrings(sections ?? [])
            return hits.length > 0
              ? `Placeholder text from a template is still here — replace it before publishing:\n${hits.join('\n')}`
              : true
          })
          .warning(),
    }),

    // ── Navigation ──

    defineField({
      name: 'showInNavigation',
      title: 'Show in Header Navigation',
      type: 'boolean',
      group: 'navigation',
      description: 'Adds this page as a link in the site header.',
      options: { layout: 'switch' },
      initialValue: false,
    }),
    defineField({
      name: 'navLabel',
      title: 'Navigation Label',
      type: 'string',
      group: 'navigation',
      description: 'Label shown in the header menu. Defaults to the page title.',
      hidden: ({ parent }) => !parent?.showInNavigation,
    }),
    defineField({
      name: 'navOrder',
      title: 'Navigation Order',
      type: 'number',
      group: 'navigation',
      description: 'Lower numbers appear first in the header menu.',
      initialValue: 0,
      hidden: ({ parent }) => !parent?.showInNavigation,
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      group: 'navigation',
      options: { layout: 'switch' },
      initialValue: false,
      hidden: ({ parent }) => !parent?.showInNavigation,
    }),

    // ── Header & Footer ──
    defineField({
      name: 'showHeader',
      title: 'Show Header',
      type: 'boolean',
      group: 'navigation',
      fieldset: 'chrome',
      description: 'Show the site header (navigation bar) on this page.',
      options: { layout: 'switch' },
      initialValue: true,
    }),
    defineField({
      name: 'showFooter',
      title: 'Show Footer',
      type: 'boolean',
      group: 'navigation',
      fieldset: 'chrome',
      description: 'Show the site footer on this page.',
      options: { layout: 'switch' },
      initialValue: true,
    }),

    // ── SEO ──
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      fieldset: 'seoSettings',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      sections: 'sections',
      showInNavigation: 'showInNavigation',
      isActive: 'isActive',
    },
    prepare({ title, slug, sections, showInNavigation, isActive }) {
      const count = sections?.length || 0
      return {
        title: title || 'Untitled Page',
        subtitle: `/${slug || ''} · ${count} section${count === 1 ? '' : 's'}${showInNavigation ? ' · In Nav' : ''
          }${isActive ? '' : ' · Inactive'}`,
        media: DocumentTextIcon,
      }
    },
  },
})
