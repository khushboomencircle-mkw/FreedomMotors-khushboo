import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'

export const accordionItemType = defineType({
  name: 'accordionItem',
  title: 'Accordion Item',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      description: 'Rich text — supports bold, italic, links, and bullet lists.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading', value: 'h3'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Underline', value: 'underline'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({name: 'href', title: 'URL', type: 'url'}),
                  defineField({
                    name: 'blank',
                    title: 'Open in New Tab',
                    type: 'boolean',
                    initialValue: true,
                  }),
                ],
              },
            ],
          },
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'expandedByDefault',
      title: 'Open by Default',
      type: 'boolean',
      options: {layout: 'switch'},
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'question', subtitle: 'answer'},
    prepare({title, subtitle}) {
      const text = Array.isArray(subtitle)
        ? subtitle
            .filter((b: any) => b._type === 'block')
            .map((b: any) => b.children?.map((c: any) => c.text).join('') || '')
            .join(' ')
            .slice(0, 80)
        : subtitle || ''
      return {
        title: title || 'Untitled Question',
        subtitle: text,
      }
    },
  },
})
