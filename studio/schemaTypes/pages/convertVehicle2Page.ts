/**
 * Convert Your Vehicle 2 — Page Document
 *
 * A thin page shell that composes sections from the shared section library.
 * Copy this pattern to create any new page with a section builder.
 */
import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {allSectionMembers} from '../sections'
import {pageChromeFieldsets, pageChromeFields} from '../fields/pageChrome'
import {pageCssFieldsets, pageCssFields} from '../fields/pageCss'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

export const convertVehicle2PageType = defineType({
  name: 'convertVehicle2Page',
  title: 'Convert Your Vehicle 2',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [...pageChromeFieldsets, ...pageCssFieldsets],
  fields: [
    defineField({
      name: 'pageTitle',
      fieldset: 'pageInfo',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Convert Your Vehicle',
    }),
    defineField({
      name: 'pageDescription',
      fieldset: 'pageInfo',
      title: 'Page Description',
      type: 'array',
      of: richTextOf,
    }),
    ...pageChromeFields,
    ...pageCssFields(),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      fieldset: 'seoSettings',
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      description: 'Add sections in any order. Each section is ordered by its sequence number.',
      of: allSectionMembers,
      validation: sectionsArrayValidation,
    }),
  ],
  preview: {
    select: {title: 'pageTitle', sections: 'sections'},
    prepare({title, sections}) {
      const count = sections?.length || 0
      return {
        title: title || 'Convert Your Vehicle 2',
        subtitle: `${count} section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
