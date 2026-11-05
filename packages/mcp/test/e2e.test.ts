import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fixturePath } from '@netherite/testing'
import { beforeAll, describe, expect, test } from 'vitest'
import { isolateGit, withSession } from './helpers'
import { script } from './script'

beforeAll(isolateGit)

const task1 = 'netherite/tasks/TASK-00001-core.md'
const task3 = 'netherite/tasks/TASK-00003-write-the-docs.md'
const adr1 = 'netherite/adr/ADR-00001-callbacks.md'
const adr2 = 'netherite/adr/ADR-00002-promises.md'
const adr4 = 'netherite/adr/ADR-00004-use-sqlite.md'
const doc1 = 'netherite/docs/DOC-00001-overview.md'

describe('a working session on a clean workspace', () => {
  test('every step changes exactly the lines it should and leaves the workspace clean', async () => {
    await withSession(async (s) => {
      const { step } = await script(s)

      await step('create', {
        args: {
          type: 'task',
          title: 'Write the docs',
          fields: { project: 'PRJ-00001', labels: ['docs'] },
          body: 'Do it.\n\n- [ ] one\n- [ ] two',
          created_by: '@ada',
        },
        result: { id: 'TASK-00003', path: task3 },
        files: {
          [task3]: {
            created: [
              '---',
              'id: TASK-00003',
              'aliases: [TASK-00003]',
              'type: task',
              'title: Write the docs',
              'created: <now>',
              'created_by: "@ada"',
              'project: PRJ-00001',
              'state: backlog',
              'labels: [docs]',
              '---',
              '',
              '# Write the docs',
              '',
              'Do it.',
              '',
              '- [ ] one',
              '- [ ] two',
              '',
            ].join('\n'),
          },
        },
      })

      await step('create', {
        args: {
          type: 'adr',
          title: 'Use SQLite',
          fields: {
            status: 'proposed',
            date: '2026-02-01',
            deciders: ['@ada'],
            project: 'PRJ-00001',
          },
        },
        result: { id: 'ADR-00004', path: adr4 },
        files: {
          [adr4]: {
            created: [
              '---',
              'id: ADR-00004',
              'aliases: [ADR-00004]',
              'type: adr',
              'title: Use SQLite',
              'created: <now>',
              'status: proposed',
              'date: 2026-02-01',
              'deciders: ["@ada"]',
              'project: PRJ-00001',
              '---',
              '',
              '# Use SQLite',
              '',
              '## Context',
              '',
              '## Decision',
              '',
              '## Consequences',
              '',
            ].join('\n'),
          },
        },
      })

      await step('update', {
        args: {
          id: 'TASK-00001',
          set: { assignees: ['@ada'] },
          section: { heading: 'Notes', content: 'Changed notes.' },
        },
        files: { [task1]: ['+assignees: ["@ada"]', '-Plain notes.', '+Changed notes.'] },
      })

      await step('set_state', {
        args: { id: 'TASK-00001', state: 'doing' },
        files: { [task1]: ['-state: backlog', '+state: doing'] },
      })

      await step('toggle_check', {
        args: { id: 'TASK-00001', item: 0 },
        files: { [task1]: ['-- [ ] first', '+- [x] first'] },
      })

      await step('link', {
        args: { from: 'TASK-00001', to: 'ADR-00002', kind: 'related' },
        files: { [task1]: ['+related: [ADR-00002]'] },
      })

      await step('unlink', {
        args: { from: 'TASK-00001', to: 'ADR-00002', kind: 'related' },
        files: { [task1]: ['-related: [ADR-00002]'] },
      })

      await step('mark_reviewed', {
        args: { id: 'DOC-00001', date: '2026-02-01' },
        files: { [doc1]: ['-reviewed_at: 2026-01-01', '+reviewed_at: 2026-02-01'] },
      })

      await step('set_state', {
        args: { id: 'ADR-00001', state: 'superseded', superseded_by: 'ADR-00002' },
        files: {
          [adr1]: ['-status: accepted', '+status: superseded', '+superseded_by: ADR-00002'],
          [adr2]: ['+supersedes: [ADR-00001]'],
        },
      })
    })
  })

  test('refused calls change nothing', async () => {
    await withSession(async (s) => {
      const { step } = await script(s)
      const { data } = await s.call('get', { id: 'TASK-00001' })

      await step('create', {
        args: { type: 'task', title: 'No project' },
        refused: true,
        result: { error: { type: 'ValidationError' } },
        files: {},
      })
      await step('update', {
        args: { id: 'TASK-09999', set: { labels: ['x'] } },
        refused: true,
        result: { error: { type: 'NotFound' } },
        files: {},
      })
      await step('update', {
        args: { id: 'TASK-00001', set: { id: 'TASK-00099' } },
        refused: true,
        files: {},
      })
      await step('set_state', {
        args: { id: 'ADR-00003', state: 'superseded' },
        refused: true,
        files: {},
      })
      await step('update', {
        args: { id: 'TASK-00001', set: { labels: ['x'] } },
        files: { [task1]: ['-labels: [backend]', '+labels: [x]'] },
      })
      await step('update', {
        args: { id: 'TASK-00001', set: { labels: ['y'] }, base_hash: data.hash },
        refused: true,
        result: { error: { type: 'ConflictError' } },
        files: {},
      })
    })
  })

  test('delete is refused while linked; forcing it leaves exactly the broken links lint reports', async () => {
    await withSession(async (s) => {
      const { step } = await script(s)

      await step('delete', {
        args: { id: 'TASK-00001' },
        refused: true,
        result: { error: { type: 'StillLinked' } },
        files: {},
      })
      await step('delete', {
        args: { id: 'TASK-00001', force: true },
        files: { [task1]: 'deleted' },
        introduces: ['broken-link', 'broken-link', 'broken-link', 'broken-link'],
      })
      expect((await s.call('get', { id: 'TASK-00001' })).data.error.type).toBe('NotFound')
    })
  })

  test('a long script ends with a workspace that lints clean from scratch', async () => {
    await withSession(async (s) => {
      const { step } = await script(s)
      const id = (n: number) => `TASK-${String(n).padStart(5, '0')}`
      for (let n = 3; n < 13; n++) {
        const path = `netherite/tasks/${id(n)}-step-${n}.md`
        await step('create', {
          args: {
            type: 'task',
            title: `Step ${n}`,
            fields: { project: 'PRJ-00001', depends_on: [id(n - 1)] },
          },
          result: { id: id(n), path },
          files: {
            [path]: {
              created: `---\nid: ${id(n)}\naliases: [${id(n)}]\ntype: task\ntitle: Step ${n}\ncreated: <now>\nproject: PRJ-00001\nstate: backlog\ndepends_on: [${id(n - 1)}]\n---\n\n# Step ${n}\n`,
            },
          },
        })
      }
      expect((await s.call('list', { type: 'task', limit: 100 })).data.items).toHaveLength(12)
    })
  })
})

