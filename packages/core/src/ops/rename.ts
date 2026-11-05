import { outlineMarkdown } from '@netherite/markdown'
import { Effect } from 'effect'
import { AlreadyExists, NotFound } from '../errors'
import { toScannedItem } from '../scanned-item'
import { contentHash } from './hash'
import { applyChanges, type Change, readText } from './io'
import type { OpEnv, OpError, OpResult } from './operations'
import type { Repo } from './repo'

const stem = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/i, '')

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Moves an item's file to another path, keeping its ID. Links written by file name
 * (`[[TASK-00001-core]]`) are rewritten to follow, in every file that has one. Links by ID or
 * title are not affected by a rename. Fails if something is already at the new path.
 */
export const renameFile = (
  repo: Repo,
  from: string,
  to: string,
): Effect.Effect<
  OpResult & { readonly oldPath: string; readonly rewritten: ReadonlyArray<string> },
  OpError,
  OpEnv
> =>
  Effect.gen(function* () {
    const item = repo.index.get(from)
    if (item === undefined) return yield* new NotFound({ id: from })
    if (from === to) {
      return {
        id: item.id ?? '',
        path: from,
        item,
        hash: contentHash(item.parsed.source),
        changed: [],
        unchanged: true,
        oldPath: from,
        rewritten: [],
      }
    }
    if (repo.index.get(to) !== undefined) return yield* new AlreadyExists({ path: to })

    const source = yield* readText(repo, from)
    const oldName = stem(from)
    const newName = stem(to)

    const referrers = new Set<string>()
    for (const edge of repo.index.incoming(from)) if (edge.from !== from) referrers.add(edge.from)

    const changes: Change[] = [{ path: from, content: null, before: source }]
    const rewritten: string[] = []
    for (const referrer of [...referrers].sort()) {
      const text = yield* readText(repo, referrer)
      const links = outlineMarkdown(text).links.filter((link) => {
        const resolution = repo.index.resolver.resolve(link.target, link.heading)
        return (
          resolution.status === 'resolved' &&
          resolution.via === 'file' &&
          resolution.item.path === from
        )
      })
      let next = text
      for (const link of [...links].reverse()) {
        const target = link.target.replace(new RegExp(`${escapeRegExp(oldName)}$`, 'i'), newName)
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
    changes.push({ path: to, content: source, before: null })
    yield* applyChanges(repo, changes)

    const result = repo.index.get(to) ?? toScannedItem(to, source)
    return {
      id: result.id ?? '',
      path: to,
      item: result,
      hash: contentHash(source),
      changed: changes.map((c) => c.path),
      unchanged: false,
      oldPath: from,
      rewritten,
    }
  })
