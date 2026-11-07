import type { GitRepository } from '@netherite/git'
import { knownFields, makeItemSchemas } from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import { computeFreshness } from '../freshness'
import type { ParseOptions } from '../parse-pool'
import { scanItems } from '../scan'
import type { ScannedItem } from '../scanned-item'
import { classifySource } from '../source'
import { readTemplates } from '../templates'
import type { Workspace } from '../workspace'
import { createIndex } from '../workspace-index'
import { lint } from './lint'
import { severityOrder, top } from './lint.helpers'
import type { Diagnostic, LintOptions } from './lint.types'

const lintTemplates = (workspace: Workspace) =>
  Effect.gen(function* () {
    const known = knownFields(makeItemSchemas(workspace.config))
    const found = yield* readTemplates(workspace)
    const diagnostics: Diagnostic[] = []
    for (const template of found) {
      if (template.source !== 'workspace' || template.path === undefined) continue
      const lines = template.text.split(/\r?\n/)
      if (lines[0] !== '---') continue
      const end = lines.indexOf('---', 1)
      const front = end === -1 ? lines.slice(1) : lines.slice(1, end)
      front.forEach((line, i) => {
        const key = line.match(/^([A-Za-z_][\w-]*):/)?.[1]
        if (key === undefined || known[template.type].includes(key)) return
        diagnostics.push({
          path: template.path as string,
          line: i + 2,
          column: 1,
          rule: 'template-unknown-field',
          severity: 'warning',
          message: `"${key}" is not a field of a ${template.type}; items made from this template would carry it unchecked`,
        })
      })
    }
    return diagnostics
  })

const lintSources = (workspace: Workspace, items: ReadonlyArray<ScannedItem>) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const diagnostics: Diagnostic[] = []
    for (const item of items) {
      const data = item.parsed.frontmatter?.data
      const source =
        typeof data === 'object' && data !== null
          ? (data as Record<string, unknown>).source
          : undefined
      if (typeof source !== 'string' || source === '') continue
      const located = classifySource(source)
      if (located.kind !== 'path') continue
      const relative = located.path
      const exists = yield* fs
        .exists(path.join(workspace.root, relative))
        .pipe(Effect.orElseSucceed(() => true))
      if (exists) continue
      const where = item.parsed.frontmatter?.fields.source ?? top
      diagnostics.push({
        path: item.path,
        line: where.line,
        column: where.column,
        rule: 'source-missing',
        severity: 'info',
        message: `source "${source}" is no longer in the repository; the original may have been moved or deleted`,
      })
    }
    return diagnostics
  })

export const lintWorkspace = (
  workspace: Workspace,
  options: {
    readonly only?: ReadonlyArray<string>
    readonly parse?: ParseOptions
    readonly git?: GitRepository | undefined
    readonly freshnessSeverity?: LintOptions['freshnessSeverity']
  } = {},
) =>
  Effect.gen(function* () {
    const items = yield* scanItems(workspace, options.parse)
    const index = createIndex({ config: workspace.config })
    index.build(items)
    const contentRoot = workspace.contentRoot
      .slice(workspace.root.length + 1)
      .split('\\')
      .join('/')
    const freshness =
      options.git === undefined
        ? undefined
        : yield* computeFreshness({
            index,
            git: options.git,
            thresholds: workspace.config.freshness,
            root: workspace.root,
          })
    const diagnostics = lint(index, {
      config: workspace.config,
      contentRoot,
      ...(options.only === undefined ? {} : { only: options.only }),
      ...(freshness === undefined ? {} : { freshness }),
      ...(options.freshnessSeverity === undefined
        ? {}
        : { freshnessSeverity: options.freshnessSeverity }),
    })
    const own = [
      ...(yield* lintTemplates(workspace)),
      ...(yield* lintSources(workspace, items)),
    ].filter((d) => options.only === undefined || options.only.includes(d.path))
    return [...diagnostics, ...own].sort(
      (a, b) =>
        a.path.localeCompare(b.path) ||
        a.line - b.line ||
        a.column - b.column ||
        severityOrder[a.severity] - severityOrder[b.severity] ||
        a.rule.localeCompare(b.rule),
    )
  })
