import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { defaultConfig, itemTypes } from '@netherite/schema'
import { Effect, type FileSystem, Layer, type Path } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  createIndex,
  fillTemplate,
  lint,
  lintWorkspace,
  MissingTemplateValue,
  openWorkspace,
  readTemplates,
  scanItems,
  type TemplateValues,
  templateBody,
  templates,
  toScannedItem,
  type Workspace,
} from '../src/index'

const ids = {
  goal: 'GOAL-00001',
  project: 'PRJ-00001',
  task: 'TASK-00001',
  adr: 'ADR-00001',
  doc: 'DOC-00001',
  context: 'CTX-00001',
  runbook: 'RUN-00001',
} as const

const folders = {
  goal: 'goals',
  project: 'projects',
  task: 'tasks',
  adr: 'adr',
  doc: 'docs',
  context: 'context',
  runbook: 'runbooks',
} as const

const values = (type: keyof typeof ids, title = 'Starter'): TemplateValues => ({
  id: ids[type],
  title,
  created: '2026-03-05T10:30:00Z',
  date: '2026-03-05',
  createdBy: '@ada',
  project: 'PRJ-00001',
  goal: 'GOAL-00001',
})

describe('templates', () => {
  test('there is one for every item type', () => {
    expect(Object.keys(templates).sort()).toEqual([...itemTypes].sort())
  })

  test('filled in, all of them lint without a warning or an error', () => {
    const items = itemTypes.map((type) =>
      toScannedItem(`n/${folders[type]}/${ids[type]}-starter.md`, fillTemplate(type, values(type))),
    )
    const index = createIndex({ config: defaultConfig })
    index.build(items)
    const problems = lint(index, { config: defaultConfig, contentRoot: 'n' }).filter(
      (d) => d.severity !== 'info',
    )
    expect(problems).toEqual([])
    expect(items.map((i) => [i.type, i.id])).toEqual(itemTypes.map((t) => [t, ids[t]]))
  })

  test('every optional field of the schema is written in a comment', () => {
    for (const type of itemTypes) {
      const text = templates[type]
      const front = text.slice(0, text.indexOf('\n---\n', 4))
      expect(front, type).toMatch(/^# tags: /m)
    }
    expect(templates.task).toMatch(/^# depends_on: /m)
    expect(templates.adr).toMatch(/^# supersedes: /m)
    expect(templates.doc).toMatch(/^# covers: /m)
    expect(templates.runbook).toMatch(/^# covers: /m)
    expect(templates.context).toMatch(/^# targets: /m)
  })

  test('a title that needs quoting is quoted in the frontmatter and plain in the heading', () => {
    const text = fillTemplate('doc', values('doc', 'Setup: the "fast" way # 1'))
    expect(text).toContain('title: "Setup: the \\"fast\\" way # 1"')
    expect(text).toContain('# Setup: the "fast" way # 1\n')
    const item = toScannedItem('n/docs/DOC-00001-setup.md', text)
    expect(item.title).toBe('Setup: the "fast" way # 1')
  })

  test('without a git identity the lines that name one are left out', () => {
    const text = fillTemplate('adr', { ...values('adr'), createdBy: undefined })
    expect(text).not.toContain('created_by')
    expect(text).not.toContain('deciders')
    expect(text).not.toContain('{{')
  })

  test('a value that is needed and missing is refused', () => {
    expect(() => fillTemplate('task', { ...values('task'), project: undefined })).toThrow(
      MissingTemplateValue,
    )
    expect(() => fillTemplate('project', { ...values('project'), goal: undefined })).toThrow(
      /\{\{goal\}\}/,
    )
  })

  test('the body is what follows the title heading', () => {
    const body = templateBody(templates.adr, 'Starter')
    expect(body.startsWith('## Context')).toBe(true)
    expect(body).toContain('## Decision')
    expect(body).toContain('## Consequences')
    expect(body).not.toContain('Starter')
  })

  test('the ADR template has the sections that createItem gives an ADR', () => {
    const body = templateBody(templates.adr, 'Starter')
    expect(body.match(/^## .*$/gm)).toEqual(['## Context', '## Decision', '## Consequences'])
  })
})

describe('the workspace templates', () => {
  const layer = Layer.merge(NodeFileSystem.layer, NodePath.layer)
  const inWorkspace = async <A>(
    files: Record<string, string>,
    use: (workspace: Workspace) => Effect.Effect<A, unknown, FileSystem.FileSystem | Path.Path>,
  ) => {
    const dir = mkdtempSync(join(tmpdir(), 'nt-templates-'))
    try {
      for (const [name, content] of Object.entries({
        '.netherite/config.yml': 'version: 1\n',
        ...files,
      })) {
        mkdirSync(dirname(join(dir, name)), { recursive: true })
        writeFileSync(join(dir, name), content)
      }
      return await Effect.runPromise(
        Effect.gen(function* () {
          return yield* use(yield* openWorkspace(dir))
        }).pipe(Effect.provide(layer)),
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }

  test('a workspace file replaces the built-in template for its type only', async () => {
    const found = await inWorkspace(
      { 'netherite/templates/runbook.md': '---\ntype: runbook\n---\n\n# {{title}}\n\n## Steps\n' },
      readTemplates,
    )
    const runbook = found.find((t) => t.type === 'runbook')
    expect(runbook).toMatchObject({ source: 'workspace', path: 'netherite/templates/runbook.md' })
    expect(runbook?.text).toContain('## Steps')
    expect(found.filter((t) => t.source === 'built-in').map((t) => t.type)).toHaveLength(6)
  })

  test('their files are not items: no scan, no diagnostics for a file without frontmatter', async () => {
    const result = await inWorkspace(
      { 'netherite/templates/doc.md': '# {{title}}\n\nJust a body.\n' },
      (workspace) =>
        Effect.gen(function* () {
          return { items: yield* scanItems(workspace), problems: yield* lintWorkspace(workspace) }
        }),
    )
    expect(result.items).toEqual([])
    expect(result.problems).toEqual([])
  })

  test('a field the type does not have is a warning, with its line; known ones and comments are not', async () => {
    const problems = await inWorkspace(
      {
        'netherite/templates/task.md':
          '---\nid: {{id}}\ntype: task\n# colour: red\nproject: {{project}}\nsprint: 4\n---\n\n# {{title}}\n',
      },
      lintWorkspace,
    )
    expect(problems).toEqual([
      {
        path: 'netherite/templates/task.md',
        line: 6,
        column: 1,
        rule: 'template-unknown-field',
        severity: 'warning',
        message: expect.stringContaining('"sprint" is not a field of a task'),
      },
    ])
  })
})
