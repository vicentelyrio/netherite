import { NetheriteProvider } from '@netherite/ui'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { SettingsProvider, type SettingsStorage, storageKey, useSettings } from '../settings'
import { actionIds } from './actions'
import {
  comboFromEvent,
  conflicts,
  conflictsWith,
  formatShortcut,
  isAllowedShortcut,
  isBrowserReserved,
  isValidShortcut,
  matchesShortcut,
  normalise,
  parseShortcut,
  refusalFor,
  resolveAll,
  resolveShortcut,
  toCodeMirrorKey,
  useActionShortcuts,
  useResolvedShortcuts,
  useShortcutSettings,
} from './index'

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
    expect(resolveShortcut('go.projects')).toEqual({ keys: 'g p', aliases: [] })
    expect(resolveShortcut('section.next')).toEqual({ keys: '.', aliases: ['f6'] })
  })

  test('a valid choice replaces the default and its aliases; an invalid one is ignored', () => {
    expect(resolveShortcut('go.projects', { 'go.projects': 'mod+shift+p' })).toEqual({
      keys: 'mod+shift+p',
      aliases: [],
    })
    expect(resolveShortcut('go.inbox', { 'go.inbox': 'hyper+x' }).keys).toBe('g i')
    expect(isValidShortcut('mod+k')).toBe(true)
    expect(isValidShortcut('')).toBe(false)
  })

  test('the defaults do not clash', () => {
    expect(conflicts()).toEqual([])
    expect(Object.keys(resolveAll())).toEqual([...actionIds])
  })

  test('two actions on the same keys are reported, including through an alias', () => {
    expect(conflicts({ 'go.tags': 'g g' })).toEqual([['go.goals', 'go.tags']])
    expect(conflicts({ 'go.tags': 'f6' })).toEqual([['go.tags', 'section.next']])
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
    fireEvent.keyDown(window, { key: 'g' })
    fireEvent.keyDown(window, { key: 't' })
    expect(run).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(run).toHaveBeenCalledTimes(1)
  })
})

describe('collisions', () => {
  test('actions in different screens may share keys; a global one clashes with everything', () => {
    expect(conflicts({ 'tags.search': 'e' })).toEqual([])
    expect(conflicts({ 'go.tags': 'e' })).toEqual([['go.tags', 'inbox.archive']])
    expect(conflicts({ 'inbox.next': 'g' })).not.toEqual([])
    expect(conflictsWith('tags.search', 'e')).toEqual([])
    expect(conflictsWith('inbox.next', 'e')).toEqual(['inbox.archive'])
    expect(conflictsWith('go.tags', 'g p')).toEqual(['go.projects'])
    expect(conflictsWith('tags.search', 'g')).toContain('go.inbox')
  })

  test('an action never clashes with itself, or with one that was cleared', () => {
    expect(conflictsWith('go.tags', 'g t')).toEqual([])
    expect(conflictsWith('go.tags', 'g g', { 'go.goals': null })).toEqual([])
  })
})

describe('keys', () => {
  test('a cleared action has no keys, and no aliases either', () => {
    expect(resolveShortcut('section.next', { 'section.next': null })).toEqual({
      keys: null,
      aliases: [],
    })
  })

  test('Option on a Mac changes the character, and the shortcut still matches', () => {
    const event = {
      key: 'π',
      code: 'KeyP',
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: true,
    }
    expect(matchesShortcut(event, parseShortcut('mod+alt+p'), true)).toBe(true)
    expect(comboFromEvent(event, true)).toBe('mod+alt+p')
  })

  test('a symbol matches whether or not the layout needs Shift for it', () => {
    const slash = { key: '/', metaKey: false, ctrlKey: false, altKey: false }
    expect(matchesShortcut({ ...slash, shiftKey: true }, parseShortcut('/'), false)).toBe(true)
    expect(matchesShortcut({ ...slash, shiftKey: false }, parseShortcut('/'), false)).toBe(true)
  })

  test('recording ignores modifiers alone, and names keys the way shortcuts spell them', () => {
    const base = { code: '', metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }
    expect(comboFromEvent({ ...base, key: 'Shift', shiftKey: true }, false)).toBeUndefined()
    expect(comboFromEvent({ ...base, key: 'K', ctrlKey: true, shiftKey: true }, false)).toBe(
      'mod+shift+k',
    )
    expect(comboFromEvent({ ...base, key: ' ', ctrlKey: true }, false)).toBe('mod+space')
    expect(comboFromEvent({ ...base, key: '?', shiftKey: true }, false)).toBe('?')
    expect(formatShortcut('mod+space', false)).toBe('Ctrl+Space')
  })

  test('keys a browser keeps are flagged, and bare keys that drive the page are refused', () => {
    expect(isBrowserReserved('mod+t')).toBe(true)
    expect(isBrowserReserved('mod+k')).toBe(false)
    expect(isAllowedShortcut('enter')).toBe(false)
    expect(isAllowedShortcut('mod+enter')).toBe(true)
  })

  test('shortcuts translate to the notation of the editor', () => {
    expect(toCodeMirrorKey('mod+s')).toBe('Mod-s')
    expect(toCodeMirrorKey('mod+alt+shift+s')).toBe('Mod-Alt-Shift-s')
  })
})

