import {defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {allSectionMembers} from '../sections'
import {pageChromeFieldsets, pageChromeFields} from '../fields/pageChrome'
import {pageCssFieldsets, pageCssFields} from '../fields/pageCss'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  icon: EnvelopeIcon,
  fieldsets: [...pageChromeFieldsets, ...pageCssFieldsets],
  fields: [
    defineField({
      name: 'pageTitle',
      fieldset: 'pageInfo',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Contact Us',
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
      description:
        'Add banner, cards grid, accordion, feature grid, or link list sections — they render in order.',
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
        title: title || 'Contact Page',
        subtitle: `${count} section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
