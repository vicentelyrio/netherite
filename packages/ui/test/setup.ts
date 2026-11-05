import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// `findBy` and `waitFor` give up after one second by default. A shared CI runner running every
// package's tests at once is slower than that for a menu that opens in a portal.
configure({ asyncUtilTimeout: 5000 })

// jsdom has no layout engine; the UI library asks for these.
const matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})
if (typeof window !== 'undefined') {
  window.matchMedia ??= matchMedia as never
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver ??= ResizeObserverStub as never
  window.HTMLElement.prototype.scrollIntoView ??= () => {}
}
