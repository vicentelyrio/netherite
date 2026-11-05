import { describe, expect, test } from 'vitest'
import { lintText, readSource } from '../src/index'
import { world } from './ops-helpers'

const path = 'netherite/tasks/TASK-00001-core.md'

describe('lintText', () => {
  test('saved text is clean, as lint says', async () => {
    const w = await world()
    const { text } = await w.run(readSource(w.repo, 'TASK-00001'))
    expect(lintText(w.repo, path, text).filter((d) => d.severity !== 'info')).toEqual([])
  })

  test('a schema problem in the buffer is reported at its line, though the file on disk is fine', async () => {
    const w = await world()
    const { text } = await w.run(readSource(w.repo, 'TASK-00001'))
    const edited = text.replace('state: backlog', 'state: nonsense')
    const found = lintText(w.repo, path, edited)
    expect(found).toContainEqual(
      expect.objectContaining({
        rule: 'schema',
        severity: 'error',
        path,
        line: expect.any(Number),
      }),
    )
    // Nothing was written, and the repo's own index still has the saved text.
    expect(w.read(path)).toBe(text)
    expect(w.repo.index.get(path)?.parsed.source).toBe(text)
  })

  test('a link to something that does not exist is broken, judged against the rest of the workspace', async () => {
    const w = await world()
    const { text } = await w.run(readSource(w.repo, 'TASK-00001'))
    const broken = lintText(w.repo, path, `${text}\nSee [[TASK-09999]] and [[TASK-00002]].\n`)
    const links = broken.filter((d) => d.rule === 'broken-link')
    expect(links).toHaveLength(1)
    expect(links[0]?.message).toContain('TASK-09999')
  })

  test('only problems in that file are reported', async () => {
    const w = await world()
    const { text } = await w.run(readSource(w.repo, 'TASK-00001'))
    const found = lintText(w.repo, path, text.replace('state: backlog', 'state: nonsense'))
    expect(new Set(found.map((d) => d.path))).toEqual(new Set([path]))
  })

  test('works for a file that is not in the index yet, and for broken frontmatter', async () => {
    const w = await world()
    const fresh = lintText(
      w.repo,
      'netherite/tasks/TASK-00077-new.md',
      '---\nid: TASK-00077\ntype: task\n---\n',
    )
    expect(fresh.some((d) => d.severity === 'error')).toBe(true)
    const broken = lintText(w.repo, path, '---\nid: [unclosed\n---\n')
    expect(broken.some((d) => d.rule === 'frontmatter')).toBe(true)
  })

  test('a duplicate ID made in the buffer is caught', async () => {
    const w = await world()
    const { text } = await w.run(readSource(w.repo, 'TASK-00001'))
    const dup = lintText(w.repo, path, text.replace('id: TASK-00001', 'id: TASK-00002'))
    expect(dup.map((d) => d.rule)).toContain('duplicate-id')
  })
})
