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

const drag = async (page: Page, from: Locator, to: Locator, offset = 0) => {
  const start = await from.boundingBox()
  const end = await to.boundingBox()
  if (start === null || end === null) throw new Error('nothing to drag')
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 20, start.y + start.height / 2, { steps: 5 })
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2 + offset, { steps: 10 })
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

test('areas stay in one row and scroll sideways', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/goals`)
  await newGoal(page, 'First goal')
  for (const area of ['One', 'Two', 'Three', 'Four']) {
    await page.getByRole('button', { name: 'New area' }).click()
    await page.keyboard.type(area)
    await page.keyboard.press('Enter')
    await page.keyboard.type(`Goal of ${area}`)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('region', { name: area })).toBeVisible()
  }
  const row = page.locator('.tpl-columns-scroll')
  const columns = row.locator('> .card-column')
  await expect(columns).toHaveCount(6)
  const tops = await columns.evaluateAll((all) => all.map((c) => c.getBoundingClientRect().top))
  expect(new Set(tops).size).toBe(1)
  const box = await row.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const main = document.querySelector('.tpl-app-content')?.getBoundingClientRect()
    return {
      scrolls: el.scrollWidth > el.clientWidth,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      paddingLeft: Number.parseFloat(getComputedStyle(el).paddingLeft),
      mainLeft: main?.left,
      mainBottom: main?.bottom,
      pageScrolls:
        (main?.height ?? 0) < (document.querySelector('.tpl-app-content')?.scrollHeight ?? 0),
    }
  })
  expect(box.scrolls).toBe(true)
  expect(box.left).toBe(box.mainLeft)
  expect(box.right).toBe(page.viewportSize()?.width)
  expect(box.bottom).toBe(box.mainBottom)
  expect(box.paddingLeft).toBeGreaterThan(0)
  expect(box.pageScrolls).toBe(false)
  await page.getByRole('button', { name: 'New area' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'New area' })).toBeInViewport()
})

test('a tall area scrolls on its own and leaves the header where it is', async ({
  page,
  workspace,
}) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await page.goto(`${workspace.url}/goals`)
  for (const title of ['One', 'Two', 'Three', 'Four', 'Five']) await newGoal(page, title)
  const column = page.locator('.card-column').first()
  await expect.poll(() => column.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
  const heading = page.getByRole('navigation', { name: 'Breadcrumb' })
  const before = await heading.boundingBox()
  await column.evaluate((el) => el.scrollTo(0, el.scrollHeight))
  expect(await heading.boundingBox()).toEqual(before)
  await expect(page.getByRole('button', { name: 'New goal' }).first()).toBeInViewport()
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

test('goals, projects and tasks keep the order they are dragged into', async ({
  page,
  workspace,
}) => {
  const titles = (scope: Locator, selector: string) => scope.locator(selector).allInnerTexts()
  await page.goto(`${workspace.url}/goals`)
  for (const title of ['One', 'Two', 'Three']) await newGoal(page, title)
  const goals = () => titles(page.locator('.card-column').first(), '.goal-card-title')
  expect(await goals()).toEqual(['One', 'Two', 'Three'])
  await drag(
    page,
    page.getByText('Three', { exact: true }),
    page.getByText('One', { exact: true }),
    -8,
  )
  await expect.poll(goals).toEqual(['Three', 'One', 'Two'])
  await page.reload()
  await expect.poll(goals).toEqual(['Three', 'One', 'Two'])
  await expect
    .poll(() => workspace.read('netherite/goals/GOAL-00003-three.md'))
    .toContain('position:')
  await expect
    .poll(() => workspace.read('netherite/goals/GOAL-00001-one.md'))
    .not.toContain('position:')

  await page.getByText('One', { exact: true }).first().click()
  for (const title of ['P one', 'P two']) await newProject(page, title)
  const projects = () => titles(page.locator('.goal-detail-main'), '.goal-card-title')
  await expect.poll(projects).toEqual(['P one', 'P two'])
  await drag(
    page,
    page.locator('.goal-detail-main').getByText('P two', { exact: true }),
    page.locator('.goal-detail-main').getByText('P one', { exact: true }),
    -8,
  )
  await expect.poll(projects).toEqual(['P two', 'P one'])

  await page.locator('.goal-detail-main').getByText('P one', { exact: true }).click()
  const backlog = page.getByRole('region', { name: 'backlog' })
  for (const title of ['T one', 'T two']) {
    await backlog.getByRole('button', { name: 'New task' }).click()
    await page.keyboard.type(title)
    await page.keyboard.press('Enter')
    await expect(backlog.getByText(title, { exact: true })).toBeVisible()
  }
  const tasks = () => titles(backlog, '.board-card-title')
  await expect.poll(tasks).toEqual(['T one', 'T two'])
  await drag(
    page,
    backlog.getByText('T two', { exact: true }),
    backlog.getByText('T one', { exact: true }),
    -8,
  )
  await expect.poll(tasks).toEqual(['T two', 'T one'])

  const doing = page.getByRole('region', { name: 'doing' })
  await drag(page, backlog.getByText('T one', { exact: true }), doing)
  await expect(doing.getByText('T one', { exact: true })).toBeVisible()
  await expect(tasks()).resolves.toEqual(['T two'])
})
