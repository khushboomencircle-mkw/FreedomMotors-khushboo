import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
  TRUSTINDEX_LOADER_SRC,
  extractTrustindexWidgetId,
  isTrustindexWidgetId,
  trustindexWidgetSrc,
} from './trustindex'

// Run with: npm run test:reviews
// A made-up ID of the real shape (27 letters and digits) — never the client's real widget ID.
const ID = 'a1b2c3d4e5f60718293a4b5c6d7'

describe('Trustindex widget ID', () => {
  it('accepts a bare ID of letters and digits', () => {
    assert.equal(isTrustindexWidgetId(ID), true)
    assert.equal(extractTrustindexWidgetId(`  ${ID}  `), ID)
  })
  it('rejects empty, short, or odd values', () => {
    for (const bad of [
      undefined,
      null,
      42,
      '',
      'abc',
      `${ID} extra`,
      `${ID}"><script>`,
      `${ID}/../x`,
    ])
      assert.equal(isTrustindexWidgetId(bad), false, String(bad))
  })
  it('finds the ID when an editor pastes the whole embed snippet or the loader URL', () => {
    assert.equal(
      extractTrustindexWidgetId(
        `<script defer async src='${TRUSTINDEX_LOADER_SRC}?${ID}'></script>`,
      ),
      ID,
    )
    assert.equal(extractTrustindexWidgetId(`${TRUSTINDEX_LOADER_SRC}?${ID}`), ID)
    assert.equal(extractTrustindexWidgetId(`<div class="ti-widget" data-pid="${ID}"></div>`), ID)
    assert.equal(
      extractTrustindexWidgetId('<script src="https://example.com/x.js"></script>'),
      undefined,
    )
  })
})

describe('trustindexWidgetSrc', () => {
  it('builds the address the loader reads the ID from', () => {
    assert.equal(trustindexWidgetSrc(ID), `https://cdn.trustindex.io/loader.js?${ID}`)
  })
  it('returns nothing when there is no usable ID, and never echoes odd input into the address', () => {
    assert.equal(trustindexWidgetSrc(undefined), undefined)
    assert.equal(trustindexWidgetSrc('abc'), undefined)
    assert.equal(trustindexWidgetSrc(`${ID}'><img src=x onerror=alert(1)>`), undefined)
  })
})
