/**
 * Reusable field builders for page sections.
 *
 * Usage in any section type:
 *   fields: [
 *     ...sectionHeaderFields('content'),
 *     ...buttonFields({ group: 'content' }),
 *     ...expandableFields({ group: 'behavior' }),
 *     sequenceField('behavior'),
 *   ]
 *
 * Each builder returns an array of defineField() calls (or a single field).
 * Pass `group` to assign all returned fields to a Sanity field group.
 */
import {defineField} from 'sanity'
import ColorPaletteInput from '../components/ColorPaletteInput'
import {richTextOf} from './richText'

// ─── Sequence / Ordering ────────────────────────────

export function sequenceField(group?: string) {
  return defineField({
    name: 'sequence',
    title: 'Display Order',
    type: 'number',
    group,
    description: 'Lower numbers show first on the page.',
  })
}

// ─── Active / Visibility toggle ─────────────────────

/**
 * Per-section active toggle. When off, the section is hidden from the page
 * without being deleted. Default on. Add to every section's fields.
 */
export function activeField(group?: string) {
  return defineField({
    name: 'isActive',
    title: 'Section Active',
    type: 'boolean',
    group,
    description: 'Turn off to hide this section from the page without deleting it.',
    options: {layout: 'switch'},
    initialValue: true,
  })
}

// ─── Sections array validation (one Static Section per page) ───

/**
 * Attach to any page's `sections` array field: `validation: sectionsArrayValidation`.
 * The Static Section is a placeholder for the page's own built-in, code-rendered
 * content (e.g. the vehicle listing grid) — only one makes sense per page.
 */
export function sectionsArrayValidation(rule: any) {
  return rule.custom((sections: Array<{_type?: string}> | undefined) => {
    const staticCount = (sections ?? []).filter((s) => s?._type === 'staticSection').length
    return staticCount > 1 ? 'Only one Static Section is allowed per page.' : true
  })
}

// ─── Section Header (title + subtitle shown above content) ──

export function sectionHeaderFields(group?: string, fieldset?: string) {
  return [
    defineField({
      name: 'sectionHeading',
      title: 'Title',
      type: 'string',
      group,
      fieldset,
      description: 'Big title shown above this section (e.g. "How It Works").',
    }),
    defineField({
      name: 'sectionDescription',
      title: 'Subtitle',
      type: 'array',
      of: richTextOf,
      group,
      fieldset,
      description: 'Short line of text below the title.',
    }),
  ]
}

// ─── Button / CTA ───────────────────────────────────

interface ButtonOpts {
  group?: string
  includeSecondary?: boolean
  includeOverlay?: boolean
  includeStyle?: boolean
}

