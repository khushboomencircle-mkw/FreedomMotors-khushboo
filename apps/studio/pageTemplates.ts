/**
 * Page Templates — initial value templates for `customPage` ("Landing
 * Page" in the Studio UI — see the comment on that type for why the
 * underlying type name stays `customPage`).
 *
 * Registered via `schema.templates` in sanity.config.ts (a separate config
 * key from `schema.types`, which schemaTypes/index.ts already populates —
 * registering a type and registering a template for creating one are two
 * different things). The "Pages → User Created Pages" list in
 * sanity.config.ts's structure then offers these via
 * `.initialValueTemplates([...])`.
 *
 * Each `value` is a FUNCTION, not a static object — Sanity calls it fresh
 * every time someone creates a document from the template, which is what
 * gives every new document its own `_key`s. A static object would hand out
 * the exact same keys to every document created from the same template.
 *
 * Per the client's own restrictions (also shown to editors via each
 * template's description and the `sections` field's help text on
 * customPage.ts): a template only applies when creating a new page, it
 * can't change colors/fonts (the Theme feature isn't built), and it can't
 * create new section designs (a section-template library isn't built yet —
 * see the Offer/Promotion template below for why it's the shortest one).
 */
import type {Template} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {RocketIcon} from '@sanity/icons/Rocket'
import {BellIcon} from '@sanity/icons/Bell'
import {TagIcon} from '@sanity/icons/Tag'
import {randomKey} from '@sanity/util/content'

/** Portable Text block array for a richText field, seeded with one paragraph. */
function placeholderRichText(text: string) {
  return [
    {
      _type: 'block',
      _key: randomKey(12),
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: randomKey(12), text, marks: []}],
    },
  ]
}

function bannerSection(heading: string, description: string) {
  return {
    _key: randomKey(12),
    _type: 'bannerSection',
    sequence: 1,
    isActive: true,
    sectionHeading: heading,
    sectionDescription: placeholderRichText(description),
    // Honestly seeded as a single-image hero (imageLayout's working value) —
    // NOT 'grid': PageSection.tsx only ever renders imageLayout === 'fullWidth'
    // as an actual layout today; 'grid'/'list'/'padded' are unimplemented
    // dead values (confirmed by grep before writing this). Advertising a
    // multi-image collage that doesn't render would violate the "never show
    // a disconnect between what's described and what renders" rule. Building
    // real collage rendering is a separate, follow-up frontend task.
    imageLayout: 'fullWidth',
    textPosition: 'overImage',
    images: [], // left empty per spec — admin adds the real photo(s)
  }
}

function featureGridSection(heading: string, featureTitles: string[]) {
  return {
    _key: randomKey(12),
    _type: 'featureGridSection',
    sequence: 2,
    isActive: true,
    sectionHeading: heading,
    features: featureTitles.map((title) => ({
      _key: randomKey(12),
      _type: 'featureCardItem',
      title,
      description: placeholderRichText('Replace with a short description of this feature.'),
      // image left unset — photoWithAlt's alt is required, and there's no
      // photo yet to attach it to; leaving the field absent avoids a
      // spurious "alt is required" error for a photo that doesn't exist.
    })),
  }
}

function photoGallerySection() {
  return {
    _key: randomKey(12),
    _type: 'photoGallerySection',
    sequence: 3,
    isActive: true,
    layout: 'grid',
    columns: '3',
    lightbox: false,
    // Left empty per spec. Unlike bannerSection.images[], this one has its
    // own existing `rule.min(2)` on `photos` (unrelated to this task, not
    // weakened here) — so this section will show a real Studio validation
    // ERROR, not just the soft placeholder warning, until at least 2 photos
    // are added. That's an accurate reflection of "a photo gallery with no
    // photos isn't a valid photo gallery," not a template bug.
    photos: [],
  }
}

function googleReviewsSection() {
  return {
    _key: randomKey(12),
    _type: 'googleReviewsSection',
    sequence: 4,
    isActive: true,
    // trustindexWidgetId intentionally left unset: it's account-specific,
    // a template can't supply a real one, and the field is already
    // `Rule.required()` with its own clear error message — this section
    // will show nothing on the live site and a required-field error in
    // Studio until that one field is filled in. Expected, not a bug.
  }
}

