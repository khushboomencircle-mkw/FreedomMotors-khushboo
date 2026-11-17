import {defineArrayMember, defineField, defineType} from 'sanity'
import {MenuIcon} from '@sanity/icons/Menu'
import ProtectedNavLinksInput from './components/ProtectedNavLinksInput'
import ProtectedNavLinkItem from './components/ProtectedNavLinkItem'
import NavLinkItemInput from './components/NavLinkItemInput'
import {validateProtectedLinks, type NavLinkValue} from './navLinkProtection'

/**
 * navigationSettings — singleton document that owns all navigation links.
 * A single list with per-link toggles for header and footer placement.
 * One document of this type is created in the desk; editors cannot create
 * additional copies.
 */
export const navigationSettingsType = defineType({
  name: 'navigationSettings',
  title: 'Navigation Links',
  type: 'document',
  icon: MenuIcon,
  // Pre-seed the built-in pages as header-only links on first document creation.
  // Pre-seed to match the hard-coded NAV_ITEMS in src/components/Header.tsx.
  // All built-in pages default to header-only; editors can toggle footer per link.
  initialValue: {
    links: [
      {
        _type: 'navigationLink',
        _key: 'nav-vehicles',
        label: 'VEHICLES',
        href: '/vehicles',
        openInNewTab: false,
        showInHeader: true,
        showInFooter: false,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-drivers',
        label: 'DRIVERS',
        href: '/drivers',
        openInNewTab: false,
        showInHeader: true,
        showInFooter: false,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-vehicle',
        label: 'CONVERT YOUR VEHICLE',
        href: '/convert-your-vehicle',
        openInNewTab: false,
        showInHeader: true,
        showInFooter: false,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-commercial',
        label: 'COMMERCIAL',
        href: '/commercial',
        openInNewTab: false,
        showInHeader: true,
        showInFooter: false,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-our-story',
        label: 'OUR STORY',
        href: '/our-story',
        openInNewTab: false,
        showInHeader: true,
        showInFooter: true,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-contact',
        label: 'CONTACT',
        href: '/contact',
        openInNewTab: false,
        showInHeader: true,
        showInFooter: true,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-careers',
        label: 'CAREERS',
        href: 'https://freedom-motors-usa.careerplug.com/',
        openInNewTab: false,
        showInHeader: true,
        showInFooter: true,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-privacy-policy',
        label: 'PRIVACY POLICY',
        href: '/privacy-policy',
        openInNewTab: false,
        showInHeader: false,
        showInFooter: true,
      },
      {
        _type: 'navigationLink',
        _key: 'nav-educational',
        label: 'EDUCATIONAL',
        href: '/educational',
        openInNewTab: false,
        showInHeader: false,
        showInFooter: true,
      },
    ],
  },
  fields: [
    defineField({
      name: 'links',
      title: 'Navigation Links',
      type: 'array',
      description:
        'All nav links in one list — toggle where each one shows (header, footer, or both). ' +
        'A link only appears on the site while a published page is behind it.',
      components: {input: ProtectedNavLinksInput},
      // `components` here replaces (not merges with) the link type's own, so `input` must be
      // repeated: it auto-fills Link Path from Nav Label.
      of: [
        defineArrayMember({
          type: 'navigationLink',
          components: {item: ProtectedNavLinkItem, input: NavLinkItemInput},
        }),
      ],
      // Protection must not depend on initialValue: existing documents never receive it.
      validation: (Rule) =>
        Rule.custom<NavLinkValue[]>((links, context) =>
          validateProtectedLinks(links, context.getClient),
        ),
    }),
  ],
  preview: {
    select: {links: 'links'},
    prepare({links}) {
      const count = links?.length ?? 0
      return {
        title: 'Navigation Links',
        subtitle: `${count} link${count === 1 ? '' : 's'} configured`,
        media: MenuIcon,
      }
    },
  },
})
