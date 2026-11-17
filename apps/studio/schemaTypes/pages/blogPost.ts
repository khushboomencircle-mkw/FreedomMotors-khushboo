import {
  defineArrayMember,
  defineField,
  defineType,
  type SlugIsUniqueValidator,
  type ValidationContext,
} from 'sanity'
import {ComposeIcon} from '@sanity/icons/Compose'
import {allSectionMembers} from '../sections'
import {sectionsArrayValidation} from '../fields/sectionFields'
import {richTextOf} from '../fields/richText'

/**
 * Blog Post — Document
 *
 * One post that belongs to exactly one Landing Page (customPage), picked by the
 * editor, and lives at /<landing page slug>/<post slug>. Same shape as
 * educationalArticle.ts, plus the landing page link and an optional sections
 * builder shown below the post's own content.
 *
 * The reference is strong on purpose: Sanity only lets a post publish once its
 * landing page is published. Deleting or unpublishing a landing page that still
 * has posts is blocked in sanity.config.ts (see LandingPageGuardActions.tsx).
 */

type PostDocument = {_id?: string; landingPage?: {_ref?: string}} | undefined

// True when no OTHER post (draft or published) under the same landing page uses this slug.
// The same slug under two different landing pages is allowed. Raw perspective so drafts count.
async function isSlugFreeInLandingPage(
  slug: string,
  document: PostDocument,
  getClient: ValidationContext['getClient'],
) {
  const landingRef = document?.landingPage?._ref
  if (!landingRef) return true
  const id = (document?._id || '').replace(/^drafts\./, '')
  const count = await getClient({apiVersion: '2024-01-01'})
    .withConfig({perspective: 'raw'})
    .fetch<number>(
      `count(*[_type == "blogPost" && landingPage._ref == $landing && slug.current == $slug && !(_id in [$draft, $published])])`,
      {landing: landingRef, slug, draft: `drafts.${id}`, published: id},
    )
  return count === 0
}

// With no landing page chosen yet there is nothing to compare against; the slug's validation
// below asks for the landing page instead of reporting a misleading "already in use".
const isUniqueWithinLandingPage: SlugIsUniqueValidator = (slug, context) =>
  isSlugFreeInLandingPage(slug, context.document as PostDocument, context.getClient)

export const blogPostType = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  icon: ComposeIcon,
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
      description: 'Show this post at its URL. Off: visiting its page shows a 404.',
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
      name: 'landingPage',
      title: 'Landing Page',
      type: 'reference',
      group: 'content',
      description:
        'The landing page this post belongs to. Its address will be /<landing page>/<post slug>.',
      to: [{type: 'customPage'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'content',
      description: "The post's address: /<landing page>/<slug>. Pick the landing page first.",
      options: {source: 'title', maxLength: 96, isUnique: isUniqueWithinLandingPage},
      // Duplicates within the landing page are caught by Sanity's own slug check (options.isUnique above).
      validation: (rule) =>
        rule.required().custom((value, context) =>
          value?.current && !(context.document as PostDocument)?.landingPage?._ref
            ? 'Pick a landing page first, then set the slug.'
            : true,
        ),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow / Category Label',
      type: 'string',
      group: 'content',
      description: 'Short category label shown above the title (e.g. "Accessible SUVs," "Lifestyle").',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'content',
      description:
        "Shown as clickable tags at the end of the post; each links to that category's own page.",
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
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      group: 'content',
      description: 'Optional extra sections shown below the post content, in order.',
      of: allSectionMembers,
      validation: sectionsArrayValidation,
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
      landingSlug: 'landingPage.slug.current',
      slug: 'slug.current',
      media: 'image.image',
      isActive: 'isActive',
    },
    prepare({title, landingSlug, slug, media, isActive}) {
      return {
        title: title || 'Untitled Post',
        subtitle: `/${landingSlug || ''}/${slug || ''}${isActive === false ? ' · Inactive' : ''}`,
        media,
      }
    },
  },
})
