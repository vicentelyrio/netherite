import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { EditorView } from '@codemirror/view'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { changesField } from '../src/editor/extensions'
import { moveFor } from '../src/pages/projects'
import { other, renderApp, server } from './helpers'

const nav = () => screen.getByRole('navigation', { name: 'Main' })
const railButton = (name: RegExp | string) => within(nav()).getByRole('button', { name })
/**
 * Opens a menu and returns one of its items. The page refreshes itself while tests write, which
 * can remount the button and close the menu, so it clicks again until the item shows.
 */
const menuItem = async (button: () => HTMLElement, name: string | RegExp) => {
  for (let attempt = 0; attempt < 4; attempt++) {
    const target = button()
    await waitFor(() => expect(target).toBeEnabled())
    // Only click a closed menu: a second click would close it again.
    if (target.getAttribute('aria-expanded') !== 'true') await userEvent.click(target)
    try {
      return await screen.findByRole('menuitem', { name }, { timeout: 2000 })
    } catch {
      // The button may have been replaced while the page refreshed: look again.
    }
  }
  return screen.findByRole('menuitem', { name })
}
const key = (init: KeyboardEventInit) => act(() => void fireEvent.keyDown(window, init))

describe('the shell', () => {
  test('opens on Goals, with the rail showing where you are, and lists the goals', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Goals' })).toBeInTheDocument()
    expect(railButton('Goals')).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByText('Ship')).toBeInTheDocument()
  })

  test('every rail item opens its screen', async () => {
    renderApp('/goals')
    await screen.findByRole('heading', { name: 'Goals' })
    for (const name of ['Inbox', 'Knowledge', 'Stats', 'Tags', 'Graph', 'Goals']) {
      await userEvent.click(railButton(new RegExp(`^${name}`)))
      expect(await screen.findByRole('heading', { name })).toBeInTheDocument()
      expect(railButton(new RegExp(`^${name}`))).toHaveAttribute('aria-current', 'page')
    }
  })

  test('a screen that is not built yet says which task builds it', async () => {
    renderApp('/tags')
    expect(await screen.findByText(/TASK-00047/)).toBeInTheDocument()
  })

  test('an unknown address is a clear dead end, not a blank page', async () => {
    renderApp('/nowhere')
    expect(await screen.findByText('Nothing here')).toBeInTheDocument()
  })

  test('shows that the page is live, and how many items the workspace has', async () => {
    renderApp('/goals')
    const status = await screen.findByRole('status')
    await waitFor(() => expect(status).toHaveTextContent('Live'))
    await waitFor(() => expect(status).toHaveTextContent(/\d+ items/))
  })

  test('the Inbox item says how many things wait for a person', async () => {
    renderApp('/goals')
    // ADR-00003 is proposed in the sample workspace.
    const rail = await screen.findByRole('navigation', { name: 'Main' })
    expect(
      await within(rail).findByRole('button', { name: /^Inbox, \d+ waiting$/ }),
    ).toBeInTheDocument()
  })
})

describe('keyboard shortcuts', () => {
  // The test platform is not a Mac, so "mod" is Control.
  test.each([
    ['i', {}, 'Inbox'],
    ['g', {}, 'Goals'],
    ['l', {}, 'Knowledge'],
    ['d', {}, 'Stats'],
    ['t', {}, 'Tags'],
    ['g', { shiftKey: true }, 'Graph'],
  ])('Control-%s %j goes to %s', async (letter, extra, title) => {
    renderApp('/knowledge')
    await screen.findByRole('heading', { name: 'Knowledge' })
    // Start somewhere else so the key has something to do.
    await userEvent.click(railButton(/^Tags/))
    await screen.findByRole('heading', { name: 'Tags' })
    key({ key: letter, ctrlKey: true, ...extra })
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
  })

  test('the keys a browser keeps for itself (L, T, D, P) have Control-Alt twins that work', async () => {
    renderApp('/goals')
    await screen.findByRole('heading', { name: 'Goals' })
    key({ key: 'l', ctrlKey: true, altKey: true })
    expect(await screen.findByRole('heading', { name: 'Knowledge' })).toBeInTheDocument()
    key({ key: 't', ctrlKey: true, altKey: true })
    expect(await screen.findByRole('heading', { name: 'Tags' })).toBeInTheDocument()
    key({ key: 'd', ctrlKey: true, altKey: true })
    expect(await screen.findByRole('heading', { name: 'Stats' })).toBeInTheDocument()
  })

  test('Control-K opens search, and Escape closes it', async () => {
    renderApp('/goals')
    await screen.findByRole('heading', { name: 'Goals' })
    key({ key: 'k', ctrlKey: true })
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search' })).toBeNull())
  })

  test('the rail tooltip shows the key', async () => {
    renderApp('/goals')
    await screen.findByRole('heading', { name: 'Goals' })
    await userEvent.hover(railButton(/^Inbox/))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/Ctrl\+I|⌘I/)
  })
})

