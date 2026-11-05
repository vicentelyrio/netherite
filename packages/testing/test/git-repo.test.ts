import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { basicHistory, createGitRepo, fixturePath, type GitRepo, withTempDir } from '../src/index'

let repo: GitRepo | undefined

afterEach(async () => {
  await repo?.cleanup()
  repo = undefined
})

describe('createGitRepo', () => {
  test('commits the fixture first, then the scripted history', async () => {
    repo = await createGitRepo({ fixture: 'basic', history: basicHistory })

    const log = repo.git('log', '--format=%s', '--reverse').split('\n')
    expect(log).toEqual([
      'chore: initial commit',
      'feat: add greeting',
      'feat: add farewell',
      'refactor: split utilities',
      'fix: trim output',
    ])
    expect(repo.git('status', '--porcelain')).toBe('')
  })

  test('uses the scripted authors and dates', async () => {
    repo = await createGitRepo({ fixture: 'basic', history: basicHistory })

    const line = repo.git('log', '-1', '--skip=2', '--format=%an|%ae|%aI|%cI')
    expect(line).toBe('Grace Hopper|grace@example.com|2026-01-11T10:00:00Z|2026-01-11T10:00:00Z')
  })

  test('produces the same commit hashes on every run', async () => {
    const first = await createGitRepo({ fixture: 'basic', history: basicHistory })
    const second = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      expect(first.git('rev-parse', 'HEAD')).toBe(second.git('rev-parse', 'HEAD'))
    } finally {
      await first.cleanup()
      await second.cleanup()
    }
  })

  test('leaves uncommitted changes in the working tree', async () => {
    repo = await createGitRepo({
      fixture: 'basic',
      uncommitted: { 'src/app.ts': 'export const app = () => "dirty"\n' },
    })

    expect(repo.git('status', '--porcelain')).toBe('M src/app.ts')
  })

  test('creates an empty repository without a fixture', async () => {
    repo = await createGitRepo()

    expect(repo.git('rev-list', '--count', 'HEAD')).toBe('1')
  })

  test('ignores the global git configuration', async () => {
    repo = await createGitRepo()

    expect(repo.git('config', '--get', 'commit.gpgsign')).toBe('false')
    expect(repo.git('rev-parse', '--abbrev-ref', 'HEAD')).toBe('main')
  })
})

describe('withTempDir', () => {
  test('copies the fixture and removes it afterwards', async () => {
    let seen = ''
    await withTempDir('basic', async (dir) => {
      seen = dir
      expect(existsSync(join(dir, '.netherite', 'config.yml'))).toBe(true)
      expect(existsSync(join(dir, 'netherite', 'adr'))).toBe(true)
    })
    expect(existsSync(seen)).toBe(false)
  })

  test('does not modify the original fixture', async () => {
    await withTempDir('basic', async (dir) => {
      const { rm } = await import('node:fs/promises')
      await rm(join(dir, 'netherite'), { recursive: true })
    })
    expect(existsSync(join(fixturePath('basic'), 'netherite', 'adr'))).toBe(true)
  })
})
