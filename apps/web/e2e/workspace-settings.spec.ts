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