describe('planning from an empty workspace', () => {
  test('goal, project, tasks, decision and doc, each step exact and lint-clean', async () => {
    await withSession(
      async (s) => {
        const { step } = await script(s)
        const made = (lines: string[]) => ({ created: `${lines.join('\n')}\n` })

        await step('create', {
          args: { type: 'goal', title: 'Ship v1', created_by: '@ada' },
          result: { id: 'GOAL-00001', path: 'netherite/goals/GOAL-00001-ship-v1.md' },
          files: {
            'netherite/goals/GOAL-00001-ship-v1.md': made([
              '---',
              'id: GOAL-00001',
              'aliases: [GOAL-00001]',
              'type: goal',
              'title: Ship v1',
              'created: <now>',
              'created_by: "@ada"',
              'status: active',
              '---',
              '',
              '# Ship v1',
            ]),
          },
        })
        await step('create', {
          args: {
            type: 'project',
            title: 'App',
            fields: { goals: ['GOAL-00001'] },
            created_by: '@ada',
          },
          result: { id: 'PRJ-00001' },
          files: {
            'netherite/projects/PRJ-00001-app.md': made([
              '---',
              'id: PRJ-00001',
              'aliases: [PRJ-00001]',
              'type: project',
              'title: App',
              'created: <now>',
              'created_by: "@ada"',
              'goals: [GOAL-00001]',
              'status: active',
              '---',
              '',
              '# App',
            ]),
          },
        })
        await step('create', {
          args: {
            type: 'task',
            title: 'Build it',
            fields: { project: 'PRJ-00001' },
            body: '- [ ] design\n- [ ] code',
            created_by: '@ada',
          },
          result: { id: 'TASK-00001' },
          files: {
            'netherite/tasks/TASK-00001-build-it.md': made([
              '---',
              'id: TASK-00001',
              'aliases: [TASK-00001]',
              'type: task',
              'title: Build it',
              'created: <now>',
              'created_by: "@ada"',
              'project: PRJ-00001',
              'state: backlog',
              '---',
              '',
              '# Build it',
              '',
              '- [ ] design',
              '- [ ] code',
            ]),
          },
        })
        await step('create', {
          args: {
            type: 'task',
            title: 'Ship it',
            fields: { project: 'PRJ-00001', depends_on: ['TASK-00001'] },
            created_by: '@ada',
          },
          result: { id: 'TASK-00002' },
          files: {
            'netherite/tasks/TASK-00002-ship-it.md': made([
              '---',
              'id: TASK-00002',
              'aliases: [TASK-00002]',
              'type: task',
              'title: Ship it',
              'created: <now>',
              'created_by: "@ada"',
              'project: PRJ-00001',
              'state: backlog',
              'depends_on: [TASK-00001]',
              '---',
              '',
              '# Ship it',
            ]),
          },
        })
        await step('create', {
          args: {
            type: 'adr',
            title: 'Use files',
            fields: { status: 'proposed', date: '2026-02-01', project: 'PRJ-00001' },
            created_by: '@ada',
          },
          result: { id: 'ADR-00001' },
          files: {
            'netherite/adr/ADR-00001-use-files.md': made([
              '---',
              'id: ADR-00001',
              'aliases: [ADR-00001]',
              'type: adr',
              'title: Use files',
              'created: <now>',
              'created_by: "@ada"',
              'status: proposed',
              'date: 2026-02-01',
              'deciders: ["@ada"]',
              'project: PRJ-00001',
              '---',
              '',
              '# Use files',
              '',
              '## Context',
              '',
              '## Decision',
              '',
              '## Consequences',
            ]),
          },
        })
        await step('link', {
          args: { from: 'TASK-00002', to: 'ADR-00001', kind: 'related' },
          files: { 'netherite/tasks/TASK-00002-ship-it.md': ['+related: [ADR-00001]'] },
        })
        await step('update', {
          args: {
            id: 'ADR-00001',
            section: { heading: 'Decision', content: 'Keep everything in Markdown files.' },
          },
          files: {
            'netherite/adr/ADR-00001-use-files.md': ['+Keep everything in Markdown files.', '+'],
          },
        })
        await step('set_state', {
          args: { id: 'ADR-00001', state: 'accepted' },
          files: {
            'netherite/adr/ADR-00001-use-files.md': ['-status: proposed', '+status: accepted'],
          },
        })
        await step('set_state', {
          args: { id: 'TASK-00001', state: 'done' },
          files: { 'netherite/tasks/TASK-00001-build-it.md': ['-state: backlog', '+state: done'] },
        })

        const plan = (await s.call('list', { project: 'PRJ-00001' })).data.items.map(
          (i: { id: string }) => i.id,
        )
        expect(plan).toEqual(['ADR-00001', 'TASK-00001', 'TASK-00002'])
        expect((await s.call('get', { id: 'TASK-00002' })).data.links).toBeDefined()
      },
      { files: (dir) => ({ [join(dir, '.netherite/config.yml')]: 'version: 1\n' }) },
    )
  })
})

