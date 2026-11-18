import {dom} from '../layoutPresets/domSetup' // a browser-like page; must load before React
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {afterEach, beforeEach, describe, it} from 'node:test'
import {act} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {fakeContext, fakeS, type Spec} from './fakeStructure'
import {buildStructure} from './structure'
import {START_TASKS, START_TIPS, StartHereView, STUDIO_BASE} from './StartHere'
import {SINGLETON_PAGES} from '../singletonPages'

// Run with: npm run test:usability

let root: Root
let visited: string[]
beforeEach(() => {
  visited = []
  root = createRoot(document.getElementById('root')!)
  act(() => root.render(<StartHereView onNavigate={(p) => visited.push(p)} />))
})
afterEach(() => act(() => root.unmount()))

const links = () => [...document.querySelectorAll<HTMLAnchorElement>('a')]
const click = (el: Element, init: MouseEventInit = {}) => {
  const event = new dom.window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  })
  act(() => {
    el.dispatchEvent(event)
  })
  return event
}

describe('Start here', () => {
  it('shows the six everyday jobs as links, and the tips', () => {
    assert.equal(links().length, START_TASKS.length)
    assert.deepEqual(
      links().map((a) => a.querySelector('strong')?.textContent),
      [
        'Edit the home page',
        'Add a new page',
        'Write a blog post',
        'Update vehicles',
        'Edit the menu',
        'See the website',
      ],
    )
    for (const tip of START_TIPS) assert.ok(document.body.textContent!.includes(tip), tip)
  })

  it('a plain click moves inside the Studio (no page reload)', () => {
    const event = click(links()[0])
    assert.deepEqual(visited, [START_TASKS[0].path])
    assert.equal(event.defaultPrevented, true)
  })

  it('a new-tab click (Ctrl or Cmd) is left to the browser', () => {
    for (const init of [{ctrlKey: true}, {metaKey: true}, {shiftKey: true}]) {
      const event = click(links()[1], init)
      assert.equal(event.defaultPrevented, false)
    }
    assert.deepEqual(visited, [])
  })

  it('every link also has a real address, so it can be opened in a new tab', () => {
    for (const a of links()) assert.match(a.getAttribute('href')!, new RegExp(`^${STUDIO_BASE}/`))
  })
})

describe('every button leads somewhere that exists', () => {
  const rootSpec = (buildStructure(fakeS as never, fakeContext as never) as unknown as {spec: Spec})
    .spec
  const rows = (rootSpec.items as {spec: Spec}[])
    .map((i) => i.spec)
    .filter((i) => i.kind === 'item')
  const byId = new Map(rows.map((r) => [String(r.id), r]))
  const childIds = (id: string): string[] => {
    const child = byId.get(id)?.child as {spec?: Spec} | undefined
    return ((child?.spec?.items as {spec: Spec}[]) ?? []).map((i) => String(i.spec.id))
  }

  for (const task of START_TASKS.filter((t) => t.path.includes('/structure/'))) {
    it(`${task.title}: the sidebar entry exists`, () => {
      const [first, second] = task.path.split('/structure/')[1].split(';')
      assert.ok(byId.has(first), `no sidebar entry "${first}"`)
      if (second) {
        // The second segment is an entry inside the first (a page, or one of its lists).
        const known = first === 'pages' ? SINGLETON_PAGES.map((p) => p.type) : childIds(first)
        assert.ok(known.includes(second), `"${first}" has no entry "${second}"`)
      }
    })
  }

  it('See the website goes to the Preview tool', () => {
    assert.equal(START_TASKS.find((t) => t.id === 'preview')!.path, `${STUDIO_BASE}/preview`)
    // the Presentation tool is registered under that name
    assert.match(fs.readFileSync('studio/presentation.ts', 'utf8'), /name:\s*'preview'/)
  })
})