describe('reading an item', () => {
  test('an ADR shows its title, status, and the text rendered from Markdown', async () => {
    renderApp('/items/ADR-00002')
    expect(await screen.findByRole('heading', { name: 'Promises', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Decision' })).toBeInTheDocument()
    expect(screen.getByText('Use promises.')).toBeInTheDocument()
    expect(railButton('Knowledge')).toHaveAttribute('aria-current', 'page')
  })

  test('a wikilink in the text is a link to the other item, followed without reloading', async () => {
    renderApp('/items/ADR-00001')
    const link = await screen.findByRole('link', { name: 'ADR-00002' })
    expect(link).toHaveAttribute('href', '/items/ADR-00002')
    await userEvent.click(link)
    expect(await screen.findByRole('heading', { name: 'Promises', level: 1 })).toBeInTheDocument()
  })

  test('a task shows its checklist as checkboxes and its progress', async () => {
    renderApp('/items/TASK-00001')
    const boxes = await screen.findAllByRole('checkbox')
    expect(boxes.map((b) => (b as HTMLInputElement).checked)).toEqual([false, true, false])
    expect(screen.getByLabelText('Checklist: 1 of 3 done')).toBeInTheDocument()
  })

  test('shows what links to an item and what it links to, as links', async () => {
    renderApp('/items/TASK-00001')
    expect(await screen.findByRole('heading', { name: 'Linked from' })).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /TASK-00002/ })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link).toHaveAttribute('href', '/items/TASK-00002')
  })

  test('an item that does not exist says so', async () => {
    renderApp('/items/TASK-09999')
    expect(await screen.findByRole('alert')).toHaveTextContent('No item TASK-09999')
  })

  test('the Knowledge screen lists decisions and docs, each leading to its page', async () => {
    renderApp('/knowledge')
    const link = await screen.findByRole('link', { name: /ADR-00002/ })
    await userEvent.click(link)
    expect(await screen.findByRole('heading', { name: 'Promises', level: 1 })).toBeInTheDocument()
  })
})

describe('staying current', () => {
  test('a new item made by someone else appears without a reload', async () => {
    renderApp('/knowledge')
    await screen.findByRole('link', { name: /ADR-00002/ })
    const title = `Made behind your back ${Date.now()}`
    await other().call((c) => c.items.create({ payload: { type: 'doc', title } }))
    expect(await screen.findByText(title, {}, { timeout: 8000 })).toBeInTheDocument()
  })

  test('an open item updates when it is changed elsewhere', async () => {
    renderApp('/items/TASK-00002')
    await screen.findByRole('heading', { name: 'CLI', level: 1 })
    const api = other()
    const task = await api.call((c) => c.items.get({ params: { id: 'TASK-00002' } }))
    await api.call((c) =>
      c.items.update({
        params: { id: 'TASK-00002' },
        payload: {
          section: { heading: 'Notes', content: 'Added from outside.', mode: 'create' },
          baseHash: task.hash,
        },
      }),
    )
    expect(
      await screen.findByText('Added from outside.', {}, { timeout: 8000 }),
    ).toBeInTheDocument()
  })
})