export function buttonFields(opts: ButtonOpts = {}) {
  const {group, includeSecondary = false, includeOverlay = false, includeStyle = true} = opts

  return [
    defineField({
      name: 'showButton',
      title: 'Show a Button',
      type: 'boolean',
      group,
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button Text',
      type: 'string',
      group,
      fieldset: 'primaryButton',
      hidden: ({parent}) => !parent?.showButton,
    }),
    defineField({
      name: 'buttonLinkUrl',
      title: 'Button Destination',
      type: 'string',
      group,
      fieldset: 'primaryButton',
      description: 'Path (/about/) or full URL (https://…).',
      placeholder: '/about/',
      hidden: ({parent}) => !parent?.showButton,
    }),
    // Legacy — hidden so saved content still renders.
    defineField({
      name: 'buttonLink',
      title: 'Button Destination (legacy)',
      type: 'linkEndpoint',
      group,
      hidden: true,
    }),
    ...(includeStyle
      ? [
          defineField({
            name: 'buttonStyle',
            title: 'Button Background',
            type: 'string',
            group,
            fieldset: 'primaryButton',
            hidden: ({parent}) => !parent?.showButton,
            components: {input: ColorPaletteInput},
            initialValue: '#dc2626',
          }),
          defineField({
            name: 'buttonTextColor',
            title: 'Button Text Color',
            type: 'string',
            group,
            fieldset: 'primaryButton',
            hidden: ({parent}) => !parent?.showButton,
            components: {input: ColorPaletteInput},
            initialValue: '#ffffff',
          }),
          defineField({
            name: 'buttonRadius',
            title: 'Corner Radius (px)',
            type: 'number',
            group,
            fieldset: 'primaryButton',
            hidden: ({parent}) => !parent?.showButton,
            description: '0 = square, 4 = slightly rounded, 9999 = pill.',
            validation: (rule) => rule.min(0).max(9999),
            initialValue: 0,
          }),
        ]
      : []),
    ...(includeOverlay
      ? [
          defineField({
            name: 'buttonOverlay',
            title: 'Float Over Image',
            type: 'boolean',
            group,
            fieldset: 'primaryButton',
            description: 'Places the button on top of the image instead of below it.',
            options: {layout: 'switch'},
            hidden: ({parent}) => !parent?.showButton,
            initialValue: false,
          }),
        ]
      : []),
    ...(includeSecondary
      ? [
          defineField({
            name: 'showSecondaryButton',
            title: 'Show a Second Button',
            type: 'boolean',
            group,
            options: {layout: 'switch'},
            hidden: ({parent}) => !parent?.showButton,
            initialValue: false,
          }),
          defineField({
            name: 'secondaryButtonLabel',
            title: 'Second Button Text',
            type: 'string',
            group,
            fieldset: 'secondaryButton',
            hidden: ({parent}) => !parent?.showSecondaryButton,
          }),
          defineField({
            name: 'secondaryButtonLinkUrl',
            title: 'Second Button Destination',
            type: 'string',
            group,
            fieldset: 'secondaryButton',
            placeholder: '/about/',
            hidden: ({parent}) => !parent?.showSecondaryButton,
          }),
          defineField({
            name: 'secondaryButtonLink',
            title: 'Second Button Destination (legacy)',
            type: 'linkEndpoint',
            group,
            hidden: true,
          }),
          defineField({
            name: 'secondaryButtonStyle',
            title: 'Second Button Background',
            type: 'string',
            group,
            fieldset: 'secondaryButton',
            hidden: ({parent}) => !parent?.showSecondaryButton,
            components: {input: ColorPaletteInput},
            options: {allowTransparent: true} as any,
            initialValue: 'transparent',
          }),
          defineField({
            name: 'secondaryButtonTextColor',
            title: 'Second Button Text Color',
            type: 'string',
            group,
            fieldset: 'secondaryButton',
            hidden: ({parent}) => !parent?.showSecondaryButton,
            components: {input: ColorPaletteInput},
            initialValue: '#ffffff',
          }),
          defineField({
            name: 'secondaryButtonRadius',
            title: 'Corner Radius (px)',
            type: 'number',
            group,
            fieldset: 'secondaryButton',
            hidden: ({parent}) => !parent?.showSecondaryButton,
            description: '0 = square, 4 = slightly rounded, 9999 = pill.',
            validation: (rule) => rule.min(0).max(9999),
            initialValue: 0,
          }),
        ]
      : []),
  ]
}

// ─── Expandable / Collapsible ───────────────────────

interface ExpandableOpts {
  group?: string
  includeFaqOptions?: boolean
}

export function expandableFields(opts: ExpandableOpts = {}) {
  const {group, includeFaqOptions = false} = opts

  return [
    defineField({
      name: 'expandable',
      title: 'Let Visitors Collapse This Section',
      type: 'boolean',
      group,
      description: 'Adds a click-to-expand toggle around this whole section.',
      options: {layout: 'switch'},
      initialValue: false,
    }),
    defineField({
      name: 'expandIcon',
      title: 'Toggle Icon',
      type: 'string',
      group,
      hidden: ({parent}) => !parent?.expandable,
      options: {
        list: [
          {title: '+ / −', value: 'plusMinus'},
          {title: '▼ Chevron', value: 'chevron'},
          {title: '↓ Arrow', value: 'arrow'},
          {title: '▸ Caret', value: 'caret'},
        ],
      },
      initialValue: 'plusMinus',
    }),
    defineField({
      name: 'expandedByDefault',
      title: 'Open by Default',
      type: 'boolean',
      group,
      options: {layout: 'switch'},
      hidden: ({parent}) => !parent?.expandable,
      initialValue: false,
    }),
    ...(includeFaqOptions
      ? [
          defineField({
            name: 'allowMultipleOpen',
            title: 'Allow Multiple Open at Once',
            type: 'boolean',
            group,
            description: 'Off: opening one question closes the others.',
            options: {layout: 'switch'},
            initialValue: true,
          }),
        ]
      : []),
  ]
}
