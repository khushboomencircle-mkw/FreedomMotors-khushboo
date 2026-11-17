import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {ImageIcon} from '@sanity/icons/Image'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import CompactImageInput from './components/CompactImageInput'

/**
 * Individual Step / Card Item
 * Each card represents one column item (e.g. "Step 1: Reach Out To Our Team")
 * with its own title, image, description, and optional action button.
 */
export const convertVehicle2CardType = defineType({
  name: 'convertVehicle2Card',
  title: 'Step / Card Item',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'stepBadge',
      title: 'Step Badge / Subtitle (CSS: badge)',
      type: 'string',
      description: 'Optional label or badge above the title, e.g. "Step 1", "01", or "Intro".',
      placeholder: 'Step 1',
    }),
    defineField({
      name: 'title',
      title: 'Card / Step Heading',
      type: 'string',
      description: 'Main heading for this card, e.g. "Step 1: Reach Out To Our Team".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Card Image',
      type: 'image',
      description: 'Image displayed inside this card.',
      options: {hotspot: true},
      components: {input: CompactImageInput},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Descriptive text for accessibility and SEO.',
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Card Description',
      type: 'text',
      rows: 4,
      description: 'Body text describing this step or feature.',
      placeholder:
        "Before purchasing your own vehicle, reach out to our team to see if we have one that you're looking for in stock and already converted.",
    }),
    defineField({
      name: 'showButton',
      title: 'Show Action Button',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
      placeholder: 'Learn More',
      hidden: ({parent}) => !parent?.showButton,
    }),
    defineField({
      name: 'buttonLink',
      title: 'Button Link',
      type: 'linkEndpoint',
      hidden: ({parent}) => !parent?.showButton,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      badge: 'stepBadge',
      media: 'image',
      desc: 'description',
    },
    prepare({title, badge, media, desc}) {
      return {
        title: title || 'Untitled Card',
        subtitle: badge ? `[${badge}] ${desc || ''}` : desc || 'Card item',
        media: media || ImageIcon,
      }
    },
  },
})

export const convertVehicle2FaqItemType = defineType({
  name: 'convertVehicle2FaqItem',
  title: 'Accordion / FAQ Item',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question / Header Title',
      type: 'string',
      description: 'The title of the question (e.g. "What Vehicles Can You Convert?").',
      validation: (rule) => rule.required(),
      placeholder: 'What Vehicles Can You Convert?',
    }),
    defineField({
      name: 'answer',
      title: 'Answer / Expandable Content',
      type: 'text',
      rows: 4,
      description: 'Content visible when this item is expanded.',
      placeholder:
        "Below, you'll find answers to key questions regarding the types of vehicles we convert...",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isExpandedByDefault',
      title: 'Expanded by Default',
      type: 'boolean',
      description: 'Check to have this question open by default on page load.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'answer',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Untitled Question',
        subtitle: subtitle || 'FAQ / Accordion Item',
      }
    },
  },
})

/**
 * Page Section Type
 * Supports multi-column step card grids, FAQ accordion lists,
 * and standard single-block content sections, with dedicated CSS style controls.
 */