function accordionSection(heading: string, qa: [string, string][]) {
  return {
    _key: randomKey(12),
    _type: 'accordionSection',
    sequence: 5,
    isActive: true,
    sectionHeading: heading,
    items: qa.map(([question, answer]) => ({
      _key: randomKey(12),
      _type: 'accordionItem',
      question,
      answer: placeholderRichText(answer),
    })),
  }
}

function callToActionSection(heading: string, buttonLabel: string) {
  return {
    _key: randomKey(12),
    _type: 'callToActionSection',
    sequence: 6,
    isActive: true,
    sectionHeading: heading,
    sectionDescription: placeholderRichText(
      'Replace with a short closing line that nudges the reader to act.',
    ),
    showButton: true,
    buttonLabel,
    buttonLinkUrl: '/contact',
  }
}

export const pageTemplates: Template[] = [
  {
    id: 'blank',
    title: 'Blank',
    description: 'An empty landing page — add sections yourself.',
    icon: DocumentTextIcon,
    schemaType: 'customPage',
    value: () => ({
      _type: 'customPage',
      isActive: true,
      showHeader: true,
      showFooter: true,
      sections: [],
    }),
  },
  {
    id: 'model-launch',
    title: 'Model Launch',
    description:
      'Hero, key features, photo gallery, reviews, and FAQ — for introducing a new model.',
    icon: RocketIcon,
    schemaType: 'customPage',
    value: () => ({
      _type: 'customPage',
      isActive: true,
      showHeader: true,
      showFooter: true,
      sections: [
        bannerSection(
          'Replace with your headline',
          'Replace with a short line introducing this model.',
        ),
        featureGridSection('Replace with your section title', [
          'Replace with feature title',
          'Replace with feature title',
          'Replace with feature title',
        ]),
        photoGallerySection(),
        googleReviewsSection(),
        accordionSection('Replace with your section title', [
          ['Replace with a question', 'Replace with the answer.'],
          ['Replace with a question', 'Replace with the answer.'],
        ]),
        callToActionSection('Replace with your closing headline', 'Replace with button text'),
      ],
    }),
  },
  {
    id: 'campaign',
    title: 'Campaign',
    description:
      'Hero, key features, FAQ, and a closing call to action — for a time-limited campaign page.',
    icon: BellIcon,
    schemaType: 'customPage',
    value: () => ({
      _type: 'customPage',
      isActive: true,
      showHeader: true,
      showFooter: true,
      // noIndex (seoType.ts's actual field name — NOT "hideFromGoogle",
      // which doesn't exist on this schema) — campaign pages are often
      // short-lived and not meant to rank; the editor can switch it off.
      seo: {noIndex: true},
      sections: [
        bannerSection(
          'Replace with your campaign headline',
          'Replace with a short line about this campaign.',
        ),
        featureGridSection('Replace with your section title', [
          'Replace with feature title',
          'Replace with feature title',
          'Replace with feature title',
        ]),
        accordionSection('Replace with your section title', [
          ['Replace with a question', 'Replace with the answer.'],
          ['Replace with a question', 'Replace with the answer.'],
        ]),
        callToActionSection('Replace with your closing headline', 'Replace with button text'),
      ],
    }),
  },
  {
    id: 'offer-promotion',
    title: 'Offer / Promotion',
    description:
      'A closing call to action only — the promotional banner slot this template was meant to also include ' +
      "isn't built yet (no section-template library exists in this project; see pageTemplates.ts).",
    icon: TagIcon,
    schemaType: 'customPage',
    value: () => ({
      _type: 'customPage',
      isActive: true,
      showHeader: true,
      showFooter: true,
      // A `templateSection` referencing a reusable "template-offer-banner"
      // section was requested here, but no reusable/referenced section-
      // template mechanism exists anywhere in this codebase today (grep for
      // templateSection/template-offer-banner returns nothing; REMAINING_
      // WORK.md independently lists "Save a custom section and reuse it on
      // other pages" as still missing). Per the client's own instruction,
      // that slot is left out entirely rather than inventing a
      // `templateSection` type to reference — this template is
      // callToActionSection only until that library actually exists.
      // (Vehicles slider correctly excluded too — no vehicle data in this
      // demo.)
      sections: [
        callToActionSection('Replace with your offer headline', 'Replace with button text'),
      ],
    }),
  },
]
