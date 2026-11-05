import { outlineMarkdown } from '@netherite/markdown'
import { type ItemType, parseId, ValidationError } from '@netherite/schema'
import { Effect } from 'effect'
import { appendToList, replaceInList, setField } from '../edit'
import { ConflictError, NotFound } from '../errors'
import { itemFileName } from '../filenames'
import { nextId } from '../ids'
import { type ScannedItem, toScannedItem } from '../scanned-item'
import { extractRefs } from '../workspace-index'
import { contentHash } from './hash'
import { applyChanges, type Change, readText } from './io'
import type { OpEnv, OpError, OpOptions } from './operations'
import type { Repo } from './repo'

export interface RenumberOptions extends OpOptions {
  readonly newId?: string
  readonly rewriteReferencesIn?: ReadonlyArray<string>
}

export interface RenumberResult {
  readonly oldId: string
  readonly newId: string
  readonly oldPath: string
  readonly path: string
  readonly item: ScannedItem
  readonly rewritten: ReadonlyArray<string>
  readonly hash: string
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const renamed = (path: string, oldId: string, newId: string, title: string | undefined) => {
  const dir = path.slice(0, path.lastIndexOf('/') + 1)
  const name = path.slice(dir.length).replace(/\.md$/i, '')
  const file =
    name === oldId
      ? `${newId}.md`
      : name.startsWith(`${oldId}-`)
        ? `${newId}-${name.slice(oldId.length + 1)}.md`
        : itemFileName(newId, title ?? '')
  return `${dir}${file}`
}

export const renumber = (
  repo: Repo,
  path: string,
  options: RenumberOptions = {},
): Effect.Effect<RenumberResult, OpError, OpEnv> =>
  Effect.gen(function* () {
    const item = repo.index.get(path)
    if (item === undefined || item.id === undefined) return yield* new NotFound({ id: path })
    const type = item.type as ItemType
    const oldId = item.id
    const source = yield* readText(repo, path)
    if (options.baseHash !== undefined && contentHash(source) !== options.baseHash) {
      return yield* new ConflictError({
        path,
        expected: options.baseHash,
        actual: contentHash(source),
      })
    }

    const newId =
      options.newId ?? nextId(repo.index.items(), type, repo.workspace.config.id_padding)
    const parsed = parseId(newId)
    if (parsed === undefined || parsed.type !== type) {
      return yield* new ValidationError({
        issues: [{ path: ['id'], message: `${newId} is not a valid ${type} ID` }],
      })
    }
    if (repo.index.findById(newId).length > 0) {
      return yield* new ValidationError({
        issues: [{ path: ['id'], message: `${newId} is already in use` }],
      })
    }

    const newPath = renamed(path, oldId, newId, item.title)
    const oldName = path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/i, '')
    const newName = newPath.slice(newPath.lastIndexOf('/') + 1).replace(/\.md$/i, '')
    const follow = new Set(options.rewriteReferencesIn ?? [])

    const own = yield* setField(source, 'id', newId, { order: repo.fieldOrder[type] }).pipe(
      Effect.flatMap((text) => replaceInList(text, 'aliases', oldId, newId)),
      Effect.flatMap((text) =>
        outlineMarkdown(text).frontmatter &&
        !JSON.stringify(outlineMarkdown(text).frontmatter?.data).includes(`"${newId}"`)
          ? appendToList(text, 'aliases', newId)
          : Effect.succeed(text),
      ),
    )

    const referrers = new Set<string>()
    for (const edge of repo.index.incoming(path)) if (edge.from !== path) referrers.add(edge.from)
    for (const u of repo.index.unresolved()) {
      if (
        u.resolution.status === 'ambiguous' &&
        u.resolution.candidates.some((c) => c.path === path)
      ) {
        if (u.path !== path) referrers.add(u.path)
      }
    }

    const changes: Change[] = [{ path, content: null, before: source }]
    const rewritten: string[] = []

    for (const referrer of [...referrers].sort()) {
      const text = yield* readText(repo, referrer)
      const scanned = toScannedItem(referrer, text)

      const points = (target: string, heading?: string) => {
        const resolution = repo.index.resolver.resolve(target, heading)
        if (resolution.status === 'resolved') return resolution.item.path === path
        return (
          resolution.status === 'ambiguous' &&
          follow.has(referrer) &&
          resolution.candidates.some((c) => c.path === path)
        )
      }
      const newTarget = (target: string) =>
        target.trim() === oldId
          ? newId
          : target.replace(new RegExp(escapeRegExp(oldName), 'i'), newName)

      let next = text
      for (const ref of extractRefs(scanned)) {
        if (ref.field === 'body' || ref.target !== oldId || !points(ref.target)) continue
        const pair = outlineMarkdown(next).frontmatter?.data as Record<string, unknown> | undefined
        const value = pair?.[ref.field]
        next = yield* Array.isArray(value)
          ? replaceInList(next, ref.field, oldId, newId)
          : setField(next, ref.field, newId)
      }
      const links = outlineMarkdown(next).links.filter((l) => points(l.target, l.heading))
      for (const link of [...links].reverse()) {
        const target = newTarget(link.target)
        if (target === link.target) continue
        const raw = `[[${target}${link.heading ? `#${link.heading}` : ''}${link.label ? `|${link.label}` : ''}]]`
        const start = link.position.start.offset ?? 0
        const end = link.position.end.offset ?? start
        next = next.slice(0, start) + raw + next.slice(end)
      }

      if (next !== text) {
        changes.push({ path: referrer, content: next, before: text })
        rewritten.push(referrer)
      }
    }

    changes.push({ path: newPath, content: own, before: null })
    yield* applyChanges(repo, changes)

    const result = repo.index.get(newPath) as ScannedItem
    return {
      oldId,
      newId,
      oldPath: path,
      path: newPath,
      item: result,
      rewritten,
      hash: contentHash(result.parsed.source),
    }
  })
