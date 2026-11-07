import { Schema } from 'effect'
import { EdgeKindName, N, opt, S } from './common'

export const NodeStatus = Schema.Literals(['backlog', 'progress', 'hold', 'done'])

export const GraphNode = Schema.Struct({
  id: S,
  type: S,
  title: S,
  path: S,
  status: Schema.optionalKey(NodeStatus),
  progress: Schema.optionalKey(N),
  parent: Schema.optionalKey(S),
  since: Schema.optionalKey(S),
  stale: Schema.optionalKey(Schema.Boolean),
})

export const GraphEdge = Schema.Struct({ from: S, to: S, kind: EdgeKindName })

export const GraphQuery = {
  asOf: opt(S),
}

export const Graph = Schema.Struct({
  nodes: Schema.Array(GraphNode),
  edges: Schema.Array(GraphEdge),
  asOf: Schema.optionalKey(S),
  approximate: Schema.optionalKey(Schema.Boolean),
})
