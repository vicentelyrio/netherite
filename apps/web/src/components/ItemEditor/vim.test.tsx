import type { EditorView } from '@codemirror/view'
import { NetheriteProvider } from '@netherite/ui'
import { getCM, Vim } from '@replit/codemirror-vim'
import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { I18nProvider } from '@/infrastructure/i18n'
import { ItemEditor } from './index'

type CodeMirrorV = Parameters<typeof Vim.handleEx>[0]

const text = 'first line\nsecond line\n'

const setup = (vimMode: boolean) => {
  let view: EditorView | undefined
  const onSave = vi.fn(async (next: string, base: string) => ({ text: next, hash: `${base}+` }))
  render(
    <NetheriteProvider>
      <I18nProvider>
        <ItemEditor
          source={{ text, hash: 'h1', head: text }}
          onSave={onSave}
          lint={async () => []}
          targets={[]}
          autosaveDelay={60_000}
          onReady={(v) => (view = v)}
          vimMode={vimMode}
        />
      </I18nProvider>
    </NetheriteProvider>,
  )
  return { onSave, view: () => view as EditorView }
}

const press = (view: EditorView, ...keys: ReadonlyArray<string>) =>
  act(() => {
    const cm = getCM(view)
    if (cm === null) throw new Error('vim is not attached')
    for (const key of keys) Vim.handleKey(cm as CodeMirrorV, key, 'user')
  })

describe('vim mode', () => {
  test('stays off unless asked for', () => {
    const { view } = setup(false)
    expect(view().scrollDOM.classList.contains('cm-vimMode')).toBe(false)
    expect(getCM(view())).toBeNull()
  })

  test('starts in normal mode, where keys are commands and not text', () => {
    const { view } = setup(true)
    expect(view().scrollDOM.classList.contains('cm-vimMode')).toBe(true)
    expect(view().dom.textContent).toContain('--NORMAL--')
    press(view(), 'x')
    expect(view().state.doc.toString()).toBe(text.slice(1))
  })

  test('edits made with vim keys reach the saved text through :w', async () => {
    const { view, onSave } = setup(true)
    press(view(), 'd', 'd')
    act(() => Vim.handleEx(getCM(view()) as CodeMirrorV, 'w'))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('second line\n', 'h1'))
  })

  test('marks what has focus so an overlay leaves Escape to the editor', () => {
    const { view } = setup(true)
    act(() => view().contentDOM.dispatchEvent(new FocusEvent('focusin', { bubbles: true })))
    expect(view().contentDOM.getAttribute('data-mantine-stop-propagation')).toBe('true')
  })
})
