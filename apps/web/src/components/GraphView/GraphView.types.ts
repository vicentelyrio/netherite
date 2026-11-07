import type { GraphData, GraphNodeData } from './layout'

export type NodeStatus = NonNullable<GraphNodeData['status']>
export type StatusFilter = 'all' | 'open' | 'done'

export interface GraphViewProps {
  readonly data: GraphData
  readonly scope?: ReadonlySet<string> | undefined
  readonly label: string
  readonly variant?: 'full' | 'embedded'
  readonly focus?: string | undefined
  readonly legend?: 'panel' | 'row' | 'none'
  readonly labels?: 'focus' | 'neighbors' | 'all'
  readonly nodeScale?: number
  readonly pad?: number
  readonly padBottom?: number
  readonly zoomButtons?: boolean
  readonly glow?: ReadonlySet<string> | undefined
  readonly className?: string
  readonly legendClassName?: string
}
