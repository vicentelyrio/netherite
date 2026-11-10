import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { dispatcher, sequenceTimeoutMs, useShortcuts } from './index'
import type { ShortcutLayer } from './shortcuts.types'

function Bind({
  keys,
  layer,
}: {
  readonly keys: Record<string, () => unknown>
  readonly layer: ShortcutLayer
}) {
  useShortcuts(keys, { layer, mac: false })
  return null
}

const press = (key: string, target: Element | Window = window) => fireEvent.keyDown(target, { key })

const overlay = () => {
  const element = document.createElement('div')
  element.setAttribute('role', 'dialog')
  document.body.append(element)
  return element
}

afterEach(() => {
  for (const element of document.querySelectorAll('[role="dialog"], [data-section]'))
    element.remove()
})

describe('scopes', () => {
  test('the page wins over the app for the same key', () => {
    const page = vi.fn()
    const app = vi.fn()
    render(
      <>
        <Bind keys={{ j: app }} layer="app" />
        <Bind keys={{ j: page }} layer="page" />
      </>,
    )
    press('j')
    expect(page).toHaveBeenCalledTimes(1)
    expect(app).not.toHaveBeenCalled()
  })

  test('a handler that declines leaves the key to the next one, and to the browser', () => {
    const app = vi.fn()
    render(
      <>
        <Bind keys={{ j: () => false }} layer="page" />
        <Bind keys={{ j: app }} layer="app" />
      </>,
    )
    press('j')
    expect(app).toHaveBeenCalledTimes(1)
  })

  test('an open overlay pauses the page and keeps the app and its own keys', () => {
    const page = vi.fn()
    const own = vi.fn()
    const app = vi.fn()
    render(
      <>
        <Bind keys={{ e: page }} layer="page" />
        <Bind keys={{ t: own }} layer="overlay" />
        <Bind keys={{ 'mod+k': app }} layer="app" />
      </>,
    )
    press('t')
    expect(own).not.toHaveBeenCalled()
    overlay()
    press('e')
    press('t')
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(page).not.toHaveBeenCalled()
    expect(own).toHaveBeenCalledTimes(1)
    expect(app).toHaveBeenCalledTimes(1)
  })

  test('page keys rest while focus is in the sidebar', () => {
    const page = vi.fn()
    render(<Bind keys={{ e: page }} layer="page" />)
    const sidebar = document.createElement('div')
    sidebar.dataset.section = 'sidebar'
    const button = document.createElement('button')
    sidebar.append(button)
    document.body.append(sidebar)
    button.focus()
    press('e', button)
    expect(page).not.toHaveBeenCalled()
  })

  test('function keys and Escape work while typing, other plain keys do not', () => {
    const next = vi.fn()
    const leave = vi.fn()
    const plain = vi.fn()
    const { container } = render(
      <>
        <input aria-label="field" />
        <Bind keys={{ f6: next, escape: leave, j: plain }} layer="app" />
      </>,
    )
    const field = container.querySelector('input') as HTMLInputElement
    fireEvent.keyDown(field, { key: 'F6' })
    fireEvent.keyDown(field, { key: 'Escape' })
    fireEvent.keyDown(field, { key: 'j' })
    expect(next).toHaveBeenCalledTimes(1)
    expect(leave).toHaveBeenCalledTimes(1)
    expect(plain).not.toHaveBeenCalled()
  })
})

describe('two-step shortcuts', () => {
  beforeEach(() => void vi.useFakeTimers())
  afterEach(() => void vi.useRealTimers())

  test('the second key runs the action, and modifiers between them do not count', () => {
    const run = vi.fn()
    render(<Bind keys={{ 'g p': run }} layer="app" />)
    press('g')
    expect(run).not.toHaveBeenCalled()
    expect(dispatcher.pending()).toEqual({ first: 'g', next: ['g p'] })
    press('Shift')
    press('p')
    expect(run).toHaveBeenCalledTimes(1)
    expect(dispatcher.pending()).toBeUndefined()
  })

  test('waiting ends after a while', () => {
    const run = vi.fn()
    render(<Bind keys={{ 'g p': run }} layer="app" />)
    press('g')
    act(() => void vi.advanceTimersByTime(sequenceTimeoutMs))
    expect(dispatcher.pending()).toBeUndefined()
    press('p')
    expect(run).not.toHaveBeenCalled()
  })

  test('a wrong second key cancels and does not fire its own action', () => {
    const run = vi.fn()
    const other = vi.fn()
    render(<Bind keys={{ 'g p': run, e: other }} layer="app" />)
    press('g')
    press('e')
    expect(run).not.toHaveBeenCalled()
    expect(other).not.toHaveBeenCalled()
    press('e')
    expect(other).toHaveBeenCalledTimes(1)
  })

  test('the first key does nothing while typing', () => {
    const run = vi.fn()
    const { container } = render(
      <>
        <input aria-label="field" />
        <Bind keys={{ 'g p': run }} layer="app" />
      </>,
    )
    press('g', container.querySelector('input') as HTMLInputElement)
    expect(dispatcher.pending()).toBeUndefined()
  })
})
