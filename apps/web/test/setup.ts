import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { EventSource } from 'eventsource'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// `findBy` and `waitFor` give up after one second by default. A shared CI runner running every
// package's tests at once is slower than that for a menu that opens in a portal.
configure({ asyncUtilTimeout: 5000 })

// jsdom has no layout engine or event streams; the UI library and the app ask for these.
if (typeof window !== 'undefined') {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as never
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  window.HTMLElement.prototype.scrollIntoView ??= () => {}
  // CodeMirror measures text to place its tooltips.
  const rect = () => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  })
  document.createRange().constructor.prototype.getClientRects ??= () => []
  document.createRange().constructor.prototype.getBoundingClientRect ??= rect
  globalThis.EventSource = EventSource as never
}
