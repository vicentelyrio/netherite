import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import Graph from 'graphology'

export interface GraphNodeData {
  readonly id: string
  readonly type: string
  readonly title: string
}

export interface GraphEdgeData {
  readonly from: string
  readonly to: string
  readonly kind: string
}

export interface GraphData {
  readonly nodes: ReadonlyArray<GraphNodeData>
  readonly edges: ReadonlyArray<GraphEdgeData>
}

export interface Placed extends GraphNodeData {
  readonly x: number
  readonly y: number
}

/** The nodes in `scope` and the edges between them. No scope is the whole graph. */
export const subgraph = (data: GraphData, scope?: ReadonlySet<string>): GraphData => {
  if (scope === undefined) return data
  return {
    nodes: data.nodes.filter((n) => scope.has(n.id)),
    edges: data.edges.filter((e) => scope.has(e.from) && scope.has(e.to)),
  }
}

/** The graph as graphology holds it, for asking who is next to whom. Edges to missing nodes are left out. */
export const toGraphology = (data: GraphData): Graph => {
  const graph = new Graph({ multi: true, type: 'undirected' })
  for (const n of data.nodes) graph.addNode(n.id)
  for (const e of data.edges) {
    if (graph.hasNode(e.from) && graph.hasNode(e.to) && e.from !== e.to) {
      graph.addEdge(e.from, e.to, { kind: e.kind })
    }
  }
  return graph
}

/** The nodes next to `id`, and `id` itself. */
export const neighbourhood = (graph: Graph, id: string): Set<string> =>
  graph.hasNode(id) ? new Set([id, ...graph.neighbors(id)]) : new Set()

interface SimNode extends SimulationNodeDatum {
  id: string
  type: string
}

/** How strongly an edge pulls its ends together: belonging is tight, a mention is loose. */
const linkStrength = (kind: string) =>
  kind === 'belongs_to' ? 0.9 : kind === 'reference' ? 0.1 : 0.35

const bigger = (type: string) => (type === 'goal' ? 34 : type === 'project' ? 26 : 18)

/** The forces over some nodes: links pull, nodes push apart, and everything drifts to the middle. */
const buildSimulation = (data: GraphData, nodes: SimNode[]) => {
  const known = new Set(nodes.map((n) => n.id))
  const links: Array<SimulationLinkDatum<SimNode> & { kind: string }> = data.edges
    .filter((e) => known.has(e.from) && known.has(e.to) && e.from !== e.to)
    .map((e) => ({ source: e.from, target: e.to, kind: e.kind }))
  return forceSimulation(nodes)
    .randomSource(() => 0.5)
    .force(
      'link',
      forceLink<SimNode, (typeof links)[number]>(links)
        .id((n) => n.id)
        .distance(70)
        .strength((l) => linkStrength(l.kind)),
    )
    .force(
      'charge',
      forceManyBody<SimNode>().strength((n) => -(n.type === 'goal' ? 420 : 160)),
    )
    .force(
      'collide',
      forceCollide<SimNode>().radius((n) => bigger(n.type)),
    )
    .force('x', forceX(0).strength(0.09))
    .force('y', forceY(0).strength(0.09))
    .force('center', forceCenter(0, 0))
}

/**
 * Places the nodes with a force simulation run to rest, so the picture is the same every time the
 * same graph is drawn and does not move under the pointer. Nodes start on a circle, in order.
 */
export const layout = (
  data: GraphData,
  options: { readonly ticks?: number } = {},
): ReadonlyArray<Placed> => {
  const count = data.nodes.length
  if (count === 0) return []
  const radius = 40 * Math.sqrt(count)
  const nodes: SimNode[] = data.nodes.map((n, i) => ({
    id: n.id,
    type: n.type,
    x: Math.cos((2 * Math.PI * i) / count) * radius,
    y: Math.sin((2 * Math.PI * i) / count) * radius,
  }))
  const simulation = buildSimulation(data, nodes).stop()
  simulation.tick(options.ticks ?? Math.min(400, 120 + count))

  const byId = new Map(nodes.map((n) => [n.id, n]))
  return data.nodes.map((n) => {
    const placed = byId.get(n.id) as SimNode
    return { ...n, x: placed.x ?? 0, y: placed.y ?? 0 }
  })
}

export interface Live {
  /** Holds a node at a place in layout space; the others move to make room. */
  readonly hold: (id: string, x: number, y: number) => void
  /** Lets the node go, and the picture settle. */
  readonly release: (id: string) => void
  /** Called after every step with where each node is now. */
  readonly onTick: (listener: (at: ReadonlyMap<string, { x: number; y: number }>) => void) => void
  readonly stop: () => void
}

/**
 * A simulation that runs while a node is being dragged, starting from where the nodes are now.
 * Dragging a node pulls the ones linked to it, and letting go lets them settle.
 */
export const live = (data: GraphData, from: ReadonlyArray<Placed>): Live => {
  const nodes: SimNode[] = from.map((p) => ({ id: p.id, type: p.type, x: p.x, y: p.y }))
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const simulation = buildSimulation(data, nodes).alphaDecay(0.05).stop()
  let listener: ((at: ReadonlyMap<string, { x: number; y: number }>) => void) | undefined
  simulation.on('tick', () => {
    listener?.(new Map(nodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }])))
  })
  return {
    hold: (id, x, y) => {
      const node = byId.get(id)
      if (node === undefined) return
      node.fx = x
      node.fy = y
      simulation.alphaTarget(0.3).restart()
    },
    release: (id) => {
      const node = byId.get(id)
      if (node !== undefined) {
        node.fx = null
        node.fy = null
      }
      simulation.alphaTarget(0)
    },
    onTick: (l) => {
      listener = l
    },
    stop: () => {
      simulation.stop()
      listener = undefined
    },
  }
}

export interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** The zoom and offset that fit these points in a view, with `pad` to spare. */
export const fitTo = (
  points: ReadonlyArray<{ x: number; y: number }>,
  view: { width: number; height: number },
  pad = 60,
  padBottom = pad,
  maxZoom = 2,
): { x: number; y: number; k: number } => {
  if (points.length === 0) return { x: view.width / 2, y: view.height / 2, k: 1 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)]
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)]
  const w = Math.max(maxX - minX, 1)
  const h = Math.max(maxY - minY, 1)
  const k = Math.min(maxZoom, (view.width - pad * 2) / w, (view.height - pad - padBottom) / h)
  return {
    k,
    x: view.width / 2 - ((minX + maxX) / 2) * k,
    y: pad + (view.height - pad - padBottom) / 2 - ((minY + maxY) / 2) * k,
  }
}
