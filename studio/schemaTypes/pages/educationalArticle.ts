import {defineArrayMember, defineField, defineType, type SlugIsUniqueValidator} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {richTextOf} from '../fields/richText'

/**
 * Educational Article — Document
 *
 * One standalone article at /educational/[slug], independent of the
 * Educational Page's own hand-curated sections (educationalPage.ts). Its
 * canonical URL is /educational/<slug> from the moment it's created — no
 * redirect needed for a new article. Legacy root-level article URLs that
 * predate this type are handled separately via the existing `redirect`
 * document type (redirectType.ts), not by this schema.
 */

const isUniqueAcrossArticles: SlugIsUniqueValidator = async (slug, context) => {
  const {document, getClient} = context
  const id = (document?._id || '').replace(/^drafts\./, '')
  const count = await getClient({apiVersion: '2024-01-01'}).fetch(
    `count(*[_type == "educationalArticle" && slug.current == $slug && !(_id in [$draft, $published])])`,
    {slug, draft: `drafts.${id}`, published: id},
  )
  return count === 0
}

export const educationalArticleType = defineType({
  name: 'educationalArticle',
  title: 'Educational Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      group: 'content',
      description: 'Show this article at its URL. Off: visiting its page shows a 404.',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      description: "The article's address: /educational/<slug>.",
      options: {source: 'title', maxLength: 96, isUnique: isUniqueAcrossArticles},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow / Category Label',
      type: 'string',
      group: 'content',
      description:
        'Short category label shown above the title (e.g. "Accessible SUVs," "Lifestyle").',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'content',
      description:
        "Shown as clickable tags at the end of the article; each links to that category's own page.",
      of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'photoWithAlt',
      group: 'content',
    }),
    defineField({
      name: 'description',
      title: 'Content',
      type: 'array',
      group: 'content',
      of: richTextOf,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      eyebrow: 'eyebrow',
      slug: 'slug.current',
      media: 'image.image',
      isActive: 'isActive',
    },
    prepare({title, eyebrow, slug, media, isActive}) {
      return {
        title: title || 'Untitled Article',
        subtitle: `/educational/${slug || ''}${eyebrow ? ` · ${eyebrow}` : ''}${isActive === false ? ' · Inactive' : ''}`,
        media,
      }
    },
  },
})
