import {defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {allSectionMembers} from '../sections'
import {pageChromeFieldsets, pageChromeFields} from '../fields/pageChrome'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

/**
 * vehicleDetailPage — the shared template for individual vehicle detail pages
 * (endpoint /vehicles/[slug]). Its sections render on every vehicle detail page
 * below that vehicle's own specs. Section-managed, like the Commercial/Driver pages.
 */
export const vehicleDetailPage = defineType({
  name: 'vehicleDetailPage',
  title: 'Vehicle Detail Page',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [...pageChromeFieldsets],
  fields: [
    defineField({
      name: 'pageTitle',
      fieldset: 'pageInfo',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Vehicle Details',
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
        'Shown on every vehicle detail page. Add a Static Section to place the vehicle specs block among them.',
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
        title: title || 'Vehicle Detail Page',
        subtitle: `${count} shared section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
