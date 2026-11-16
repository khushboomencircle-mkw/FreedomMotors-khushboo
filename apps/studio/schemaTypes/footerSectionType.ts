import { defineArrayMember, defineField, defineType } from 'sanity'
import { UlistIcon } from '@sanity/icons/Ulist'
import { EnvelopeIcon } from '@sanity/icons/Envelope'
import { ShareIcon } from '@sanity/icons/Share'
import { InfoOutlineIcon } from '@sanity/icons/InfoOutline'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import CompactImageInput from './components/CompactImageInput'

export const footerColumnType = defineType({
  name: 'footerColumn',
  title: 'Footer Navigation Column',
  type: 'object',
  icon: UlistIcon,
  fields: [
    defineField({
      name: 'columnTitle',
      title: 'Column Heading',
      type: 'string',
      placeholder: 'Quick Links, Resources, Company...',
    }),
    defineField({
      name: 'links',
      title: 'Column Links / Redirect Endpoints',
      type: 'array',
      of: [defineArrayMember({ type: 'linkEndpoint' })],
      description: 'Internal or external links.',
    }),
  ],
  preview: {
    select: {
      title: 'columnTitle',
      links: 'links',
    },
    prepare({ title, links }) {
      const count = links?.length || 0
      return {
        title: title || 'Footer Column',
        subtitle: `${count} link${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const newsletterSectionType = defineType({
  name: 'newsletterSection',
  title: 'Newsletter / Subscription Section',
  type: 'object',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      initialValue: 'Stay in the Loop',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      placeholder: 'Subscribe to our newsletter for upcoming events and updates.',
    }),
    defineField({
      name: 'inputPlaceholder',
      title: 'Email Input Placeholder',
      type: 'string',
      initialValue: 'Enter your email address',
    }),
    defineField({
      name: 'buttonText',
      title: 'Submit Button Label',
      type: 'string',
      initialValue: 'Subscribe',
    }),
    defineField({
      name: 'disclaimer',
      title: 'Privacy / Terms Disclaimer',
      type: 'string',
      placeholder: 'We respect your privacy. Unsubscribe anytime.',
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'description',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Newsletter Section',
        subtitle: subtitle || 'Newsletter subscription form',
      }
    },
  },
})

export const socialLinksSectionType = defineType({
  name: 'socialLinksSection',
  title: 'Social Media Links Section',
  type: 'object',
  icon: ShareIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Follow Us',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Profiles',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialItem',
          title: 'Social Profile',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform Name',
              type: 'string',
              placeholder: 'Instagram, Twitter / X, YouTube, LinkedIn...',
            }),
            defineField({
              name: 'url',
              title: 'Profile URL',
              type: 'url',
            }),
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'url',
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      links: 'socialLinks',
    },
    prepare({ title, links }) {
      const count = links?.length || 0
      return {
        title: title || 'Social Links',
        subtitle: `${count} profile${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const copyrightSectionType = defineType({
  name: 'copyrightSection',
  title: 'Copyright & Legal Bar',
  type: 'object',
  icon: InfoOutlineIcon,
  fields: [
    defineField({
      name: 'copyrightText',
      title: 'Copyright Notice',
      type: 'string',
      placeholder: '© 2026 Freedom Motors. All rights reserved.',
      initialValue: '© 2026 Freedom Motors. All rights reserved.',
    }),
    defineField({
      name: 'legalLinks',
      title: 'Legal Links (Privacy Policy, Terms of Service, etc.)',
      type: 'array',
      of: [defineArrayMember({ type: 'linkEndpoint' })],
    }),
  ],
  preview: {
    select: {
      title: 'copyrightText',
    },
    prepare({ title }) {
      return {
        title: title || 'Copyright Bar',
        subtitle: 'Bottom legal section',
      }
    },
  },
})

export const footerRichTextType = defineType({
  name: 'footerRichText',
  title: 'Footer Rich Text / Brand Block',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Block Title',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'logo',
      title: 'Brand Logo',
      type: 'image',
      components: {input: CompactImageInput},
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Brand / About Block',
        subtitle: 'Rich text content section',
      }
    },
  },
})
