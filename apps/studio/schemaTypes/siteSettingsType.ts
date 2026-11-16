
import { defineField, defineType } from 'sanity'
import { CogIcon } from '@sanity/icons/Cog'
import CompactImageInput from './components/CompactImageInput'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,

  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'header', title: 'Header' },
    { name: 'footer', title: 'Footer' },
    { name: 'seo', title: 'SEO' },
    { name: 'social', title: 'Social Media Links' },
    { name: 'theme', title: 'Theme' },
  ],

  // Collapsible fieldsets within the existing groups
  fieldsets: [
    {
      name: 'generalInfo',
      title: 'General Information',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'headerLogo',
      title: 'Logo & Sticky Settings',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'headerTopBar',
      title: 'Top Bar Settings',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'footerBranding',
      title: 'Footer Contact Information',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'footerAddress',
      title: 'Footer Address',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'footerCopyright',
      title: 'Copyright Settings',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'seoDefaults',
      title: 'SEO Defaults',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'themeSetting',
      title: 'Theme Settings',
      options: { collapsible: true, collapsed: true },
    }
  ],

  fields: [
    defineField({
      name: 'siteLogo',
      title: 'Header Logo',
      type: 'image',
      group: 'header',
      fieldset: 'headerLogo',
      description: 'Logo displayed in the site header.',
      options: { hotspot: true },
      components: { input: CompactImageInput },
    }),

    // GENERAL
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      group: 'general',
      fieldset: 'generalInfo',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      group: 'general',
      fieldset: 'generalInfo',
      components: { input: CompactImageInput },
    }),

    // HEADER

    // Top Bar
    defineField({
      name: 'topBarEnabled',
      title: 'Show Top Bar',
      type: 'boolean',
      group: 'header',
      fieldset: 'headerTopBar',
      initialValue: true,
    }),
    defineField({
      name: 'businessHours',
      title: 'Business Hours Text',
      type: 'string',
      group: 'header',
      fieldset: 'headerTopBar',
      description: 'Shown on the left of the top bar.',
      initialValue: 'Open Mon - Fri : 9am-6pm EST',
      hidden: ({ parent }) => !parent?.topBarEnabled,
    }),
    defineField({
      name: 'phoneLabel',
      title: 'Phone Label',
      type: 'string',
      group: 'header',
      fieldset: 'headerTopBar',
      initialValue: 'Call Us:',
      hidden: ({ parent }) => !parent?.topBarEnabled,
    }),
    defineField({
      name: 'phoneNumber',
      title: 'Phone Number',
      type: 'string',
      group: 'header',
      fieldset: 'headerTopBar',
      initialValue: '(866) 577-0794',
      hidden: ({ parent }) => !parent?.topBarEnabled,
    }),
    defineField({
      name: 'headerCta',
      title: 'Top Bar CTA Button',
      type: 'object',
      group: 'header',
      fieldset: 'headerTopBar',
      description: 'Button on the right side of the top bar (e.g. "CONTACT US").',
      hidden: ({ parent }) => !parent?.topBarEnabled,
      fields: [
        defineField({
          name: 'label',
          title: 'Button Label',
          type: 'string',
          initialValue: 'CONTACT US',
        }),
        defineField({
          name: 'endpoint',
          title: 'Redirect URL',
          type: 'string',
          initialValue: '/contact',
        }),
        defineField({
          name: 'openInNewTab',
          title: 'Open in New Tab',
          type: 'boolean',
          initialValue: false,
        }),
      ],
    }),

    // Logo & Sticky
    defineField({
      name: 'stickyHeader',
      title: 'Sticky Header on Scroll',
      type: 'boolean',
      group: 'header',
      fieldset: 'headerLogo',
      initialValue: false,
    }),
    defineField({
      name: 'headerLogoRedirect',
      title: 'Logo Click Redirect',
      type: 'string',
      group: 'header',
      fieldset: 'headerLogo',
      description: 'Where clicking the header logo goes (e.g. /).',
      initialValue: '/',
    }),

    // Navigation items are hardcoded in the frontend Header component.
    // They are not editable from Sanity Studio.

    // FOOTER

    // Contact Info
    defineField({
      name: 'footerLogo',
      title: 'Footer Logo',
      type: 'image',
      group: 'footer',
      fieldset: 'footerBranding',
      options: { hotspot: true },
      description: 'Logo displayed in the footer contact area.',
      components: { input: CompactImageInput },
    }),
    defineField({
      name: 'footerContactTitle',
      title: 'Contact Title',
      type: 'string',
      group: 'footer',
      fieldset: 'footerBranding',
      initialValue: 'REACH OUT TO US!',
    }),
    defineField({
      name: 'addressLine1',
      title: 'Address Line 1',
      type: 'string',
      group: 'footer',
      fieldset: 'footerAddress',
      initialValue: '740 Watkins Rd',
    }),
    defineField({
      name: 'addressLine2',
      title: 'Address Line 2 (City, State, Zip)',
      type: 'string',
      group: 'footer',
      fieldset: 'footerAddress',
      initialValue: 'Battle Creek, MI 49015',
    }),
    defineField({
      name: 'addressMapUrl',
      title: 'Address Map Link',
      type: 'url',
      group: 'footer',
      fieldset: 'footerAddress',
      description: 'Google Maps or directions URL. When set, the address in the footer becomes a clickable link. The link itself is never shown.',
    }),
    defineField({
      name: 'footerPhoneLabel',
      title: 'Phone Label',
      type: 'string',
      group: 'footer',
      fieldset: 'footerBranding',
      initialValue: 'Call us Today:',
    }),
    defineField({
      name: 'footerPhone',
      title: 'Phone Number',
      type: 'string',
      group: 'footer',
      fieldset: 'footerBranding',
      initialValue: '(866) 577-0794',
    }),
    defineField({
      name: 'footerTextLabel',
      title: 'Text Label',
      type: 'string',
      group: 'footer',
      fieldset: 'footerBranding',
      initialValue: 'Text us Now:',
    }),
    defineField({
      name: 'footerTextNumber',
      title: 'Text Number',
      type: 'string',
      group: 'footer',
      fieldset: 'footerBranding',
      initialValue: '620-400-8756',
    }),
    defineField({
      name: 'footerEmail',
      title: 'Email Address',
      type: 'string',
      group: 'footer',
      fieldset: 'footerBranding',
    }),

    defineField({
      name: 'copyright',
      title: 'Copyright Line',
      type: 'string',
      group: 'footer',
      fieldset: 'footerCopyright',
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'Default SEO',
      description: "Used by pages that don't set their own.",
      type: 'seo',
      group: 'seo',
      fieldset: 'seoDefaults',
      options: { collapsible: true, collapsed: true },
    }),

    // SOCIAL MEDIA LINKS — each platform its own independent, optional field.
    // No shared list/dropdown: a platform is either filled in or it isn't,
    // with no way to end up with a duplicate or unset entry.
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      group: 'social',
      placeholder: 'https://facebook.com/yourpage',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      group: 'social',
      placeholder: 'https://instagram.com/yourpage',
    }),
    defineField({
      name: 'twitterUrl',
      title: 'Twitter / X URL',
      type: 'url',
      group: 'social',
      placeholder: 'https://x.com/yourpage',
    }),
    defineField({
      name: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'social',
      placeholder: 'https://linkedin.com/company/yourpage',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      group: 'social',
      placeholder: 'https://youtube.com/@yourpage',
    }),
    defineField({
      name: 'tiktokUrl',
      title: 'TikTok URL',
      type: 'url',
      group: 'social',
      placeholder: 'https://tiktok.com/@yourpage',
    }),
    defineField({
      name: 'pinterestUrl',
      title: 'Pinterest URL',
      type: 'url',
      group: 'social',
      placeholder: 'https://pinterest.com/yourpage',
    }),

    // THEME
    // Only the enable toggle shows initially. When ON, the appearance radio and
    // the full theme configuration (colors, fonts, buttons, corner rounding) appear.
    defineField({
      name: 'enableSiteTheme',
      title: 'Enable Global Site Theme',
      type: 'boolean',
      group: 'theme',
      description: 'When on, this theme applies site-wide unless a section sets its own.',
      options: { layout: 'switch' },
      initialValue: false,
    }),
    defineField({
      name: 'defaultMode',
      title: 'Appearance',
      type: 'string',
      group: 'theme',
      description: 'Light or Dark appearance for the site theme.',
      options: {
        list: [
          { title: 'Light', value: 'light' },
          { title: 'Dark', value: 'dark' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'dark',
      hidden: ({ parent }) => !parent?.enableSiteTheme,
    }),
    // `lightTheme`/`darkTheme` share the exact same title and are mutually
    // exclusive via `hidden` (keyed off `defaultMode`, not just
    // `enableSiteTheme`) — only one is ever visible at a time, so to the
    // admin this reads as one "Theme Settings" panel whose values change
    // when Appearance is toggled, not two parallel sections. The two
    // fields really are separate, independently-stored data underneath
    // (see lib/theme.ts) — this is presentation only.
    defineField({
      name: 'lightTheme',
      title: 'Theme Settings',
      type: 'themeConfig',
      group: 'theme',
      description:
        'Colors, fonts, button styles, and corner rounding applied site-wide. Edited independently of Dark — a blank field here falls back to a built-in light default, never a Dark value.',
      hidden: ({ parent }) => !parent?.enableSiteTheme || parent?.defaultMode !== 'light',
    }),
    defineField({
      name: 'darkTheme',
      title: 'Theme Settings',
      type: 'themeConfig',
      group: 'theme',
      description:
        'Colors, fonts, button styles, and corner rounding applied site-wide. Edited independently of Light — a blank field here falls back to a built-in dark default, never a Light value.',
      hidden: ({ parent }) => !parent?.enableSiteTheme || parent?.defaultMode === 'light',
    }),
  ],

  preview: {
    select: {
      title: 'siteTitle',
      media: 'siteLogo',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Site Settings',
        media: media || CogIcon,
      }
    },
  },
})
