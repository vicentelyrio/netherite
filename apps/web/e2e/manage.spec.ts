import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixture'

test.use({ seeded: false })

const newGoal = async (page: Page, title: string) => {
  await page
    .getByRole('button', { name: /New goal/ })
    .first()
    .click()
  await page.keyboard.type(title)
  await page.keyboard.press('Enter')
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible()
}

const newProject = async (page: Page, title: string) => {
  await page.getByRole('button', { name: 'New project' }).click()
  await page.keyboard.type(title)
  await page.keyboard.press('Enter')
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible()
}

const drag = async (page: Page, from: Locator, to: Locator) => {
  const start = await from.boundingBox()
  const end = await to.boundingBox()
  if (start === null || end === null) throw new Error('nothing to drag')
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 20, start.y + start.height / 2, { steps: 5 })
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 10 })
  await page.mouse.up()
}

const confirmDelete = async (page: Page) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click()
}

test('a goal drags between areas, and clicking it still opens it', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await newGoal(page, 'Sleep well')
  await page.getByRole('button', { name: 'New area' }).click()
  await page.keyboard.type('Work')
  await page.keyboard.press('Enter')
  await page.keyboard.type('Ship it')
  await page.keyboard.press('Enter')
  const work = page.getByRole('region', { name: 'Work' })
  await expect(work.getByText('Ship it')).toBeVisible()

  await drag(page, page.getByText('Sleep well'), work)
  await expect(work.getByText('Sleep well')).toBeVisible()
  await expect(page).toHaveURL(/\/goals$/)
  await expect
    .poll(() => workspace.read('netherite/goals/GOAL-00001-sleep-well.md'))
    .toContain('area: Work')

  await drag(page, work.getByText('Sleep well'), page.getByRole('heading', { name: 'Work' }))
  await expect(page).toHaveURL(/\/goals$/)
  await work.getByText('Sleep well').click()
  await expect(page).toHaveURL(/\/goals\/GOAL-00001$/)
})

test('a goal is deleted only when empty', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await newGoal(page, 'Keep')
  await page.getByText('Keep', { exact: true }).first().click()
  await newProject(page, 'Inside')

  const blocked = page.getByRole('button', { name: 'Move or delete its projects first' })
  await expect(blocked).toHaveAttribute('aria-disabled', 'true')
  await blocked.hover()
  await expect(page.getByRole('tooltip')).toHaveText('Move or delete its projects first')
  await blocked.click({ force: true })
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByText('Inside', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Delete project' }).click()
  await expect(page.getByRole('dialog').getByText('Delete Inside?')).toBeVisible()
  await confirmDelete(page)
  await expect(page).toHaveURL(/\/goals\/GOAL-00001$/)

  await page.getByRole('button', { name: 'Delete goal' }).click()
  await confirmDelete(page)
  await expect(page).toHaveURL(/\/goals$/)
  await expect(page.getByRole('heading', { name: 'No goals yet' })).toBeVisible()
})

test('a project moves to another goal, and a task to another project, then is deleted', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/goals`)
  await newGoal(page, 'First')
  await newGoal(page, 'Second')
  await page.getByText('Second', { exact: true }).first().click()
  await newProject(page, 'Target')
  await page.goto(`${workspace.url}/goals`)
  await page.getByText('First', { exact: true }).first().click()
  await newProject(page, 'Source')
  await page.getByText('Source', { exact: true }).first().click()

  const carried = page
    .getByRole('region', { name: 'backlog' })
    .getByText('Carry me', { exact: true })
  await page.getByRole('button', { name: 'New task' }).first().click()
  await page.keyboard.type('Carry me')
  await page.keyboard.press('Enter')
  await expect(carried).toBeVisible()

  const blocked = page.getByRole('button', {
    name: 'Move or delete its tasks and knowledge first',
  })
  await expect(blocked).toHaveAttribute('aria-disabled', 'true')

  await page.getByRole('button', { name: 'Move to another goal' }).click()
  const goals = page.getByRole('dialog')
  await expect(goals.getByRole('button', { name: /First.*Current/ })).toBeDisabled()
  await goals.getByRole('button', { name: /Second/ }).click()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Second')
  await expect
    .poll(() => workspace.read('netherite/projects/PRJ-00002-source.md'))
    .toContain('GOAL-00002')

  await carried.click()
  await page.getByRole('button', { name: 'Move to another project' }).click()
  const projects = page.getByRole('dialog', { name: 'Move Carry me to' })
  await projects.getByRole('textbox', { name: 'Filter' }).fill('targ')
  await expect(projects.getByRole('button', { name: /Source/ })).toBeHidden()
  await projects.getByRole('button', { name: /Target/ }).click()
  await expect(page).toHaveURL(/\/projects\/PRJ-00001\?task=TASK-00001/)
  await expect(carried).toBeVisible()

  await page.getByRole('button', { name: 'Delete task' }).click()
  await confirmDelete(page)
  await expect(page).toHaveURL(/\/projects\/PRJ-00001$/)
  await expect(carried).toBeHidden()
})
