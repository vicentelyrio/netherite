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

test('a new runbook starts from its template, and linking it clears the orphan tag', async ({
  page,
  workspace,
}) => {
  const file = 'netherite/runbooks/RUN-00001-restore-backups.md'
  await addKnowledge(page, workspace.url, 'context', 'House rules')
  await page.goto(`${workspace.url}/knowledge/new/runbook`)
  await page.getByRole('textbox', { name: 'New runbook', exact: true }).fill('Restore backups')
  await page.keyboard.press('Enter')
  await expect(page.locator('.cm-content')).toBeFocused()
  expect(workspace.read(file)).toContain('## Before you start')
  await page.keyboard.type('When the database is lost.')
  await expect.poll(() => workspace.read(file)).toContain('When the database is lost.')
  expect(workspace.read(file)).not.toContain('When to use this runbook')

  await page.goto(`${workspace.url}/items/RUN-00001`)
  const panel = page.getByRole('complementary', { name: 'Related' })
  await expect(panel.getByText('orphan')).toBeVisible()
  await expect(panel.getByText('Not linked to anything yet')).toBeVisible()
  await panel.getByRole('button', { name: 'Link to…' }).click()
  const picker = page.getByRole('dialog')
  await picker.getByRole('button', { name: /House rules/ }).click()
  await expect(picker).toBeHidden()

  await expect(panel.getByRole('link', { name: /House rules/ })).toBeVisible()
  await expect(panel.getByText('orphan')).toBeHidden()
  expect(workspace.read(file)).toContain('explains:')
})

test('a runbook can be unlinked and given covers from its panel', async ({ page, workspace }) => {
  const file = 'netherite/runbooks/RUN-00001-restore-backups.md'
  await addKnowledge(page, workspace.url, 'context', 'House rules')
  await addKnowledge(page, workspace.url, 'runbook', 'Restore backups')
  await page.goto(`${workspace.url}/items/RUN-00001`)
  const panel = page.getByRole('complementary', { name: 'Related' })
  const orphan = panel.getByText('orphan')

  await panel.getByRole('button', { name: 'Link to…' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /House rules/ })
    .click()
  await panel.getByRole('button', { name: 'Unlink CTX-00001' }).click()
  await expect(panel.getByText('Not linked to anything yet')).toBeVisible()
  await expect(orphan).toBeVisible()
  expect(workspace.read(file)).not.toContain('explains')

  await panel.getByRole('button', { name: 'Add path' }).click()
  await page.keyboard.type('./scripts/**')
  await page.keyboard.press('Enter')
  await expect(panel.getByText('scripts/**', { exact: true })).toBeVisible()
  await expect(orphan).toBeHidden()
  expect(workspace.read(file)).toContain('scripts/**')
  expect(workspace.read(file)).not.toContain('./scripts')

  await panel.getByRole('button', { name: 'Stop covering scripts/**' }).click()
  await expect(orphan).toBeVisible()
  expect(workspace.read(file)).not.toContain('covers')
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
