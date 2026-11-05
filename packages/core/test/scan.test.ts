import { describe, expect, test } from 'vitest'
import { scanItems } from '../src/index'
import { itemFile, runWithMemory, scanFixture } from './helpers'

describe('scanItems', () => {
  test('reads every item in the fixture with its identity fields', async () => {
    const items = await scanFixture()
    expect(items).toHaveLength(17)
    const task = items.find((i) => i.path === 'netherite/tasks/TASK-00002-add-the-cli.md')
    expect(task).toMatchObject({
      fileName: 'TASK-00002-add-the-cli',
      id: 'TASK-00002',
      type: 'task',
      title: 'Add the CLI',
      aliases: ['TASK-00002'],
    })
  })

  test('paths are relative to the workspace root and sorted', async () => {
    const paths = (await scanFixture()).map((i) => i.path)
    expect(paths.every((p) => p.startsWith('netherite/') && !p.includes('\\'))).toBe(true)
    expect(paths).toEqual([...paths].sort())
  })

  test('an empty or missing content root gives no items', async () => {
    const ws = { root: '/repo', contentRoot: '/repo/netherite' }
    expect(await runWithMemory(scanItems(ws), {})).toEqual([])
  })

  test('skips non-Markdown files, hidden folders and assets', async () => {
    const files = {
      '/repo/netherite/tasks/TASK-00001-a.md': itemFile({ id: 'TASK-00001' }),
      '/repo/netherite/tasks/notes.txt': 'not markdown',
      '/repo/netherite/.obsidian/workspace.md': 'hidden',
      '/repo/netherite/assets/readme.md': 'asset',
      '/repo/netherite/docs/Upper.MD': '# upper',
    }
    const items = await runWithMemory(
      scanItems({ root: '/repo', contentRoot: '/repo/netherite' }),
      files,
    )
    expect(items.map((i) => i.path)).toEqual([
      'netherite/docs/Upper.MD',
      'netherite/tasks/TASK-00001-a.md',
    ])
  })

  test('keeps files with broken frontmatter and no id', async () => {
    const files = {
      '/repo/netherite/a.md': '---\nid: [oops\n---\n',
      '/repo/netherite/b.md': '# plain\n',
      '/repo/netherite/c.md': '---\nid: 5\ntitle: [x]\naliases: nope\n---\n',
    }
    const items = await runWithMemory(
      scanItems({ root: '/repo', contentRoot: '/repo/netherite' }),
      files,
    )
    expect(items.map((i) => [i.id, i.title, i.aliases])).toEqual([
      [undefined, undefined, []],
      [undefined, undefined, []],
      [undefined, undefined, []],
    ])
    expect(items[0]?.parsed.frontmatter?.errors.length).toBeGreaterThan(0)
  })
})
