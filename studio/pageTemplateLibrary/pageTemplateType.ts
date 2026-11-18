import {defineField, defineType} from 'sanity'
import {DocumentsIcon} from '@sanity/icons/Documents'
import CompactImageInput from '../schemaTypes/components/CompactImageInput'
import {allSectionMembers} from '../schemaTypes/sections'
import {pageChromeFields, pageChromeFieldsets} from '../schemaTypes/fields/pageChrome'
import {sectionsArrayValidation} from '../schemaTypes/fields/sectionFields'
import {TEMPLATE_CATEGORIES, TEMPLATE_DOCUMENT_TYPE} from './queries'
import {findDisplayOrderProblems} from './resolve'

/**
 * Page Template — a saved starting point for new Landing Pages, managed in Studio under "Page Templates".
 *
 * Its `sections` are the very same section types a Landing Page uses (allSectionMembers), so a template is configured
 * with the same forms and validation as a page and renders on the site through the existing section components. Nothing
 * here is rendered by the website: a template is only ever COPIED into a new page (see libraryTemplate.ts), never linked.
 *
 * Sections show in the order of their Display Order (`sequence`) number, exactly as on a page, so the list is not
 * drag-sortable — change the number to move a section.
 */
export const pageTemplateType = defineType({
  name: TEMPLATE_DOCUMENT_TYPE,
  title: 'Page Template',
  type: 'document',
  icon: DocumentsIcon,
  fieldsets: pageChromeFieldsets.filter((f) => f.name !== 'pageInfo'),
  fields: [
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description:
        'Only active templates can be used when creating a Landing Page. Switching a template off never changes pages already created from it.',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'title',
      title: 'Template Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Shown to editors when they choose a template.',
    }),
    defineField({
      name: 'previewImage',
      title: 'Preview Image',
      type: 'image',
      options: {hotspot: true},
      description:
        'A picture that shows what this template looks like. Shown on the template card.',
      components: {input: CompactImageInput},
    }),
    defineField({
      name: 'category',
      title: 'Template Category',
      type: 'string',
      options: {list: [...TEMPLATE_CATEGORIES], layout: 'dropdown'},
      initialValue: 'general',
    }),
    ...pageChromeFields,
    defineField({
      name: 'seo',
      title: 'Default SEO Settings',
      type: 'seo',
      fieldset: 'seoSettings',
    }),
    defineField({
      name: 'sections',
      title: 'Default Sections',
      type: 'array',
      description:
        'The sections (and their content) a new page starts with. This is a copy: later changes here never change pages that already exist. ' +
        'Sections appear on the page in order of their Display Order number — to move one, change its number.',
      of: allSectionMembers,
      // Order on the page comes from each section's Display Order number, so drag-and-drop is turned off here.
      options: {sortable: false},
      validation: (rule) => [
        sectionsArrayValidation(rule),
        rule
          .custom((sections: unknown[] | undefined) => {
            const problems = findDisplayOrderProblems(sections)
            return problems.length > 0
              ? `Sections are ordered by their Display Order number:\n${problems.join('\n')}`
              : true
          })
          .warning(),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      sections: 'sections',
      isActive: 'isActive',
      media: 'previewImage',
    },
    prepare({title, category, sections, isActive, media}) {
      const count = sections?.length || 0
      const categoryTitle = TEMPLATE_CATEGORIES.find((c) => c.value === category)?.title
      return {
        title: title || 'Untitled Template',
        subtitle: [
          categoryTitle,
          `${count} section${count === 1 ? '' : 's'}`,
          isActive === false ? 'Inactive' : null,
        ]
          .filter(Boolean)
          .join(' · '),
        media: media || DocumentsIcon,
      }
    },
  },
  orderings: [
    {title: 'Name', name: 'nameAsc', by: [{field: 'title', direction: 'asc'}]},
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [
        {field: 'category', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
})
