import type { EditorView } from '@codemirror/view'
import { NetheriteProvider } from '@netherite/ui'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { changesField, problemsField } from '../src/editor/extensions'
import { bodyOf, ItemEditor, type ItemEditorProps } from '../src/editor/ItemEditor'

const text = `---
id: TASK-00001
type: task
title: Core
state: backlog
---

# Core

- [ ] first
- [x] second

See [[ADR-00002]].
`

const source = (overrides: Partial<ItemEditorProps['source']> = {}) => ({
  text,
  hash: 'h1',
  head: text,
  ...overrides,
})

const setup = (props: Partial<ItemEditorProps> = {}) => {
  let view: EditorView | undefined
  const onSave = vi.fn(async (next: string, base: string) => ({ text: next, hash: `${base}+` }))
  const lint = vi.fn(async () => [])
  const ui = (p: Partial<ItemEditorProps>) => (
    <NetheriteProvider>
      <ItemEditor
        source={source()}
        onSave={onSave}
        lint={lint}
        targets={[]}
        onReady={(v) => (view = v)}
        {...p}
      />
    </NetheriteProvider>
  )
  const result = render(ui(props))
  return {
    ...result,
    onSave,
    lint,
    view: () => view as EditorView,
    update: (p: Partial<ItemEditorProps>) => result.rerender(ui({ ...props, ...p })),
  }
}

const type = (view: EditorView, from: number, insert: string, to = from) =>
  act(() => void view.dispatch({ changes: { from, to, insert } }))

describe('the editor', () => {
  test('shows the whole file, frontmatter and text, and the text rendered beside it', () => {
    const { view } = setup()
    expect(view().state.doc.toString()).toBe(text)
    expect(document.querySelector('.cm-content')?.textContent).toContain('state: backlog')
    const rendered = document.querySelector('.ed-rendered') as HTMLElement
    expect(within(rendered).getByRole('heading', { name: 'Core', level: 1 })).toBeInTheDocument()
    expect(within(rendered).queryByText('state: backlog')).toBeNull()
  })

  test('the rendered side follows what is typed, before anything is saved', async () => {
    const { view } = setup()
    type(view(), text.indexOf('# Core') + 2, 'Shiny ')
    expect(await screen.findByRole('heading', { name: 'Shiny Core' })).toBeInTheDocument()
  })

  test('the body is what comes after the frontmatter', () => {
    expect(bodyOf(text).startsWith('\n# Core')).toBe(true)
    expect(bodyOf('no frontmatter here')).toBe('no frontmatter here')
  })

  test('shows the position of the cursor, and what the file is', () => {
    const { view } = setup()
    act(() => void view().dispatch({ selection: { anchor: text.indexOf('# Core') + 3 } }))
    expect(screen.getByText('Ln 8, Col 4')).toBeInTheDocument()
    expect(screen.getByText('Markdown · YAML')).toBeInTheDocument()
  })

  test('wikilinks, dates, mentions and checkboxes are marked', () => {
    const { view } = setup()
    type(view(), 0, '')
    act(
      () =>
        void view().dispatch({
          changes: {
            from: view().state.doc.length,
            insert: '\nBy @ada on 2026-01-14T03:06:05+00:00\n',
          },
        }),
    )
    const html = document.querySelector('.cm-content')?.innerHTML ?? ''
    expect(html).toContain('cm-wikilink')
    expect(html).toContain('cm-mention')
    expect(html).toContain('cm-date')
    expect(html).toContain('cm-check')
  })
})

