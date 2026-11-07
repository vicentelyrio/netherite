import { NetheriteProvider } from '@netherite/ui'
import { render, screen } from '@testing-library/react'
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
      editor: { vimMode: true },
    })
  })

  test('shows the remembered choice, and ignores a stored value of the wrong kind', () => {
    const first = setup(memory(JSON.stringify({ editor: { vimMode: true } })))
    expect(screen.getByRole('switch', { name: /Vim mode/ })).toBeChecked()
    first.unmount()
    setup(memory(JSON.stringify({ editor: { vimMode: 'yes' } })))
    expect(screen.getByRole('switch', { name: /Vim mode/ })).not.toBeChecked()
  })
})
