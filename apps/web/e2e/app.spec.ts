import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { expect, test } from './fixture'

const task1 = 'netherite/tasks/TASK-00001-core.md'

test('dragging a card to another column changes its state in the file', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/projects/PRJ-00001`)
  const card = page.getByRole('link', { name: 'Core' })
  const doing = page.getByRole('region', { name: 'doing' })
  await expect(card).toBeVisible()

  const from = await card.boundingBox()
  const to = await doing.boundingBox()
  if (!from || !to) throw new Error('nothing to drag')
  await page.mouse.move(from.x + 20, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + 40, from.y + from.height / 2, { steps: 4 })
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 12 })
  await page.mouse.up()

  await expect(doing.getByRole('link', { name: 'Core' })).toBeVisible()
  await expect.poll(() => workspace.diff(task1)).toContain('+position: ')
  const diff = workspace.diff(task1)
  expect(diff).toContain('-state: backlog')
  expect(diff).toContain('+state: doing')
  expect(diff.split('\n').filter((l) => /^[+-][^+-]/.test(l))).toHaveLength(3)
})

test('ticking a checklist item in the task drawer writes the checkbox to the file', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/projects/PRJ-00001?task=TASK-00001`)
  const drawer = page.getByRole('dialog')
  await drawer.getByRole('checkbox', { name: 'first' }).click()

  await expect(drawer.getByRole('checkbox', { name: 'first' })).toBeChecked()
  await expect.poll(() => workspace.diff(task1)).toContain('+- [x] first')
  expect(workspace.diff(task1)).toContain('-- [ ] first')
})

test('the review button shows the date and writes today to reviewed_at', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/items/DOC-00001`)
  await page.getByRole('button', { name: 'Reviewed at 1 Jan 2026' }).click()

  const today = new Date().toISOString().slice(0, 10)
  await expect
    .poll(() => workspace.diff('netherite/docs/DOC-00001-overview.md'))
    .toContain(`+reviewed_at: ${today}`)
  expect(workspace.diff('netherite/docs/DOC-00001-overview.md')).toContain(
    '-reviewed_at: 2026-01-01',
  )
  await expect(page.getByRole('button', { name: /^Reviewed at / })).toBeDisabled()
})

test('uncommitted edits to covered files are named, and marking reviewed clears them', async ({
  page,
  workspace,
}) => {
  const covered = 'src/core.ts'
  mkdirSync(join(workspace.dir, dirname(covered)), { recursive: true })
  writeFileSync(join(workspace.dir, covered), 'export const edited = true\n')
  await page.goto(`${workspace.url}/projects/PRJ-00001?task=TASK-00001`)
  await page.getByRole('dialog').getByRole('checkbox', { name: 'first' }).click()
  await expect.poll(() => workspace.diff(task1)).toContain('+- [x] first')
  await page.goto(`${workspace.url}/items/DOC-00001`)

  const banner = page.getByText('Uncommitted changes to the files this doc covers')
  await expect(banner).toBeVisible()
  await page.getByRole('button', { name: 'Review changes' }).click()
  await expect(page.getByRole('list', { name: 'Commits since review' })).toContainText(covered)

  await page.getByRole('button', { name: 'Mark reviewed' }).click()
  await expect(page.getByText('Overview marked reviewed')).toBeVisible()
  await expect(banner).toBeHidden()
})

test('the include switch on a context item writes include_in_context', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/items/CTX-00001`)
  const context = page.getByRole('region', { name: 'Context' })
  await expect(context).toBeVisible()
  await context.getByRole('switch', { name: 'Include in context' }).click({ force: true })

  await expect
    .poll(() => workspace.diff('netherite/context/CTX-00001-rules.md'))
    .toContain('+include_in_context: true')
  expect(workspace.diff('netherite/context/CTX-00001-rules.md')).toContain(
    '-include_in_context: false',
  )
})

test('search finds an ADR by its title, and Enter opens it', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await page.keyboard.press('ControlOrMeta+k')
  const palette = page.getByRole('dialog', { name: 'Search' })
  await palette.getByRole('textbox').fill('Promises')
  await expect(palette.getByText('ADR-00002')).toBeVisible()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/items\/ADR-00002$/)
  await expect(page.getByRole('article', { name: 'Promises' })).toBeVisible()
  expect(workspace.diff()).toBe('')
})

test('a new goal in an area is created as a file with that area', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await page
    .getByRole('button', { name: /New goal/ })
    .first()
    .click()
  await page.getByLabel('Goal title').fill('Learn to sail')
  await page.getByLabel('Goal title').press('Enter')

  await expect(page.getByText('Learn to sail')).toBeVisible()
  await expect
    .poll(() => workspace.read('netherite/goals/GOAL-00002-learn-to-sail.md'))
    .toContain('title: Learn to sail')
})
