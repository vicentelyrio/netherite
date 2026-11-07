import { expect, test } from './fixture'

test('settings open on the first tab, and each tab shows only its own settings', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings`)
  await expect(page.getByRole('tab', { name: 'Editor' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('switch', { name: /Vim mode/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeHidden()

  await page.getByRole('tab', { name: 'Shortcuts' }).click()
  await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible()
  await expect(page.getByRole('switch', { name: /Vim mode/ })).toBeHidden()
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
  await expect(page.getByRole('tab', { name: 'Editor' })).toHaveAttribute('aria-selected', 'true')
})

test('tabs work by keyboard and name their panels', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings`)
  await expect(page.getByRole('tablist', { name: 'Settings sections' })).toBeVisible()
  await page.getByRole('tab', { name: 'Editor' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Shortcuts' })).toBeFocused()
  await expect(page.getByRole('tabpanel', { name: 'Shortcuts' })).toBeVisible()
  await expect(page).toHaveURL(/\/settings\?tab=shortcuts$/)
})

test('the settings shortcut reaches the page', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await page.keyboard.press('ControlOrMeta+,')
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('tab', { name: 'Editor' })).toBeVisible()
})
