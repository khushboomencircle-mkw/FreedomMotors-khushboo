import {JSDOM} from 'jsdom'

/**
 * Gives the component tests a browser-like page. It must be imported BEFORE react-dom: React decides at load time
 * whether input events exist, and without a window it silently ignores typing.
 */
export const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
})
const g = globalThis as Record<string, unknown>
g.window = dom.window
g.document = dom.window.document
g.HTMLElement = dom.window.HTMLElement
g.Event = dom.window.Event
g.MouseEvent = dom.window.MouseEvent
g.IS_REACT_ACT_ENVIRONMENT = true
