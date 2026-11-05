import type { GitRepository } from '@netherite/git'
import {
  type Config,
  checkItem,
  type ItemType,
  itemTypes,
  knownFields,
  makeItemSchemas,
} from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import { fileSlug, typeFolders } from './filenames'
import { computeFreshness, type Freshness } from './freshness'
import { parseHorizon } from './horizon'
import type { ParseOptions } from './parse-pool'
import { scanItems } from './scan'
import type { ScannedItem } from './scanned-item'
import { classifySource } from './source'
import { readTemplates } from './templates'
import type { Workspace } from './workspace'
import { createIndex, isRetired, type WorkspaceIndex } from './workspace-index'

export type Severity = 'error' | 'warning' | 'info'

export type RuleId =
  | 'frontmatter'
  | 'schema'
  | 'duplicate-id'
  | 'missing-alias'
  | 'file-name-id'
  | 'outside-type-folder'
  | 'broken-link'
  | 'ambiguous-link'
  | 'broken-heading'
  | 'drifting'
  | 'stale'
  | 'orphan'
  | 'superseded-without-successor'
  | 'links-to-retired'
  | 'unknown-field'
  | 'template-unknown-field'
  | 'source-missing'
  | 'due-before-created'
  | 'milestone-without-due'
  | 'invalid-horizon'

/**
 * A change that would clear a diagnostic. Lint only describes it; core operations apply it
 * (`netherite lint --fix`), always without committing.
 */
export type Fix =
  | { readonly kind: 'add-alias'; readonly path: string; readonly alias: string }
  | { readonly kind: 'rename-file'; readonly path: string; readonly to: string }

export interface Diagnostic {
  /** Path relative to the workspace root. */
  readonly path: string
  /** 1-based. */
  readonly line: number
  /** 1-based. */
  readonly column: number
  readonly rule: RuleId
  readonly severity: Severity
  readonly message: string
  readonly fix?: Fix
}

export interface LintOptions {
  readonly config: Pick<Config, 'states'>
  /** Content root relative to the workspace root, such as `netherite`. */
  readonly contentRoot: string
  /** Report only diagnostics for these paths. Rules still look at the whole workspace. */
  readonly only?: ReadonlyArray<string>
  /** Freshness of each item (from `computeFreshness`). Without it, freshness is not checked. */
  readonly freshness?: ReadonlyMap<string, Freshness>
  /** How serious drifting and stale items are. Both default to `warning`; CI can use `error`. */
  readonly freshnessSeverity?: { readonly drifting?: Severity; readonly stale?: Severity }
}

type Position = { line: number; column: number }
const top: Position = { line: 1, column: 1 }

const fieldPosition = (item: ScannedItem, field: string | number | undefined): Position =>
  (typeof field === 'string' ? item.parsed.frontmatter?.fields[field] : undefined) ?? top

const severityOrder: Record<Severity, number> = { error: 0, warning: 1, info: 2 }

/** The file name an item should have: its ID, then the slug it already has (or one from its title). */
const expectedFileName = (item: ScannedItem, id: string) => {
  const withoutId = item.fileName.replace(/^[A-Za-z]+-\d+-?/, '')
  const slug = withoutId === '' ? fileSlug(item.title ?? '') : withoutId
  return `${id}-${slug}.md`
}

/**
 * Checks the whole index against the rules in ADR-00003, ADR-00004 and ADR-00006 and returns
 * every problem as data: path, position, rule, severity and message. Results are sorted by path,
 * then position. Freshness rules are added with the freshness model.
 */
