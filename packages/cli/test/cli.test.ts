import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { basicHistory, createGitRepo, withTempDir } from '@netherite/testing'
import { beforeAll, describe, expect, test } from 'vitest'
import { cli, git, isolateGit, json, type Result } from './helpers'

beforeAll(isolateGit)

const temp = async <A>(use: (dir: string) => Promise<A>) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-cli-')))
  try {
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8')

/** A repository with goal, project and a task, set up through the CLI itself. */
const workspace = async (dir: string) => {
  git(dir, 'init', '-q', '-b', 'main')
  await cli(dir, 'init')
  await cli(dir, 'new', 'goal', 'Ship it', '--created-by', '@ada')
  await cli(dir, 'new', 'project', 'App', '--set', 'goals=[GOAL-00001]', '--created-by', '@ada')
  await cli(dir, 'new', 'task', 'Core', '--set', 'project=PRJ-00001', '--created-by', '@ada')
}

describe('init', () => {
  test('creates the config, the folders and the .gitignore line', async () => {
    await temp(async (dir) => {
      const result = await cli(dir, 'init')
      expect(result.code).toBe(0)
      expect(existsSync(join(dir, '.netherite/config.yml'))).toBe(true)
      for (const folder of [
        'goals',
        'projects',
        'tasks',
        'adr',
        'docs',
        'context',
        'runbooks',
        'assets',
      ]) {
        expect(existsSync(join(dir, 'netherite', folder, '.gitkeep')), folder).toBe(true)
      }
      expect(read(dir, '.gitignore')).toBe('.netherite/local/\n')
      // Config, 8 folders and .gitignore, then 5 skills and AGENTS.md.
      expect(result.stdout.filter((l) => l.startsWith('created'))).toHaveLength(16)
    })
  })

  test('the config it writes is valid and uses the defaults', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      expect(read(dir, '.netherite/config.yml')).toMatch(/^version: 1$/m)
      // A workspace that lints (so the config parsed) and has no problems.
      expect((await cli(dir, 'lint')).code).toBe(0)
    })
  })

  test('is safe to run again: it adds what is missing and overwrites nothing', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      writeFileSync(join(dir, '.netherite/config.yml'), 'version: 1\nid_padding: 3\n')
      mkdirSync(join(dir, 'netherite/tasks/sub'), { recursive: true })
      const again = await cli(dir, 'init')
      expect(again.code).toBe(0)
      expect(again.stdout.at(-1)).toBe('Already set up.')
      expect(read(dir, '.netherite/config.yml')).toBe('version: 1\nid_padding: 3\n')
      expect(read(dir, '.gitignore')).toBe('.netherite/local/\n')
    })
  })

  test('adds to an existing .gitignore without touching it, and keeps its line endings', async () => {
    await temp(async (dir) => {
      writeFileSync(join(dir, '.gitignore'), 'node_modules\r\ndist')
      await cli(dir, 'init')
      expect(read(dir, '.gitignore')).toBe('node_modules\r\ndist\r\n.netherite/local/\r\n')
    })
  })

  test('does not add the line twice', async () => {
    await temp(async (dir) => {
      writeFileSync(join(dir, '.gitignore'), '.netherite/local\n')
      await cli(dir, 'init')
      expect(read(dir, '.gitignore')).toBe('.netherite/local\n')
    })
  })

  test('--content picks another folder, and the config says so', async () => {
    await temp(async (dir) => {
      expect((await cli(dir, 'init', '--content', 'docs/work')).code).toBe(0)
      expect(existsSync(join(dir, 'docs/work/tasks'))).toBe(true)
      expect(read(dir, '.netherite/config.yml')).toMatch(/^content: docs\/work$/m)
      expect((await cli(dir, 'new', 'doc', 'Hello')).code).toBe(0)
      expect(existsSync(join(dir, 'docs/work/docs/DOC-00001-hello.md'))).toBe(true)
    })
  })

  test.each(['..', '../outside', '/etc', '.', ''])('--content "%s" is refused', async (content) => {
    await temp(async (dir) => {
      const result = await cli(dir, 'init', '--content', content)
      expect(result.code).toBe(2)
      expect(result.stderr[0]).toContain('inside the repository')
      expect(existsSync(join(dir, '.netherite'))).toBe(false)
    })
  })

  test('--dir works in another folder; a missing one is refused', async () => {
    await temp(async (dir) => {
      mkdirSync(join(dir, 'sub'))
      expect((await cli(dir, 'init', '--dir', 'sub')).code).toBe(0)
      expect(existsSync(join(dir, 'sub/.netherite/config.yml'))).toBe(true)
      expect((await cli(dir, 'init', '--dir', 'nope')).code).toBe(2)
    })
  })

  test('--json reports what happened', async () => {
    await temp(async (dir) => {
      const result = json<{ root: string; created: string[]; existed: string[] }>(
        await cli(dir, 'init', '--json'),
      )
      expect(result.root).toBe(dir)
      expect(result.created).toContain('.netherite/config.yml')
      expect(result.existed).toEqual([])
    })
  })
})

