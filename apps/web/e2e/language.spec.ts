import { expect, test } from './fixture'

const nav = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('navigation', { name }).first()

test('the switcher changes the language at once, and a reload keeps it', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings`)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.getByRole('radiogroup', { name: 'Language' }).getByText('Español').click()

  await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(nav(page, 'Principal')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible()

  await page.getByRole('radiogroup', { name: 'Idioma' }).getByText('Português (Brasil)').click()
  await expect(page.getByRole('heading', { name: 'Configurações', level: 1 })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
})

test('components from the UI package follow the language', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings`)
  await page.getByRole('radiogroup', { name: 'Language' }).getByText('Español').click()
  await page.goto(`${workspace.url}/knowledge`)
  await expect(page.locator('.nt-status-pill', { hasText: 'Aceptada' }).first()).toBeVisible()
  await expect(page.locator('.nt-status-pill', { hasText: 'Accepted' })).toHaveCount(0)
  await expect(page.locator('.nt-type-badge', { hasText: 'Task' })).toHaveCount(0)
})

test.describe('with a Portuguese browser', () => {
  test.use({ locale: 'pt-PT' })
  test('the app starts in the closest language', async ({ page, workspace }) => {
    await page.goto(`${workspace.url}/settings`)
    await expect(page.getByRole('heading', { name: 'Configurações', level: 1 })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Idioma' })).toBeVisible()
  })
})

test.describe('with a browser in another language', () => {
  test.use({ locale: 'ja-JP' })
  test('the app starts in English', async ({ page, workspace }) => {
    await page.goto(`${workspace.url}/settings`)
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  })
})
