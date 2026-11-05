import type { GraphData } from './layout'

type NodeLike = GraphData['nodes'][number]

/**
 * Where opening a node in the graph goes: a goal and a project to their pages, a task to its
 * drawer on its project's board (the project is found through the task's `belongs_to` link), and
 * anything else to its item page.
 */
export const graphTarget = (node: NodeLike, data: GraphData) => {
  if (node.type === 'goal') return { to: '/goals/$id', params: { id: node.id } } as const
  if (node.type === 'project') return { to: '/projects/$id', params: { id: node.id } } as const
  if (node.type === 'task') {
    const projects = new Set(data.nodes.filter((n) => n.type === 'project').map((n) => n.id))
    const project = data.edges.find(
      (e) => e.from === node.id && e.kind === 'belongs_to' && projects.has(e.to),
    )?.to
    if (project !== undefined) {
      return { to: '/projects/$id', params: { id: project }, search: { task: node.id } } as const
    }
  }
  return { to: '/items/$id', params: { id: node.id } } as const
}
