import { Schema } from 'effect'
import { N, opt, S } from './common'
import { LinkView } from './items'

export const KnowledgeRow = Schema.Struct({
  id: S,
  type: S,
  title: S,
  path: S,
  status: opt(S),
  projects: Schema.Array(S),
  tags: Schema.Array(S),
  freshness: Schema.NullOr(Schema.Literals(['fresh', 'drifting', 'stale', 'unknown'])),
  orphan: Schema.Boolean,
  commits: N,
  date: opt(S),
  supersedes: Schema.Array(S),
  supersededBy: Schema.Array(S),
  handle: opt(S),
  aiTokens: Schema.NullOr(N),
  explains: Schema.Record(S, N),
})

export type KnowledgeRow = typeof KnowledgeRow.Type

export const KnowledgeList = Schema.Struct({ items: Schema.Array(KnowledgeRow) })

export const CoChangedFile = Schema.Struct({ path: S, commits: N, share: N, last: S })

export const CommitView = Schema.Struct({ hash: S, subject: S, date: S, author: S })

export const KnowledgePreview = Schema.Struct({
  id: S,
  summary: S,
  backlinks: Schema.Array(LinkView),
  coChanged: Schema.NullOr(
    Schema.Struct({
      itemCommits: N,
      files: Schema.Array(CoChangedFile),
      partial: Schema.Boolean,
    }),
  ),
  lastCommit: opt(CommitView),
  source: opt(S),
  importedAt: opt(S),
})

export type KnowledgePreview = typeof KnowledgePreview.Type

export const ChainLink = Schema.Struct({ id: S, title: S, status: opt(S) })

export const ContextTargetView = Schema.Struct({
  target: S,
  path: S,
  included: Schema.Boolean,
  omitted: Schema.Boolean,
  tokens: N,
  budget: N,
  stale: Schema.Boolean,
})

export const KnowledgeView = Schema.Struct({
  id: S,
  chain: Schema.Array(ChainLink),
  changes: Schema.NullOr(
    Schema.Struct({
      since: Schema.NullOr(S),
      commits: Schema.Array(CommitView),
      uncommitted: Schema.Array(S),
      covers: Schema.Array(S),
    }),
  ),
  context: Schema.NullOr(
    Schema.Struct({
      include: Schema.Boolean,
      targets: Schema.Array(ContextTargetView),
    }),
  ),
})

export type KnowledgeView = typeof KnowledgeView.Type
