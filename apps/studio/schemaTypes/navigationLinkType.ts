import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'
import NavLinkItemInput from './components/NavLinkItemInput'
import ProtectedNavLinkHrefInput from './components/ProtectedNavLinkHrefInput'

const normalizeHref = (href: string) =>
  (href || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()

/**
 * navigationLink — a single nav link item used in both the header nav bar
 * and the footer nav list. Each link has independent visibility toggles so
 * one list drives both locations.
 */
export const navigationLinkType = defineType({
  name: 'navigationLink',
  title: 'Navigation Link',
  type: 'object',
  icon: LinkIcon,
  // Auto-fills Link Path from Nav Label for new links (see the component).
  components: {input: NavLinkItemInput},
  fieldsets: [
    {
      name: 'linkDetails',
      title: '1. Link',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'visibility',
      title: '2. Show In',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
    {
      name: 'megaMenu',
      title: '3. Mega Menu',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // ── 1. Link ──────────────────────────────────────────────────────────────
    defineField({
      name: 'label',
      title: 'Nav Label',
      type: 'string',
      fieldset: 'linkDetails',
      description: 'Text displayed in the nav bar (e.g. "Contact Us").',
      validation: (rule) => rule.required().error('Every nav link needs a label.'),
    }),
    defineField({
      name: 'href',
      title: 'Link Path',
      type: 'string',
      fieldset: 'linkDetails',
      description: 'Internal path or full URL (e.g. /contact or https://example.com).',
      placeholder: '/contact',
      // Locked for links used by a page (built-in or Landing Page); see ProtectedNavLinkHrefInput.
      components: {input: ProtectedNavLinkHrefInput},
      validation: (rule) =>
        rule
          .required()
          .error('Enter a path or URL for the link.')
          .custom((href, context) => {
            if (!href) return true
            const doc = context.document as any
            const currentParent = context.parent as any
            const links: any[] = doc?.links ?? []
            const normalized = normalizeHref(href)
            const duplicate = links.find(
              (link) =>
                link._key !== currentParent?._key && normalizeHref(link.href) === normalized,
            )
            if (duplicate) {
              return `"${href}" is already used by "${duplicate.label || 'another nav link'}". Each path must appear once in the nav list.`
            }
            return true
          }),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      fieldset: 'linkDetails',
      options: {layout: 'switch'},
      initialValue: false,
      hidden: ({parent}) => !parent?.href,
    }),

    // ── Mega Menu toggle (lives in linkDetails so editors see it early) ────────
    defineField({
      name: 'showMegaMenu',
      title: 'Show Mega Menu',
      type: 'boolean',
      fieldset: 'linkDetails',
      description: 'Enable a full-width dropdown mega menu for this nav item.',
      options: {layout: 'switch'},
      initialValue: false,
    }),

    // ── 2. Visibility ─────────────────────────────────────────────────────────
    defineField({
      name: 'showInHeader',
      title: 'Header Nav Bar',
      type: 'boolean',
      fieldset: 'visibility',
      description: 'Show this link in the top navigation bar.',
      options: {layout: 'switch'},
      initialValue: true,
    }),
    defineField({
      name: 'showInFooter',
      title: 'Footer Nav List',
      type: 'boolean',
      fieldset: 'visibility',
      description: 'Show this link in the footer navigation list.',
      options: {layout: 'switch'},
      initialValue: true,
    }),

    // ── 3. Mega Menu ──────────────────────────────────────────────────────────
    defineField({
      name: 'megaMenuConfig',
      title: 'Mega Menu',
      type: 'megaMenuConfig',
      fieldset: 'megaMenu',
      description: 'Feature grid shown when hovering this nav item.',
      hidden: ({parent}) => !parent?.showMegaMenu,
    }),
  ],
  preview: {
    select: {
      label: 'label',
      href: 'href',
      inHeader: 'showInHeader',
      inFooter: 'showInFooter',
      hasMegaMenu: 'showMegaMenu',
    },
    prepare({label, href, inHeader, inFooter, hasMegaMenu}) {
      const locations = [inHeader && 'Header', inFooter && 'Footer'].filter(Boolean).join(' · ')
      const megaTag = hasMegaMenu ? '  ·  Mega Menu' : ''
      return {
        title: label || 'Untitled Link',
        subtitle: `${href || '—'}  ·  ${locations || 'Hidden'}${megaTag}`,
        media: LinkIcon,
      }
    },
  },
})
