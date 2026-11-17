/**
 * Vehicle Carousel Section — a swipeable row of vehicle cards for any page (home, landing pages).
 * The editor picks vehicles from the existing Vehicle list; nothing about a vehicle is typed in
 * here. Name, photo, price and mileage come from the vehicle itself, with the same "Available"
 * rule and price rules as the /vehicles page — so a vehicle switched to unavailable drops out of
 * every carousel on the next page load.
 */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {CubeIcon} from '@sanity/icons/Cube'
import {sectionThemeFields} from '../fields/sectionTheme'
import {
  sectionHeaderFields,
  buttonFields,
  sequenceField,
  activeField,
} from '../fields/sectionFields'

export const vehicleCarouselSectionType = defineType({
  name: 'vehicleCarouselSection',
  title: 'Vehicle Carousel Section',
  type: 'object',
  icon: CubeIcon,
  description: 'A swipeable row of vehicles you choose from your Vehicle list.',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'sectionStyles', title: 'Section Theme'},
    {name: 'behavior', title: 'Behavior'},
  ],
  fieldsets: [
    {name: 'header', title: '1. Header', options: {collapsible: true, collapsed: true}},
    {
      name: 'vehicles',
      title: '2. Vehicles to Show',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'primaryButton',
      title: '3. Button',
      options: {columns: 2, collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // ── Content ──
    sequenceField('content'),
    ...sectionHeaderFields('content', 'header'),
    defineField({
      name: 'vehicles',
      title: 'Vehicles',
      type: 'array',
      group: 'content',
      fieldset: 'vehicles',
      description:
        'Choose from your Vehicle list (up to 20) and drag to set the order. Photo, name, price and mileage come from each vehicle automatically. A vehicle marked unavailable is skipped on the website.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'vehicle'}],
          // Weak: the inventory sync may remove a vehicle — that must never be blocked by a
          // carousel still pointing at it. A removed vehicle simply stops showing.
          weak: true,
        }),
      ],
      validation: (rule) => rule.max(20).unique(),
    }),

    // ── "View all vehicles" button (shown by default) ──
    ...buttonFields({
      group: 'content',
      defaults: {show: true, label: 'View all vehicles', linkUrl: '/vehicles'},
    }),

    // ── Section Theme ──
    ...sectionThemeFields(),
    defineField({
      name: 'container',
      title: 'Section Background & Width (Fallback Theme)',
      type: 'containerConfig',
      group: 'sectionStyles',
      hidden: ({parent}) => parent?.enableSectionTheme,
    }),
    defineField({
      name: 'border',
      title: 'Section Border',
      type: 'borderConfig',
      group: 'sectionStyles',
      hidden: ({parent}) => parent?.enableSectionTheme,
    }),

    // ── Behavior ──
    activeField('behavior'),
  ],
  preview: {
    select: {heading: 'sectionHeading', sequence: 'sequence', vehicles: 'vehicles'},
    prepare({heading, sequence, vehicles}) {
      const count = Array.isArray(vehicles) ? vehicles.length : 0
      return {
        title: heading || 'Vehicle Carousel',
        subtitle: `#${sequence ?? '—'} · ${count} vehicle${count === 1 ? '' : 's'} selected`,
        media: CubeIcon,
      }
    },
  },
})