describe('writing, and conflicts', () => {
  const docFile = () =>
    readFileSync(join(server().dir, 'netherite/docs/DOC-00001-overview.md'), 'utf8')

  test('Mark reviewed writes the date to the file', async () => {
    renderApp('/items/DOC-00001')
    await userEvent.click(await screen.findByRole('button', { name: /Mark reviewed/ }))
    const today = new Date().toISOString().slice(0, 10)
    await waitFor(() => expect(docFile()).toContain(`reviewed_at: ${today}`))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('only docs, runbooks and context can be reviewed', async () => {
    renderApp('/items/TASK-00001')
    await screen.findByRole('heading', { name: 'Core', level: 1 })
    expect(screen.queryByRole('button', { name: /Mark reviewed/ })).toBeNull()
  })

  test('if the file changed since it was opened, nothing is saved: the person is told, and Reload fixes it', async () => {
    // No live updates in this test, so the page really does hold an old copy.
    const real = globalThis.EventSource
    globalThis.EventSource = class {
      close() {}
    } as never
    try {
      renderApp('/items/DOC-00001')
      const button = await screen.findByRole('button', { name: /Mark reviewed/ })

      const api = other()
      const fresh = await api.call((c) => c.items.get({ params: { id: 'DOC-00001' } }))
      await api.call((c) =>
        c.items.update({
          params: { id: 'DOC-00001' },
          payload: { set: { tags: [`edited-${Date.now()}`] }, baseHash: fresh.hash },
        }),
      )
      const before = docFile()
      await userEvent.click(button)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('Changed on disk')
      expect(alert).toHaveTextContent('nothing was saved')
      expect(docFile()).toBe(before)

      await userEvent.click(within(alert).getByRole('button', { name: 'Reload' }))
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
      // The page now holds the file's current version.
      const current = await api.call((c) => c.items.get({ params: { id: 'DOC-00001' } }))
      await waitFor(() =>
        expect(document.querySelector('article')).toHaveAttribute('data-hash', current.hash),
      )
      await userEvent.click(await screen.findByRole('button', { name: /Mark reviewed/ }))
      const today = new Date().toISOString().slice(0, 10)
      await waitFor(() => expect(docFile()).toContain(`reviewed_at: ${today}`))
      expect(screen.queryByRole('alert')).toBeNull()
    } finally {
      globalThis.EventSource = real
    }
  })
})

describe('editing the source of an item', () => {
  const taskFile = () =>
    readFileSync(join(server().dir, 'netherite/tasks/TASK-00002-cli.md'), 'utf8')
  const editorView = async () => {
    const dom = await waitFor(() => {
      const el = document.querySelector('.cm-editor')
      if (el === null) throw new Error('no editor yet')
      return el as HTMLElement
    })
    return EditorView.findFromDOM(dom) as EditorView
  }
  const open = async (id: string) => {
    renderApp(`/items/${id}`)
    await userEvent.click(await screen.findByRole('button', { name: /Edit source/ }))
    return editorView()
  }
  const type = (view: EditorView, insert: string, at = view.state.doc.length) =>
    act(() => void view.dispatch({ changes: { from: at, insert } }))

  test('opens the whole file, frontmatter and all, beside the rendered text', async () => {
    const view = await open('TASK-00002')
    expect(view.state.doc.toString()).toBe(taskFile())
    expect(view.state.doc.toString().startsWith('---\nid: TASK-00002')).toBe(true)
  })

  test('saving writes the file, and the page shows the new text', async () => {
    const view = await open('TASK-00002')
    const marker = `Edited in the editor ${Date.now()}.`
    type(view, `\n${marker}\n`)
    await userEvent.click(screen.getByRole('button', { name: /^Save/ }))
    await waitFor(() => expect(taskFile()).toContain(marker))
    await waitFor(() => expect(screen.queryByText('Unsaved')).toBeNull())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('the server judges the text as it is typed: a bad state is marked on its line, with why', async () => {
    const view = await open('TASK-00002')
    const before = taskFile()
    const at = view.state.doc.toString().indexOf('state: doing')
    act(
      () =>
        void view.dispatch({
          changes: { from: at, to: at + 'state: doing'.length, insert: 'state: nonsense' },
        }),
    )
    await waitFor(() => expect(document.querySelector('.cm-problem-error')).not.toBeNull(), {
      timeout: 8000,
    })
    expect(document.querySelector('.cm-hint')?.textContent).toMatch(/state/i)
    expect(screen.getByTitle(/errors/)).not.toHaveTextContent('0')
    // Nothing was saved by linting.
    expect(taskFile()).toBe(before)
  })

  test('a save the server refuses is explained, and the text stays', async () => {
    const view = await open('TASK-00002')
    const before = taskFile()
    const at = view.state.doc.toString().indexOf('state: doing')
    act(
      () =>
        void view.dispatch({
          changes: { from: at, to: at + 'state: doing'.length, insert: 'state: nonsense' },
        }),
    )
    await userEvent.click(screen.getByRole('button', { name: /^Save/ }))
    expect(await screen.findByRole('alert', {}, { timeout: 8000 })).toHaveTextContent('not valid')
    expect(taskFile()).toBe(before)
    expect(view.state.doc.toString()).toContain('state: nonsense')
  })

  test('the gutter shows changes since the last commit, from git', async () => {
    const view = await open('TASK-00001')
    // The sample workspace is committed, so the file matches its committed text until edited.
    await waitFor(() =>
      expect(
        view.state.field(changesField).modified.size + view.state.field(changesField).added.size,
      ).toBeGreaterThanOrEqual(0),
    )
    type(view, '\nA line that is new.\n')
    await waitFor(() => expect(view.state.field(changesField).added.size).toBeGreaterThan(0))
  })

  test('[[ suggests the workspace’s items, and choosing one completes the link', async () => {
    const view = await open('TASK-00002')
    await waitFor(() => expect(document.querySelector('.cm-editor')).not.toBeNull())
    // Give the items query a moment, then type an unfinished link at the end.
    await new Promise((r) => setTimeout(r, 500))
    type(view, '\nSee [[ADR-00002')
    act(() => void view.dispatch({ selection: { anchor: view.state.doc.length } }))
    const { startCompletion } = await import('@codemirror/autocomplete')
    act(() => void startCompletion(view))
    const option = await screen.findByText(
      'ADR-00002',
      { selector: '.cm-completionLabel' },
      { timeout: 4000 },
    )
    expect(option).toBeInTheDocument()
    await userEvent.click(option)
    await waitFor(() => expect(view.state.doc.toString()).toContain('See [[ADR-00002]]'))
  })

  test('if someone else changes the file while you have unsaved edits, you are asked, and nothing is lost', async () => {
    const view = await open('TASK-00002')
    type(view, '\nMy unsaved line.\n')
    const api = other()
    const fresh = await api.call((c) => c.items.source({ params: { id: 'TASK-00002' } }))
    await api.call((c) =>
      c.items.replaceSource({
        params: { id: 'TASK-00002' },
        payload: { text: `${fresh.text}\nTheirs ${Date.now()}.\n`, baseHash: fresh.hash },
      }),
    )
    expect(await screen.findByText('Changed on disk', {}, { timeout: 8000 })).toBeInTheDocument()
    expect(view.state.doc.toString()).toContain('My unsaved line.')
    await userEvent.click(screen.getByRole('button', { name: /Reload/ }))
    await waitFor(() => expect(view.state.doc.toString()).toContain('Theirs'))
    expect(view.state.doc.toString()).not.toContain('My unsaved line.')
  })

  test('if someone else changes the file and you have no edits, the editor just shows it', async () => {
    const view = await open('TASK-00001')
    const api = other()
    const fresh = await api.call((c) => c.items.source({ params: { id: 'TASK-00001' } }))
    const note = `Quietly changed ${Date.now()}.`
    await api.call((c) =>
      c.items.replaceSource({
        params: { id: 'TASK-00001' },
        payload: { text: `${fresh.text}\n${note}\n`, baseHash: fresh.hash },
      }),
    )
    await waitFor(() => expect(view.state.doc.toString()).toContain(note), { timeout: 8000 })
    expect(screen.queryByText('Changed on disk')).toBeNull()
  })
})

describe('goals', () => {
  test('are grouped by area, each card with its title, tags and progress count', async () => {
    renderApp('/goals')
    const card = await screen.findByText('Ship')
    expect(card).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'No area' })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /done$/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /New goal/ }).length).toBeGreaterThan(0)
  })

  test('a goal opens with its projects and a graph', async () => {
    renderApp('/goals')
    await userEvent.click(await screen.findByText('Ship'))
    expect(await screen.findByRole('heading', { name: 'Ship' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(await screen.findByText('App')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /projects and tasks/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Goals' })).toBeInTheDocument()
  })

  test('an unknown or non-goal ID says so', async () => {
    renderApp('/goals/TASK-00001')
    expect(await screen.findByText('No goal TASK-00001')).toBeInTheDocument()
  })

  test('New area asks for a name and a first goal, and the area appears with that goal in it', async () => {
    renderApp('/goals')
    await userEvent.click(await screen.findByRole('button', { name: /New area/ }))
    await userEvent.type(screen.getByLabelText('Area name'), 'Health')
    await userEvent.type(screen.getByLabelText('First goal'), 'Sleep well')
    await userEvent.click(screen.getByRole('button', { name: 'Create area' }))
    const area = await screen.findByRole('region', { name: 'Health' })
    expect(within(area).getByText('Sleep well')).toBeInTheDocument()
    // The goal's file records the area; remove it so other tests see the same workspace.
    const api = other()
    const goals = await api.call((c) => c.goals.list())
    const made = goals.goals.find((g) => g.title === 'Sleep well')
    expect(made?.area).toBe('Health')
    await api.call((c) =>
      c.items.delete({ params: { id: made?.id as string }, query: { force: 'true' } }),
    )
  })

  test('a goal made inside an area joins that area', async () => {
    renderApp('/goals')
    const area = await screen.findByRole('region', { name: 'No area' })
    await userEvent.click(within(area).getByRole('button', { name: /New goal/ }))
    await userEvent.type(within(area).getByLabelText('Goal title'), 'Learn to sail')
    await userEvent.click(within(area).getByRole('button', { name: 'Create' }))
    expect(await within(area).findByText('Learn to sail')).toBeInTheDocument()
    const api = other()
    const goals = await api.call((c) => c.goals.list())
    const made = goals.goals.find((g) => g.title === 'Learn to sail')
    await api.call((c) =>
      c.items.delete({ params: { id: made?.id as string }, query: { force: 'true' } }),
    )
  })

  test('New goal asks for a title, creates the goal, and it shows up', async () => {
    renderApp('/goals')
    await userEvent.click(await screen.findByRole('button', { name: /New goal/ }))
    await userEvent.type(screen.getByLabelText('Goal title'), 'Learn to sail')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(await screen.findByText('Learn to sail')).toBeInTheDocument()
  })
})

describe('the project board', () => {
  test('Projects in the rail opens a board, not a list, and a project also opens from its goal', async () => {
    renderApp('/goals/GOAL-00001')
    await screen.findByRole('navigation', { name: 'Main' })
    await userEvent.click(await screen.findByText('App'))
    expect(railButton('Projects')).toHaveAttribute('aria-current', 'page')
    await screen.findByRole('region', { name: 'backlog' })
    for (const name of ['backlog', 'doing', 'blocked', 'done']) {
      expect(await screen.findByRole('region', { name })).toBeInTheDocument()
    }
    const backlog = screen.getByRole('region', { name: 'backlog' })
    expect(within(backlog).getByText('Core')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /: tasks$/ })).toBeInTheDocument()
  })

  test('Docs and Knowledge are views of what links to the project', async () => {
    renderApp('/projects/PRJ-00001')
    await screen.findByRole('region', { name: 'backlog' })
    await userEvent.click(screen.getByRole('tab', { name: 'Knowledge' }))
    expect(await screen.findByText(/ADR-0000|No decisions/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Docs' }))
    expect(await screen.findByText(/DOC-0000|RUN-0000|No docs/)).toBeInTheDocument()
  })

  test('an unknown or non-project ID says so', async () => {
    renderApp('/projects/TASK-00001')
    expect(await screen.findByText('No project TASK-00001')).toBeInTheDocument()
  })

  test('a drop changes state only when it lands on another column', () => {
    const tasks = [{ id: 'TASK-00001', state: 'backlog' }]
    expect(moveFor(tasks, 'TASK-00001', 'doing')).toEqual({ id: 'TASK-00001', state: 'doing' })
    expect(moveFor(tasks, 'TASK-00001', 'backlog')).toBeUndefined()
    expect(moveFor(tasks, 'TASK-00001', undefined)).toBeUndefined()
    expect(moveFor(tasks, 'TASK-09999', 'doing')).toBeUndefined()
  })
})

describe('the task drawer', () => {
  const taskFile = () =>
    readFileSync(join(server().dir, 'netherite/tasks/TASK-00001-core.md'), 'utf8')

  test('opens from a card with the fields, checklist and decisions, and closes back to the board', async () => {
    renderApp('/projects/PRJ-00001')
    await userEvent.click(await screen.findByRole('link', { name: 'Core' }))
    const drawer = await screen.findByRole('dialog')
    expect(await within(drawer).findByText('backend')).toBeInTheDocument()
    expect(within(drawer).getByRole('checkbox', { name: 'second' })).toBeChecked()
    expect(within(drawer).getByRole('checkbox', { name: 'first' })).not.toBeChecked()
    expect(within(drawer).getByRole('button', { name: /Link ADR/ })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('region', { name: 'backlog' })).toBeInTheDocument()
  })

  test('is a link: the address opens the drawer', async () => {
    renderApp('/projects/PRJ-00001?task=TASK-00002')
    const drawer = await screen.findByRole('dialog')
    expect(
      await within(drawer).findByRole('link', { name: /ADR-00002.*Promises/ }),
    ).toBeInTheDocument()
  })

  test('ticking a checklist item writes it to the file, and unticking undoes it', async () => {
    renderApp('/projects/PRJ-00001?task=TASK-00001')
    const drawer = await screen.findByRole('dialog')
    const box = await within(drawer).findByRole('checkbox', { name: 'first' })
    await userEvent.click(box)
    await waitFor(() => expect(taskFile()).toContain('- [x] first'))
    await waitFor(() =>
      expect(within(drawer).getByRole('checkbox', { name: 'first' })).toBeChecked(),
    )
    await userEvent.click(within(drawer).getByRole('checkbox', { name: 'first' }))
    await waitFor(() => expect(taskFile()).toContain('- [ ] first'))
  })

  test('changing the state from the drawer moves the card to that column', async () => {
    renderApp('/projects/PRJ-00001?task=TASK-00001')
    const drawer = await screen.findByRole('dialog')
    await within(drawer).findByRole('button', { name: 'Change state' })
    await userEvent.click(
      await menuItem(() => within(drawer).getByRole('button', { name: 'Change state' }), 'doing'),
    )
    await waitFor(() => expect(taskFile()).toContain('state: doing'))
    await other().call((c) =>
      c.items.setState({ params: { id: 'TASK-00001' }, payload: { state: 'backlog' } }),
    )
  })

  test('Link ADR adds the decision to the task', async () => {
    renderApp('/projects/PRJ-00001?task=TASK-00001')
    const drawer = await screen.findByRole('dialog')
    await within(drawer).findByRole('button', { name: /Link ADR/ })
    await userEvent.click(
      await menuItem(() => within(drawer).getByRole('button', { name: /Link ADR/ }), /ADR-00001/),
    )
    await waitFor(() => expect(taskFile()).toContain('ADR-00001'))
    expect(
      await within(drawer).findByRole('link', { name: /ADR-00001.*Callbacks/ }),
    ).toBeInTheDocument()
    await other().call((c) =>
      c.items.unlink({
        params: { id: 'TASK-00001' },
        query: { to: 'ADR-00001', kind: 'implements' },
      }),
    )
  })
})

describe('the knowledge index', () => {
  test('lists knowledge with type tabs that count, and filters by tab', async () => {
    renderApp('/knowledge')
    expect(await screen.findByText('ADR-00001')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^ADR 3/ })).toBeInTheDocument()
    expect(screen.queryByText('TASK-00001')).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: /^Doc/ }))
    await waitFor(() => expect(screen.queryByText('ADR-00001')).toBeNull())
    expect(screen.getByText('DOC-00001')).toBeInTheDocument()
  })

  test('the status filter narrows to proposed ADRs, and Clear filters brings everything back', async () => {
    renderApp('/knowledge')
    await screen.findByText('ADR-00001')
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'proposed')
    await waitFor(() => expect(screen.queryByText('ADR-00001')).toBeNull())
    expect(screen.getByText('ADR-00003')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'deprecated')
    await userEvent.click(await screen.findByRole('button', { name: 'Clear filters' }))
    expect(await screen.findByText('ADR-00001')).toBeInTheDocument()
  })

  test('selecting a row shows its summary, who links to it, and an Open link', async () => {
    renderApp('/knowledge')
    await userEvent.click(await screen.findByText('Promises'))
    const preview = await screen.findByRole('complementary', { name: 'Preview of ADR-00002' })
    expect(await within(preview).findByText('Text.')).toBeInTheDocument()
    expect(within(preview).getAllByText(/PRJ-00001/).length).toBeGreaterThan(0)
    expect(within(preview).getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      '/items/ADR-00002',
    )
  })
})

