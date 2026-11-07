import { NetheriteProvider } from '@netherite/ui'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { SettingsProvider, type SettingsStorage, storageKey } from '@/infrastructure/settings'
import { EditorSettings } from './EditorSettings'

const memory = (initial?: string): SettingsStorage => {
  const data = new Map(initial === undefined ? [] : [[storageKey, initial]])
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
}

const setup = (storage: SettingsStorage) =>
  render(
    <NetheriteProvider>
      <I18nProvider>
        <SettingsProvider storage={storage}>
          <EditorSettings />
        </SettingsProvider>
      </I18nProvider>
    </NetheriteProvider>,
  )

describe('the editor settings', () => {
  test('vim mode starts off, and turning it on is remembered without touching shortcuts', async () => {
    const storage = memory(JSON.stringify({ shortcuts: { 'go.tags': 'mod+y' } }))
    setup(storage)
    const toggle = screen.getByRole('switch', { name: /Vim mode/ })
    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    expect(toggle).toBeChecked()
    expect(JSON.parse(storage.getItem(storageKey) as string)).toEqual({
      shortcuts: { 'go.tags': 'mod+y' },
      editor: { vimMode: true, autosaveDelayMs: 1000 },
      notices: { lifetimeMs: 5000 },
      language: null,
      theme: null,
    })
  })

  test('shows the remembered choice, and ignores a stored value of the wrong kind', () => {
    const first = setup(memory(JSON.stringify({ editor: { vimMode: true } })))
    expect(screen.getByRole('switch', { name: /Vim mode/ })).toBeChecked()
    first.unmount()
    setup(memory(JSON.stringify({ editor: { vimMode: 'yes' } })))
    expect(screen.getByRole('switch', { name: /Vim mode/ })).not.toBeChecked()
  })

  test('the autosave delay is remembered, and a stored value outside its limits is ignored', async () => {
    const storage = memory(JSON.stringify({ editor: { autosaveDelayMs: 2000 } }))
    const first = setup(storage)
    const delay = screen.getByRole('radiogroup', { name: 'Autosave delay' })
    expect(within(delay).getByRole('radio', { name: '2 s' })).toBeChecked()
    await userEvent.click(within(delay).getByText('5 s'))
    expect(JSON.parse(storage.getItem(storageKey) as string).editor.autosaveDelayMs).toBe(5000)
    first.unmount()

    for (const bad of [5, 3_600_000, 1500.5, 'soon']) {
      const view = setup(memory(JSON.stringify({ editor: { autosaveDelayMs: bad } })))
      const group = screen.getByRole('radiogroup', { name: 'Autosave delay' })
      expect(within(group).getByRole('radio', { name: '1 s' })).toBeChecked()
      view.unmount()
    }
  })

  test('a stored delay within its limits but off the list still shows', () => {
    setup(memory(JSON.stringify({ editor: { autosaveDelayMs: 1500 } })))
    const delay = screen.getByRole('radiogroup', { name: 'Autosave delay' })
    expect(within(delay).getByRole('radio', { name: '1.5 s' })).toBeChecked()
  })
})
