import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { describe, expect, test } from 'vitest'
import { createItem, openRepo, surveyRepository } from '../src/index'

const layer = Layer.merge(NodeFileSystem.layer, NodePath.layer)

const adr = (title: string, status: string, date: string) =>
  `# ${title}\n\n- **Status:** ${status}\n- **Date:** ${date}\n\n## Context\n\nWhy.\n`

const files: Record<string, string> = {
  '.netherite/config.yml': 'version: 1\n',
  '.gitignore': 'build-output/\n*.log\n',
  'README.md': '# Shop\n\nA shop.\n',
  'CHANGELOG.md': '# Changes\n',
  LICENSE: 'MIT\n',
  'CLAUDE.md': '# Rules\n\n- Use pnpm.\n',
  'AGENTS.md': '# Agents\n\n- Be brief.\n',
  'apps/web/AGENTS.md': '# Web\n\n- Tests next to code.\n',
  'apps/web/src/domain/user/AGENTS.md': '# User\n\n- Local rule.\n',
  'apps/web/src/domain/user/deep/AGENTS.md': '# Deeper\n\n- Another.\n',
  'apps/api/CLAUDE.md': '@AGENTS.md\n',
  '.cursorrules': 'Prefer small functions.\n',
  '.ai/context/code-style.mdc': '---\ndescription: style\n---\n\n# Style\n\nTabs.\n',
  '.github/copilot-instructions.md': '# Copilot\n\nBe careful.\n',
  '.github/workflows/ci.yml': 'name: CI\n',
  '.github/PULL_REQUEST_TEMPLATE.md': '## What\n',
  '.claude/commands/review.md': '# Review\n',
  'docs/setup.md': '# Setup\n\nRun it.\n',
  'docs/architecture.md': '# Architecture\n\nParts.\n',
  'docs/templates/new-doc.md': '# {{title}}\n',
  'docs/runbooks/deploy.md': '# Deploy\n\nSteps.\n',
  'docs/ops/oncall.md': '# On call\n',
  'docs/adr/0001-use-jest.md': adr('1. Use Jest', 'Superseded by [3](0003.md)', '2023-02-10'),
  'docs/adr/0002-use-postgres.md': adr('2. Use Postgres', 'Accepted', '2023-03-01'),
  'docs/adr/0003-use-vitest.md':
    '# 3. Use Vitest\n\n## Status\n\nAccepted\n\n## Context\n\nSlow.\n',
  'docs/adr/README.md': '# Decisions\n',
  'docs/adr/_template.md': '# NNNN\n',
  'packages/other/docs/decisions/0001-use-esm.md': adr('1. Use ESM', 'Proposed', '2024-01-01'),
  'openspec/specs/a/spec.md': '# Spec\n',
  'openspec/changes/b/proposal.md': '# Proposal\n',
  'node_modules/lib/README.md': '# Lib\n',
  'build-output/page.md': '# Built\n',
  'notes/secret.md': `# Notes\n\ntoken: ghp_${'a1B2c3D4e5'.repeat(4)}\n`,
  'notes/debug.log': 'x\n',
  'src/index.ts': 'export {}\n',
  'packages/core/test/fixtures/basic/README.md': '# Fixture\n',
  'packages/core/test/golden/a/expected.md': '# Expected\n',
  'docs/agents.md': '# Using agents\n\nA page about agents.\n',
}

const inRepo = async <A>(extra: Record<string, string>, use: (dir: string) => Promise<A>) => {
  const dir = mkdtempSync(join(tmpdir(), 'nt-survey-'))

  try {
    for (const [name, content] of Object.entries({ ...files, ...extra })) {
      mkdirSync(dirname(join(dir, name)), { recursive: true })
      writeFileSync(join(dir, name), content)
    }
    symlinkSync(join(dir, '.ai/context'), join(dir, '.claude/context'))
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const survey = (dir: string, options: Parameters<typeof surveyRepository>[2] = {}) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repo = yield* openRepo(dir)
      return yield* surveyRepository(repo.workspace, repo.index, options)
    }).pipe(Effect.provide(layer)),
  )

