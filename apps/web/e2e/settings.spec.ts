import { expect, test } from './fixture'

test('settings open on the first tab, and each tab shows only its own settings', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings`)
  await expect(page.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('radiogroup', { name: 'Notice duration' })).toBeVisible()
  await expect(page.getByRole('switch', { name: /Vim mode/ })).toBeHidden()

  await page.getByRole('tab', { name: 'Editor' }).click()
  await expect(page.getByRole('switch', { name: /Vim mode/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeHidden()

  await page.getByRole('tab', { name: 'Shortcuts' }).click()
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Autosave delay' })).toBeHidden()
})

test('the open tab is in the URL, so a reload or a shared link keeps it', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings`)
  await page.getByRole('tab', { name: 'Shortcuts' }).click()
  await expect(page).toHaveURL(/\/settings\?tab=shortcuts$/)
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Shortcuts' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible()
})

test('an unknown tab in the URL falls back to the first one', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings?tab=nowhere`)
  await expect(page.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
})

test('tabs work by keyboard and name their panels', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings`)
  await expect(page.getByRole('tablist', { name: 'Settings sections' })).toBeVisible()
  await page.getByRole('tab', { name: 'General' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Editor' })).toBeFocused()
  await expect(page.getByRole('tabpanel', { name: 'Editor' })).toBeVisible()
  await expect(page).toHaveURL(/\/settings\?tab=editor$/)
})

test('the settings shortcut reaches the page', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await expect(page.locator('main [data-section]').first()).toBeVisible()
  await page.keyboard.press('g')
  await page.keyboard.press('s')
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('tab', { name: 'General' })).toBeVisible()
})

test('the chosen autosave delay is what the editor waits, and it survives a reload', async ({
  page,
  workspace,
}) => {
  const task1 = 'netherite/tasks/TASK-00001-core.md'
  await page.goto(`${workspace.url}/settings?tab=editor`)
  const delay = page.getByRole('radiogroup', { name: 'Autosave delay' })
  await delay.getByText('5 s', { exact: true }).click()
  await page.reload()
  await expect(delay.getByRole('radio', { name: '5 s', exact: true })).toBeChecked()

  await page.goto(`${workspace.url}/projects/PRJ-00001?task=TASK-00001`)
  const drawer = page.getByRole('dialog')
  await drawer.getByText('code', { exact: true }).click()
  await drawer.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type('waited for')
  await page.waitForTimeout(2500)
  expect(workspace.diff(task1)).toBe('')
  await expect.poll(() => workspace.diff(task1), { timeout: 8000 }).toContain('+waited for')
})