export const convertVehicle2SectionType = defineType({
  name: 'convertVehicle2Section',
  title: 'Page Section',
  type: 'object',
  icon: ThLargeIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'layout', title: 'Layout'},
    {name: 'sectionStyles', title: 'Section Style'},
    {name: 'cardStyles', title: 'Card Style'},
    {name: 'typography', title: 'Text & Fonts'},
    {name: 'behavior', title: 'Order & Behavior'},
  ],
  fieldsets: [
    {
      name: 'sectionHeader',
      title: 'Section Title & Subtitle (shown above content)',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'faqSection',
      title: 'FAQ Questions (click to expand/collapse)',
      options: {collapsible: false},
    },
    {
      name: 'cardsSection',
      title: 'Step Cards',
      options: {collapsible: false},
    },
    {
      name: 'standardContent',
      title: 'Banner Content (heading, text, image, buttons)',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'gridLayout',
      title: 'Columns & Spacing',
      options: {collapsible: false},
    },
    {
      name: 'cardFlow',
      title: 'Card Element Order',
      options: {collapsible: false},
    },
    {
      name: 'sectionContainer',
      title: 'Background & Container',
      options: {collapsible: false},
    },
    {
      name: 'sectionSpacing',
      title: 'Padding & Spacing',
      options: {collapsible: false},
    },
    {
      name: 'sectionBorderSet',
      title: 'Section Outline Border',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'cardBox',
      title: 'Card Background & Padding',
      options: {collapsible: false},
    },
    {
      name: 'cardBorderSet',
      title: 'Card Border & Corner Radius',
      options: {collapsible: false},
    },
    {
      name: 'cardImageSet',
      title: 'Card Image Display',
      options: {collapsible: false},
    },
    {
      name: 'headingTypo',
      title: 'Heading Font & Color',
      options: {collapsible: false},
    },
    {
      name: 'descTypo',
      title: 'Description Font & Color',
      options: {collapsible: false},
    },
    {
      name: 'expandableSet',
      title: 'Accordion / Expand Settings',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    // ==========================================
    // 📝 GROUP: CONTENT
    // ==========================================
    defineField({
      name: 'sectionType',
      title: 'What type of section is this?',
      type: 'string',
      group: 'content',
      description: 'Pick the layout that best fits the content you want to display.',
      options: {
        list: [
          {
            title: 'Step Cards Grid — side-by-side cards (Step 1, Step 2, Step 3…)',
            value: 'cardsGrid',
          },
          {title: 'FAQ Accordion — expandable questions & answers', value: 'faqAccordion'},
          {
            title: 'Banner Block — full-width image with heading, text & buttons',
            value: 'standard',
          },
        ],
        layout: 'radio',
      },
      initialValue: 'cardsGrid',
    }),

    // FAQ / Accordion Items Array (for faqAccordion mode)
    defineField({
      name: 'faqItems',
      title: 'Add FAQ Questions',
      type: 'array',
      group: 'content',
      fieldset: 'faqSection',
      description: 'Each item shows as a collapsible row. Click the "+" to add questions.',
      hidden: ({parent}) =>
        parent?.sectionType !== 'faqAccordion' &&
        (!parent?.faqItems || parent?.faqItems?.length === 0),
      of: [defineArrayMember({type: 'convertVehicle2FaqItem'})],
    }),

    // Optional Overall Section Heading
    defineField({
      name: 'sectionHeading',
      title: 'Section Title',
      type: 'string',
      group: 'content',
      fieldset: 'sectionHeader',
      description: 'Big title shown above all the cards or FAQ items (e.g. "How It Works").',
      placeholder: 'How It Works',
    }),
    defineField({
      name: 'sectionDescription',
      title: 'Section Subtitle / Intro',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'sectionHeader',
      description: 'Short paragraph shown below the section title.',
      placeholder: 'Follow these simple steps to get started…',
    }),

    // Cards / Steps Array (for cardsGrid mode)
    defineField({
      name: 'cards',
      title: 'Step Cards',
      type: 'array',
      group: 'content',
      fieldset: 'cardsSection',
      description: 'Add each step/card — title, image, description, and optional button.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      of: [defineArrayMember({type: 'convertVehicle2Card'})],
    }),

    // Legacy / Standard Content Fields (for standard mode)
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
      fieldset: 'standardContent',
      placeholder: 'Convert Your Own Vehicle',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
    }),
    defineField({
      name: 'description',
      title: 'Description / Body Text',
      type: 'text',
      rows: 4,
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'content',
      fieldset: 'standardContent',
      description: 'Upload one image for a hero banner, or multiple for a grid.',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          components: {input: CompactImageInput},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text (for accessibility & SEO)',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow Label (small text above heading)',
      type: 'string',
      group: 'content',
      fieldset: 'standardContent',
      placeholder: 'What We Convert',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
    }),
    defineField({
      name: 'headerStyle',
      title: 'Heading Style',
      type: 'string',
      group: 'content',
      fieldset: 'standardContent',
      description:
        'Standard: heading + paragraph. Eyebrow: small label + large title (like "What We Convert").',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
      options: {
        list: [
          {title: 'Standard — heading + description paragraph', value: 'standard'},
          {
            title: 'Eyebrow + Large Headline (e.g. What We Convert / Our Line Up)',
            value: 'eyebrowHeadline',
          },
        ],
      },
      initialValue: 'standard',
    }),
    defineField({
      name: 'showButton',
      title: 'Add a Primary Button?',
      type: 'boolean',
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
      initialValue: false,
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button Text',
      type: 'string',
      group: 'content',
      fieldset: 'standardContent',
      placeholder: 'Get Started',
      hidden: ({parent}) => parent?.sectionType !== 'standard' || !parent?.showButton,
    }),
    defineField({
      name: 'buttonLink',
      title: 'Button Link / Destination',
      type: 'linkEndpoint',
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard' || !parent?.showButton,
    }),
    defineField({
      name: 'buttonStyle',
      title: 'Button Color',
      type: 'string',
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard' || !parent?.showButton,
      options: {
        list: [
          {title: 'Red (Freedom Motors style)', value: 'red'},
          {title: 'Blue', value: 'blue'},
          {title: 'White', value: 'white'},
          {title: 'Dark / Black', value: 'dark'},
        ],
      },
      initialValue: 'red',
    }),
    defineField({
      name: 'buttonOverlay',
      title: 'Float button on top of image?',
      type: 'boolean',
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard' || !parent?.showButton,
      initialValue: false,
    }),
    defineField({
      name: 'showSecondaryButton',
      title: 'Add a Secondary Button? (e.g. "Learn More")',
      type: 'boolean',
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
      initialValue: false,
    }),
    defineField({
      name: 'secondaryButtonLabel',
      title: 'Secondary Button Text',
      type: 'string',
      group: 'content',
      fieldset: 'standardContent',
      placeholder: 'Learn More',
      hidden: ({parent}) => parent?.sectionType !== 'standard' || !parent?.showSecondaryButton,
    }),
    defineField({
      name: 'secondaryButtonLink',
      title: 'Secondary Button Link / Destination',
      type: 'linkEndpoint',
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard' || !parent?.showSecondaryButton,
    }),
    defineField({
      name: 'secondaryButtonStyle',
      title: 'Secondary Button Style',
      type: 'string',
      group: 'content',
      fieldset: 'standardContent',
      hidden: ({parent}) => parent?.sectionType !== 'standard' || !parent?.showSecondaryButton,
      options: {
        list: [
          {title: 'Outline White (hero banner style)', value: 'outlineWhite'},
          {title: 'Outline Dark', value: 'outlineDark'},
          {title: 'Solid Gray', value: 'solidGray'},
        ],
      },
      initialValue: 'outlineWhite',
    }),

    // ==========================================
    // LAYOUT
    // ==========================================
    defineField({
      name: 'columns',
      title: 'Number of Card Columns (desktop)',
      type: 'string',
      group: 'layout',
      fieldset: 'gridLayout',
      description: 'How many cards appear side-by-side on large screens.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: '1 Column (full width)', value: '1'},
          {title: '2 Columns', value: '2'},
          {title: '3 Columns — best for 3 steps', value: '3'},
          {title: '4 Columns', value: '4'},
        ],
        layout: 'radio',
      },
      initialValue: '3',
    }),
    defineField({
      name: 'gridGap',
      title: 'Gap Between Cards',
      type: 'string',
      group: 'layout',
      fieldset: 'gridLayout',
      description: 'Space between each card.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Tight (16px)', value: '16'},
          {title: 'Normal (24px)', value: '24'},
          {title: 'Wide (32px)', value: '32'},
          {title: 'Extra Wide (48px)', value: '48'},
        ],
      },
      initialValue: '24',
    }),
    defineField({
      name: 'cardContentOrder',
      title: 'Card Element Order',
      type: 'string',
      group: 'layout',
      fieldset: 'cardFlow',
      description: 'The vertical order of title, image, and description inside each card.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Title → Image → Description', value: 'titleImageDesc'},
          {title: 'Image → Title → Description', value: 'imageTitleDesc'},
          {title: 'Title → Description → Image', value: 'titleDescImage'},
        ],
        layout: 'radio',
      },
      initialValue: 'titleImageDesc',
    }),

    // Standard block layout controls
    defineField({
      name: 'imageLayout',
      title: 'How should images display?',
      type: 'string',
      group: 'layout',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
      options: {
        list: [
          {title: 'Grid (multiple images side by side)', value: 'grid'},
          {title: 'List (stacked vertically)', value: 'list'},
          {title: 'Full Width (single image, edge to edge)', value: 'fullWidth'},
          {title: 'Padded / Contained (single image with margins)', value: 'padded'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'textPosition',
      title: 'Where does the text appear?',
      type: 'string',
      group: 'layout',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
      options: {
        list: [
          {title: 'Above the image', value: 'aboveImage'},
          {title: 'Over / on top of the image (hero style)', value: 'overImage'},
          {title: 'Below the image', value: 'belowImage'},
          {title: 'Box layout (Title → Image → Description)', value: 'boxLayout'},
        ],
        layout: 'radio',
      },
      initialValue: 'belowImage',
    }),
    defineField({
      name: 'overlayPosition',
      title: 'Text Position on Hero Image',
      type: 'string',
      group: 'layout',
      description: 'Where the heading and text appear on the image.',
      hidden: ({parent}) =>
        parent?.sectionType !== 'standard' || parent?.textPosition !== 'overImage',
      options: {
        list: [
          {title: 'Center Left (Freedom Motors hero style)', value: 'centerLeft'},
          {title: 'Top Left', value: 'topLeft'},
          {title: 'Top Center', value: 'topCenter'},
          {title: 'Top Right', value: 'topRight'},
          {title: 'Center', value: 'center'},
          {title: 'Center Right', value: 'centerRight'},
          {title: 'Bottom Left', value: 'bottomLeft'},
          {title: 'Bottom Center', value: 'bottomCenter'},
          {title: 'Bottom Right', value: 'bottomRight'},
        ],
      },
      initialValue: 'centerLeft',
    }),
    defineField({
      name: 'bannerHeight',
      title: 'Banner / Hero Height',
      type: 'string',
      group: 'layout',
      description: 'How tall should the full-width hero image be?',
      hidden: ({parent}) =>
        parent?.sectionType !== 'standard' || parent?.textPosition !== 'overImage',
      options: {
        list: [
          {title: 'Tall (660px — Freedom Motors style)', value: 'large'},
          {title: 'Medium (500px)', value: 'medium'},
          {title: 'Compact (380px)', value: 'small'},
          {title: 'Auto (natural image height)', value: 'auto'},
        ],
      },
      initialValue: 'large',
    }),
    defineField({
      name: 'overlayGradient',
      title: 'Dark Gradient Over Image',
      type: 'string',
      group: 'layout',
      description: 'Adds a dark overlay on the image so the white text is easy to read.',
      hidden: ({parent}) =>
        parent?.sectionType !== 'standard' || parent?.textPosition !== 'overImage',
      options: {
        list: [
          {title: 'Left fade (hero banner style)', value: 'darkLeft'},
          {title: 'Bottom fade', value: 'darkBottom'},
          {title: 'Full image dark wash', value: 'darkFull'},
          {title: 'None (use raw image)', value: 'none'},
        ],
      },
      initialValue: 'darkLeft',
    }),
    defineField({
      name: 'imageFocalPoint',
      title: 'Image Focus Point',
      type: 'string',
      group: 'layout',
      description:
        'Which part of the image should stay visible (e.g. keep the vehicle on the right).',
      hidden: ({parent}) => parent?.sectionType !== 'standard',
      options: {
        list: [
          {title: 'Right center (vehicle on right)', value: 'rightCenter'},
          {title: 'Center', value: 'center'},
          {title: 'Left center', value: 'leftCenter'},
        ],
      },
      initialValue: 'rightCenter',
    }),

    // ==========================================
    // SECTION STYLE
    // ==========================================
    defineField({
      name: 'sectionTheme',
      title: 'Color Theme',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionContainer',
      description: 'Quick preset — sets background and text colors together.',
      options: {
        list: [
          {title: 'Dark (charcoal background, white text)', value: 'dark'},
          {title: 'Light (white background, dark text)', value: 'light'},
          {title: 'Custom (choose colors below)', value: 'custom'},
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
    }),
    defineField({
      name: 'sectionBgColor',
      title: 'Background Color',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionContainer',
      description: 'Color behind all the section content.',
      options: {
        list: [
          {title: 'Dark Charcoal — #121212 (default)', value: '#121212'},
          {title: 'Pure White — #ffffff', value: '#ffffff'},
          {title: 'Deep Black — #000000', value: '#000000'},
          {title: 'Dark Zinc — #18181b', value: '#18181b'},
          {title: 'Slate Navy — #0f172a', value: '#0f172a'},
          {title: 'Transparent', value: 'transparent'},
          {title: 'Light Gray — #f9fafb', value: '#f9fafb'},
        ],
      },
      initialValue: '#121212',
    }),
    defineField({
      name: 'sectionTextColor',
      title: 'Text Color',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionContainer',
      description: 'Default text color for all text in this section.',
      options: {
        list: [
          {title: 'White — #ffffff (for dark backgrounds)', value: '#ffffff'},
          {title: 'Soft White — #f3f4f6', value: '#f3f4f6'},
          {title: 'Dark — #111827 (for light backgrounds)', value: '#111827'},
        ],
      },
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'containerWidth',
      title: 'Content Container Width',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionContainer',
      description: 'How wide the content area can grow.',
      options: {
        list: [
          {title: 'Standard (1280px max)', value: 'max-w-7xl'},
          {title: 'Narrower (1152px max)', value: 'max-w-6xl'},
          {title: 'Full viewport width', value: 'fullWidth'},
        ],
      },
      initialValue: 'max-w-7xl',
    }),
    defineField({
      name: 'sectionPaddingY',
      title: 'Top & Bottom Padding',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionSpacing',
      description: 'Breathing room above and below the section.',
      options: {
        list: [
          {title: 'None (0px)', value: '0'},
          {title: 'Small (32px)', value: '32'},
          {title: 'Medium (64px)', value: '64'},
          {title: 'Large (96px)', value: '96'},
        ],
      },
      initialValue: '64',
    }),
    defineField({
      name: 'sectionPaddingX',
      title: 'Left & Right Padding',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionSpacing',
      description: 'Side margins inside the section container.',
      options: {
        list: [
          {title: 'None (0px)', value: '0'},
          {title: 'Standard (16px)', value: '16'},
          {title: 'Wide (32px)', value: '32'},
        ],
      },
      initialValue: '16',
    }),
    defineField({
      name: 'sectionPadding',
      title: 'Legacy Padding (hidden)',
      type: 'number',
      group: 'sectionStyles',
      fieldset: 'sectionSpacing',
      hidden: true,
      initialValue: 0,
    }),

    // Section Outer Border Controls
    defineField({
      name: 'showBorder',
      title: 'Add an outline border around this section?',
      type: 'boolean',
      group: 'sectionStyles',
      fieldset: 'sectionBorderSet',
      description: 'Draws a visible border around the entire section block.',
      initialValue: false,
    }),
    defineField({
      name: 'borderStyle',
      title: 'Border Style',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionBorderSet',
      hidden: ({parent}) => !parent?.showBorder,
      options: {
        list: [
          {title: 'Solid line', value: 'solid'},
          {title: 'Dashed', value: 'dashed'},
          {title: 'Dotted', value: 'dotted'},
          {title: 'Double line', value: 'double'},
        ],
      },
      initialValue: 'solid',
    }),
    defineField({
      name: 'borderColor',
      title: 'Border Color',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionBorderSet',
      hidden: ({parent}) => !parent?.showBorder,
      options: {
        list: [
          {title: 'Green — #22c55e', value: '#22c55e'},
          {title: 'Dark Gray — #374151', value: '#374151'},
          {title: 'Light Gray — #d1d5db', value: '#d1d5db'},
          {title: 'Black — #000000', value: '#000000'},
          {title: 'Blue — #3b82f6', value: '#3b82f6'},
        ],
      },
      initialValue: '#22c55e',
    }),
    defineField({
      name: 'borderWidth',
      title: 'Border Thickness',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionBorderSet',
      hidden: ({parent}) => !parent?.showBorder,
      options: {
        list: [
          {title: 'Thin (1px)', value: '1px'},
          {title: 'Normal (2px)', value: '2px'},
          {title: 'Thick (3px)', value: '3px'},
          {title: 'Bold (4px)', value: '4px'},
        ],
      },
      initialValue: '2px',
    }),
    defineField({
      name: 'borderRadius',
      title: 'Border Corner Roundness',
      type: 'string',
      group: 'sectionStyles',
      fieldset: 'sectionBorderSet',
      hidden: ({parent}) => !parent?.showBorder,
      options: {
        list: [
          {title: 'Square (no rounding)', value: 'none'},
          {title: 'Slightly rounded (4px)', value: 'small'},
          {title: 'Medium rounded (8px)', value: 'medium'},
          {title: 'Very rounded (16px)', value: 'large'},
          {title: 'Pill / circle (full)', value: 'full'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'borderSides',
      title: 'Which sides show the border?',
      type: 'object',
      group: 'sectionStyles',
      fieldset: 'sectionBorderSet',
      hidden: ({parent}) => !parent?.showBorder,
      fields: [
        defineField({name: 'top', title: 'Top', type: 'boolean', initialValue: true}),
        defineField({name: 'right', title: 'Right', type: 'boolean', initialValue: true}),
        defineField({name: 'bottom', title: 'Bottom', type: 'boolean', initialValue: true}),
        defineField({name: 'left', title: 'Left', type: 'boolean', initialValue: true}),
      ],
      options: {columns: 4},
    }),
    defineField({
      name: 'borderFullWidth',
      title: 'Extend border to full screen width',
      type: 'boolean',
      group: 'sectionStyles',
      fieldset: 'sectionBorderSet',
      hidden: ({parent}) => !parent?.showBorder,
      initialValue: false,
    }),

    // ==========================================
    // CARD STYLE
    // ==========================================
    defineField({
      name: 'cardBgColor',
      title: 'Card Background Color',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBox',
      description: 'Fill color inside each card.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Dark — #1c1c1c (Freedom Motors style)', value: '#1c1c1c'},
          {title: 'Dark Zinc — #18181b', value: '#18181b'},
          {title: 'Charcoal — #262626', value: '#262626'},
          {title: 'Transparent (border only)', value: 'transparent'},
          {title: 'White — #ffffff', value: '#ffffff'},
        ],
      },
      initialValue: '#1c1c1c',
    }),
    defineField({
      name: 'cardPadding',
      title: 'Card Inner Padding',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBox',
      description: 'Space between the card border and its content.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Tight (16px)', value: '16'},
          {title: 'Normal (24px)', value: '24'},
          {title: 'Spacious (32px)', value: '32'},
        ],
      },
      initialValue: '24',
    }),
    defineField({
      name: 'cardAlignment',
      title: 'Card Text Alignment',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBox',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'cardShadow',
      title: 'Card Shadow',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBox',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'None (flat, no shadow)', value: 'none'},
          {title: 'Subtle shadow', value: 'subtle'},
          {title: 'Medium shadow', value: 'medium'},
          {title: 'Soft glow', value: 'glow'},
        ],
      },
      initialValue: 'none',
    }),

    // Card Border Controls
    defineField({
      name: 'showCardBorder',
      title: 'Show border around each card?',
      type: 'boolean',
      group: 'cardStyles',
      fieldset: 'cardBorderSet',
      description: 'Draws an outline around every card.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      initialValue: true,
    }),
    defineField({
      name: 'cardBorderColor',
      title: 'Card Border Color',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBorderSet',
      hidden: ({parent}) => parent?.sectionType === 'standard' || parent?.showCardBorder === false,
      options: {
        list: [
          {title: 'Dark Gray — #374151 (default)', value: '#374151'},
          {title: 'Subtle Charcoal — #27272a', value: '#27272a'},
          {title: 'Slate Gray — #4b5563', value: '#4b5563'},
          {title: 'Light — #d1d5db', value: '#d1d5db'},
          {title: 'Blue Accent — #3b82f6', value: '#3b82f6'},
        ],
      },
      initialValue: '#374151',
    }),
    defineField({
      name: 'cardBorderStyle',
      title: 'Card Border Style',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBorderSet',
      hidden: ({parent}) => parent?.sectionType === 'standard' || parent?.showCardBorder === false,
      options: {
        list: [
          {title: 'Solid line', value: 'solid'},
          {title: 'Dashed', value: 'dashed'},
          {title: 'Dotted', value: 'dotted'},
        ],
      },
      initialValue: 'solid',
    }),
    defineField({
      name: 'cardBorderWidth',
      title: 'Card Border Thickness',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBorderSet',
      hidden: ({parent}) => parent?.sectionType === 'standard' || parent?.showCardBorder === false,
      options: {
        list: [
          {title: 'Thin (1px)', value: '1px'},
          {title: 'Thick (2px)', value: '2px'},
        ],
      },
      initialValue: '1px',
    }),
    defineField({
      name: 'cardBorderRadius',
      title: 'Card Corner Roundness',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardBorderSet',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Square (no rounding)', value: 'none'},
          {title: 'Slightly rounded (4px)', value: 'small'},
          {title: 'Rounded (8px)', value: 'medium'},
          {title: 'Very rounded (16px)', value: 'large'},
        ],
      },
      initialValue: 'none',
    }),

    // Card Image Display
    defineField({
      name: 'cardImageAspectRatio',
      title: 'Image Proportions (aspect ratio)',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardImageSet',
      description: 'Makes all card images the same shape.',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: '4:3 — standard photo (default)', value: '4/3'},
          {title: '16:9 — widescreen landscape', value: '16/9'},
          {title: '3:2 — classic photo', value: '3/2'},
          {title: '1:1 — square', value: '1/1'},
          {title: 'Auto — original image proportions', value: 'auto'},
        ],
      },
      initialValue: '4/3',
    }),
    defineField({
      name: 'cardImageFit',
      title: 'How should the image fill its space?',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardImageSet',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Cover — fills the space, may crop edges', value: 'cover'},
          {title: 'Contain — shows the full image, may leave gaps', value: 'contain'},
        ],
      },
      initialValue: 'cover',
    }),
    defineField({
      name: 'cardImageBorderRadius',
      title: 'Image Corner Roundness',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardImageSet',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Square (no rounding)', value: 'none'},
          {title: 'Slightly rounded (4px)', value: 'small'},
          {title: 'Rounded (8px)', value: 'medium'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'cardImageMarginBottom',
      title: 'Space above & below image',
      type: 'string',
      group: 'cardStyles',
      fieldset: 'cardImageSet',
      hidden: ({parent}) => parent?.sectionType === 'standard',
      options: {
        list: [
          {title: 'Tight (12px)', value: '12'},
          {title: 'Normal (16px)', value: '16'},
          {title: 'Spacious (24px)', value: '24'},
        ],
      },
      initialValue: '16',
    }),

    // ==========================================
    // TEXT & FONTS
    // ==========================================
    defineField({
      name: 'headingSize',
      title: 'Heading Size',
      type: 'string',
      group: 'typography',
      fieldset: 'headingTypo',
      options: {
        list: [
          {title: 'Small (18px)', value: 'sm'},
          {title: 'Medium (22px)', value: 'md'},
          {title: 'Large (26px)', value: 'lg'},
          {title: 'Extra Large (32px)', value: 'xl'},
          {title: '2XL (40px)', value: '2xl'},
        ],
      },
      initialValue: 'lg',
    }),
    defineField({
      name: 'headingWeight',
      title: 'Heading Weight',
      type: 'string',
      group: 'typography',
      fieldset: 'headingTypo',
      options: {
        list: [
          {title: 'Normal', value: '400'},
          {title: 'Medium', value: '500'},
          {title: 'Semi-Bold', value: '600'},
          {title: 'Bold (default)', value: '700'},
        ],
      },
      initialValue: '700',
    }),
    defineField({
      name: 'headingColor',
      title: 'Heading Color',
      type: 'string',
      group: 'typography',
      fieldset: 'headingTypo',
      options: {
        list: [
          {title: 'White — #ffffff (default)', value: '#ffffff'},
          {title: 'Soft White — #f3f4f6', value: '#f3f4f6'},
          {title: 'Dark — #111827 (for light backgrounds)', value: '#111827'},
          {title: 'Blue Accent — #3b82f6', value: '#3b82f6'},
        ],
      },
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'headingAlignment',
      title: 'Heading Alignment',
      type: 'string',
      group: 'typography',
      fieldset: 'headingTypo',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'descriptionSize',
      title: 'Description Size',
      type: 'string',
      group: 'typography',
      fieldset: 'descTypo',
      options: {
        list: [
          {title: 'Small (14px)', value: 'sm'},
          {title: 'Medium (16px)', value: 'md'},
          {title: 'Large (18px)', value: 'lg'},
        ],
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'descriptionColor',
      title: 'Description Color',
      type: 'string',
      group: 'typography',
      fieldset: 'descTypo',
      options: {
        list: [
          {title: 'Light Gray — #e5e7eb (default)', value: '#e5e7eb'},
          {title: 'Muted Gray — #9ca3af', value: '#9ca3af'},
          {title: 'Dark — #4b5563 (for light backgrounds)', value: '#4b5563'},
        ],
      },
      initialValue: '#e5e7eb',
    }),
    defineField({
      name: 'descriptionLineHeight',
      title: 'Description Line Spacing',
      type: 'string',
      group: 'typography',
      fieldset: 'descTypo',
      description: 'How much vertical space between each line of description text.',
      options: {
        list: [
          {title: 'Compact (1.5)', value: '1.5'},
          {title: 'Normal (1.65)', value: '1.65'},
          {title: 'Loose (1.8)', value: '1.8'},
        ],
      },
      initialValue: '1.65',
    }),
    defineField({
      name: 'descriptionAlignment',
      title: 'Description Alignment',
      type: 'string',
      group: 'typography',
      fieldset: 'descTypo',
      description: 'Can be different from the heading alignment above.',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'contentAlignment',
      title: 'Overall Text Alignment (fallback)',
      type: 'string',
      group: 'typography',
      description:
        'Sets alignment for both heading and description if individual settings above are not specified.',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'contentIndentation',
      title: 'Left Indent (px)',
      type: 'number',
      group: 'typography',
      description: 'Shifts all text content to the right by this many pixels.',
      initialValue: 0,
    }),

    // ==========================================
    // ORDER & BEHAVIOR
    // ==========================================
    defineField({
      name: 'sequence',
      title: 'Section Order (number)',
      type: 'number',
      group: 'behavior',
      description: 'Sections with lower numbers appear first. e.g. 1 = first, 2 = second.',
    }),
    defineField({
      name: 'expandable',
      title: 'Make this section collapsible?',
      type: 'boolean',
      group: 'behavior',
      fieldset: 'expandableSet',
      description: 'Adds an expand/collapse toggle so users can show or hide this section.',
      initialValue: false,
    }),
    defineField({
      name: 'expandIcon',
      title: 'Expand/Collapse Icon',
      type: 'string',
      group: 'behavior',
      fieldset: 'expandableSet',
      hidden: ({parent}) => !parent?.expandable,
      options: {
        list: [
          {title: '+ / − (plus/minus)', value: 'plusMinus'},
          {title: '▼ Chevron arrow', value: 'chevron'},
          {title: '↓ Arrow', value: 'arrow'},
          {title: '▸ Caret', value: 'caret'},
        ],
      },
      initialValue: 'plusMinus',
    }),
    defineField({
      name: 'expandedByDefault',
      title: 'Start expanded (open by default)?',
      type: 'boolean',
      group: 'behavior',
      fieldset: 'expandableSet',
      hidden: ({parent}) => !parent?.expandable,
      initialValue: false,
    }),
    defineField({
      name: 'accordionDividerColor',
      title: 'Divider Line Color between FAQ items',
      type: 'string',
      group: 'behavior',
      fieldset: 'expandableSet',
      description: 'The horizontal line color separating each FAQ question.',
      options: {
        list: [
          {title: 'Light Gray — #d1d5db (default)', value: '#d1d5db'},
          {title: 'Soft Gray — #e5e7eb', value: '#e5e7eb'},
          {title: 'Dark Charcoal — #374151', value: '#374151'},
          {title: 'Black — #000000', value: '#000000'},
        ],
      },
      initialValue: '#d1d5db',
    }),
    defineField({
      name: 'allowMultipleOpen',
      title: 'Allow multiple FAQs open at once?',
      type: 'boolean',
      group: 'behavior',
      fieldset: 'expandableSet',
      description: "When on, opening one FAQ question won't close the others.",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      sectionHeading: 'sectionHeading',
      sequence: 'sequence',
      sectionType: 'sectionType',
      cards: 'cards',
      faqItems: 'faqItems',
      media: 'images.0',
    },
    prepare({heading, sectionHeading, sequence, sectionType, cards, faqItems, media}) {
      const isFaq = sectionType === 'faqAccordion'
      const isCards = sectionType === 'cardsGrid'
      const faqCount = faqItems?.length || 0
      const cardCount = cards?.length || 0
      const title =
        sectionHeading ||
        heading ||
        (isFaq
          ? `FAQ Section (${faqCount} questions)`
          : isCards
            ? `${cardCount} Step Cards Section`
            : 'Untitled Section')
      const firstCardMedia = cards?.[0]?.image
      return {
        title,
        subtitle: `#${sequence ?? '—'} · ${
          isFaq
            ? `FAQ Accordion (${faqCount} items)`
            : isCards
              ? `Cards Grid (${cardCount} cards)`
              : 'Standard Block'
        }`,
        media: firstCardMedia || media || ImageIcon,
      }
    },
  },
})

/**
 * Main Page Document Type for "Convert Your Vehicle 2"
 */
export const convertVehicle2PageType = defineType({
  name: 'convertVehicle2Page',
  title: 'Convert Your Vehicle 2',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Convert Your Vehicle',
    }),
    defineField({
      name: 'pageDescription',
      title: 'Page Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      type: 'array',
      description:
        'Add any number of content sections (such as step card grids, feature blocks, or hero banners). Sections are ordered by their sequence number.',
      of: [
        defineArrayMember({
          type: 'convertVehicle2Section',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'pageTitle',
      sections: 'sections',
    },
    prepare({title, sections}) {
      const count = sections?.length || 0
      return {
        title: title || 'Convert Your Vehicle 2',
        subtitle: `${count} section${count === 1 ? '' : 's'}`,
      }
    },
  },
})