describe('surveyRepository', () => {
  test('sorts what it finds into types, with decisions first', async () => {
    await inRepo({}, async (dir) => {
      const found = await survey(dir)
      const by = (type: string) => found.entries.filter((e) => e.type === type).map((e) => e.source)
      expect(by('adr')).toEqual([
        'docs/adr/0001-use-jest.md',
        'docs/adr/0002-use-postgres.md',
        'docs/adr/0003-use-vitest.md',
        'packages/other/docs/decisions/0001-use-esm.md',
      ])
      expect(by('runbook')).toEqual(['docs/ops/oncall.md', 'docs/runbooks/deploy.md'])
      expect(by('context')).toEqual([
        '.cursorrules',
        'AGENTS.md',
        'CLAUDE.md',
        '.github/copilot-instructions.md',
        '.ai/context/code-style.mdc',
        'apps/web/AGENTS.md',
      ])
      expect(by('doc')).toEqual([
        'README.md',
        'docs/agents.md',
        'docs/architecture.md',
        'docs/setup.md',
      ])
      expect(found.entries.map((e) => e.type)).toEqual(
        [...found.entries.map((e) => e.type)].sort(
          (a, b) =>
            ['adr', 'doc', 'runbook', 'context'].indexOf(a) -
            ['adr', 'doc', 'runbook', 'context'].indexOf(b),
        ),
      )
    })
  })

  test('a decision record keeps its number and takes the status and date it states', async () => {
    await inRepo({}, async (dir) => {
      const found = await survey(dir)
      const entry = (source: string) => found.entries.find((e) => e.source === source)
      expect(entry('docs/adr/0001-use-jest.md')).toEqual({
        source: 'docs/adr/0001-use-jest.md',
        type: 'adr',
        id: 'ADR-00001',
        fields: { status: 'superseded', date: '2023-02-10' },
      })
      expect(entry('docs/adr/0002-use-postgres.md')?.fields).toEqual({
        status: 'accepted',
        date: '2023-03-01',
      })
      expect(entry('docs/adr/0003-use-vitest.md')).toEqual({
        source: 'docs/adr/0003-use-vitest.md',
        type: 'adr',
        id: 'ADR-00003',
        fields: { status: 'accepted' },
      })
    })
  })

  test('the same number in two places is noted, and the second gets no ID', async () => {
    await inRepo({}, async (dir) => {
      const found = await survey(dir)
      const second = found.entries.find((e) => e.source.startsWith('packages/other'))
      expect(second?.id).toBeUndefined()
      expect(found.notes).toEqual([
        expect.stringContaining('packages/other/docs/decisions/0001-use-esm.md has the number 1'),
      ])
    })
  })

  test('leaves out, and counts, what is not for import', async () => {
    await inRepo({}, async (dir) => {
      const found = await survey(dir)
      const group = (reason: string) => found.skipped.find((g) => g.reason === reason)
      expect(group('nested-agent-file')).toMatchObject({ count: 2 })
      expect(group('stub')?.examples).toEqual(['apps/api/CLAUDE.md'])
      expect(group('managed-by-a-tool')).toMatchObject({ count: 2 })
      expect(group('not-documentation')?.examples).toEqual(['CHANGELOG.md'])
      expect(group('template')?.count).toBe(2)
      expect(group('decision-index')?.examples).toEqual(['docs/adr/README.md'])
      expect(group('test-data')).toMatchObject({ count: 2 })
      expect(group('maybe-a-secret')?.examples).toEqual(['notes/secret.md'])
      const all = found.entries.map((e) => e.source)
      for (const never of [
        'node_modules/lib/README.md',
        'build-output/page.md',
        '.claude/commands/review.md',
        'apps/web/src/domain/user/AGENTS.md',
        'notes/secret.md',
        'docs/adr/README.md',
      ]) {
        expect(all, never).not.toContain(never)
      }
    })
  })

  test('a symlinked folder is the same folder, not a second one', async () => {
    await inRepo({}, async (dir) => {
      const found = await survey(dir)
      expect(found.entries.filter((e) => e.source.endsWith('code-style.mdc'))).toHaveLength(1)
    })
  })

  test('per-folder agent files come in on request', async () => {
    await inRepo({}, async (dir) => {
      const found = await survey(dir, { nestedAgentFiles: true })
      const all = found.entries.map((e) => e.source)
      expect(all).toContain('apps/web/src/domain/user/AGENTS.md')
      expect(all).toContain('apps/web/src/domain/user/deep/AGENTS.md')
    })
  })

  test('what is already imported is left out', async () => {
    await inRepo({}, async (dir) => {
      await Effect.runPromise(
        Effect.gen(function* () {
          const repo = yield* openRepo(dir)
          yield* createItem(repo, {
            type: 'doc',
            title: 'Setup',
            fields: { source: 'docs/setup.md', imported_at: '2026-03-05' },
          })
        }).pipe(Effect.provide(layer)),
      )
      const found = await survey(dir)
      expect(found.entries.map((e) => e.source)).not.toContain('docs/setup.md')
      expect(found.skipped.find((g) => g.reason === 'already-imported')?.examples).toEqual([
        'docs/setup.md',
      ])
    })
  })

  test('reads only: no file is written', async () => {
    await inRepo({}, async (dir) => {
      const before = JSON.stringify(Object.keys(files).map((f) => [f]))
      await survey(dir)
      expect(JSON.stringify(Object.keys(files).map((f) => [f]))).toBe(before)
    })
  })
})
