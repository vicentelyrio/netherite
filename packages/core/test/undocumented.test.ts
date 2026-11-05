import { NodeServices } from '@effect/platform-node'
import { openGit } from '@netherite/git'
import { type Commit, createGitRepo, emptyGitConfig } from '@netherite/testing'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { linkedCommits, undocumentedChurn } from '../src/index'

beforeAll(() => {
  process.env.GIT_CONFIG_GLOBAL = emptyGitConfig
  process.env.GIT_CONFIG_SYSTEM = emptyGitConfig
})

const code = (n: number, day: string, extra: Record<string, string> = {}): Commit => ({
  message: `change ${n}`,
  date: `${day}T10:00:00Z`,
  write: { 'src/app.ts': `export const v = ${n}\n`, ...extra },
})

describe('undocumentedChurn', () => {
  test('counts the commits on a file that changed no knowledge, inside the period', async () => {
    const repo = await createGitRepo({
      fixture: 'basic',
      history: [
        code(1, '2026-03-01'),
        code(2, '2026-03-05'),
        code(3, '2026-03-06'),
        code(4, '2026-03-07', { 'netherite/docs/DOC-00001-app-overview.md': '# updated\n' }),
        code(5, '2026-04-20'),
      ],
    })
    try {
      const git = await Effect.runPromise(
        openGit(repo.root).pipe(Effect.provide(NodeServices.layer)),
      )
      const found = await Effect.runPromise(
        undocumentedChurn(git, repo.root, {
          contentRoot: 'netherite',
          from: '2026-03-01',
          to: '2026-03-31',
        }).pipe(Effect.provide(NodeServices.layer)),
      )
      expect(found).toEqual([{ path: 'src/app.ts', commits: 3, last: '2026-03-06' }])
    } finally {
      await repo.cleanup()
    }
  })
})

describe('linkedCommits', () => {
  test('a commit is linked when it changes the content folder or names an item', async () => {
    const repo = await createGitRepo({
      fixture: 'basic',
      history: [
        { ...code(1, '2026-03-01'), message: 'chore: tidy' },
        { ...code(2, '2026-03-02'), message: 'fix: cache, closes TASK-00012' },
        code(3, '2026-03-03', { 'netherite/docs/DOC-00001-app-overview.md': '# changed\n' }),
        { ...code(4, '2026-04-20'), message: 'fix: outside, TASK-00001' },
      ],
    })
    try {
      const git = await Effect.runPromise(
        openGit(repo.root).pipe(Effect.provide(NodeServices.layer)),
      )
      const found = await Effect.runPromise(
        linkedCommits(git, repo.root, {
          contentRoot: 'netherite',
          from: '2026-03-01',
          to: '2026-03-31',
        }).pipe(Effect.provide(NodeServices.layer)),
      )
      expect(found).toEqual({ total: 3, linked: 2 })
    } finally {
      await repo.cleanup()
    }
  })
})
