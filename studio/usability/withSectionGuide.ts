import {defineField} from 'sanity'
import {BareField, SectionIntroInput, SectionPositionInput} from './SectionIntroInput'
import {CONTENT_GROUP, STATUS_FIELDSET} from './contentLayout'
import {SECTION_GUIDE} from './sectionGuide'

/**
 * Adds the intro card (first) and "Position on the page" (in the Status row) to a section's Content tab.
 *
 * Both are DISPLAY-ONLY fields: they carry no data, so nothing new is ever saved in a document and no existing field is
 * touched. They exist only so the Studio has somewhere to draw them. Their names are in the field lock.
 */

/** The names of the two display-only fields. */
export const INTRO_FIELD = 'sectionIntro'
export const POSITION_FIELD = 'sectionPosition'

const introField = defineField({
  name: INTRO_FIELD,
  title: 'About this section',
  type: 'string',
  group: CONTENT_GROUP,
  readOnly: true,
  components: {field: BareField, input: SectionIntroInput},
})

const positionField = defineField({
  name: POSITION_FIELD,
  title: 'Position on the page',
  type: 'string',
  group: CONTENT_GROUP,
  fieldset: STATUS_FIELDSET,
  readOnly: true,
  components: {input: SectionPositionInput},
})

interface TypeLike {
  name: string
  groups?: unknown[]
  fields?: unknown[]
}

export function withSectionGuide<T extends TypeLike>(type: T): T {
  if (!type.groups?.length || !SECTION_GUIDE[type.name]) return type
  const fields = (type.fields ?? []) as {name?: string}[]
  // already applied (or a section that already has these names): leave it alone
  if (fields.some((f) => f.name === INTRO_FIELD || f.name === POSITION_FIELD)) return type
  const withPosition = fields.flatMap((f) => (f.name === 'sequence' ? [f, positionField] : [f]))
  // no Display Order field to sit beside: skip the position rather than guess where it goes
  const hasSequence = fields.some((f) => f.name === 'sequence')
  return {...type, fields: [introField, ...(hasSequence ? withPosition : fields)]}
}
