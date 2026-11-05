import { expect, test } from './fixture'

const task2 = 'netherite/tasks/TASK-00002-cli.md'

test('scrubbing the graph to a past date shows fewer nodes, and Today restores them', async ({
  page,
  workspace,
}) => {
  workspace.git(['rm', '--cached', '-q', task2])
  workspace.git(['commit', '--amend', '-q', '--no-edit'], '2026-01-05T10:00:00Z')
  workspace.git(['add', task2])
  workspace.git(['commit', '-q', '-m', 'second task'])

  await page.goto(`${workspace.url}/graph`)
  const nodes = page.locator('.gv-node')
  await expect(nodes).toHaveCount(9)

  const range = page.getByRole('slider', { name: 'Date' })
  await range.fill('0')
  await expect(page.locator('time')).toHaveText('5 Jan 2026')
  await expect(nodes).toHaveCount(8)

  await page.getByRole('button', { name: 'Today' }).click()
  await expect(nodes).toHaveCount(9)
  await expect(page.getByRole('button', { name: 'Today' })).toBeDisabled()
})