describe('new', () => {
  test('creates items with the next ids, printing id and path', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const goal = await cli(dir, 'new', 'goal', 'Ship', 'the', 'first', 'release')
      expect(goal.code).toBe(0)
      expect(goal.stdout).toEqual([
        'GOAL-00001  netherite/goals/GOAL-00001-ship-the-first-release.md',
      ])
      const second = await cli(dir, 'new', 'goal', 'Another')
      expect(second.stdout[0]).toMatch(/^GOAL-00002 /)
    })
  })

  test('--set values are read as YAML', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      await cli(
        dir,
        'new',
        'task',
        'Typed',
        '--set',
        'project=PRJ-00001',
        '--set',
        'labels=[a, b]',
        '--set',
        'due=2026-05-01',
        '--set',
        'assignees=["@ada"]',
      )
      const text = read(dir, 'netherite/tasks/TASK-00002-typed.md')
      expect(text).toContain('labels: [a, b]')
      expect(text).toContain('due: 2026-05-01')
      expect(text).toContain('assignees: ["@ada"]')
    })
  })

  test('--body and --body-file add text after the title', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      await cli(dir, 'new', 'doc', 'Inline', '--body', 'Some text.')
      expect(
        read(dir, 'netherite/docs/DOC-00001-inline.md').endsWith('# Inline\n\nSome text.\n'),
      ).toBe(true)
      writeFileSync(join(dir, 'body.md'), '## Details\n\nFrom a file.\n')
      await cli(dir, 'new', 'doc', 'From file', '--body-file', 'body.md')
      expect(read(dir, 'netherite/docs/DOC-00002-from-file.md')).toContain(
        '## Details\n\nFrom a file.',
      )
    })
  })

  test('records who created it, from git config or --created-by', async () => {
    await temp(async (dir) => {
      git(dir, 'init', '-q')
      git(dir, 'config', 'user.name', 'Ada Lovelace')
      git(dir, 'config', 'user.email', 'ada@example.com')
      await cli(dir, 'init')
      await cli(dir, 'new', 'doc', 'By git')
      await cli(dir, 'new', 'doc', 'By flag', '--created-by', '@grace')
      expect(read(dir, 'netherite/docs/DOC-00001-by-git.md')).toContain('created_by: "@ada"')
      expect(read(dir, 'netherite/docs/DOC-00002-by-flag.md')).toContain('created_by: "@grace"')
    })
  })

  test('works without git or a git identity', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      expect((await cli(dir, 'new', 'doc', 'Plain')).code).toBe(0)
      expect(read(dir, 'netherite/docs/DOC-00001-plain.md')).not.toContain('created_by')
    })
  })

  test('--json prints the id, path and hash', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const out = json<{ id: string; path: string; hash: string }>(
        await cli(dir, 'new', 'doc', 'J', '--json'),
      )
      expect(out).toMatchObject({ id: 'DOC-00001', path: 'netherite/docs/DOC-00001-j.md' })
      expect(out.hash).toMatch(/^[0-9a-f]{64}$/)
    })
  })

  test('a field-level error exits 1 and creates nothing', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      const result = await cli(
        dir,
        'new',
        'task',
        'Bad',
        '--set',
        'project=PRJ-00404',
        '--set',
        'due=soon',
      )
      expect(result.code).toBe(1)
      expect(result.stderr).toEqual(
        expect.arrayContaining([
          'project: PRJ-00404 does not match any item',
          expect.stringMatching(/^due: /),
        ]),
      )
      expect(existsSync(join(dir, 'netherite/tasks/TASK-00002-bad.md'))).toBe(false)
    })
  })

  test('a project needs goals', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const result = await cli(dir, 'new', 'project', 'Lonely')
      expect(result.code).toBe(1)
      expect(result.stderr.join('\n')).toContain('goals')
    })
  })

  test('an unknown type, no workspace, and both body flags are usage errors', async () => {
    await temp(async (dir) => {
      expect((await cli(dir, 'new', 'doc', 'x')).code).toBe(2) // no workspace
      await cli(dir, 'init')
      const unknown = await cli(dir, 'new', 'epic', 'x')
      expect(unknown.code).toBe(2)
      expect(unknown.stderr[0]).toContain('goal, project, task, adr, doc, context, runbook')
      expect((await cli(dir, 'new', 'doc', 'x', '--body', 'a', '--body-file', 'b')).code).toBe(2)
      expect((await cli(dir, 'new', 'doc', 'x', '--body-file', 'missing.md')).code).toBe(2)
    })
  })

  test('finds the workspace from a subfolder', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      const deep = join(dir, 'netherite/docs')
      expect((await cli(deep, 'new', 'doc', 'From deep')).code).toBe(0)
      expect(existsSync(join(dir, 'netherite/docs/DOC-00001-from-deep.md'))).toBe(true)
    })
  })
})

