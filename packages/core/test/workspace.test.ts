import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { memoryFileSystem, withTempDir } from '@netherite/testing'
import { Effect, Layer, Path } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  ConfigInvalid,
  findWorkspaceRoot,
  loadWorkspace,
  openWorkspace,
  parseConfig,
} from '../src/index'

const posix = Path.layer

const run = <A, E>(
  effect: Effect.Effect<A, E, import('effect').FileSystem.FileSystem | Path.Path>,
  files: Record<string, string>,
) => {
  const fs = memoryFileSystem(files)
  return Effect.runPromise(effect.pipe(Effect.provide(Layer.merge(fs.layer, posix))))
}
const fail = <A, E>(
  effect: Effect.Effect<A, E, import('effect').FileSystem.FileSystem | Path.Path>,
  files: Record<string, string>,
) => run(Effect.flip(effect), files)

const cfg = '.netherite/config.yml'

describe('findWorkspaceRoot', () => {
  const files = { [`/repo/${cfg}`]: 'version: 1\n', '/repo/src/deep/file.ts': '' }

  test('finds the config in the start directory', async () => {
    expect(await run(findWorkspaceRoot('/repo'), files)).toBe('/repo')
  })

  test('walks up from a nested directory', async () => {
    expect(await run(findWorkspaceRoot('/repo/src/deep'), files)).toBe('/repo')
  })

  test('uses the nearest workspace when they are nested', async () => {
    const nested = { ...files, '/repo/packages/a/.netherite/config.yml': 'version: 1\n' }
    expect(await run(findWorkspaceRoot('/repo/packages/a/src'), nested)).toBe('/repo/packages/a')
  })

  test('fails with WorkspaceNotFound at the filesystem root', async () => {
    const error = await fail(findWorkspaceRoot('/elsewhere/dir'), files)
    expect(error).toMatchObject({ _tag: 'WorkspaceNotFound', startDir: '/elsewhere/dir' })
    expect(error.message).toContain('/elsewhere/dir')
  })
})

describe('loadWorkspace', () => {
  test('applies defaults and resolves the content root', async () => {
    const ws = await run(loadWorkspace('/repo'), { [`/repo/${cfg}`]: 'version: 1\n' })
    expect(ws).toMatchObject({
      root: '/repo',
      configPath: `/repo/${cfg}`,
      contentRoot: '/repo/netherite',
    })
    expect(ws.config.id_padding).toBe(5)
    expect(ws.config.states.map((s) => s.name)).toEqual(['backlog', 'doing', 'blocked', 'done'])
  })

  test('merges explicit values over the defaults', async () => {
    const text = 'version: 1\ncontent: docs/work\nfreshness:\n  stale: 3\n'
    const ws = await run(loadWorkspace('/repo'), { [`/repo/${cfg}`]: text })
    expect(ws.contentRoot).toBe('/repo/docs/work')
    expect(ws.config.freshness).toEqual({ drifting: 1, stale: 3 })
  })

  test.each(['..', '../outside', '/etc', '.', ''])('rejects content "%s"', async (content) => {
    const text = `version: 1\ncontent: "${content}"\n`
    const error = await fail(loadWorkspace('/repo'), { [`/repo/${cfg}`]: text })
    expect(error).toBeInstanceOf(ConfigInvalid)
    expect(error).toMatchObject({ issues: [{ path: ['content'], line: 2 }] })
  })

  test('a missing config file is a read error', async () => {
    const error = await fail(loadWorkspace('/repo'), {})
    expect(error).toMatchObject({ _tag: 'ConfigReadError', path: `/repo/${cfg}` })
  })
})

describe('parseConfig errors', () => {
  const file = '/repo/.netherite/config.yml'
  const issues = async (text: string) => {
    const error = await fail(parseConfig(text, file), {})
    expect(error).toBeInstanceOf(ConfigInvalid)
    return (error as ConfigInvalid).issues
  }

  test('a YAML syntax error has its line and column', async () => {
    const [issue] = await issues('version: 1\nstates: [a, b\nfreshness: {')
    expect(issue?.line).toBeGreaterThanOrEqual(2)
    expect(issue?.column).toBeGreaterThanOrEqual(1)
  })

  test('a missing version points at the top of the file', async () => {
    const [issue] = await issues('content: netherite\n')
    expect(issue).toMatchObject({ path: ['version'], line: 1, column: 1 })
  })

  test('an empty file is reported as a missing version', async () => {
    const [issue] = await issues('')
    expect(issue?.path).toEqual(['version'])
  })

  test('a wrong value points at its line', async () => {
    const text = ['version: 1', 'id_padding: 0', 'freshness:', '  stale: ten'].join('\n')
    const found = await issues(text)
    expect(found.map((i) => [i.path.join('.'), i.line])).toEqual([
      ['id_padding', 2],
      ['freshness.stale', 4],
    ])
  })

  test('a nested list item points at the item', async () => {
    const text = [
      'version: 1',
      'states:',
      '  - { name: ok, category: todo }',
      '  - { name: bad, category: later }',
    ].join('\n')
    const [issue] = await issues(text)
    expect(issue).toMatchObject({ path: ['states', 1, 'category'], line: 4 })
  })

  test('the error message is file:line:column for each issue', async () => {
    const error = await fail(parseConfig('version: 1\nid_padding: 0\n', file), {})
    expect(error.message).toMatch(/^\/repo\/\.netherite\/config\.yml:2:\d+ /)
  })

  test('reports every problem at once', async () => {
    const found = await issues('version: 1\nid_padding: 0\ncontext:\n  budget: -1\n')
    expect(found).toHaveLength(2)
  })
})

describe('with the real filesystem', () => {
  const real = Layer.merge(NodeFileSystem.layer, NodePath.layer)

  test('opens the fixture workspace from a nested directory', async () => {
    await withTempDir('basic', async (dir) => {
      const { join } = await import('node:path')
      const { realpathSync } = await import('node:fs')
      const root = realpathSync(dir)
      const ws = await Effect.runPromise(
        openWorkspace(join(root, 'netherite', 'tasks')).pipe(Effect.provide(real)),
      )
      expect(ws.root).toBe(root)
      expect(ws.contentRoot).toBe(join(root, 'netherite'))
      expect(ws.config.states).toHaveLength(4)
    })
  })

  test('reports no workspace outside the fixture', async () => {
    await withTempDir(undefined, async (dir) => {
      const error = await Effect.runPromise(
        Effect.flip(findWorkspaceRoot(dir)).pipe(Effect.provide(real)),
      )
      expect(error._tag).toBe('WorkspaceNotFound')
    })
  })
})
