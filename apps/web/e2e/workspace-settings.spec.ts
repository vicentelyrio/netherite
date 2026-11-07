import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from './fixture'

const configPath = '.netherite/config.yml'
const row = (page: import('@playwright/test').Page, label: string) =>
  page.getByRole('tabpanel', { name: 'Workspace' }).locator('.sr', { hasText: label })

test('a change on the page is an uncommitted edit that keeps the comments', async ({
  page,
  workspace,
}) => {
  const file = join(workspace.dir, configPath)
  appendFileSync(file, '# keep this comment\n')
  workspace.git(['add', '-A'])
  workspace.git(['commit', '-q', '-m', 'comment'])

  await page.goto(`${workspace.url}/settings?tab=workspace`)
  await expect(page.getByText(/shared with everyone through git/)).toBeVisible()

  await row(page, 'Orphan').locator('.mantine-Switch-track').click()
  await expect(page.getByRole('switch', { name: 'Orphan' })).not.toBeChecked()

  const stale = page.getByRole('spinbutton', { name: 'Stale after' })
  await stale.fill('25')
  await stale.press('Enter')

  await expect.poll(() => readFileSync(file, 'utf8')).toContain('stale: 25')
  const text = readFileSync(file, 'utf8')
  expect(text).toContain('# keep this comment')
  expect(text).toContain('orphan: false')
  expect(workspace.diff(configPath)).toContain('+')
  expect(workspace.git(['log', '-1', '--format=%s']).trim()).toBe('comment')

  await page.reload()
  await expect(page.getByRole('switch', { name: 'Orphan' })).not.toBeChecked()
  await expect(stale).toHaveValue('25')
})

test('quick changes in a row all land', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  for (const label of ['Orphan', 'Overdue', 'Similar tags', 'New TODO']) {
    await row(page, label).locator('.mantine-Switch-track').click()
  }
  const file = join(workspace.dir, configPath)
  await expect.poll(() => (readFileSync(file, 'utf8').match(/: false/g) ?? []).length).toBe(4)
})

test('number fields refuse values outside their limits and put the old value back', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  const file = join(workspace.dir, configPath)
  const before = readFileSync(file, 'utf8')
  const stale = page.getByRole('spinbutton', { name: 'Stale after' })
  const value = await stale.inputValue()
  for (const bad of ['0', '-3', '']) {
    await stale.fill(bad)
    await stale.blur()
    await expect(stale).toHaveValue(value)
  }
  const drifting = page.getByRole('spinbutton', { name: 'Drifting after' })
  await drifting.fill(String(Number(value) + 1))
  await drifting.press('Enter')
  await expect(drifting).not.toHaveValue(String(Number(value) + 1))
  expect(readFileSync(file, 'utf8')).toBe(before)
})

test('context targets and budget save', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  await row(page, 'MCP').locator('.mantine-Switch-track').click()
  const budget = page.getByRole('spinbutton', { name: 'Token budget' })
  await budget.fill('1234')
  await budget.blur()
  const file = join(workspace.dir, configPath)
  await expect.poll(() => readFileSync(file, 'utf8')).toContain('budget: 1234')
  expect(readFileSync(file, 'utf8')).toMatch(/targets: .*mcp|- mcp/)
})

test('an edit made elsewhere is a conflict, and the newer values can be loaded', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  const stale = page.getByRole('spinbutton', { name: 'Stale after' })
  await expect(stale).toBeVisible()
  const file = join(workspace.dir, configPath)
  const edited = `${readFileSync(file, 'utf8')}freshness:\n  stale: 77\n`
  writeFileSync(file, edited)

  await stale.fill('30')
  await stale.press('Enter')
  const notice = page.getByRole('alert').or(page.getByRole('status')).filter({ hasText: 'Reload' })
  await notice.getByRole('button', { name: 'Reload' }).click()
  await expect(stale).toHaveValue('77')
  expect(readFileSync(file, 'utf8')).toBe(edited)
})

