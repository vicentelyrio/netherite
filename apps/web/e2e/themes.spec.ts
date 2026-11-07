import { expect, test } from './fixture'

const canvas = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor)

const choose = async (page: import('@playwright/test').Page, name: string) => {
  await page.getByRole('radiogroup', { name: 'Theme' }).getByText(name, { exact: true }).click()
}

test('the switcher changes the theme at once, and a reload keeps it', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings`)
  const dark = await canvas(page)
  await choose(page, 'Solarized Light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'solarized-light')
  await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'light')
  await expect.poll(() => canvas(page)).toBe('rgb(253, 246, 227)')
  expect(dark).not.toBe('rgb(253, 246, 227)')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'solarized-light')
  await expect(page.getByRole('radio', { name: 'Solarized Light' })).toBeChecked()

  await choose(page, 'Dracula')
  await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'dark')
  await expect.poll(() => canvas(page)).toBe('rgb(40, 42, 54)')
})

test('the theme is in place before the app starts, so nothing flashes', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings`)
  await choose(page, 'Netherite Light')
  await page.route('**/assets/*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await page.goto(`${workspace.url}/settings`, { waitUntil: 'commit' })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme), { timeout: 1200 })
    .toBe('netherite-light')
  expect(await page.locator('#root').innerHTML()).toBe('')
})

test('the theme script is allowed by the page security policy', async ({ page, workspace }) => {
  const blocked: Array<string> = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/.test(message.text()))
      blocked.push(message.text())
  })
  await page.goto(`${workspace.url}/settings`)
  await expect(page.getByRole('radiogroup', { name: 'Theme' })).toBeVisible()
  expect(blocked).toEqual([])
})

test('the graph and the editor follow the theme', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings`)
  await choose(page, 'Netherite Light')

  await page.goto(`${workspace.url}/projects/PRJ-00001?task=TASK-00001`)
  const drawer = page.getByRole('dialog')
  await drawer.getByText('code', { exact: true }).click()
  await expect(drawer.locator('.cm-content')).toBeVisible()
  const editor = await drawer
    .locator('.cm-editor')
    .evaluate((node) => getComputedStyle(node).backgroundColor)
  expect(editor).toBe('rgb(255, 255, 255)')

  await page.goto(`${workspace.url}/graph`)
  const fill = await page
    .locator('svg circle[fill], svg rect[fill], svg path[fill]')
    .first()
    .evaluate((node) => getComputedStyle(node).fill)
  expect(fill).not.toBe('rgb(143, 145, 242)')
  expect(fill).not.toBe('none')
})

test('a theme that does not exist falls back to the default', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings`)
  await page.evaluate(() =>
    localStorage.setItem('netherite.settings', JSON.stringify({ theme: 'nope' })),
  )
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'netherite')
  await expect(page.getByRole('radio', { name: 'Netherite', exact: true })).toBeChecked()
})
