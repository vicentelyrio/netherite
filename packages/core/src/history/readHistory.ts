import type { CommitPatch, FilePatch, GitError, GitRepository } from '@netherite/git'
import { Effect, type FileSystem, type Path } from 'effect'
import { parseDocument } from 'yaml'
import { pathMap } from '../gitpaths'
import { inReservedFolder } from '../reserved'
import type { Builder, FieldValue, History, HistoryOptions, ItemHistory } from './history.types'
import { defaultTrackedFields } from './trackedFields'
import { utcDay } from './weeks'

const frontmatterAfter = (patch: FilePatch): Record<string, unknown> | null | undefined => {
  if (patch.deleted) return null
  const hunk = patch.hunks.find((h) => h.newStart === 1)
  if (hunk === undefined || hunk.lines[0]?.trim() !== '---') return undefined
  const close = hunk.lines.findIndex((line, i) => i > 0 && line.trim() === '---')
  if (close === -1) return undefined
  const doc = parseDocument(hunk.lines.slice(1, close).join('\n'))
  if (doc.errors.length > 0) return undefined
  const data = doc.toJS() as unknown
  return typeof data === 'object' && data !== null && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : undefined
}

const asValue = (value: unknown): FieldValue => {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  return undefined
}

const same = (a: FieldValue, b: FieldValue) => JSON.stringify(a) === JSON.stringify(b)

export const readHistory = (
  git: GitRepository,
  workspaceRoot: string,
  options: HistoryOptions,
): Effect.Effect<History, GitError, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* () {
    const map = yield* pathMap(git, workspaceRoot)
    const tracked = options.fields ?? defaultTrackedFields
    const prefix = `${options.contentRoot.replace(/\/$/, '')}/`

    const commits: ReadonlyArray<CommitPatch> = yield* git.patchLog({
      paths: [map.toGit(options.contentRoot)],
      context: 200,
      ...(options.after === undefined ? {} : { after: options.after }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    })

    const items = new Map<string, Builder>()
    const pathId = new Map<string, string>()
    const windowed = options.after !== undefined || options.limit !== undefined

    for (const commit of [...commits].reverse()) {
      for (const patch of commit.patches) {
        const path = map.fromGit(patch.path)
        if (path === undefined || !path.startsWith(prefix) || !path.toLowerCase().endsWith('.md'))
          continue
        if (
          path
            .slice(prefix.length)
            .split('/')
            .some((part) => part.startsWith('.') || part === 'assets')
        )
          continue
        if (inReservedFolder(path.slice(prefix.length))) continue

        const front = frontmatterAfter(patch)
        const known = pathId.get(path)
        const id = front && typeof front.id === 'string' && front.id !== '' ? front.id : known

        if (front === null) {
          pathId.delete(path)
          if (id === undefined) continue
        } else if (id !== undefined) {
          pathId.set(path, id)
        }
        if (id === undefined) continue

        let item = items.get(id)
        if (item === undefined) {
          item = {
            id,
            type: undefined,
            paths: [],
            transitions: [],
            fields: new Map(),
            authors: new Map(),
            created: undefined,
            deletedAt: undefined,
            commits: 0,
            lastCounted: undefined,
          }
          items.set(id, item)
        }
        if (!item.paths.includes(path)) item.paths.push(path)
        if (front && typeof front.type === 'string') item.type = front.type
        if (item.created === undefined && patch.added) {
          item.created = { hash: commit.hash, date: commit.committerDate, author: commit.author }
        }
        item.deletedAt = front === null ? commit.committerDate : undefined

        if (item.lastCounted !== commit.hash) {
          item.lastCounted = commit.hash
          item.commits++
          const key = (commit.author.email || commit.author.name).toLowerCase()
          const seen = item.authors.get(key)
          const day = utcDay(commit.committerDate)
          if (seen === undefined) {
            item.authors.set(key, { author: commit.author, commits: 1, first: day, last: day })
          } else {
            seen.commits++
            if (day > seen.last) seen.last = day
            if (day < seen.first) seen.first = day
          }
        }

        if (!front) continue
        const firstSight = item.fields.size === 0 && item.transitions.length === 0
        for (const field of tracked) {
          const next = asValue(front[field])
          const before = item.fields.get(field)
          if (same(before, next)) continue
          item.fields.set(field, next)
          const kind = patch.added
            ? 'created'
            : before === undefined && (windowed || firstSight)
              ? 'seen'
              : 'changed'
          item.transitions.push({
            id,
            type: item.type,
            field,
            from: before,
            to: next,
            kind,
            hash: commit.hash,
            date: commit.committerDate,
            author: commit.author,
          })
        }
      }
    }

    const result = new Map<string, ItemHistory>()
    for (const [id, b] of items) {
      result.set(id, {
        id,
        type: b.type,
        paths: b.paths,
        transitions: b.transitions.map((t) => ({ ...t, type: b.type })),
        authors: [...b.authors.values()]
          .map((a) => ({ ...a.author, commits: a.commits, first: a.first, last: a.last }))
          .sort(
            (x, y) =>
              y.commits - x.commits ||
              (x.last < y.last ? 1 : x.last > y.last ? -1 : 0) ||
              x.email.localeCompare(y.email),
          ),
        created: b.created,
        deletedAt: b.deletedAt,
        commits: b.commits,
      })
    }
    return {
      items: result,
      commits: commits.length,
      log: commits.map((c) => ({ hash: c.hash, date: c.committerDate })),
      partial: git.shallow || windowed,
    }
  })