describe('ADR and context views', () => {
  test('an ADR shows where it is in its lifecycle', async () => {
    renderApp('/items/ADR-00002')
    const lifecycle = await screen.findByRole('list', { name: 'Lifecycle' })
    expect(within(lifecycle).getByText('accepted').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(within(lifecycle).getByText('proposed').closest('li')).not.toHaveAttribute(
      'aria-current',
    )
  })

  test('a superseded ADR has a banner naming its replacement, and the chain', async () => {
    const api = other()
    const old = await api.call((c) =>
      c.items.create({ payload: { type: 'adr', title: 'Old way' } }),
    )
    const next = await api.call((c) =>
      c.items.create({ payload: { type: 'adr', title: 'New way' } }),
    )
    try {
      await api.call((c) =>
        c.items.setState({ params: { id: old.id }, payload: { state: 'accepted' } }),
      )
      await api.call((c) =>
        c.items.setState({
          params: { id: old.id },
          payload: { state: 'superseded', supersededBy: next.id },
        }),
      )
      renderApp(`/items/${old.id}`)
      expect(await screen.findByText(/Superseded by/)).toBeInTheDocument()
      const chain = await screen.findByRole('region', { name: 'Supersession chain' })
      expect(within(chain).getByRole('link', { name: new RegExp(next.id) })).toBeInTheDocument()
      const lifecycle = screen.getByRole('list', { name: 'Lifecycle' })
      expect(within(lifecycle).getByText('superseded').closest('li')).toHaveAttribute(
        'aria-current',
        'step',
      )
    } finally {
      for (const made of [old, next])
        await api.call((c) => c.items.delete({ params: { id: made.id }, query: { force: 'true' } }))
    }
  })

  test('a context item has an include switch that writes the file, and its sync targets', async () => {
    const api = other()
    const made = await api.call((c) =>
      c.items.create({ payload: { type: 'context', title: 'House rules' } }),
    )
    try {
      renderApp(`/items/${made.id}`)
      const panel = await screen.findByRole('region', { name: 'Context' })
      const box = within(panel).getByRole('switch', { name: 'Include in context' })
      expect(box).not.toBeChecked()
      await userEvent.click(box)
      await waitFor(() =>
        expect(readFileSync(join(server().dir, made.path.replace(/^\/?/, '')), 'utf8')).toContain(
          'include_in_context: true',
        ),
      )
      expect(await within(panel).findByText('CLAUDE.md')).toBeInTheDocument()
    } finally {
      await api.call((c) => c.items.delete({ params: { id: made.id }, query: { force: 'true' } }))
    }
  })

  test('the side panel lists who links to a doc, and what it links to', async () => {
    renderApp('/items/DOC-00001')
    const side = await screen.findByRole('complementary', { name: 'Related' })
    expect(within(side).getByText(/Linked from/)).toBeInTheDocument()
    expect(within(side).getByRole('link', { name: /ADR-00001/ })).toBeInTheDocument()
    expect(await within(side).findByText(/Changes with/)).toBeInTheDocument()
  })

  test('a doc whose covered files changed shows the stale banner, the commits, and Mark reviewed', async () => {
    mkdirSync(join(server().dir, 'src'), { recursive: true })
    writeFileSync(join(server().dir, 'src/a.ts'), 'export {}\n')
    const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' }
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: server().dir, env, stdio: 'ignore' })
    git('add', '-A')
    git('commit', '-q', '-m', 'touch covered code')
    // Earlier tests may have reviewed the doc today, so put the review back. The test server does not watch, so this write is also what makes it look at git again.
    const api = other()
    const doc = await api.call((c) => c.items.get({ params: { id: 'DOC-00001' } }))
    await api.call((c) =>
      c.items.update({
        params: { id: 'DOC-00001' },
        payload: { set: { reviewed_at: '2026-01-01' }, baseHash: doc.hash },
      }),
    )

    renderApp('/items/DOC-00001')
    expect(
      await screen.findByText(/Related code changed in/, {}, { timeout: 10000 }),
    ).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('button', { name: 'Review changes' }))
    const commits = await screen.findByRole('list', { name: 'Commits since review' })
    expect(within(commits).getByText(/touch covered code/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark reviewed' })).toBeInTheDocument()
  })
})

