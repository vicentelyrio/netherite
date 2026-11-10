import type { Page } from '@playwright/test'
import { expect, test } from './fixture'

const task1 = 'netherite/tasks/TASK-00001-core.md'
const normal = '--NORMAL--'

const turnOnVim = async (page: Page, url: string) => {
  await page.goto(`${url}/settings?tab=editor`)
  await page.locator('.mantine-Switch-track').click()
  await expect(page.getByRole('switch', { name: /Vim mode/ })).toBeChecked()
}

const openTaskEditor = async (page: Page, url: string) => {
  await page.goto(`${url}/projects/PRJ-00001?task=TASK-00001`)
  const drawer = page.getByRole('dialog')
  await drawer.getByText('code', { exact: true }).click()
  await drawer.locator('.cm-content').click()
  return drawer
}

test('vim mode set in settings edits and saves a task, and Esc leaves the drawer open', async ({
  page,
  workspace,
}) => {
  await turnOnVim(page, workspace.url)
  const drawer = await openTaskEditor(page, workspace.url)
  await expect(drawer.getByText(normal)).toBeVisible()

  await page.keyboard.type('Go')
  await expect(drawer.getByText('--INSERT--')).toBeVisible()
  await page.keyboard.type('typed with vim')
  await page.keyboard.press('Escape')
  await expect(drawer.getByText(normal)).toBeVisible()
  await expect(drawer).toBeVisible()

  await page.keyboard.type(':w')
  await page.keyboard.press('Enter')
  await expect.poll(() => workspace.diff(task1)).toContain('+typed with vim')
})

test('Esc in the vim command line cancels it and leaves the drawer open', async ({
  page,
  workspace,
}) => {
  await turnOnVim(page, workspace.url)
  const drawer = await openTaskEditor(page, workspace.url)
  await page.keyboard.type(':')
  await expect(drawer.locator('.cm-vim-panel input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(drawer.locator('.cm-vim-panel input')).toBeHidden()
  await expect(drawer).toBeVisible()
})

test('app shortcuts still work from normal mode', async ({ page, workspace }) => {
  await turnOnVim(page, workspace.url)
  const drawer = await openTaskEditor(page, workspace.url)
  await page.keyboard.type('Ax')
  await page.keyboard.press('Escape')
  await page.keyboard.press('ControlOrMeta+s')
  await expect(drawer.getByText('Saved', { exact: true })).toBeVisible()
  await page.keyboard.press('ControlOrMeta+k')
  await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible()
})

test('with vim mode off Esc leaves the editor, then closes the drawer', async ({
  page,
  workspace,
}) => {
  const drawer = await openTaskEditor(page, workspace.url)
  await expect(drawer.getByText(normal)).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
})
