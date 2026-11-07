import { AdrStatus, FreshnessState, ItemType, RelationKind } from '@netherite/schema'
import { estimateTokens } from '../context-bundle'
import type { Freshness } from '../freshness'
import type { Repo } from '../ops/repo'
import { fieldsOf } from './fieldsOf'
import { strings } from './views.helpers'

const knowledgeKinds = new Set(['adr', 'doc', 'context', 'runbook'])

export interface KnowledgeRow {
  readonly id: string
  readonly type: string
  readonly title: string
  readonly path: string
  readonly status: string | undefined
  readonly projects: ReadonlyArray<string>
  readonly tags: ReadonlyArray<string>
  readonly freshness: 'fresh' | 'drifting' | 'stale' | 'unknown' | null
  readonly orphan: boolean
  readonly commits: number
  readonly date: string | undefined
  readonly supersedes: ReadonlyArray<string>
  readonly supersededBy: ReadonlyArray<string>
  readonly handle: string | undefined
  readonly aiTokens: number | null
  readonly explains: Readonly<Record<string, number>>
}

const explainsOf = (repo: Repo, path: string): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const edge of repo.index.outgoing(path)) {
    if (edge.kind !== RelationKind.Explains) continue
    const type = repo.index.get(edge.to)?.type
    if (type !== undefined && type !== ItemType.Project) counts[type] = (counts[type] ?? 0) + 1
  }
  return counts
}

export const knowledgeRows = (
  repo: Repo,
  freshness: ReadonlyMap<string, Freshness> | undefined,
): KnowledgeRow[] => {
  const idsOf = (paths: ReadonlyArray<string>) =>
    paths.flatMap((p) => {
      const id = repo.index.get(p)?.id
      return id === undefined ? [] : [id]
    })
  return repo.index
    .items()
    .filter((i) => knowledgeKinds.has(i.type ?? '') && i.id !== undefined)
    .sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))
    .map((item) => {
      const f = fieldsOf(item)
      const neighbours = [
        ...repo.index.outgoing(item.path).map((e) => e.to),
        ...repo.index.backlinks(item.path).map((e) => e.from),
      ]
      const projects = [
        ...new Set(
          neighbours.flatMap((path) => {
            const other = repo.index.get(path)
            return other?.type === ItemType.Project && other.id !== undefined ? [other.id] : []
          }),
        ),
      ].sort()
      const fresh = freshness?.get(item.path)
      const date = f.reviewed_at ?? f.date ?? f.created
      return {
        id: item.id as string,
        type: item.type as string,
        title: item.title ?? (item.id as string),
        path: item.path,
        status: typeof f.status === 'string' ? f.status : undefined,
        projects,
        tags: strings(f.tags),
        freshness:
          fresh === undefined || fresh.state === FreshnessState.NotTracked
            ? null
            : (fresh.state as 'fresh' | 'drifting' | 'stale' | 'unknown'),
        orphan: repo.index.isOrphan(item.path),
        commits: fresh?.commits ?? 0,
        supersedes: idsOf(
          repo.index
            .outgoing(item.path)
            .filter((e) => e.kind === RelationKind.Supersedes)
            .map((e) => e.to),
        ),
        supersededBy: idsOf(
          repo.index
            .backlinks(item.path)
            .filter((e) => e.kind === RelationKind.Supersedes)
            .map((e) => e.from),
        ),
        handle:
          [f.owner, f.created_by].find((v): v is string => typeof v === 'string' && v !== '') ??
          undefined,
        aiTokens:
          item.type === ItemType.Context &&
          f.include_in_context === true &&
          f.status !== AdrStatus.Superseded &&
          f.status !== AdrStatus.Deprecated
            ? estimateTokens(item.parsed.source.slice(item.parsed.bodyStart))
            : null,
        explains: explainsOf(repo, item.path),
        date:
          typeof date === 'string'
            ? date
            : date instanceof Date
              ? date.toISOString().slice(0, 10)
              : undefined,
      }
    })
}

export const summaryOf = (body: string): string => {
  const paragraphs = body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '' && !p.startsWith('#') && !/^[-*]\s|^\d+\.\s|^```/.test(p))
  const first = paragraphs[0] ?? ''
  return first
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 400)
}
