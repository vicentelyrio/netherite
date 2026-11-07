import { expect, test } from './fixture'

const change = (action: string) => `Change the shortcut for ${action}`

test('a shortcut can be rebound, works straight away and survives a reload', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=shortcuts`)
  await page.getByRole('button', { name: change('Go to Goals') }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Press the keys' })).toBeVisible()
  await page.keyboard.press('ControlOrMeta+Shift+y')

  await page.keyboard.press('ControlOrMeta+Shift+y')
  await expect(page).toHaveURL(/\/goals$/)

  await page.goto(`${workspace.url}/settings?tab=shortcuts`)
  await expect(
    page.getByRole('button', { name: 'Reset the shortcut for Go to Goals' }),
  ).toBeVisible()
  await page.keyboard.press('ControlOrMeta+Shift+y')
  await expect(page).toHaveURL(/\/goals$/)
})

test('keys already in use need a decision, and taking them clears the other action', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=shortcuts`)
  await page.getByRole('button', { name: change('Go to Tags') }).click()
  await page.keyboard.press('ControlOrMeta+k')

  const clash = page.getByRole('alert')
  await expect(clash).toContainText('already used by Search')
  await expect(page.getByRole('dialog', { name: 'Search' })).toBeHidden()

  await clash.getByRole('button', { name: 'Use it here instead' }).click()
  await expect(page.getByRole('alert')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Clear the shortcut for Search' })).toBeHidden()

  await page.keyboard.press('ControlOrMeta+k')
  await expect(page).toHaveURL(/\/tags$/)
})

test('Escape cancels recording without changing anything or leaving the keys to the app', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=shortcuts`)
  await page.getByRole('button', { name: change('Go to Goals') }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('status').filter({ hasText: 'Press the keys' })).toBeHidden()
  await expect(
    page.getByRole('button', { name: 'Reset the shortcut for Go to Goals' }),
  ).toBeHidden()
  await expect(page).toHaveURL(/\/settings\?tab=shortcuts$/)
})

test('a screen shows the keys chosen for it, and hides the ones cleared', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=shortcuts`)
  await page.getByRole('button', { name: change('Archive') }).click()
  await page.keyboard.press('x')
  await page.getByRole('button', { name: 'Clear the shortcut for Snooze' }).click()

  await page.goto(`${workspace.url}/inbox`)
  const keys = page.getByRole('list', { name: 'Keys' })
  await expect(keys).toContainText('X')
  await expect(keys).not.toContainText('snooze')
})

test('the rail reaches the settings page', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page).toHaveURL(/\/settings$/)
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})
