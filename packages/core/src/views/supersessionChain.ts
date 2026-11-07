import { RelationKind } from '@netherite/schema'
import type { Repo } from '../ops/repo'
import type { ScannedItem } from '../scanned-item'
import { fieldsOf } from './fieldsOf'

export interface ChainLink {
  readonly id: string
  readonly title: string
  readonly status: string | undefined
}

export const supersessionChain = (repo: Repo, item: ScannedItem): ChainLink[] => {
  const link = (i: ScannedItem): ChainLink => ({
    id: i.id as string,
    title: i.title ?? (i.id as string),
    status: typeof fieldsOf(i).status === 'string' ? (fieldsOf(i).status as string) : undefined,
  })
  const seen = new Set([item.path])
  const walk = (from: ScannedItem, older: boolean): ScannedItem[] => {
    const out: ScannedItem[] = []
    let current = from
    for (;;) {
      const edges = older
        ? repo.index.outgoing(current.path).filter((e) => e.kind === RelationKind.Supersedes)
        : repo.index.backlinks(current.path).filter((e) => e.kind === RelationKind.Supersedes)
      const next = edges
        .map((e) => repo.index.get(older ? e.to : e.from))
        .find((i): i is ScannedItem => i !== undefined && i.id !== undefined && !seen.has(i.path))
      if (next === undefined) return out
      seen.add(next.path)
      out.push(next)
      current = next
    }
  }
  return [...walk(item, true).reverse(), item, ...walk(item, false)].map(link)
}
