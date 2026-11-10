import type { Page } from '@playwright/test'
import { expect, test } from './fixture'

const section = (page: Page) =>
  page.evaluate(
    () =>
      (document.activeElement?.closest('[data-section]') as HTMLElement | null)?.dataset.section,
  )

const press = async (page: Page, ...keys: string[]) => {
  for (const key of keys) await page.keyboard.press(key)
}

const ready = async (page: Page) =>
  expect(page.locator('main [data-section]').first()).toBeVisible()

test('a page is reached with g and a letter, and g just types in a field', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, 'g', 'k')
  await expect(page).toHaveURL(/\/knowledge/)
  const filter = page.getByRole('textbox', { name: 'Filter' })
  await filter.click()
  await press(page, 'g', 'p')
  await expect(filter).toHaveValue('gp')
  await expect(page).toHaveURL(/\/knowledge/)
  await press(page, 'Escape')
  expect(await section(page)).toBe('toolbar')
})

test('a quick second key shows no popup', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, 'g', 't')
  await expect(page).toHaveURL(/\/tags/)
  await expect(page.getByRole('status', { name: 'Next key' })).toBeHidden()
})

test('shared verbs and page keys work on their pages', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/inbox`)
  await expect(page.getByRole('textbox', { name: /capture/i })).toBeVisible()
  await press(page, 'n')
  await expect(page.getByRole('textbox', { name: /capture/i })).toBeFocused()
  await press(page, 'Escape')

  await page.goto(`${workspace.url}/knowledge`)
  await expect(page.getByRole('textbox', { name: 'Filter' })).toBeVisible()
  await press(page, '/')
  await expect(page.getByRole('textbox', { name: 'Filter' })).toBeFocused()
  await press(page, 'Escape', 'n')
  await expect(page.getByRole('menuitem', { name: 'New doc' })).toBeVisible()
  await press(page, 'Escape')

  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, 'n')
  await expect(page.getByRole('textbox').first()).toBeFocused()
  await press(page, 'Escape')
})

test('goals are walked with j and opened with Enter', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, '.', '.', 'j')
  const goal = page.locator(':focus')
  await expect(goal).toHaveAttribute('data-nav-item', 'GOAL-00001')
  await press(page, 'Enter')
  await expect(page).toHaveURL(/\/goals\/GOAL-00001/)
})

test('knowledge rows are walked with j and selected with Enter', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/knowledge`)
  await expect(page.locator('.kn-row').first()).toBeVisible()
  const first = page.locator('.kn-row').first()
  await page.keyboard.press('.')
  for (let i = 0; i < 4 && (await section(page)) !== 'content'; i += 1) await press(page, '.')
  await press(page, 'j')
  await expect(first).toBeFocused()
  await press(page, 'Enter')
  await expect(first).toHaveAttribute('aria-pressed', 'true')
})

test('the graph zooms from the keyboard and fits back', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/graph`)
  const node = page.locator('main svg [tabindex]').first()
  await expect(node).toBeVisible()
  const left = async () => (await node.boundingBox())?.x
  const start = await left()
  await press(page, '=')
  await expect.poll(left).not.toBe(start)
  await press(page, '0')
  await expect.poll(left).toBe(start)
})

test('the next keys show after a pause on g', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, 'g')
  const hint = page.getByRole('status', { name: 'Next key' })
  await expect(hint).toContainText('Go to Tags')
  await press(page, 'Escape')
  await expect(hint).toBeHidden()
  await expect(page).toHaveURL(/\/goals/)
})

test('sections wrap inside the page on different templates', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, '.')
  expect(await section(page)).toBe('header')
  await press(page, '.')
  expect(await section(page)).toBe('content')
  await press(page, '.')
  expect(await section(page)).toBe('header')
  await press(page, ',')
  expect(await section(page)).toBe('content')

  await page.goto(`${workspace.url}/settings`)
  await ready(page)
  await press(page, '.')
  expect(await section(page)).toBe('header')
  await press(page, 'F6')
  expect(await section(page)).toBe('content')
})

test('; goes to the sidebar and back, and Enter lands in the next page', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, '.', '.')
  expect(await section(page)).toBe('content')
  await press(page, ';')
  expect(await section(page)).toBe('sidebar')
  await expect(page.locator(':focus')).toHaveAttribute('aria-current', 'page')
  await press(page, ';')
  expect(await section(page)).toBe('content')
  await press(page, ';', 'j')
  await expect(page.locator(':focus')).toHaveAccessibleName('Projects')
  await press(page, 'Enter')
  await expect(page).toHaveURL(/\/projects/)
  await expect.poll(() => section(page)).toBe('content')
})

test('the cheat sheet follows the page', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/inbox`)
  await ready(page)
  await press(page, '?')
  const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
  await expect(sheet.getByRole('region', { name: 'Inbox' })).toBeVisible()
  await expect(sheet.getByRole('region', { name: 'Tags' })).toBeHidden()
  await press(page, '?')
  await expect(sheet).toBeHidden()

  await page.goto(`${workspace.url}/tags`)
  await ready(page)
  await press(page, '?')
  await expect(sheet.getByRole('region', { name: 'Tags' })).toBeVisible()
  await expect(sheet.getByRole('region', { name: 'Inbox' })).toBeHidden()
})

