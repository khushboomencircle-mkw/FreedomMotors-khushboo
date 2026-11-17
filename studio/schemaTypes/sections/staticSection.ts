/**
 * Static Section — a placeholder in the page's section list standing in for
 * that page's own built-in, code-rendered content (e.g. the vehicle listing
 * grid on the Vehicles page, or the spec block on a Vehicle Detail page).
 *
 * It has no content fields of its own: it exists only so an editor can
 * decide WHERE that built-in content appears relative to the other,
 * CMS-authored sections, and whether it shows at all — same Active toggle
 * and Display Order every other section has, nothing more.
 */
import {defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
import {activeField, sequenceField} from '../fields/sectionFields'

export const staticSectionType = defineType({
  name: 'staticSection',
  title: 'Static Section (Built-in Page Content)',
  type: 'object',
  icon: PinIcon,
  description:
    "Marks where this page's built-in content (e.g. the vehicle listing) appears. Only Active and Order are editable here.",
  fields: [activeField(), sequenceField()],
  preview: {
    select: {
      isActive: 'isActive',
      sequence: 'sequence',
    },
    prepare({isActive, sequence}) {
      return {
        title: 'Static Section (Built-in Page Content)',
        subtitle: `${isActive === false ? 'Inactive' : 'Active'}${
          typeof sequence === 'number' ? ` · Order ${sequence}` : ''
        }`,
      }
    },
  },
})
