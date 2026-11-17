import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {allSectionMembers} from '../sections'
import {pageChromeFieldsets, pageChromeFields} from '../fields/pageChrome'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

export const commercialPage = defineType({
  name: 'commercialPage',
  title: 'Commercial Page',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [...pageChromeFieldsets],
  fields: [
    defineField({
      name: 'pageTitle',
      fieldset: 'pageInfo',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Commercial Vehicles',
    }),
    defineField({
      name: 'pageDescription',
      fieldset: 'pageInfo',
      title: 'Page Description',
      type: 'array',
      of: richTextOf,
    }),
    ...pageChromeFields,
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
      description:
        'Add banner, cards grid, accordion, or feature grid sections — they render in order.',
      of: allSectionMembers,
      validation: sectionsArrayValidation,
    }),
  ],
  preview: {
    select: {
      title: 'pageTitle',
      sections: 'sections',
    },
    prepare({title, sections}) {
      const count = sections?.length || 0
      return {
        title: title || 'Commercial Page',
        subtitle: `${count} section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
