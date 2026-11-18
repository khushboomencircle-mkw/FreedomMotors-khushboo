import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {renderToStaticMarkup} from 'react-dom/server'
import PageSection, {type Section} from './PageSection'

// Run with: npm run test:preview
// The Link List's picture side is whatever the Studio's layout picker saved in `imageSide`
// (the picker writes the same field the website reads; an empty field means left).

const render = (imageSide?: 'left' | 'right') =>
  renderToStaticMarkup(
    <PageSection
      section={
        {
          _key: 'l1',
          _type: 'linkListSection',
          imageSide,
          image: {url: '/images/no-image.jpg', alt: 'THE-PICTURE'},
          listItems: [{_key: 'i1', title: 'THE-LIST-ITEM'}],
        } as Section
      }
    />,
  )

/** Where the picture and the list sit in the page, in reading order. */
const order = (html: string) => ({
  picture: html.indexOf('THE-PICTURE'),
  list: html.indexOf('THE-LIST-ITEM'),
})

describe('Link List picture side follows the layout picker', () => {
  it('Image left: the picture comes before the list', () => {
    const {picture, list} = order(render('left'))
    assert.ok(picture > -1 && list > -1)
    assert.ok(picture < list)
  })

  it('Image right: the picture comes after the list', () => {
    const {picture, list} = order(render('right'))
    assert.ok(picture > -1 && list > -1)
    assert.ok(picture > list)
  })

  it('nothing chosen yet: left, as the picker shows', () => {
    assert.equal(render(undefined), render('left'))
  })
})