describe('lint', () => {
  test('a clean workspace passes', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      const result = await cli(dir, 'lint')
      expect(result).toMatchObject({ code: 0, stdout: ['✔ No problems'] })
    })
  })

  test('prints problems grouped by file and exits 1 on errors', async () => {
    await withTempDir('basic', async (dir) => {
      const result = await cli(dir, 'lint')
      expect(result.code).toBe(1)
      expect(result.stdout).toContain('netherite/tasks/TASK-00090-broken-link.md')
      expect(
        result.stdout.some((line) =>
          /^ {2}14:5 +error +broken-link +\[\[TASK-00404\]\] does not match any item$/.test(line),
        ),
      ).toBe(true)
      expect(result.stdout.at(-1)).toBe('✖ 9 problems (7 errors, 1 warning, 1 info)')
    })
  })

  test('--json is machine-readable', async () => {
    await withTempDir('basic', async (dir) => {
      const result = await cli(dir, 'lint', '--json')
      const out = json<{
        diagnostics: Array<{ path: string; rule: string }>
        summary: Record<string, number>
      }>(result)
      expect(result.code).toBe(1)
      expect(out.summary).toEqual({ error: 7, warning: 1, info: 1 })
      expect(out.diagnostics).toHaveLength(9)
      expect(out.diagnostics[0]).toEqual(
        expect.objectContaining({
          path: expect.any(String),
          line: expect.any(Number),
          rule: expect.any(String),
          severity: expect.any(String),
        }),
      )
    })
  })

  test('--fail-on decides what makes it fail', async () => {
    await withTempDir('basic', async (dir) => {
      expect((await cli(dir, 'lint', '--fail-on', 'never')).code).toBe(0)
      expect((await cli(dir, 'lint', '--fail-on', 'info')).code).toBe(1)
      expect((await cli(dir, 'lint', 'netherite/docs/DOC-00002-orphan-notes.md')).code).toBe(0) // only an info
      expect(
        (await cli(dir, 'lint', 'netherite/docs/DOC-00002-orphan-notes.md', '--fail-on', 'info'))
          .code,
      ).toBe(1)
      expect(
        (
          await cli(
            dir,
            'lint',
            'netherite/tasks/DOC-00003-wrong-folder.md',
            '--fail-on',
            'warning',
          )
        ).code,
      ).toBe(1)
      expect(
        (await cli(dir, 'lint', 'netherite/tasks/DOC-00003-wrong-folder.md', '--fail-on', 'error'))
          .code,
      ).toBe(0)
    })
  })

  test('an unknown --fail-on is a usage error', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      expect((await cli(dir, 'lint', '--fail-on', 'sometimes')).code).toBe(2)
    })
  })

  test('paths limit the report to files and folders, relative to where you are', async () => {
    await withTempDir('basic', async (dir) => {
      const one = json<{ diagnostics: Array<{ path: string }> }>(
        await cli(dir, 'lint', 'netherite/tasks/TASK-00090-broken-link.md', '--json'),
      )
      expect(one.diagnostics.map((d) => d.path)).toEqual([
        'netherite/tasks/TASK-00090-broken-link.md',
      ])
      const folder = json<{ diagnostics: Array<{ path: string }> }>(
        await cli(join(dir, 'netherite'), 'lint', 'docs', '--json'),
      )
      expect(new Set(folder.diagnostics.map((d) => d.path))).toEqual(
        new Set([
          'netherite/docs/DOC-00001-app-overview.md',
          'netherite/docs/DOC-00002-orphan-notes.md',
        ]),
      )
    })
  })

  test('no workspace is exit 2', async () => {
    await temp(async (dir) => {
      const result = await cli(dir, 'lint')
      expect(result.code).toBe(2)
      expect(result.stderr[1]).toContain('netherite init')
    })
  })

  test('a broken config is exit 2 with file:line:column', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      writeFileSync(join(dir, '.netherite/config.yml'), 'version: 1\nid_padding: 0\n')
      const result = await cli(dir, 'lint')
      expect(result.code).toBe(2)
      expect(result.stderr[0]).toMatch(/config\.yml:2:\d+ /)
    })
  })

  test('freshness needs git history, and --no-git skips it', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const withGit = json<{ diagnostics: Array<{ rule: string }> }>(
        await cli(repo.root, 'lint', '--json'),
      )
      expect(withGit.diagnostics.filter((d) => d.rule === 'drifting')).toHaveLength(2)
      const without = json<{ diagnostics: Array<{ rule: string }> }>(
        await cli(repo.root, 'lint', '--json', '--no-git'),
      )
      expect(without.diagnostics.filter((d) => d.rule === 'drifting')).toHaveLength(0)
    } finally {
      await repo.cleanup()
    }
  })

  test('outside a git repository freshness is simply skipped', async () => {
    await withTempDir('basic', async (dir) => {
      const out = json<{ diagnostics: Array<{ rule: string }> }>(await cli(dir, 'lint', '--json'))
      expect(out.diagnostics.some((d) => d.rule === 'drifting' || d.rule === 'stale')).toBe(false)
    })
  })

  describe('--fix', () => {
    const broken = async (dir: string) => {
      await workspace(dir)
      const file = 'netherite/tasks/TASK-00001-core.md'
      writeFileSync(
        join(dir, file),
        read(dir, file).replace('aliases: [TASK-00001]', 'aliases: []'),
      )
      git(dir, 'mv', '-f', file, 'netherite/tasks/core-task.md') // not tracked: fall back to plain move below
    }

    const breakIt = async (dir: string) => {
      await workspace(dir)
      const file = join(dir, 'netherite/tasks/TASK-00001-core.md')
      writeFileSync(
        file,
        read(dir, 'netherite/tasks/TASK-00001-core.md').replace(
          'aliases: [TASK-00001]',
          'aliases: []',
        ),
      )
      execFileSync('mv', [file, join(dir, 'netherite/tasks/core-task.md')])
    }
    void broken

    test('--dry-run shows the diff and changes nothing', async () => {
      await temp(async (dir) => {
        await breakIt(dir)
        const before = read(dir, 'netherite/tasks/core-task.md')
        const result = await cli(dir, 'lint', '--fix', '--dry-run')
        expect(result.code).toBe(1) // problems still there: nothing was changed
        const text = result.text
        expect(text).toContain('rename from netherite/tasks/core-task.md')
        expect(text).toContain('rename to netherite/tasks/TASK-00001-core-task.md')
        expect(text).toContain('-aliases: []')
        expect(text).toContain('+aliases: [TASK-00001]')
        expect(text).toContain('Would fix 2 problems in 2 files.')
        expect(read(dir, 'netherite/tasks/core-task.md')).toBe(before)
        expect(existsSync(join(dir, 'netherite/tasks/TASK-00001-core-task.md'))).toBe(false)
      })
    })

    test('applies the fixes and then reports what is left', async () => {
      await temp(async (dir) => {
        await breakIt(dir)
        const result = await cli(dir, 'lint', '--fix')
        expect(result.code).toBe(0)
        expect(result.stdout).toEqual(['Fixed 2 problems in 2 files.', '✔ No problems'])
        expect(existsSync(join(dir, 'netherite/tasks/core-task.md'))).toBe(false)
        expect(read(dir, 'netherite/tasks/TASK-00001-core-task.md')).toContain(
          'aliases: [TASK-00001]',
        )
        expect((await cli(dir, 'lint')).code).toBe(0)
      })
    })

    test('never commits or stages anything', async () => {
      await temp(async (dir) => {
        await breakIt(dir)
        const before = git(dir, 'status', '--porcelain')
        await cli(dir, 'lint', '--fix')
        expect(git(dir, 'log', '--oneline', '--all').trim()).toBe('')
        expect(git(dir, 'diff', '--cached', '--name-only')).toBe('')
        expect(before).not.toBe('')
      })
    })

    test('leaves problems it cannot fix, and exits 1', async () => {
      await withTempDir('basic', async (dir) => {
        const result = await cli(dir, 'lint', '--fix')
        expect(result.code).toBe(1)
        expect(result.stdout.join('\n')).toContain('Fixed 1 problem in 1 file.')
        expect(read(dir, 'netherite/tasks/TASK-00092-missing-alias.md')).toContain(
          'aliases: [TASK-00092]',
        )
        expect(result.stdout.at(-1)).toMatch(/6 errors/)
      })
    })

    test('--json includes what was fixed', async () => {
      await temp(async (dir) => {
        await breakIt(dir)
        const out = json<{
          fix: { dryRun: boolean; applied: unknown[]; changes: unknown[] }
          summary: Record<string, number>
        }>(await cli(dir, 'lint', '--fix', '--json'))
        expect(out.fix).toMatchObject({ dryRun: false })
        expect(out.fix.applied).toHaveLength(2)
        expect(out.summary).toEqual({ error: 0, warning: 0, info: 0 })
      })
    })

    test('--dry-run alone is a usage error', async () => {
      await temp(async (dir) => {
        await workspace(dir)
        const result = await cli(dir, 'lint', '--dry-run')
        expect(result.code).toBe(2)
        expect(result.stderr[0]).toContain('--fix')
      })
    })

    test('nothing to fix says so', async () => {
      await temp(async (dir) => {
        await workspace(dir)
        expect((await cli(dir, 'lint', '--fix')).stdout).toEqual([
          'Nothing to fix.',
          '✔ No problems',
        ])
      })
    })
  })
})