describe('saving', () => {
  test('is off until something changes, then on; an edit that is undone is not a change', async () => {
    const { view } = setup()
    const save = screen.getByRole('button', { name: /Save/ })
    expect(save).toBeDisabled()
    type(view(), 0, 'x')
    await waitFor(() => expect(save).toBeEnabled())
    expect(screen.getByText('Unsaved')).toBeInTheDocument()
    type(view(), 0, '', 1)
    await waitFor(() => expect(save).toBeDisabled())
  })

  test('saves the whole text over the version it started from, and is then clean', async () => {
    const { view, onSave } = setup()
    type(view(), text.indexOf('first'), 'my ')
    await userEvent.click(await screen.findByRole('button', { name: /Save/ }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0]).toEqual([text.replace('first', 'my first'), 'h1'])
    await waitFor(() => expect(screen.queryByText('Unsaved')).toBeNull())
  })

  test('Control-S saves too, and does nothing when there is nothing to save', async () => {
    const { view, onSave } = setup()
    const content = document.querySelector('.cm-content') as HTMLElement
    fireEvent.keyDown(content, { key: 's', ctrlKey: true })
    expect(onSave).not.toHaveBeenCalled()
    type(view(), 0, 'x')
    fireEvent.keyDown(content, { key: 's', ctrlKey: true })
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
  })

  test('a refused save leaves the text as it is, still unsaved', async () => {
    const { view, onSave } = setup()
    onSave.mockRejectedValueOnce(new Error('refused'))
    type(view(), 0, 'x')
    await userEvent.click(await screen.findByRole('button', { name: /Save/ }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(view().state.doc.toString().startsWith('x')).toBe(true)
    expect(screen.getByText('Unsaved')).toBeInTheDocument()
  })
})

describe('problems', () => {
  const problem = (line: number, column: number, message: string, severity = 'error') => ({
    line,
    column,
    rule: 'schema',
    severity: severity as 'error',
    message,
  })

  test('the server is asked about the text, and what it finds is marked, explained and counted', async () => {
    const lint = vi.fn(async () => [problem(5, 1, 'state: Expected one of backlog, doing, done')])
    const { view } = setup({ lint })
    await waitFor(() => expect(view().state.field(problemsField)).toHaveLength(1))
    const [p] = view().state.field(problemsField)
    expect(text.slice(p?.from, p?.to)).toBe('state:')
    expect(document.querySelector('.cm-problem-error')).not.toBeNull()
    expect(document.querySelector('.cm-hint')?.textContent).toContain('Expected one of')
    expect(document.querySelector('.cm-lint-mark')).not.toBeNull()
    expect(screen.getByTitle('1 errors')).toHaveTextContent('1')
  })

  test('typing asks again, after a pause, with the new text', async () => {
    const lint = vi.fn(async () => [])
    const { view } = setup({ lint })
    await waitFor(() => expect(lint).toHaveBeenCalledTimes(1))
    type(view(), 0, 'a')
    type(view(), 1, 'b')
    expect(lint).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(lint).toHaveBeenCalledTimes(2), { timeout: 2000 })
    expect((lint.mock.calls[1] as unknown as [string])[0].startsWith('ab')).toBe(true)
  })

  test('an answer about text that has since changed is not shown', async () => {
    let release: (v: Array<ReturnType<typeof problem>>) => void = () => {}
    const lint = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = resolve
          }),
      )
      .mockImplementation(async () => [])
    const { view } = setup({ lint })
    await waitFor(() => expect(lint).toHaveBeenCalledTimes(1))
    type(view(), 0, 'z')
    await waitFor(() => expect(lint).toHaveBeenCalledTimes(2), { timeout: 2000 })
    await act(async () => release([problem(5, 1, 'stale answer')]))
    expect(view().state.field(problemsField)).toEqual([])
  })

  test('marks move with the text while typing, so a problem stays on its word', async () => {
    const lint = vi.fn(async () => [problem(5, 1, 'state is wrong')])
    const { view } = setup({ lint })
    await waitFor(() => expect(view().state.field(problemsField)).toHaveLength(1))
    type(view(), 0, '# a comment line\n')
    const [p] = view().state.field(problemsField)
    expect(view().state.doc.sliceString(p?.from ?? 0, p?.to)).toBe('state:')
    expect(p?.line).toBe(6)
  })

  test('a failing lint request is quiet, and the editor keeps working', async () => {
    const lint = vi.fn(async () => {
      throw new Error('server away')
    })
    const { view } = setup({ lint })
    await waitFor(() => expect(lint).toHaveBeenCalled())
    type(view(), 0, 'ok')
    expect(view().state.doc.toString().startsWith('ok')).toBe(true)
  })
})

describe('the change gutter', () => {
  const marks = (view: EditorView) => {
    const c = view.state.field(changesField)
    return { added: [...c.added], modified: [...c.modified], deleted: [...c.deleted] }
  }

  test('shows nothing for text that matches the committed version', () => {
    const { view } = setup()
    expect(marks(view())).toEqual({ added: [], modified: [], deleted: [] })
  })

  test('shows added and modified lines against the committed text, as typing goes on', () => {
    const { view } = setup()
    type(view(), text.indexOf('first'), 'my ')
    type(view(), view().state.doc.length, 'A new last line\n')
    expect(marks(view()).modified).toEqual([10])
    expect(marks(view()).added).toEqual([14])
  })

  test('shows where lines were removed', () => {
    const { view } = setup()
    const start = text.indexOf('- [ ] first')
    type(view(), start, '', start + '- [ ] first\n'.length)
    expect(marks(view()).deleted).toEqual([9])
  })

  test('has nothing to compare against without a committed version', () => {
    const { view } = setup({ source: source({ head: null }) })
    type(view(), 0, 'x')
    expect(marks(view())).toEqual({ added: [], modified: [], deleted: [] })
  })

  test('follows a new commit: when the committed text catches up, the marks go', async () => {
    const { view, update } = setup()
    type(view(), 0, 'edit ')
    expect(marks(view()).modified).toEqual([1])
    update({ source: source({ head: `edit ${text}`, text, hash: 'h1' }) })
    await waitFor(() => expect(marks(view()).modified).toEqual([]))
  })

  test('says so in the status bar', () => {
    const { view } = setup()
    expect(screen.queryByText('Changed since the last commit')).toBeNull()
    type(view(), 0, 'x')
    expect(screen.getByText('Changed since the last commit')).toBeInTheDocument()
  })
})

