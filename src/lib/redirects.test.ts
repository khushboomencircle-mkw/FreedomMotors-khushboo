import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {REDIRECT_RETRY_AFTER_FAILURE_MS, createRedirectMapLoader, normalizePath} from './redirects'

// Run with: npm run test:redirects
// The loader that serves Studio redirects to the site: cached for a short time, shared between concurrent
// requests, and never allowed to take the site down when Sanity cannot be reached.

const raw = (source: string, destination: string, permanent = true) => ({
  source,
  destination,
  permanent,
})
const TTL = 1000

function harness(fetchImpl: () => Promise<ReturnType<typeof raw>[]>) {
  let time = 0
  let calls = 0
  const load = createRedirectMapLoader(
    () => {
      calls++
      return fetchImpl()
    },
    {ttlMs: TTL, now: () => time},
  )
  return {load, advance: (ms: number) => (time += ms), calls: () => calls}
}

describe('redirect map loader', () => {
  it('flattens what Sanity returns (case, trailing slash, chains)', async () => {
    const h = harness(async () => [raw('/Old-Page/', '/middle'), raw('/middle', '/final?x=1')])
    const map = await h.load()
    assert.deepEqual(map['/old-page'], {destination: '/final?x=1', permanent: true})
    assert.equal(map[normalizePath('/OLD-PAGE')]?.destination, '/final?x=1')
  })

  it('reuses the map within the time window, and reloads after it', async () => {
    const h = harness(async () => [raw('/a', '/b')])
    await h.load()
    h.advance(TTL - 1)
    await h.load()
    assert.equal(h.calls(), 1)
    h.advance(2)
    await h.load()
    assert.equal(h.calls(), 2)
  })

  it('shares one Sanity request between concurrent callers', async () => {
    const h = harness(async () => [raw('/a', '/b')])
    await Promise.all([h.load(), h.load(), h.load()])
    assert.equal(h.calls(), 1)
  })

  it('picks up a changed redirect after the window (what an editor saving in Studio relies on)', async () => {
    let data = [raw('/a', '/b')]
    const h = harness(async () => data)
    assert.equal((await h.load())['/a'].destination, '/b')
    data = [raw('/a', '/c')]
    h.advance(TTL + 1)
    assert.equal((await h.load())['/a'].destination, '/c')
  })

  it('with Sanity unreachable and nothing cached: an empty map, and a retry soon (not on every request)', async () => {
    let fail = true
    const h = harness(async () => {
      if (fail) throw new Error('network down')
      return [raw('/a', '/b')]
    })
    const originalError = console.error
    console.error = () => {}
    try {
      assert.deepEqual(await h.load(), {})
      await h.load()
      assert.equal(h.calls(), 1, 'does not hammer Sanity right after a failure')
      fail = false
      h.advance(REDIRECT_RETRY_AFTER_FAILURE_MS)
      assert.equal((await h.load())['/a'].destination, '/b')
    } finally {
      console.error = originalError
    }
  })

  it('keeps serving the last good map when a later reload fails', async () => {
    let fail = false
    const h = harness(async () => {
      if (fail) throw new Error('network down')
      return [raw('/a', '/b')]
    })
    await h.load()
    fail = true
    h.advance(TTL + 1)
    const originalError = console.error
    console.error = () => {}
    try {
      assert.equal((await h.load())['/a'].destination, '/b')
    } finally {
      console.error = originalError
    }
  })
})
