import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {renderToStaticMarkup} from 'react-dom/server'
import PageSection, {type Section} from './PageSection'

// Run with: npm run test:preview
// Renders the real PageSection for one sample of every section type, with and without the preview document,
// and checks the click-to-edit marker: present and correct in preview, completely absent on the live site.

process.env.NEXT_PUBLIC_TRUSTINDEX_LOADER_SRC = 'https://example.com/loader.js'

const DOC = {id: 'homePage', type: 'homePage'}

/** One minimal-but-real section per type. `_type` drives the renderer; the fields are just enough to render. */
const SAMPLES: Record<string, Partial<Section>> = {
  bannerSection: {
    sectionHeading: 'Banner',
    textPosition: 'overImage',
    images: [{_key: 'i1', url: '/images/no-image.jpg', alt: 'x'}],
  },
  cardsGridSection: {
    sectionHeading: 'Cards',
    sectionType: 'cardsGrid',
    cards: [{_key: 'c1', title: 'Card one'}],
  },
  featureGridSection: {
    sectionHeading: 'Features',
    features: [{_key: 'f1', title: 'Feature one'}],
  },
  linkListSection: {
    sectionHeading: 'Links',
    listItems: [{_key: 'l1', title: 'Link one'}],
  },
  accordionSection: {
    sectionHeading: 'FAQ',
    sectionType: 'accordionSection',
    items: [{_key: 'q1', question: 'Why?', answer: []}],
  },
  photoGallerySection: {
    sectionHeading: 'Gallery',
    images: [{_key: 'p1', url: '/images/no-image.jpg', alt: 'x'}],
  },
  vehicleCarouselSection: {sectionHeading: 'Vehicles', isPreview: true},
  callToActionSection: {sectionHeading: 'Call to action', buttonLabel: 'Go'},
  customHtmlSection: {htmlCode: '<p>Hello</p>'},
  googleReviewsSection: {trustindexWidgetId: 'abc'},
}

const render = (section: Section, doc?: typeof DOC) =>
  renderToStaticMarkup(<PageSection section={section} doc={doc} />)

describe('every section type carries a click-to-edit marker in preview', () => {
  for (const [type, fields] of Object.entries(SAMPLES)) {
    const key = `key${type}`
    const section = {_key: key, _type: type, ...fields} as Section

    it(`${type}: marker points at this section's key`, () => {
      const html = render(section, DOC)
      assert.match(html, /data-sanity="/, 'has a data-sanity attribute')
      assert.ok(html.includes(`id=homePage`), 'names the document')
      assert.ok(html.includes(`path=sections:${key}`), `points at sections:${key}`)
    })

    it(`${type}: no marker on the live site`, () => {
      assert.doesNotMatch(render(section), /data-sanity/)
    })
  }
})

describe('markers do not change the public page', () => {
  it('live HTML is identical to the HTML before this feature (no doc → no new attributes)', () => {
    const section = {_key: 'k1', _type: 'callToActionSection', sectionHeading: 'Hi'} as Section
    const live = render(section)
    const preview = render(section, DOC)
    // The only difference in preview is the marker attribute.
    assert.equal(preview.replace(/ data-sanity="[^"]*"/, ''), live)
  })

  it('an inactive section still renders nothing', () => {
    const section = {_key: 'k1', _type: 'callToActionSection', isActive: false} as Section
    assert.equal(render(section, DOC), '')
  })

  it('two sections on one page get different markers', () => {
    const a = render(
      {_key: 'aaa', _type: 'callToActionSection', sectionHeading: 'A'} as Section,
      DOC,
    )
    const b = render(
      {_key: 'bbb', _type: 'callToActionSection', sectionHeading: 'B'} as Section,
      DOC,
    )
    assert.ok(a.includes('path=sections:aaa') && !a.includes('sections:bbb'))
    assert.ok(b.includes('path=sections:bbb') && !b.includes('sections:aaa'))
  })
})
