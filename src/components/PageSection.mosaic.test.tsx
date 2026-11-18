import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {renderToStaticMarkup} from 'react-dom/server'
import PageSection, {type Section} from './PageSection'

// Run with: npm run test:preview
// Cards Grid in Mosaic View: each picture fills the whole tile it sits in. Without Mosaic View nothing changes.

const cards = Array.from({length: 6}, (_, i) => ({
  _key: `c${i}`,
  title: `Card ${i}`,
  image: {url: '/images/no-image.jpg', alt: `Image ${i}`},
}))

const render = (extra: Partial<Section>) =>
  renderToStaticMarkup(
    <PageSection
      section={
        {
          _key: 's1',
          _type: 'cardsGridSection',
          sectionType: 'cardsGrid',
          cards,
          ...extra,
        } as Section
      }
    />,
  )

describe('Cards Grid mosaic: pictures fill their tile', () => {
  const html = render({mosaicView: true})

  it('every picture fills its tile (next/image "fill"), cropped to cover', () => {
    const fills = html.match(/data-nimg="fill"/g) ?? []
    assert.equal(fills.length, cards.length)
    assert.match(html, /object-fit:cover/)
  })

  it('the picture area grows with the tile (flex-1) and has a minimum height', () => {
    const areas = html.match(/class="relative flex-1 overflow-hidden"/g) ?? []
    assert.equal(areas.length, cards.length)
    assert.ok(html.includes('padding-top:56.25%'), 'the big tile has a wide minimum')
    assert.ok(html.includes('padding-top:75%'), 'normal tiles have a 4:3 minimum')
  })

  it('the first of every five tiles is the big one (2×2)', () => {
    assert.equal((html.match(/md:col-span-2 md:row-span-2/g) ?? []).length, 2)
    assert.equal((html.match(/padding-top:56.25%/g) ?? []).length, 2)
  })

  it('an editor-set image ratio is used as the minimum height of normal tiles', () => {
    const wide = render({mosaicView: true, cardStyle: {cardImageAspectRatio: '16 / 9'}} as never)
    assert.ok(wide.includes('padding-top:56.25%'))
  })
})

describe('without Mosaic View nothing changes', () => {
  for (const mosaicView of [false, undefined]) {
    const html = render({mosaicView})
    it(`mosaicView ${String(mosaicView)}: pictures keep their own proportions`, () => {
      assert.ok(!html.includes('data-nimg="fill"'), 'no filled pictures')
      assert.ok(!html.includes('flex-1'), 'no stretching wrappers')
      assert.ok(!html.includes('padding-top:'), 'no spacers')
      assert.ok(!html.includes('md:col-span-2'), 'no big tile')
    })
  }

  it('the grid markup is identical whether mosaicView is false or missing', () => {
    assert.equal(render({mosaicView: false}), render({mosaicView: undefined}))
  })
})
