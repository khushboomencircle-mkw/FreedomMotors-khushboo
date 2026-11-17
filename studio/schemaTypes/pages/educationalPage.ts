import {defineField, defineType} from 'sanity'
import {BookIcon} from '@sanity/icons/Book'
import {allSectionMembers} from '../sections'
import {pageChromeFieldsets, pageChromeFields} from '../fields/pageChrome'
import {pageCssFieldsets, pageCssFields} from '../fields/pageCss'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

/**
 * educationalPage — the /educational page (the live site's "Freedom Motors
 * Blog" intro page). An admin-curated flexible page, same family as
 * Our Story / Commercial / Contact: full access to every section type,
 * hand-picked and ordered by an editor.
 *
 * Deliberately NOT the dynamic article archive + per-article template a
 * true match of the live WordPress blog would need (query-driven grid,
 * category filters, pagination, individual article documents) — that's a
 * separate, larger task this page's existence doesn't solve.
 */
export const educationalPage = defineType({
  name: 'educationalPage',
  title: 'Educational Page',
  type: 'document',
  icon: BookIcon,
  fieldsets: [...pageChromeFieldsets, ...pageCssFieldsets],
  fields: [
    defineField({
      name: 'pageTitle',
      fieldset: 'pageInfo',
      title: 'Page Title',
      type: 'string',
      // Matches the live page's own on-page heading exactly (confirmed by
      // fetching https://www.freedommotors.com/educational/ directly) —
      // not the footer nav link's separate "Educational" label, and not
      // the browser tab title ("Educational Information..."), which is
      // governed by the SEO field below instead.
      initialValue: 'Freedom Motors Blog',
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
        'Add any section — banner, cards grid, feature grid, accordion, link list, photo gallery, ' +
        'call to action, Google reviews, custom HTML, or static — they render in order.',
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
        title: title || 'Educational Page',
        subtitle: `${count} section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