test('the recorder takes two keys and refuses browser and shared keys', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=shortcuts`)
  await page.getByRole('button', { name: 'Change the shortcut for Go to Tags' }).click()
  const status = page.getByRole('status').filter({ hasText: 'Esc to cancel' })
  await press(page, 'ControlOrMeta+l')
  await expect(status).toContainText('The browser keeps')
  await press(page, '.')
  await expect(status).toContainText('moves around on every page')
  await press(page, 'g')
  await expect(status).toContainText('second key')
  await press(page, 'z')
  await expect(status).toBeHidden()

  await page.goto(`${workspace.url}/goals`)
  await ready(page)
  await press(page, 'g')
  await expect(page.getByRole('status', { name: 'Next key' })).toContainText('Z')
  await press(page, 'z')
  await expect(page).toHaveURL(/\/tags/)
})

test.describe('on the board', () => {
  test.use({ seeded: false })

  const board = async (page: Page, url: string) => {
    await page.goto(`${url}/goals`)
    await page
      .getByRole('button', { name: /New goal/ })
      .first()
      .click()
    await page.keyboard.type('Goal')
    await page.keyboard.press('Enter')
    await page.getByText('Goal', { exact: true }).first().click()
    await page.getByRole('button', { name: 'New project' }).click()
    await page.keyboard.type('Work')
    await page.keyboard.press('Enter')
    await page.getByText('Work', { exact: true }).first().click()
    await expect(page.getByRole('region', { name: 'backlog' })).toBeVisible()
  }

  test('n adds a task, the keys move the card, and the file changes', async ({
    page,
    workspace,
  }) => {
    await board(page, workspace.url)
    await press(page, 'n')
    await page.keyboard.type('Keyed')
    await press(page, 'Enter')
    const card = page.locator('[data-nav-item="TASK-00001"]')
    await expect(card).toBeVisible()
    await press(page, 'Escape')
    await card.focus()
    await press(page, 'Shift+l')
    await expect
      .poll(() => workspace.read('netherite/tasks/TASK-00001-keyed.md'))
      .toContain('state: doing')
    await expect(page.getByRole('region', { name: 'doing' }).getByText('Keyed')).toBeVisible()
    await expect(card).toBeFocused()
    await press(page, 'h')
    await expect(card).toBeFocused()
    await press(page, 'm')
    await expect(page.getByRole('dialog', { name: 'Move Keyed to' })).toBeVisible()
  })

  test('j and l walk the cards', async ({ page, workspace }) => {
    await board(page, workspace.url)
    for (const title of ['One', 'Two']) {
      await press(page, 'n')
      await page.keyboard.type(title)
      await press(page, 'Enter')
      await expect(page.getByText(title, { exact: true })).toBeVisible()
      await press(page, 'Escape')
    }
    await page.locator('[data-nav-item="TASK-00001"]').focus()
    await press(page, 'j')
    await expect(page.locator('[data-nav-item="TASK-00002"]')).toBeFocused()
    await press(page, 'k')
    await expect(page.locator('[data-nav-item="TASK-00001"]')).toBeFocused()
  })

  test('the drawer has its own sections and closes back to the card', async ({
    page,
    workspace,
  }) => {
    await board(page, workspace.url)
    await press(page, 'n')
    await page.keyboard.type('Drawn')
    await press(page, 'Enter')
    const card = page.locator('[data-nav-item="TASK-00001"]')
    await expect(card).toBeVisible()
    await press(page, 'Escape')
    await card.focus()
    await press(page, 'Enter')
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByRole('heading', { name: 'Drawn' })).toBeVisible()
    await press(page, '.')
    expect(await section(page)).toBe('header')
    await press(page, '.')
    expect(await section(page)).toBe('content')
    await press(page, ';')
    expect(await section(page)).toBe('content')
    await press(page, 't')
    await expect(drawer.getByTestId('editor')).toBeVisible()
    await press(page, 't')
    await expect(drawer.getByTestId('editor')).toBeHidden()
    await press(page, 'Escape')
    await expect(drawer).toBeHidden()
    await expect(card).toBeFocused()
  })
})
