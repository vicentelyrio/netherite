import {
  AdrStatus,
  checkItem,
  FreshnessState,
  ItemType,
  itemTypes,
  knownFields,
  makeItemSchemas,
  RelationKind,
} from '@netherite/schema'
import { fileSlug, typeFolders } from '../filenames'
import { parseHorizon } from '../horizon'
import type { ScannedItem } from '../scanned-item'
import { isRetired, type WorkspaceIndex } from '../workspace-index'
import { severityOrder, top } from './lint.helpers'
import type { Diagnostic, Fix, LintOptions, Position, RuleId, Severity } from './lint.types'

const fieldPosition = (item: ScannedItem, field: string | number | undefined): Position =>
  (typeof field === 'string' ? item.parsed.frontmatter?.fields[field] : undefined) ?? top

const expectedFileName = (item: ScannedItem, id: string) => {
  const withoutId = item.fileName.replace(/^[A-Za-z]+-\d+-?/, '')
  const slug = withoutId === '' ? fileSlug(item.title ?? '') : withoutId
  return `${id}-${slug}.md`
}

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
    if (
      item.type === ItemType.Project &&
      fields.milestone !== undefined &&
      fields.due === undefined
    ) {
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
      if (fresh.state !== FreshnessState.Drifting && fresh.state !== FreshnessState.Stale) continue
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
        `${fresh.state === FreshnessState.Stale ? 'Stale' : 'Drifting'}: ${count} touched ${fresh.covers.join(', ')} since ${since}${fresh.uncommitted ? ' (including uncommitted changes)' : ''}. Review it, then mark it reviewed.`,
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
    if (
      isKnowledge &&
      data?.status === AdrStatus.Superseded &&
      typeof data.superseded_by !== 'string'
    ) {
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
      if (edge.kind === RelationKind.Supersedes) continue
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
