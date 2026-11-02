import { designColor as color, type ItemTypeName, nodeSpec } from '@netherite/ui'

interface Node {
  readonly id: string
  readonly type: ItemTypeName
  readonly title: string
}

export interface Branch extends Node {
  readonly leaves: ReadonlyArray<Node>
}

export const nodeTitle = (nodes: ReadonlyArray<{ id: string; title: string }>, id: string) =>
  nodes.find((n) => n.id === id)?.title ?? id

const size = 520

/**
 * One node in the middle, its branches around it and each branch's leaves around that, drawn with
 * the design's node sizes and colours at 1.25 scale.
 */
export function RadialGraph({
  root,
  branches,
  label,
}: {
  readonly root: Node
  readonly branches: ReadonlyArray<Branch>
  readonly label: string
}) {
  const mid = size / 2
  const placed: Array<Node & { x: number; y: number; parent?: string }> = [
    { ...root, x: mid, y: mid },
  ]
  branches.forEach((branch, i) => {
    const angle = (2 * Math.PI * i) / Math.max(branches.length, 1)
    const x = mid + Math.cos(angle) * 120
    const y = mid + Math.sin(angle) * 120
    placed.push({ ...branch, x, y, parent: root.id })
    branch.leaves.forEach((leaf, j) => {
      const a = angle + (j - (branch.leaves.length - 1) / 2) * 0.35
      placed.push({
        ...leaf,
        x: x + Math.cos(a) * 80,
        y: y + Math.sin(a) * 80,
        parent: branch.id,
      })
    })
  })
  const at = new Map(placed.map((n) => [n.id, n]))
  return (
    <svg className="goal-graph" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      {placed.map((n) => {
        const parent = n.parent ? at.get(n.parent) : undefined
        return parent ? (
          <line
            key={`e-${n.id}`}
            x1={parent.x}
            y1={parent.y}
            x2={n.x}
            y2={n.y}
            stroke={color.graph.edge}
            strokeOpacity={0.45}
          />
        ) : null
      })}
      {placed.map((n) => (
        <circle
          key={n.id}
          cx={n.x}
          cy={n.y}
          r={nodeSpec[n.type].radius * 1.25}
          fill={color.type[n.type]}
        >
          <title>{`${n.id} ${n.title}`}</title>
        </circle>
      ))}
    </svg>
  )
}
