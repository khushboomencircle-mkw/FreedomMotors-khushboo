import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {allSectionMembers} from '../sections'
import {pageChromeFieldsets, pageChromeFields} from '../fields/pageChrome'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

export const vehiclesPage = defineType({
  name: 'vehiclesPage',
  title: 'Vehicles Page',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [...pageChromeFieldsets],
  fields: [
    defineField({
      name: 'pageTitle',
      fieldset: 'pageInfo',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Our Vehicles',
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
        'Sections render in order. Add a Static Section to place the built-in vehicle listing among them.',
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
        title: title || 'Vehicles Page',
        subtitle: `${count} section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