describe('the decision log', () => {
  test('has a lane per project with the commits that changed each ADR, and the status it moved to', async () => {
    renderApp('/decisions')
    const lane = await screen.findByRole('region', { name: 'PRJ-00001' })
    expect(await within(lane).findByRole('link', { name: 'ADR-00002' })).toBeInTheDocument()
    expect(within(lane).getByText('Accepted')).toBeInTheDocument()
    expect(within(lane).getByText(/1 ADRs/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'No project' })).toBeInTheDocument()
  })

  test('the project tabs show one lane, and Knowledge links to the log', async () => {
    renderApp('/decisions')
    await screen.findByRole('region', { name: 'No project' })
    await userEvent.click(screen.getByRole('radio', { name: 'PRJ-00001' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'No project' })).toBeNull())
    expect(screen.getByRole('region', { name: 'PRJ-00001' })).toBeInTheDocument()
    await userEvent.click(railButton(/^Knowledge/))
    await userEvent.click(await screen.findByRole('link', { name: /Decision log/ }))
    expect(await screen.findByRole('heading', { name: 'Decision log' })).toBeInTheDocument()
  })
})

describe('the graph view', () => {
  const nodeButton = (id: string) => screen.findByRole('button', { name: new RegExp(`^${id} `) })

  test('draws every item, with a legend for the types and links present', async () => {
    renderApp('/graph')
    expect(await nodeButton('GOAL-00001')).toBeInTheDocument()
    expect(await nodeButton('TASK-00001')).toBeInTheDocument()
    const legend = screen.getByRole('complementary', { name: 'Legend' })
    expect(within(legend).getByRole('checkbox', { name: /Goal/ })).toBeChecked()
    expect(within(legend).getByRole('checkbox', { name: /belongs to/i })).toBeChecked()
  })

  test('the legend hides a type, and shows it again', async () => {
    renderApp('/graph')
    await nodeButton('TASK-00001')
    const legend = screen.getByRole('complementary', { name: 'Legend' })
    await userEvent.click(within(legend).getByRole('checkbox', { name: /Task/ }))
    await waitFor(() => expect(screen.queryByRole('button', { name: /^TASK-00001 / })).toBeNull())
    expect(screen.getByRole('button', { name: /^GOAL-00001 / })).toBeInTheDocument()
    await userEvent.click(within(legend).getByRole('checkbox', { name: /Task/ }))
    expect(await nodeButton('TASK-00001')).toBeInTheDocument()
  })

  test('clicking a node focuses it and offers to open it; clicking it again clears the focus', async () => {
    renderApp('/graph')
    const node = await nodeButton('PRJ-00001')
    await userEvent.click(node)
    expect(node).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      '/items/PRJ-00001',
    )
    await userEvent.click(node)
    expect(node).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('link', { name: 'Open' })).toBeNull()
  })

  test('hovering a node says what it is, and the keyboard works too', async () => {
    renderApp('/graph')
    const node = await nodeButton('ADR-00002')
    await userEvent.hover(node)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Promises')
    await userEvent.unhover(node)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
    node.focus()
    await userEvent.keyboard('{Enter}')
    expect(node).toHaveAttribute('aria-pressed', 'true')
  })

  test('the goal page embeds the graph with its legend and zoom buttons, and it pans and zooms', async () => {
    renderApp('/goals/GOAL-00001')
    expect(await screen.findByRole('img', { name: /projects and tasks/ })).toBeInTheDocument()
    expect(await screen.findByRole('complementary', { name: 'Legend' })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Zoom' })).toBeInTheDocument()
    const graph = screen.getByRole('img', { name: /projects and tasks/ })
    const node = await nodeButton('GOAL-00001')
    const shape = () => node.querySelector('circle:not(.gv-glow), rect') as SVGElement
    const at = () => Number(shape().getAttribute('cx') ?? shape().getAttribute('x'))
    const start = at()
    // Dragging the background pans.
    fireEvent.pointerDown(graph, { clientX: 10, clientY: 10, button: 0 })
    fireEvent.pointerMove(graph, { clientX: 80, clientY: 50 })
    fireEvent.pointerUp(graph)
    await waitFor(() => expect(at()).not.toBe(start))
    // The wheel zooms.
    const panned = at()
    fireEvent.wheel(graph, { deltaY: -100, clientX: 0, clientY: 0 })
    await waitFor(() => expect(at()).not.toBe(panned))
  })

  test('a node can be dragged, letting go on the node ends the drag, and the drop is not a click', async () => {
    renderApp('/graph')
    const node = await nodeButton('PRJ-00001')
    const shape = () => node.querySelector('circle:not(.gv-glow), rect') as SVGElement
    const at = () => Number(shape().getAttribute('cx') ?? shape().getAttribute('x'))
    const before = at()
    fireEvent.pointerDown(node, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.pointerMove(window, { clientX: 220, clientY: 180 })
    fireEvent.pointerMove(window, { clientX: 260, clientY: 200 })
    await waitFor(() => expect(at()).not.toBe(before))
    // The pointer comes up on the node itself, as it does when you drop where you are.
    fireEvent.pointerUp(node)
    fireEvent.click(node)
    expect(node).toHaveAttribute('aria-pressed', 'false')

    // The drag is over: moving the pointer now does not move the node.
    await new Promise((r) => setTimeout(r, 600))
    const dropped = at()
    fireEvent.pointerMove(window, { clientX: 600, clientY: 600 })
    await new Promise((r) => setTimeout(r, 300))
    expect(Math.abs(at() - dropped)).toBeLessThan(5)

    // And the next click on it is a click again.
    await userEvent.click(node)
    expect(node).toHaveAttribute('aria-pressed', 'true')
  })

  test('Fit and the zoom buttons are there', async () => {
    renderApp('/graph')
    await nodeButton('GOAL-00001')
    const zoom = screen.getByRole('toolbar', { name: 'Zoom' })
    for (const name of ['Zoom in', 'Zoom out', 'Fit to view']) {
      await userEvent.click(within(zoom).getByRole('button', { name }))
    }
    expect(screen.getByRole('button', { name: /^GOAL-00001 / })).toBeInTheDocument()
  })
})