describe('renumber', () => {
  test('renumbers by ID and rewrites links', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      await cli(
        dir,
        'new',
        'task',
        'Second',
        '--set',
        'project=PRJ-00001',
        '--set',
        'depends_on=[TASK-00001]',
      )
      const result = await cli(dir, 'renumber', 'TASK-00001', '--to', 'TASK-00050')
      expect(result.code).toBe(0)
      expect(result.stdout[0]).toBe('TASK-00001 -> TASK-00050')
      expect(read(dir, 'netherite/tasks/TASK-00002-second.md')).toContain(
        'depends_on: [TASK-00050]',
      )
      expect(existsSync(join(dir, 'netherite/tasks/TASK-00050-core.md'))).toBe(true)
      expect((await cli(dir, 'lint')).code).toBe(0)
    })
  })

  test('takes a path, and defaults to the next free id', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      const result = json<{ oldId: string; newId: string; path: string }>(
        await cli(dir, 'renumber', 'netherite/tasks/TASK-00001-core.md', '--json'),
      )
      expect(result).toMatchObject({
        oldId: 'TASK-00001',
        newId: 'TASK-00002',
        path: 'netherite/tasks/TASK-00002-core.md',
      })
    })
  })

  test('finds the item from a subfolder', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      const result = await cli(join(dir, 'netherite/tasks'), 'renumber', 'TASK-00001-core.md')
      expect(result.code).toBe(0)
    })
  })

  test('an unknown item is a usage error', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      expect((await cli(dir, 'renumber', 'TASK-09999')).code).toBe(2)
    })
  })

  test('an id that is taken, or of the wrong type, is refused', async () => {
    await temp(async (dir) => {
      await workspace(dir)
      expect((await cli(dir, 'renumber', 'TASK-00001', '--to', 'PRJ-00001')).code).toBe(1)
      expect((await cli(dir, 'renumber', 'TASK-00001', '--to', 'DOC-00009')).code).toBe(1)
    })
  })

  describe('after a merge produced a duplicate id', () => {
    /** Two branches each created TASK-00001; the second was committed later. */
    const collision = async (dir: string) => {
      git(dir, 'init', '-q', '-b', 'main')
      await cli(dir, 'init')
      await cli(dir, 'new', 'goal', 'G', '--created-by', '@ada')
      await cli(dir, 'new', 'project', 'P', '--set', 'goals=[GOAL-00001]', '--created-by', '@ada')
      await cli(dir, 'new', 'task', 'Older', '--set', 'project=PRJ-00001', '--created-by', '@ada')
      git(dir, 'add', '-A')
      execFileSync(
        'git',
        ['commit', '-q', '-m', 'first', '--date=2026-01-01T10:00:00Z', '--author=Ada <ada@x.y>'],
        {
          cwd: dir,
          env: {
            ...process.env,
            GIT_COMMITTER_DATE: '2026-01-01T10:00:00Z',
            GIT_COMMITTER_NAME: 'Ada',
            GIT_COMMITTER_EMAIL: 'ada@x.y',
          },
        },
      )
      const newer = 'netherite/tasks/TASK-00001-newer.md'
      writeFileSync(
        join(dir, newer),
        read(dir, 'netherite/tasks/TASK-00001-older.md')
          .replace('title: Older', 'title: Newer')
          .replace('# Older', '# Newer'),
      )
      writeFileSync(
        join(dir, 'netherite/docs/DOC-00001-uses-newer.md'),
        '---\nid: DOC-00001\naliases: [DOC-00001]\ntype: doc\ntitle: Uses newer\n---\n\nSee [[TASK-00001]].\n',
      )
      git(dir, 'add', '-A')
      execFileSync(
        'git',
        ['commit', '-q', '-m', 'second', '--date=2026-02-01T10:00:00Z', '--author=Ada <ada@x.y>'],
        {
          cwd: dir,
          env: {
            ...process.env,
            GIT_COMMITTER_DATE: '2026-02-01T10:00:00Z',
            GIT_COMMITTER_NAME: 'Ada',
            GIT_COMMITTER_EMAIL: 'ada@x.y',
          },
        },
      )
    }

    test('lint reports the duplicate as an error', async () => {
      await temp(async (dir) => {
        await collision(dir)
        const out = json<{ diagnostics: Array<{ rule: string }> }>(
          await cli(dir, 'lint', '--json', '--no-git'),
        )
        expect(out.diagnostics.filter((d) => d.rule === 'duplicate-id')).toHaveLength(2)
      })
    })

    test('renumbers the newest by first commit, even when you name the older', async () => {
      await temp(async (dir) => {
        await collision(dir)
        const result = await cli(dir, 'renumber', 'netherite/tasks/TASK-00001-older.md')
        expect(result.code).toBe(0)
        expect(result.stderr[0]).toContain(
          'renumbering the newest, netherite/tasks/TASK-00001-newer.md',
        )
        expect(existsSync(join(dir, 'netherite/tasks/TASK-00001-older.md'))).toBe(true)
        expect(existsSync(join(dir, 'netherite/tasks/TASK-00001-newer.md'))).toBe(false)
        expect(result.stdout.join('\n')).toContain('still point at the other item')
      })
    })

    test('--exact renumbers the one you named', async () => {
      await temp(async (dir) => {
        await collision(dir)
        await cli(dir, 'renumber', 'netherite/tasks/TASK-00001-older.md', '--exact')
        expect(existsSync(join(dir, 'netherite/tasks/TASK-00001-older.md'))).toBe(false)
        expect(existsSync(join(dir, 'netherite/tasks/TASK-00001-newer.md'))).toBe(true)
      })
    })

    test('--rewrite-in makes the links in the files you name follow', async () => {
      await temp(async (dir) => {
        await collision(dir)
        const result = await cli(
          dir,
          'renumber',
          'netherite/tasks/TASK-00001-older.md',
          '--rewrite-in',
          'netherite/docs/DOC-00001-uses-newer.md',
        )
        expect(result.code).toBe(0)
        const newId = result.stdout[0]?.split(' -> ')[1]
        expect(read(dir, 'netherite/docs/DOC-00001-uses-newer.md')).toContain(`See [[${newId}]].`)
        expect(result.stdout.join('\n')).toContain(
          'links updated in netherite/docs/DOC-00001-uses-newer.md',
        )
        expect((await cli(dir, 'lint', '--no-git')).code).toBe(0)
      })
    })
  })
})

