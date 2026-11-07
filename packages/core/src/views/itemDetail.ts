import { FreshnessState } from '@netherite/schema'
import type { Freshness } from '../freshness'
import { contentHash } from '../ops/hash'
import type { Repo } from '../ops/repo'
import type { ScannedItem } from '../scanned-item'
import type { EdgeKind } from '../workspace-index'
import { itemSummary } from './itemList'

export interface LinkView {
  readonly kind: EdgeKind
  readonly id: string | undefined
  readonly title: string | undefined
  readonly path: string
}

export const itemDetail = (
  repo: Repo,
  item: ScannedItem,
  freshness: ReadonlyMap<string, Freshness> | undefined,
) => {
  const link = (edge: { kind: EdgeKind }, other: string): LinkView => {
    const target = repo.index.get(other)
    return { kind: edge.kind, id: target?.id, title: target?.title, path: other }
  }
  const fresh = freshness?.get(item.path)
  return {
    ...itemSummary(item),
    hash: contentHash(item.parsed.source),
    frontmatter: (item.parsed.frontmatter?.data ?? null) as unknown,
    body: item.parsed.source.slice(item.parsed.bodyStart).replace(/^\r?\n/, ''),
    links: repo.index.outgoing(item.path).map((e) => link(e, e.to)),
    backlinks: repo.index.backlinks(item.path).map((e) => link(e, e.from)),
    unresolved: repo.index
      .refs(item.path)
      .filter(({ resolution }) => resolution.status !== 'resolved')
      .map(({ ref, resolution }) => ({
        target: ref.target,
        field: ref.field,
        status: resolution.status,
      })),
    checklist: item.parsed.checklist.map((c) => ({ text: c.text, checked: c.checked })),
    progress: repo.index.progress(item.path) ?? null,
    orphan: repo.index.isOrphan(item.path),
    freshness:
      fresh && fresh.state !== FreshnessState.NotTracked
        ? {
            state: fresh.state,
            commits: fresh.commits,
            since: fresh.baseline?.date ?? null,
            atLeast: fresh.atLeast,
          }
        : null,
  }
}
