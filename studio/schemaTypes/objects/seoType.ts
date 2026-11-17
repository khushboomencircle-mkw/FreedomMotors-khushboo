import {defineField, defineType} from 'sanity'
import CompactImageInput from '../components/CompactImageInput'

export const seoType = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Meta Title',
      type: 'string',
      description: 'Appears in browser tabs and search results.',
      validation: (rule) =>
        rule.max(70).warning('Keep under 60–70 characters for best display in search results.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Summary shown below the title in search results.',
      validation: (rule) =>
        rule.max(200).warning('Keep under 160–200 characters for best display in search results.'),
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'The main URL to use when this content is available at more than one address.',
    }),
    defineField({
      name: 'image',
      title: 'Share Image',
      type: 'image',
      description: 'Image shown when this page is shared on social media. Recommended: 1200×630px.',
      options: {hotspot: true},
      components: {input: CompactImageInput},
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from Search Engines',
      type: 'boolean',
      description: 'Hides this page from search engine results.',
      initialValue: false,
    }),
  ],
})
