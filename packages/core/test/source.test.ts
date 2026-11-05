import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { checkItem, defaultConfig, makeItemSchemas } from '@netherite/schema'
import { Effect, Layer } from 'effect'
import { describe, expect, test } from 'vitest'
import { lintWorkspace, openWorkspace } from '../src/index'

const layer = Layer.merge(NodeFileSystem.layer, NodePath.layer)

const doc = (id: string, extra: string) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: doc\ntitle: T ${id}\n${extra}---\n\n# T ${id}\n\n[[DOC-00001]]\n`

const inRepo = async (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'nt-source-'))
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
        return yield* lintWorkspace(yield* openWorkspace(dir))
      }).pipe(Effect.provide(layer)),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('source and imported_at', () => {
  const schemas = makeItemSchemas(defaultConfig)
  const valid = (type: 'doc' | 'runbook' | 'context' | 'adr', extra: Record<string, unknown>) => {
    const base = { id: 'X', aliases: ['X'], type, title: 'T', ...extra }
    const withId = {
      doc: { ...base, id: 'DOC-00001', aliases: ['DOC-00001'] },
      runbook: { ...base, id: 'RUN-00001', aliases: ['RUN-00001'] },
      context: { ...base, id: 'CTX-00001', aliases: ['CTX-00001'] },
      adr: {
        ...base,
        id: 'ADR-00001',
        aliases: ['ADR-00001'],
        status: 'proposed',
        date: '2026-01-01',
      },
    }[type]
    return checkItem(schemas)(withId)
  }

  test('docs, runbooks, context items and ADRs accept both, and neither is required', () => {
    for (const type of ['doc', 'runbook', 'context', 'adr'] as const) {
      expect(valid(type, {}), type).toEqual([])
      expect(valid(type, { source: 'docs/old.md', imported_at: '2026-03-05' }), type).toEqual([])
      expect(valid(type, { source: 'https://wiki.example.com/page' }), type).toEqual([])
    }
  })

  test('imported_at is a day and source is not empty', () => {
    expect(valid('doc', { imported_at: 'yesterday' }).map((i) => i.path)).toEqual([['imported_at']])
    expect(valid('doc', { imported_at: '2026-03-05T10:00:00Z' })).not.toEqual([])
    expect(valid('doc', { source: '' }).map((i) => i.path)).toEqual([['source']])
  })

  test('lint notes a source in the repository that is gone, and nothing else', async () => {
    const found = await inRepo({
      'docs/kept.md': '# kept\n',
      'netherite/docs/DOC-00001-a.md': doc('DOC-00001', 'source: docs/kept.md\n'),
      'netherite/docs/DOC-00002-b.md': doc('DOC-00002', 'source: docs/gone.md\n'),
      'netherite/docs/DOC-00003-c.md': doc('DOC-00003', 'source: https://wiki.example.com/x\n'),
      'netherite/docs/DOC-00004-d.md': doc('DOC-00004', 'source: ../elsewhere/x.md\n'),
      'netherite/docs/DOC-00005-e.md': doc('DOC-00005', 'source: ./docs/kept.md\n'),
      'netherite/docs/DOC-00006-f.md': doc('DOC-00006', ''),
    })
    const missing = found.filter((d) => d.rule === 'source-missing')
    expect(missing).toEqual([
      {
        path: 'netherite/docs/DOC-00002-b.md',
        line: 6,
        column: 1,
        rule: 'source-missing',
        severity: 'info',
        message: expect.stringContaining('"docs/gone.md" is no longer in the repository'),
      },
    ])
  })
})