export const lint = (index: WorkspaceIndex, options: LintOptions): Diagnostic[] => {
  const schemas = makeItemSchemas(options.config)
  const check = checkItem(schemas)
  const known = knownFields(schemas)
  const prefix = options.contentRoot === '' ? '' : `${options.contentRoot.replace(/\/$/, '')}/`
  const diagnostics: Diagnostic[] = []
  const report = (
    item: ScannedItem,
    where: Position,
    rule: RuleId,
    severity: Severity,
    message: string,
    fix?: Fix,
  ) => {
    diagnostics.push({
      path: item.path,
      line: where.line,
      column: where.column,
      rule,
      severity,
      message,
      ...(fix === undefined ? {} : { fix }),
    })
  }

  const paths = new Set(index.paths())

  for (const item of index.items()) {
    const frontmatter = item.parsed.frontmatter

    if (frontmatter === undefined) {
      report(item, top, 'frontmatter', 'error', 'File has no frontmatter')
      continue
    }
    if (frontmatter.errors.length > 0) {
      for (const error of frontmatter.errors) {
        report(item, error, 'frontmatter', 'error', `Invalid YAML: ${error.message}`)
      }
      continue
    }
    const data = frontmatter.data
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      report(item, top, 'frontmatter', 'error', 'Frontmatter must be a YAML mapping')
      continue
    }

    for (const issue of check(data)) {
      const field = issue.path[0]
      const label = issue.path.length === 0 ? '' : `${issue.path.join('.')}: `
      report(item, fieldPosition(item, field), 'schema', 'error', `${label}${issue.message}`)
    }

    const fields = data as {
      created?: unknown
      due?: unknown
      milestone?: unknown
      horizon?: unknown
    }
    if (typeof fields.created === 'string' && typeof fields.due === 'string') {
      if (fields.due < fields.created.slice(0, 10)) {
        report(
          item,
          fieldPosition(item, 'due'),
          'due-before-created',
          'warning',
          `due ${fields.due} is before the item was created (${fields.created.slice(0, 10)})`,
        )
      }
    }
    if (item.type === 'project' && fields.milestone !== undefined && fields.due === undefined) {
      report(
        item,
        fieldPosition(item, 'milestone'),
        'milestone-without-due',
        'warning',
        'A milestone needs a due date, or it cannot be placed on the Timeline',
      )
    }
    if (typeof fields.horizon === 'string' && parseHorizon(fields.horizon) === undefined) {
      report(
        item,
        fieldPosition(item, 'horizon'),
        'invalid-horizon',
        'warning',
        `horizon "${fields.horizon}" is not "forever" or a length like "10 years", "6 months" or "90d"`,
      )
    }

    const type = item.type as ItemType | undefined
    const validType = type !== undefined && (itemTypes as string[]).includes(type)

    if (item.id !== undefined) {
      const same = index.findById(item.id)
      if (same.length > 1) {
        const others = same.filter((other) => other !== item).map((other) => other.path)
        report(
          item,
          fieldPosition(item, 'id'),
          'duplicate-id',
          'error',
          `ID ${item.id} is also used by ${others.join(', ')}`,
        )
      }
      const aliases = (data as { aliases?: unknown }).aliases
      if (Array.isArray(aliases) && !aliases.includes(item.id)) {
        report(
          item,
          fieldPosition(item, 'aliases'),
          'missing-alias',
          'error',
          `aliases must include the ID ${item.id}, so Obsidian can resolve [[${item.id}]]`,
          { kind: 'add-alias', path: item.path, alias: item.id },
        )
      }
      if (item.fileName !== item.id && !item.fileName.startsWith(`${item.id}-`)) {
        const to = item.path.replace(/[^/]+$/, expectedFileName(item, item.id))
        report(
          item,
          fieldPosition(item, 'id'),
          'file-name-id',
          'warning',
          `File name should start with the ID: ${item.id}-<slug>.md`,
          paths.has(to) ? undefined : { kind: 'rename-file', path: item.path, to },
        )
      }
    }

    if (validType && item.path.startsWith(prefix)) {
      const folder = `${prefix}${typeFolders[type]}/`
      if (!item.path.startsWith(folder)) {
        report(
          item,
          fieldPosition(item, 'type'),
          'outside-type-folder',
          'warning',
          `A ${type} belongs in ${folder}`,
        )
      }
    }

    if (validType) {
      const allowed = new Set(known[type])
      for (const key of Object.keys(data)) {
        if (!allowed.has(key)) {
          report(
            item,
            fieldPosition(item, key),
            'unknown-field',
            'info',
            `Unknown field "${key}" (kept as is)`,
          )
        }
      }
    }
  }

  for (const { path, ref, resolution } of index.unresolved()) {
    const item = index.get(path)
    if (item === undefined) continue
    const where = ref.position?.start ?? fieldPosition(item, ref.field)
    const written = ref.field === 'body' ? `[[${ref.target}]]` : `${ref.field}: ${ref.target}`
    const position = { line: where.line, column: where.column }
    if (resolution.status === 'broken') {
      report(item, position, 'broken-link', 'error', `${written} does not match any item`)
    } else if (resolution.status === 'ambiguous') {
      const names = resolution.candidates.map((c) => c.path).join(', ')
      const severity = resolution.via === 'id' || resolution.via === 'alias' ? 'error' : 'warning'
      report(
        item,
        position,
        'ambiguous-link',
        severity,
        `${written} matches several items: ${names}`,
      )
    } else {
      report(
        item,
        position,
        'broken-heading',
        'warning',
        `${written}#${ref.heading ?? ''} points at a heading that does not exist`,
      )
    }
  }

  if (options.freshness !== undefined) {
    for (const [path, fresh] of options.freshness) {
      if (fresh.state !== 'drifting' && fresh.state !== 'stale') continue
      const item = index.get(path)
      if (item === undefined) continue
      const since =
        fresh.baseline?.source === 'reviewed_at'
          ? `it was reviewed on ${fresh.baseline.date}`
          : `its last commit on ${fresh.baseline?.date ?? '?'}`
      const count = `${fresh.atLeast ? 'at least ' : ''}${fresh.commits} commit${fresh.commits === 1 ? '' : 's'}`
      const where = fieldPosition(
        item,
        item.parsed.frontmatter?.fields.reviewed_at ? 'reviewed_at' : 'covers',
      )
      report(
        item,
        where,
        fresh.state,
        options.freshnessSeverity?.[fresh.state] ?? 'warning',
        `${fresh.state === 'stale' ? 'Stale' : 'Drifting'}: ${count} touched ${fresh.covers.join(', ')} since ${since}${fresh.uncommitted ? ' (including uncommitted changes)' : ''}. Review it, then mark it reviewed.`,
      )
    }
  }

  for (const path of index.orphans()) {
    const item = index.get(path)
    if (item !== undefined) report(item, top, 'orphan', 'info', 'Nothing links to this item')
  }

  for (const item of index.items()) {
    const data = item.parsed.frontmatter?.data as Record<string, unknown> | undefined
    const isKnowledge = ['doc', 'runbook', 'context'].includes(item.type ?? '')
    if (isKnowledge && data?.status === 'superseded' && typeof data.superseded_by !== 'string') {
      report(
        item,
        fieldPosition(item, 'status'),
        'superseded-without-successor',
        'warning',
        'Superseded, but superseded_by names no replacement',
      )
    }
    if (isRetired(item) || !isKnowledge) continue
    for (const edge of index.outgoing(item.path)) {
      if (edge.kind === 'supersedes') continue
      const target = index.get(edge.to)
      if (target === undefined || !isRetired(target)) continue
      report(
        item,
        top,
        'links-to-retired',
        'info',
        `Links to ${target.id ?? target.path}, which is ${(target.parsed.frontmatter?.data as Record<string, unknown> | undefined)?.status}`,
      )
    }
  }

  const only = options.only === undefined ? undefined : new Set(options.only)
  return diagnostics
    .filter((d) => only === undefined || only.has(d.path))
    .sort(
      (a, b) =>
        a.path.localeCompare(b.path) ||
        a.line - b.line ||
        a.column - b.column ||
        severityOrder[a.severity] - severityOrder[b.severity] ||
        a.rule.localeCompare(b.rule),
    )
}

export interface LintSummary {
  readonly error: number
  readonly warning: number
  readonly info: number
}

export const summarize = (diagnostics: ReadonlyArray<Diagnostic>): LintSummary => ({
  error: diagnostics.filter((d) => d.severity === 'error').length,
  warning: diagnostics.filter((d) => d.severity === 'warning').length,
  info: diagnostics.filter((d) => d.severity === 'info').length,
})

/**
 * The workspace's own templates (`templates/<type>.md` under the content root) that name a
 * frontmatter field the type does not have. A field the schema renamed or dropped would otherwise
 * be copied into every new item without anyone noticing.
 */
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

/**
 * An imported item whose `source` is a path in the repository that is no longer there: the
 * original may have been moved or deleted, so the link back to it is stale (ADR-00026).
 */
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

/** Scans the workspace from disk, indexes it and lints it. */
export const lintWorkspace = (
  workspace: Workspace,
  options: {
    readonly only?: ReadonlyArray<string>
    readonly parse?: ParseOptions
    /** Pass the repository to check freshness; `undefined` skips it (no git). */
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