/** The files of the shared `basic` fixture, which has deliberate problems, as `path -> text`. */
const fixtureFiles = (dir: string, sub = ''): Record<string, string> => {
  const root = fixturePath('basic')
  const out: Record<string, string> = {}
  for (const name of readdirSync(join(root, sub))) {
    const rel = sub === '' ? name : `${sub}/${name}`
    if (rel === 'expected.json') continue
    if (statSync(join(root, rel)).isDirectory()) Object.assign(out, fixtureFiles(dir, rel))
    else out[join(dir, rel)] = readFileSync(join(root, rel), 'utf8')
  }
  return out
}

describe('on a workspace that already has problems', () => {
  test('edits do not add problems, and the existing ones are untouched', async () => {
    await withSession(
      async (s) => {
        const { step, baseline } = await script(s)
        expect(baseline.size).toBeGreaterThan(0)
        const before = (await s.call('lint')).data.summary

        const doc = 'netherite/docs/DOC-00004-release-notes.md'
        await step('create', {
          args: { type: 'doc', title: 'Release notes', fields: { project: 'PRJ-00001' } },
          result: { id: 'DOC-00004', path: doc },
          files: {
            [doc]: {
              created:
                '---\nid: DOC-00004\naliases: [DOC-00004]\ntype: doc\ntitle: Release notes\ncreated: <now>\nproject: PRJ-00001\n---\n\n# Release notes\n',
            },
          },
        })
        await step('update', {
          args: {
            id: 'DOC-00004',
            section: { heading: 'Notes', content: 'First draft.', mode: 'create' },
          },
          files: { [doc]: ['+## Notes', '+', '+First draft.', '+'] },
        })
        const after = (await s.call('lint')).data.summary
        expect(after.error).toBe(before.error)
        expect(after.warning).toBe(before.warning)
      },
      { files: fixtureFiles },
    )
  })
})
