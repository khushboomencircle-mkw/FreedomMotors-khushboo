import {defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'
import {allSectionMembers} from '../sections'
import {pageChromeFieldsets, pageChromeFields} from '../fields/pageChrome'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

/**
 * homePage — the site landing page rendered at "/". A singleton (one document,
 * no slug, not part of navigation), section-managed like the other pages.
 */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  icon: HomeIcon,
  fieldsets: [...pageChromeFieldsets],
  fields: [
    defineField({
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      fieldset: 'pageInfo',
      initialValue: 'Home',
    }),
    defineField({
      name: 'pageDescription',
      title: 'Page Description',
      type: 'array',
      of: richTextOf,
      fieldset: 'pageInfo',
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
      description: 'Add banner, cards grid, accordion, feature grid, or link list sections — they render in order.',
      of: allSectionMembers,
      validation: sectionsArrayValidation,
    }),
  ],
  preview: {
    select: {title: 'pageTitle', sections: 'sections'},
    prepare({title, sections}) {
      const count = sections?.length || 0
      return {
        title: title || 'Home Page',
        subtitle: `/  ·  ${count} section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
