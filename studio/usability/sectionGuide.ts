/**
 * What each section is for, in plain words (shown in the intro card at the top of a section's Content tab), and where a
 * section sits on its page. Pure data + functions (no Studio imports), so the wording and the ordering are tested.
 */

export interface SectionGuide {
  /** The name an editor knows the section by (matches the Add menu). */
  name: string
  /** One sentence: what the section is. */
  description: string
  /** One practical tip. */
  tip: string
}

export const SECTION_GUIDE: Record<string, SectionGuide> = {
  bannerSection: {
    name: 'Banner / Hero',
    description: 'A big picture at the top of a page, with a heading, a line of text and a button.',
    tip: 'Use a wide, bright picture. About 1600 px wide works well.',
  },
  cardsGridSection: {
    name: 'Cards Grid',
    description: 'A row or grid of cards, good for steps, services or benefits.',
    tip: 'Three or four cards per row read best. Keep titles under six words.',
  },
  featureGridSection: {
    name: 'Feature Grid',
    description: 'A title and a grid of picture cards, with an optional button underneath.',
    tip: 'Pictures with one clear subject work best. Keep the card text short.',
  },
  linkListSection: {
    name: 'Image + Link List',
    description: 'A picture beside a clickable list of titles.',
    tip: 'Keep each title short so the list is easy to scan.',
  },
  accordionSection: {
    name: 'Accordion (FAQ)',
    description: 'A list of click-to-open questions and answers.',
    tip: 'Put the question people ask most at the top.',
  },
  photoGallerySection: {
    name: 'Photo Gallery',
    description: 'A grid, mosaic or slider of photos, with an option to enlarge them.',
    tip: 'Describe each photo in its alt text. It helps screen readers and search engines.',
  },
  callToActionSection: {
    name: 'Call to Action',
    description: 'A short message with one or two buttons.',
    tip: 'One clear action works better than several.',
  },
  vehicleCarouselSection: {
    name: 'Vehicle Carousel',
    description: 'A swipeable row of vehicles you choose.',
    tip: 'Choose three to six vehicles. The section stays hidden on the live site until you pick some.',
  },
  googleReviewsSection: {
    name: 'Google Reviews',
    description: 'Your Google reviews in a slider, shown through Trustindex.',
    tip: 'You need your Trustindex widget ID, and the widget must be set up for the site.',
  },
  customHtmlSection: {
    name: 'Custom HTML',
    description: 'Your own HTML, for something the other sections cannot do.',
    tip: 'Use it only when no other section fits. It is checked for safety before it is shown.',
  },
}

interface SectionLike {
  _key?: string
  sequence?: number | null
}

/**
 * Where a section sits on its page, the way the website orders them: by Display Order (lowest first), a section with
 * no number last, and sections with the same number in the order they were added. Undefined when it cannot be found.
 */
export function positionOnPage(
  sections: SectionLike[] | undefined,
  key: string | undefined,
): {position: number; total: number} | undefined {
  if (!Array.isArray(sections) || !key) return undefined
  const ordered = sections
    .map((s, index) => ({
      key: s?._key,
      index,
      sequence: typeof s?.sequence === 'number' ? s.sequence : Infinity,
    }))
    .sort((a, b) =>
      a.sequence === b.sequence ? a.index - b.index : a.sequence < b.sequence ? -1 : 1,
    )
  const at = ordered.findIndex((s) => s.key === key)
  return at < 0 ? undefined : {position: at + 1, total: sections.length}
}
