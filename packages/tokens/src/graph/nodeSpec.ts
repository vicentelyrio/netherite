import type { ItemTypeName } from '../color'
import type { NodeSpec } from './graph.types'

export const nodeSpec: Readonly<Record<ItemTypeName, NodeSpec>> = {
  goal: { shape: 'circle', radius: 15 },
  project: { shape: 'circle', radius: 10.5 },
  task: { shape: 'circle', radius: 6 },
  adr: { shape: 'diamond', radius: 8 },
  doc: { shape: 'square', radius: 7.5 },
  context: { shape: 'ring', radius: 7.5 },
  runbook: { shape: 'bar', radius: 7 },
}