describe('usage', () => {
  test.each([[['nope']], [['lint', '--nope']], [['new']], [['new', 'task']], [['renumber']]])(
    '%j is a usage error (exit 2)',
    async (argv) => {
      await temp(async (dir) => {
        await cli(dir, 'init')
        expect((await cli(dir, ...argv)).code).toBe(2)
      })
    },
  )

  test('--help and --version succeed', async () => {
    await temp(async (dir) => {
      expect((await cli(dir, '--help')).code).toBe(0)
      expect((await cli(dir, '--version')).code).toBe(0)
      expect((await cli(dir, 'lint', '--help')).code).toBe(0)
    })
  })
})

describe('timeline and stats', () => {
  test('print the same data as the API, as JSON or as text', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const timeline = json<{ tasks: unknown[]; activity: unknown[]; today: string }>(
        await cli(repo.root, 'timeline', '--json'),
      )
      expect(timeline.tasks.length).toBeGreaterThan(0)
      expect(timeline.activity.length).toBeGreaterThan(0)
      const text = await cli(repo.root, 'timeline')
      expect(text.code).toBe(0)
      expect(text.stdout[0]).toMatch(/^Timeline \d{4}-\d{2}-\d{2} to /)

      const stats = json<{ period: string; kpis: { commits: { value: number } } }>(
        await cli(repo.root, 'stats', '--period', 'year', '--json'),
      )
      expect(stats.period).toBe('year')
      expect(stats.kpis.commits.value).toBeGreaterThan(0)
      expect((await cli(repo.root, 'stats')).stdout[0]).toMatch(/^Stats .* \(30d\)$/)
    } finally {
      await repo.cleanup()
    }
  })

  test('refuse bad input and workspaces without git', async () => {
    await temp(async (dir) => {
      await cli(dir, 'init')
      expect((await cli(dir, 'timeline')).code).toBe(2)
      expect((await cli(dir, 'stats')).code).toBe(2)
      expect((await cli(dir, 'stats', '--period', 'decade')).code).toBe(2)
      expect((await cli(dir, 'timeline', '--from', 'soon')).code).toBe(2)
    })
  })
})

describe('the built program', () => {
  const bin = join(__dirname, '..', 'dist', 'bin.mjs')

  test.skipIf(!existsSync(bin))(
    'runs from the command line with real exit codes',
    async () => {
      await temp(async (dir) => {
        const run = (...args: string[]) => {
          try {
            return {
              code: 0,
              out: execFileSync('node', [bin, ...args], {
                cwd: dir,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
              }),
            }
          } catch (error) {
            const e = error as { status: number; stdout: string; stderr: string }
            return { code: e.status, out: e.stdout + e.stderr }
          }
        }
        expect(run('lint').code).toBe(2)
        expect(run('init').code).toBe(0)
        expect(run('new', 'doc', 'Hello').out).toContain('DOC-00001')
        expect(run('lint', '--json').code).toBe(0)
        expect(run('--version').out).toMatch(/netherite v/)
        expect(run('bogus').code).toBe(2)
      })
      // Each call starts a real process; with the other packages' tests running, 5 seconds is not enough.
    },
    30_000,
  )
})

export type { Result }
