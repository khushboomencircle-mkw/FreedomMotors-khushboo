import {defineArrayMember, defineField, defineType} from 'sanity'
import {BellIcon} from '@sanity/icons/Bell'
import {MenuIcon} from '@sanity/icons/Menu'
import {SparkleIcon} from '@sanity/icons/Sparkle'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {UserIcon} from '@sanity/icons/User'
import CompactImageInput from './components/CompactImageInput'

export const announcementBarType = defineType({
  name: 'announcementBar',
  title: 'Announcement Bar',
  type: 'object',
  icon: BellIcon,
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enable Announcement Bar',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'message',
      title: 'Announcement Message',
      type: 'string',
    }),
    defineField({
      name: 'link',
      title: 'Redirect / Action Link',
      type: 'linkEndpoint',
    }),
    defineField({
      name: 'badgeText',
      title: 'Badge Text',
      type: 'string',
      placeholder: 'New, Sale, Update...',
    }),
    defineField({
      name: 'theme',
      title: 'Theme Color',
      type: 'string',
      options: {
        list: [
          {title: 'Default Dark', value: 'dark'},
          {title: 'Primary Brand Accent', value: 'primary'},
          {title: 'Light / Subtle', value: 'light'},
          {title: 'Warning / Highlight', value: 'warning'},
        ],
      },
      initialValue: 'dark',
    }),
  ],
  preview: {
    select: {
      title: 'message',
      badge: 'badgeText',
      enabled: 'enabled',
    },
    prepare({title, badge, enabled}) {
      return {
        title: title || 'Untitled Announcement',
        subtitle: `Announcement Bar (${enabled ? 'Active' : 'Disabled'}) ${badge ? `[${badge}]` : ''}`,
      }
    },
  },
})

export const headerNavigationMenuType = defineType({
  name: 'headerNavigationMenu',
  title: 'Navigation Menu Section',
  type: 'object',
  icon: MenuIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Menu Title / Identifier',
      type: 'string',
      initialValue: 'Main Navigation',
    }),
    defineField({
      name: 'links',
      title: 'Navigation Links',
      type: 'array',
      of: [defineArrayMember({type: 'linkEndpoint'})],
      description: 'Header navigation links (e.g. Home, About, Contact).',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      links: 'links',
    },
    prepare({title, links}) {
      const count = links?.length || 0
      return {
        title: title || 'Navigation Menu',
        subtitle: `${count} navigation link${count === 1 ? '' : 's'}`,
      }
    },
  },
})

export const userProfileMenuType = defineType({
  name: 'userProfileMenu',
  title: 'User Profile & Account Menu',
  type: 'object',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'menuLabel',
      title: 'Menu Label',
      type: 'string',
      initialValue: 'Account',
      description: 'Label shown beside the avatar (e.g. Account, My Profile)',
    }),
    defineField({
      name: 'showAvatar',
      title: 'Show User Avatar',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'accountLinks',
      title: 'Account Dropdown Options',
      type: 'array',
      description: 'Account dropdown links (e.g. Profile, Settings).',
      of: [defineArrayMember({type: 'linkEndpoint'})],
    }),
  ],
  preview: {
    select: {
      title: 'menuLabel',
      links: 'accountLinks',
      showAvatar: 'showAvatar',
    },
    prepare({title, links, showAvatar}) {
      const count = links?.length || 0
      return {
        title: title || 'User Account Menu',
        subtitle: `${count} option${count === 1 ? '' : 's'} (Avatar: ${showAvatar ? 'On' : 'Off'})`,
        media: UserIcon,
      }
    },
  },
})

export const headerCtaType = defineType({
  name: 'headerCta',
  title: 'Call to Action Button',
  type: 'object',
  icon: SparkleIcon,
  fields: [
    defineField({
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
      placeholder: 'Get Tickets, Contact Us...',
    }),
    defineField({
      name: 'link',
      title: 'Destination Link / Redirect Endpoint',
      type: 'linkEndpoint',
    }),
    defineField({
      name: 'style',
      title: 'Button Style',
      type: 'string',
      options: {
        list: [
          {title: 'Primary Filled', value: 'primary'},
          {title: 'Secondary Outline', value: 'secondary'},
          {title: 'Ghost / Subtle', value: 'ghost'},
        ],
      },
      initialValue: 'primary',
    }),
  ],
  preview: {
    select: {
      title: 'buttonLabel',
      style: 'style',
    },
    prepare({title, style}) {
      return {
        title: title || 'Call to Action Button',
        subtitle: `CTA Button (${style || 'primary'})`,
      }
    },
  },
})

export const headerCustomContentType = defineType({
  name: 'headerCustomContent',
  title: 'Custom Header Content Block',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'richText',
      title: 'Content',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'image',
      title: 'Supporting Image / Graphic',
      type: 'image',
      options: {
        hotspot: true,
      },
      components: {input: CompactImageInput},
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Custom Header Content',
        subtitle: 'Rich text content section',
      }
    },
  },
})
