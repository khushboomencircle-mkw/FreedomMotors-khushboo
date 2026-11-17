import {defineArrayMember, defineField} from 'sanity'

/**
 * Shared rich text config for description/subtitle fields — bold, italic,
 * bullet/numbered lists, and links. No heading styles: these are short body
 * copy fields (subtitles, card text, page intros), not long-form articles.
 *
 * Used as `of: richTextOf` on any field that's `type: 'array'` in place of
 * the old `type: 'text'`.
 */
export const richTextOf = [
  defineArrayMember({
    type: 'block',
    styles: [{title: 'Normal', value: 'normal'}],
    lists: [
      {title: 'Bullet', value: 'bullet'},
      {title: 'Numbered', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Bold', value: 'strong'},
        {title: 'Italic', value: 'em'},
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            defineField({
              name: 'href',
              title: 'URL',
              type: 'string',
              description: 'Path (/about/) or full URL (https://…).',
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    },
  }),
]