describe('changed on disk', () => {
  test('with nothing typed, the new version simply appears', async () => {
    const { view, update } = setup()
    update({ source: source({ text: text.replace('Core', 'Core, renamed'), hash: 'h2' }) })
    await waitFor(() => expect(view().state.doc.toString()).toContain('Core, renamed'))
    expect(screen.queryByText('Changed on disk')).toBeNull()
  })

  test('with edits typed, nothing is lost: the person is asked', async () => {
    const { view, update } = setup()
    type(view(), 0, 'mine ')
    update({ source: source({ text: text.replace('first', 'theirs'), hash: 'h2' }) })
    expect(await screen.findByText('Changed on disk')).toBeInTheDocument()
    expect(view().state.doc.toString().startsWith('mine ')).toBe(true)
    expect(view().state.doc.toString()).toContain('first')
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled()
  })

  test('Reload takes the new version and drops the edits', async () => {
    const { view, update } = setup()
    type(view(), 0, 'mine ')
    update({ source: source({ text: text.replace('first', 'theirs'), hash: 'h2' }) })
    await userEvent.click(await screen.findByRole('button', { name: /Reload/ }))
    await waitFor(() => expect(view().state.doc.toString()).toBe(text.replace('first', 'theirs')))
    expect(screen.queryByText('Changed on disk')).toBeNull()
    expect(screen.queryByText('Unsaved')).toBeNull()
  })

  test('Keep mine keeps the edits, and the next save goes over the new version', async () => {
    const { view, update, onSave } = setup()
    type(view(), 0, 'mine ')
    update({ source: source({ text: text.replace('first', 'theirs'), hash: 'h2' }) })
    await userEvent.click(await screen.findByRole('button', { name: 'Keep mine' }))
    await waitFor(() => expect(screen.queryByText('Changed on disk')).toBeNull())
    expect(view().state.doc.toString().startsWith('mine ')).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: /Save/ }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect((onSave.mock.calls[0] as unknown as [string, string])[1]).toBe('h2')
  })
})

describe('views', () => {
  test('text only shows the rendered text, with no editor; code brings the editor back', async () => {
    function Host() {
      const [mode, setMode] = useState<'split' | 'text'>('split')
      return (
        <NetheriteProvider>
          <ItemEditor
            source={source()}
            onSave={async (t) => ({ text: t, hash: 'x' })}
            lint={async () => []}
            targets={[]}
            mode={mode}
            onModeChange={setMode}
          />
        </NetheriteProvider>
      )
    }
    render(<Host />)
    expect(document.querySelector('.cm-editor')).not.toBeNull()
    await userEvent.click(screen.getByText('text'))
    await waitFor(() => expect(document.querySelector('.cm-editor')).toBeNull())
    expect(screen.getByRole('heading', { name: 'Core', level: 1 })).toBeInTheDocument()
    await userEvent.click(screen.getByText('code'))
    await waitFor(() => expect(document.querySelector('.cm-editor')).not.toBeNull())
  })

  test('typed text survives a trip to text view and back', async () => {
    function Host() {
      const [mode, setMode] = useState<'split' | 'text'>('split')
      return (
        <NetheriteProvider>
          <ItemEditor
            source={source()}
            onSave={async (t) => ({ text: t, hash: 'x' })}
            lint={async () => []}
            targets={[]}
            mode={mode}
            onModeChange={setMode}
            onReady={(v) => (current = v)}
          />
        </NetheriteProvider>
      )
    }
    let current: EditorView | undefined
    render(<Host />)
    type(current as EditorView, 0, 'keep me\n')
    await userEvent.click(screen.getByText('text'))
    await userEvent.click(screen.getByText('code'))
    await waitFor(() => expect(current?.state.doc.toString().startsWith('keep me')).toBe(true))
  })
})
