import {defineField, defineType, type SlugIsUniqueValidator} from 'sanity'
import {TagIcon} from '@sanity/icons/Tag'

/**
 * Category — Document
 *
 * A label with a URL (/category/<slug>), not a page an admin designs —
 * attached to Educational Articles (educationalArticle.ts's `categories`
 * field) and rendered as clickable tags on an article's page. Visiting a
 * category's own page (src/app/category/[slug]/page.tsx) lists
 * every active article tagged with it.
 */

const isUniqueAcrossCategories: SlugIsUniqueValidator = async (slug, context) => {
  const {document, getClient} = context
  const id = (document?._id || '').replace(/^drafts\./, '')
  const count = await getClient({apiVersion: '2024-01-01'}).fetch(
    `count(*[_type == "category" && slug.current == $slug && !(_id in [$draft, $published])])`,
    {slug, draft: `drafts.${id}`, published: id},
  )
  return count === 0
}

export const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      description: "The category's address: /category/<slug>.",
      options: {source: 'title', maxLength: 96, isUnique: isUniqueAcrossCategories},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: "Shown at the top of the category's page.",
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare({title, slug}) {
      return {
        title: title || 'Untitled Category',
        subtitle: `/category/${slug || ''}`,
      }
    },
  },
})
