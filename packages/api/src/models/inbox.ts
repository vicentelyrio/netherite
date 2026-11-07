import { Schema } from 'effect'
import { N, opt, S } from './common'
import { ItemSummary } from './items'
import { Diagnostic } from './lint'

export const InboxQuery = {
  since: opt(S),
}

export const Raised = Schema.Struct({
  key: S,
  rule: Schema.Literals([
    'stale-doc',
    'proposed-adr',
    'orphan',
    'overdue-task',
    'closing-commit',
    'new-todo',
    'similar-tag',
  ]),
  title: S,
  detail: S,
  id: opt(S),
  path: opt(S),
  line: opt(N),
  date: opt(S),
  commit: opt(S),
})

export const CapturePayload = Schema.Struct({ text: S })

export const CaptureQuery = { text: S }

export const CaptureResult = Schema.Struct({ text: S })

export const CaptureRemoved = Schema.Struct({ removed: Schema.Boolean })

export const Inbox = Schema.Struct({
  captures: Schema.Array(CaptureResult),
  raised: Schema.Array(Raised),
  changes: Schema.Array(
    Schema.Struct({
      path: S,
      change: S,
      id: opt(S),
      title: opt(S),
      type: opt(S),
    }),
  ),
  activity: Schema.Array(
    Schema.Struct({
      id: S,
      path: S,
      count: N,
      tools: Schema.Array(S),
      first: S,
      last: S,
      deleted: Schema.Boolean,
    }),
  ),
  proposed: Schema.Array(ItemSummary),
  freshness: Schema.Array(
    Schema.Struct({
      id: S,
      title: S,
      path: S,
      state: Schema.Literals(['drifting', 'stale']),
      commits: N,
    }),
  ),
  orphans: Schema.Array(ItemSummary),
  errors: Schema.Array(Diagnostic),
  blocked: Schema.Array(ItemSummary),
})
