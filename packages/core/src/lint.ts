import {
  type Config,
  checkItem,
  type ItemType,
  itemTypes,
  knownFields,
  makeItemSchemas,
} from '@netherite/schema'
import { Effect } from 'effect'
import { fileSlug, typeFolders } from './filenames'
import type { ParseOptions } from './parse-pool'
import { scanItems } from './scan'
import type { ScannedItem } from './scanned-item'
import type { Workspace } from './workspace'
import { createIndex, type WorkspaceIndex } from './workspace-index'

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
  | 'orphan'
  | 'unknown-field'

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

    // 1. The file must have readable frontmatter.
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

    // 2. The schema.
    for (const issue of check(data)) {
      const field = issue.path[0]
      const label = issue.path.length === 0 ? '' : `${issue.path.join('.')}: `
      report(item, fieldPosition(item, field), 'schema', 'error', `${label}${issue.message}`)
    }

    const type = item.type as ItemType | undefined
    const validType = type !== undefined && (itemTypes as string[]).includes(type)

    // 3. Identity: duplicate IDs, the ID in aliases, the file name.
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

    // 4. The folder.
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

    // 5. Unknown fields are kept, and only mentioned.
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

  // 6. Links.
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
      // A title or file name shared by two items is a warning; a shared ID or alias is an error.
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

  // 7. Orphans.
  for (const path of index.orphans()) {
    const item = index.get(path)
    if (item !== undefined) report(item, top, 'orphan', 'info', 'Nothing links to this item')
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

/** Scans the workspace from disk, indexes it and lints it. */
export const lintWorkspace = (
  workspace: Workspace,
  options: { readonly only?: ReadonlyArray<string>; readonly parse?: ParseOptions } = {},
) =>
  Effect.gen(function* () {
    const items = yield* scanItems(workspace, options.parse)
    const index = createIndex({ config: workspace.config })
    index.build(items)
    const contentRoot = workspace.contentRoot
      .slice(workspace.root.length + 1)
      .split('\\')
      .join('/')
    return lint(index, {
      config: workspace.config,
      contentRoot,
      ...(options.only === undefined ? {} : { only: options.only }),
    })
  })
