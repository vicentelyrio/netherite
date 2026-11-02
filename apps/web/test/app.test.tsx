import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { other, renderApp, server } from './helpers'

const nav = () => screen.getByRole('navigation', { name: 'Main' })
const railButton = (name: RegExp | string) => within(nav()).getByRole('button', { name })
const key = (init: KeyboardEventInit) => act(() => void fireEvent.keyDown(window, init))

describe('the shell', () => {
  test('opens on Goals, with the rail showing where you are, and lists the goals', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Goals' })).toBeInTheDocument()
    expect(railButton('Goals')).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByText('GOAL-00001')).toBeInTheDocument()
    expect(screen.getByText('Ship')).toBeInTheDocument()
  })

  test('every rail item opens its screen', async () => {
    renderApp('/goals')
    await screen.findByRole('heading', { name: 'Goals' })
    for (const name of ['Inbox', 'Projects', 'Knowledge', 'Stats', 'Tags', 'Graph', 'Goals']) {
      await userEvent.click(railButton(new RegExp(`^${name}`)))
      expect(await screen.findByRole('heading', { name })).toBeInTheDocument()
      expect(railButton(new RegExp(`^${name}`))).toHaveAttribute('aria-current', 'page')
    }
  })

  test('a screen that is not built yet says which task builds it', async () => {
    renderApp('/stats')
    expect(await screen.findByText(/TASK-00046/)).toBeInTheDocument()
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
    ['p', {}, 'Projects'],
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
    key({ key: 'p', ctrlKey: true, altKey: true })
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
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