test('a broken config shows the problem and offers nothing that could overwrite it', async ({
  page,
  workspace,
}) => {
  const file = join(workspace.dir, configPath)
  const broken = 'version: 1\nfreshness: { stale: 0 }\n'
  writeFileSync(file, broken)
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  await expect(page.getByText('The workspace config has a problem')).toBeVisible()
  await expect(page.getByRole('switch')).toHaveCount(0)
  await expect(page.getByRole('spinbutton')).toHaveCount(0)
  expect(readFileSync(file, 'utf8')).toBe(broken)
})

test('renaming a state warns with its task count, then changes the file and the board', async ({
  page,
  workspace,
}) => {
  const board = await page.context().newPage()
  await board.goto(`${workspace.url}/projects/PRJ-00001`)
  await expect(board.getByText('backlog', { exact: true }).first()).toBeVisible()

  await page.goto(`${workspace.url}/settings?tab=workspace`)
  await page.getByRole('textbox', { name: 'Name of state 1' }).fill('queue')
  await page.getByRole('button', { name: 'Save states' }).click()

  const dialog = page.getByRole('dialog', { name: 'Tasks may be using these states' })
  await expect(dialog).toContainText('backlog → queue')
  await expect(dialog).toContainText(/\d+ tasks?/)
  await expect(dialog).toContainText('netherite lint')
  expect(readFileSync(join(workspace.dir, configPath), 'utf8')).not.toContain('queue')

  await dialog.getByRole('button', { name: 'Save anyway' }).click()
  await expect
    .poll(() => readFileSync(join(workspace.dir, configPath), 'utf8'))
    .toContain('name: queue')
  await expect(board.getByText('queue', { exact: true }).first()).toBeVisible()
  await expect(board.getByText('backlog', { exact: true })).toHaveCount(0)
  await board.close()
})

test('keeping on editing from the warning writes nothing', async ({ page, workspace }) => {
  const file = join(workspace.dir, configPath)
  const before = readFileSync(file, 'utf8')
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  await page.getByRole('button', { name: 'Remove blocked' }).click()
  await page.getByRole('button', { name: 'Save states' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('blocked (removed)')
  await dialog.getByRole('button', { name: 'Keep editing' }).click()
  expect(readFileSync(file, 'utf8')).toBe(before)
  await page.getByRole('button', { name: 'Discard' }).click()
  await expect(page.getByRole('button', { name: 'Remove blocked' })).toBeVisible()
})

test('adding and reordering save without a warning, and boards follow the order', async ({
  page,
  workspace,
}) => {
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  await page.getByRole('button', { name: 'Add a state' }).click()
  await page.getByRole('textbox', { name: 'Name of state 5' }).fill('review')
  await page.getByRole('combobox', { name: 'Category of review' }).selectOption('active')
  await page.getByRole('button', { name: 'Move review up' }).click()
  await page.getByRole('button', { name: 'Save states' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()

  const file = join(workspace.dir, configPath)
  await expect.poll(() => readFileSync(file, 'utf8')).toContain('name: review')
  const text = readFileSync(file, 'utf8')
  expect(text.indexOf('name: review')).toBeLessThan(text.indexOf('name: done'))
  expect(text).toContain('category: active')
  await expect(page.getByRole('button', { name: 'Save states' })).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Name of state 4' })).toHaveValue('review')
})

test('a list that cannot be saved says why and keeps Save off', async ({ page, workspace }) => {
  await page.goto(`${workspace.url}/settings?tab=workspace`)
  const save = page.getByRole('button', { name: 'Save states' })
  const first = page.getByRole('textbox', { name: 'Name of state 1' })
  await first.fill('doing')
  await expect(page.getByRole('alert').filter({ hasText: 'same name' })).toBeVisible()
  await expect(save).toBeDisabled()
  await first.fill('   ')
  await expect(page.getByRole('alert').filter({ hasText: 'needs a name' })).toBeVisible()
  await expect(save).toBeDisabled()
})
