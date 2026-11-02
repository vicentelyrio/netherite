import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { EventSource } from 'eventsource'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

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
  globalThis.EventSource = EventSource as never
}
