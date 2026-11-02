import { NetheriteProvider } from '@netherite/ui'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { SettingsProvider, type SettingsStorage, storageKey, useSettings } from '../settings'
import { actionIds } from './actions'
import { useActionShortcuts, useResolvedShortcuts } from './hooks'
import { conflicts, isValidShortcut, resolveAll, resolveShortcut } from './shortcuts'

const memory = (initial?: string): SettingsStorage & { saved: () => string | null } => {
  let value = initial ?? null
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next
    },
    saved: () => value,
  }
}

const wrap =
  (storage: SettingsStorage) =>
  ({ children }: { children: ReactNode }) => (
    <NetheriteProvider env="test">
      <SettingsProvider storage={storage}>{children}</SettingsProvider>
    </NetheriteProvider>
  )

describe('resolving shortcuts', () => {
  test('defaults apply, with the aliases of the defaults', () => {
    expect(resolveShortcut('go.projects')).toEqual({
      keys: 'mod+p',
      aliases: ['mod+alt+p'],
    })
    expect(resolveShortcut('go.inbox').aliases).toEqual([])
  })

  test('a valid choice replaces the default and its aliases; an invalid one is ignored', () => {
    expect(resolveShortcut('go.projects', { 'go.projects': 'mod+shift+p' })).toEqual({
      keys: 'mod+shift+p',
      aliases: [],
    })
    expect(resolveShortcut('go.inbox', { 'go.inbox': 'hyper+x' }).keys).toBe('mod+i')
    expect(isValidShortcut('mod+k')).toBe(true)
    expect(isValidShortcut('')).toBe(false)
  })

  test('the defaults do not clash', () => {
    expect(conflicts()).toEqual([])
    expect(Object.keys(resolveAll())).toEqual([...actionIds])
  })

  test('two actions on the same keys are reported, including through an alias', () => {
    expect(conflicts({ 'go.tags': 'mod+g' })).toEqual([['go.goals', 'go.tags']])
    expect(conflicts({ 'go.tags': 'mod+alt+p' })).toEqual([['go.projects', 'go.tags']])
  })
})

describe('settings', () => {
  test('are loaded from storage, and a change is saved', () => {
    const storage = memory(JSON.stringify({ shortcuts: { 'go.inbox': 'mod+shift+i' } }))
    const { result } = renderHook(() => ({ s: useSettings(), keys: useResolvedShortcuts() }), {
      wrapper: wrap(storage),
    })
    expect(result.current.keys['go.inbox'].keys).toBe('mod+shift+i')
    result.current.s.update((s) => ({ ...s, shortcuts: { ...s.shortcuts, 'go.tags': 'mod+y' } }))
    expect(JSON.parse(storage.saved() ?? '{}').shortcuts['go.tags']).toBe('mod+y')
  })

  test('unreadable or unknown stored values are dropped', () => {
    const storage = memory(
      JSON.stringify({ shortcuts: { 'go.nowhere': 'mod+x', 'go.inbox': 42, 'go.tags': 'mod+y' } }),
    )
    const { result } = renderHook(() => useSettings(), { wrapper: wrap(storage) })
    expect(result.current.settings.shortcuts).toEqual({ 'go.tags': 'mod+y' })
    const broken = renderHook(() => useSettings(), { wrapper: wrap(memory('{oops')) })
    expect(broken.result.current.settings.shortcuts).toEqual({})
  })

  test('reset goes back to the defaults and saves that', () => {
    const storage = memory(JSON.stringify({ shortcuts: { 'go.tags': 'mod+y' } }))
    const { result } = renderHook(() => useSettings(), { wrapper: wrap(storage) })
    result.current.reset()
    expect(JSON.parse(storage.saved() ?? '{}').shortcuts).toEqual({})
  })

  test('storage that throws does not stop the app', () => {
    const storage: SettingsStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const { result } = renderHook(() => useSettings(), { wrapper: wrap(storage) })
    expect(() => result.current.update((s) => s)).not.toThrow()
    expect(storageKey).toBe('netherite.settings')
  })
})

describe('useActionShortcuts', () => {
  function Probe({ run }: { readonly run: () => void }) {
    useActionShortcuts({ 'go.tags': run }, { mac: false })
    return <p>ready</p>
  }

  test('runs the handler on the default keys, and on the person’s own once set', () => {
    const run = vi.fn()
    const storage = memory(JSON.stringify({ shortcuts: { 'go.tags': 'mod+y' } }))
    render(<Probe run={run} />, { wrapper: wrap(storage) })
    expect(screen.getByText('ready')).toBeTruthy()
    fireEvent.keyDown(window, { key: 't', ctrlKey: true })
    expect(run).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(run).toHaveBeenCalledTimes(1)
  })
})
