import type { Page } from '@playwright/test'
import { expect, test } from './fixture'

test.use({ seeded: false })

test('goals start from a small button that creates the first goal', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await expect(page.getByRole('heading', { name: 'No goals yet' })).toBeVisible()
  await page.getByRole('button', { name: 'New goal' }).click()
  await page.getByLabel('Goal title').fill('Learn to sail')
  await page.locator('body').click({ position: { x: 400, y: 800 } })
  await expect(page.getByText('Learn to sail')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No goals yet' })).toBeHidden()
})

test('projects point to goals, where a project is made', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/projects`)
  await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible()
  await page.getByRole('button', { name: 'Go to goals' }).click()
  await expect(page).toHaveURL(/\/goals$/)
})

test('stats replace the dashboard until there is something to measure', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/stats`)
  await expect(page.getByRole('heading', { name: 'Nothing to measure yet' })).toBeVisible()
  await expect(page.getByText('Median cycle time')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Quarter' })).toBeHidden()
  await page.getByRole('button', { name: 'Go to goals' }).click()
  await expect(page).toHaveURL(/\/goals$/)
})

const addKnowledge = async (page: Page, url: string, kind: string, title: string) => {
  await page.goto(`${url}/knowledge`)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByRole('menuitem', { name: `New ${kind}` }).click()
  await expect(page.getByRole('textbox', { name: `New ${kind}`, exact: true })).toBeFocused()
  await page.keyboard.type(title)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
  await expect(page.locator('.cm-content')).toBeFocused()
}

test('a new document writes nothing until it has a title', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/knowledge`)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByRole('menuitem', { name: 'New doc' }).click()
  await expect(page).toHaveURL(/\/knowledge\/new\/doc$/)
  await page.getByRole('textbox', { name: 'New doc', exact: true }).press('Enter')
  await expect(page).toHaveURL(/\/knowledge\/new\/doc$/)
  await page.getByRole('textbox', { name: 'New doc', exact: true }).fill('Abandoned')
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page).toHaveURL(/\/knowledge$/)
  await expect(page.getByText('Abandoned')).toBeHidden()
})

test('stats show the dashboard once there is a doc', async ({ page, workspace }) => {
  await addKnowledge(page, workspace.url, 'doc', 'Setup guide')
  await page.goto(`${workspace.url}/stats`)
  await expect(page.getByText('Median cycle time')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nothing to measure yet' })).toBeHidden()
})

test('stats stay empty with only context, which init always creates', async ({
  page,
  workspace,
}) => {
  await addKnowledge(page, workspace.url, 'context', 'House rules')
  await page.goto(`${workspace.url}/stats`)
  await expect(page.getByRole('heading', { name: 'Nothing to measure yet' })).toBeVisible()
})

test('the graph hides its time scrubber when there is nothing to draw', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/graph`)
  await expect(page.getByRole('heading', { name: 'Nothing to draw' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Today' })).toBeHidden()
})
