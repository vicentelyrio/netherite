import { fireEvent, render } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { formatShortcut, matchesShortcut, parseShortcut, useShortcuts } from './index'

const press = (init: KeyboardEventInit, target: Element | Window = window) =>
  fireEvent.keyDown(target, init)

describe('parsing and showing shortcuts', () => {
  test('reads modifiers and the key', () => {
    expect(parseShortcut('mod+shift+g')).toEqual({ mod: true, shift: true, alt: false, key: 'g' })
    expect(parseShortcut('K')).toEqual({ mod: false, shift: false, alt: false, key: 'k' })
    expect(parseShortcut('mod+/')).toMatchObject({ mod: true, key: '/' })
  })

  test('refuses nonsense', () => {
    expect(() => parseShortcut('')).toThrow()
    expect(() => parseShortcut('super+k')).toThrow(/Unknown modifier/)
  })

  test('shows ⇧⌘G on a Mac and Ctrl+Shift+G elsewhere', () => {
    expect(formatShortcut('mod+shift+g', true)).toBe('⇧⌘G')
    expect(formatShortcut('mod+k', true)).toBe('⌘K')
    expect(formatShortcut('mod+shift+g', false)).toBe('Ctrl+Shift+G')
    expect(formatShortcut('mod+enter', false)).toBe('Ctrl+↵')
    expect(formatShortcut('alt+arrowup', true)).toBe('⌥↑')
  })
})

describe('matching key presses', () => {
  const k = parseShortcut('mod+k')
  const base = { shiftKey: false, altKey: false, metaKey: false, ctrlKey: false }

  test('mod is Command on a Mac and Control elsewhere, and not the other one', () => {
    expect(matchesShortcut({ ...base, key: 'k', metaKey: true }, k, true)).toBe(true)
    expect(matchesShortcut({ ...base, key: 'k', ctrlKey: true }, k, true)).toBe(false)
    expect(matchesShortcut({ ...base, key: 'k', ctrlKey: true }, k, false)).toBe(true)
    expect(matchesShortcut({ ...base, key: 'k', metaKey: true }, k, false)).toBe(false)
  })

  test('extra modifiers do not match, and neither does a different key', () => {
    expect(matchesShortcut({ ...base, key: 'k', metaKey: true, shiftKey: true }, k, true)).toBe(
      false,
    )
    expect(matchesShortcut({ ...base, key: 'k', metaKey: true, altKey: true }, k, true)).toBe(false)
    expect(matchesShortcut({ ...base, key: 'j', metaKey: true }, k, true)).toBe(false)
    expect(matchesShortcut({ ...base, key: 'K', metaKey: true }, k, true)).toBe(true)
  })
})

describe('useShortcuts', () => {
  function Listener({
    bindings,
    enabled,
  }: {
    bindings: Record<string, () => void>
    enabled?: boolean
  }) {
    useShortcuts(bindings, { mac: true, ...(enabled === undefined ? {} : { enabled }) })
    return (
      <div>
        <input aria-label="field" />
        <button type="button">button</button>
      </div>
    )
  }

  test('runs the handler, and stops the browser from acting on the keys too', () => {
    const open = vi.fn()
    render(<Listener bindings={{ 'mod+k': open }} />)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      cancelable: true,
      bubbles: true,
    })
    window.dispatchEvent(event)
    expect(open).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  test('ignores keys that are not bound, and keys with extra modifiers', () => {
    const open = vi.fn()
    render(<Listener bindings={{ 'mod+k': open }} />)
    press({ key: 'k' })
    press({ key: 'k', metaKey: true, shiftKey: true })
    press({ key: 'j', metaKey: true })
    expect(open).not.toHaveBeenCalled()
  })

  test('a bare key does nothing while typing in a field, but a mod shortcut still works', () => {
    const slash = vi.fn()
    const palette = vi.fn()
    const { getByLabelText, getByText } = render(
      <Listener bindings={{ '/': slash, 'mod+k': palette }} />,
    )
    const field = getByLabelText('field')
    press({ key: '/' }, field)
    press({ key: 'k', metaKey: true }, field)
    expect(slash).not.toHaveBeenCalled()
    expect(palette).toHaveBeenCalledTimes(1)
    press({ key: '/' }, getByText('button'))
    expect(slash).toHaveBeenCalledTimes(1)
  })

  test('uses the latest handler without re-subscribing', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Listener bindings={{ 'mod+k': first }} />)
    rerender(<Listener bindings={{ 'mod+k': second }} />)
    press({ key: 'k', metaKey: true })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  test('can be switched off, and stops listening when unmounted', () => {
    const open = vi.fn()
    const off = render(<Listener bindings={{ 'mod+k': open }} enabled={false} />)
    press({ key: 'k', metaKey: true })
    expect(open).not.toHaveBeenCalled()
    off.unmount()
    const on = render(<Listener bindings={{ 'mod+k': open }} />)
    on.unmount()
    press({ key: 'k', metaKey: true })
    expect(open).not.toHaveBeenCalled()
  })

  test('does not act on a key the page already handled', () => {
    const open = vi.fn()
    render(<Listener bindings={{ 'mod+k': open }} />)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      cancelable: true,
      bubbles: true,
    })
    event.preventDefault()
    window.dispatchEvent(event)
    expect(open).not.toHaveBeenCalled()
  })
})