describe('the rules for keys', () => {
  const allowed = new Set(['mod+k', 'mod+s'])

  test('defaults use mod only for search and save, and none belongs to the browser', () => {
    const keys = actionIds.flatMap((id) => {
      const { keys, aliases } = resolveShortcut(id)
      return keys === null ? [...aliases] : [keys, ...aliases]
    })
    expect(keys.filter((k) => k.includes('mod+') && !allowed.has(k))).toEqual([])
    expect(keys.filter(isBrowserReserved)).toEqual([])
  })

  test('the recorder refuses browser keys and the keys every page shares', () => {
    for (const keys of ['mod+l', 'mod+p', 'mod+d', 'mod+y', 'mod+r', 'mod+f', 'mod+[', 'mod+]']) {
      expect(refusalFor('go.tags', keys)).toBe('browser')
    }
    expect(refusalFor('go.tags', 'mod+3')).toBe('browser')
    for (const keys of ['.', ',', ';', '?']) expect(refusalFor('go.tags', keys)).toBe('shared')
    expect(refusalFor('go.tags', 'enter')).toBe('modifier')
    expect(refusalFor('go.tags', 'mod+shift+y')).toBeUndefined()
  })

  test('an action may go back to its own shared key', () => {
    expect(refusalFor('section.next', '.')).toBeUndefined()
  })

  test('the editor takes one key combination only', () => {
    expect(refusalFor('editor.save', 'g s')).toBe('singleStep')
    expect(resolveShortcut('editor.save', { 'editor.save': 'g s' }).keys).toBe('mod+s')
  })

  test('two-step keys are valid, three are not, and they read in order', () => {
    expect(isValidShortcut('g p')).toBe(true)
    expect(isValidShortcut('g p x')).toBe(false)
    expect(formatShortcut('g p', true)).toBe('G P')
    expect(normalise('G  P')).toBe('g p')
  })
})

describe('managing shortcuts', () => {
  const setup = (initial?: string) => {
    const storage = memory(initial)
    const view = renderHook(
      () => ({ manage: useShortcutSettings(), keys: useResolvedShortcuts() }),
      { wrapper: wrap(storage) },
    )
    return { storage, view }
  }

  test('binding, clearing and resetting are saved', () => {
    const { storage, view } = setup()
    act(() => view.result.current.manage.bind('go.tags', 'mod+shift+y'))
    expect(view.result.current.keys['go.tags'].keys).toBe('mod+shift+y')
    expect(view.result.current.manage.isCustom('go.tags')).toBe(true)
    act(() => view.result.current.manage.clear('go.tags'))
    expect(view.result.current.keys['go.tags'].keys).toBeNull()
    expect(JSON.parse(storage.saved() ?? '{}').shortcuts['go.tags']).toBeNull()
    act(() => view.result.current.manage.reset('go.tags'))
    expect(view.result.current.keys['go.tags'].keys).toBe('g t')
    expect(view.result.current.manage.isCustom('go.tags')).toBe(false)
  })

  test('choosing the default keys again brings its aliases back', () => {
    const { view } = setup(JSON.stringify({ shortcuts: { 'section.next': 'mod+y' } }))
    act(() => view.result.current.manage.bind('section.next', '.'))
    expect(view.result.current.keys['section.next'].aliases).toEqual(['f6'])
  })

  test('replacing takes the keys and clears the action that had them', () => {
    const { view } = setup()
    act(() => view.result.current.manage.replace('go.tags', 'g g', ['go.goals']))
    expect(view.result.current.keys['go.tags'].keys).toBe('g g')
    expect(view.result.current.keys['go.goals'].keys).toBeNull()
    expect(conflicts(view.result.current.manage.overrides)).toEqual([])
  })

  test('a cleared action survives being read back from storage', () => {
    const { view } = setup(JSON.stringify({ shortcuts: { 'go.tags': null } }))
    expect(view.result.current.keys['go.tags'].keys).toBeNull()
  })
})