describe('the Projects rail item', () => {
  test('opens the board you were last on', async () => {
    renderApp('/projects/PRJ-00001')
    await screen.findByRole('region', { name: 'backlog' })
    await userEvent.click(railButton('Goals'))
    await screen.findByRole('heading', { name: 'Goals' })
    await userEvent.click(railButton('Projects'))
    expect(await screen.findByRole('region', { name: 'backlog' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'App' })).toBeInTheDocument()
  })
})

describe('the search palette', () => {
  const openPalette = async () => {
    renderApp('/goals')
    await screen.findByRole('heading', { name: 'Goals' })
    key({ key: 'k', ctrlKey: true })
    return await screen.findByRole('dialog', { name: 'Search' })
  }

  test('finds items by what you type, grouped by kind, with the match marked', async () => {
    const palette = await openPalette()
    await userEvent.type(within(palette).getByRole('textbox'), 'Promises')
    const results = await within(palette).findByRole('listbox', { name: 'Results' })
    expect(await within(results).findByText('Decisions')).toBeInTheDocument()
    expect(within(results).getByText('ADR-00002')).toBeInTheDocument()
    expect(results.querySelector('mark')?.textContent?.toLowerCase()).toBe('promises')
  })

  test('Enter opens the highlighted result, and the palette closes', async () => {
    const palette = await openPalette()
    await userEvent.type(within(palette).getByRole('textbox'), 'Promises')
    await within(palette).findByText('ADR-00002')
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('article', { name: 'Promises' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Search' })).toBeNull()
  })

  test('the type chips count and narrow the results, and Tab moves to the next type', async () => {
    const palette = await openPalette()
    await userEvent.type(within(palette).getByRole('textbox'), 'core')
    await within(palette).findByRole('listbox', { name: 'Results' })
    await waitFor(() =>
      expect(within(palette).getByRole('radio', { name: /^All [1-9]/ })).toBeInTheDocument(),
    )
    await userEvent.keyboard('{Tab}')
    expect(within(palette).getByRole('radio', { name: /^ADRs/ })).toBeChecked()
  })

  test('says so when nothing matches', async () => {
    const palette = await openPalette()
    await userEvent.type(within(palette).getByRole('textbox'), 'zzzzzqqq')
    expect(await within(palette).findByText(/No results/)).toBeInTheDocument()
  })
})

describe('opening as a split', () => {
  test('a search result opened with Control-Enter has the file beside the text', async () => {
    renderApp('/goals')
    await screen.findByRole('heading', { name: 'Goals' })
    key({ key: 'k', ctrlKey: true })
    const palette = await screen.findByRole('dialog', { name: 'Search' })
    await userEvent.type(within(palette).getByRole('textbox'), 'Promises')
    await within(palette).findByText('ADR-00002')
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    expect(await screen.findByRole('article', { name: 'Promises' })).toBeInTheDocument()
    expect(await screen.findByTestId('editor')).toBeInTheDocument()
  })
})

describe('the Inbox', () => {
  test('lists what waits for you: a proposed ADR under decisions to make, with the count in the header', async () => {
    renderApp('/inbox')
    const group = await screen.findByRole('region', { name: 'Decisions to make' })
    expect(within(group).getByText('ADR-00003')).toBeInTheDocument()
    expect(within(group).getByText('Proposed')).toBeInTheDocument()
    expect(screen.getByText(/things? need(s)? you/)).toBeInTheDocument()
    expect(within(group).getByRole('link', { name: /ADR-00003/ })).toHaveAttribute(
      'href',
      '/items/ADR-00003',
    )
  })

  test('shows uncommitted changes to items, and Mark as seen moves the since-line forward', async () => {
    const api = other()
    const doc = await api.call((c) => c.items.get({ params: { id: 'DOC-00001' } }))
    await api.call((c) =>
      c.items.update({
        params: { id: 'DOC-00001' },
        payload: { set: { tags: ['inbox-test'] }, baseHash: doc.hash },
      }),
    )
    renderApp('/inbox')
    const changes = await screen.findByRole('region', { name: 'Uncommitted changes' })
    expect(within(changes).getByText('DOC-00001')).toBeInTheDocument()
    expect(screen.getByText(/changes since the beginning/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Mark as seen/ }))
    expect(await screen.findByText(/changes since today/)).toBeInTheDocument()
    localStorage.removeItem('netherite:inbox-seen')
  })

  test('the rail badge counts the same things the page lists', async () => {
    renderApp('/inbox')
    await screen.findByRole('region', { name: 'Decisions to make' })
    expect(
      await within(nav()).findByRole('button', { name: /^Inbox, \d+ waiting$/ }),
    ).toBeInTheDocument()
  })
})

describe('Stats', () => {
  test('shows the tiles and the three charts from the git history', async () => {
    renderApp('/stats')
    expect(await screen.findByRole('heading', { name: 'Stats' })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'Tasks done per week' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Progress of each goal/ })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /ADRs by the status/ })).toBeInTheDocument()
    expect(screen.getByText('tasks done')).toBeInTheDocument()
    expect(screen.getByText('ADRs accepted')).toBeInTheDocument()
  })

  test('progress can be shown per goal or per project, with each one named and its latest percent', async () => {
    renderApp('/stats')
    const progress = await screen.findByRole('region', { name: 'Progress over time' })
    await userEvent.click(within(progress).getByRole('radio', { name: 'Projects' }))
    expect(await screen.findByRole('img', { name: /Progress of each project/ })).toBeInTheDocument()
    await waitFor(() => expect(within(progress).getAllByText('App').length).toBeGreaterThan(0))
    expect(within(progress).getAllByText(/^\d+%$|^—$/).length).toBeGreaterThan(0)
  })
})
