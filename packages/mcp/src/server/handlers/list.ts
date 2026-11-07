import { graphAsOf, itemTypes, listItems, settingDefaults } from '@netherite/core'
import { describeError, ok } from '../../errors'
import type { ToolContext, ToolEntry } from '../server.types'

export const listTool = (ctx: ToolContext): ToolEntry => {
  const { repo, history, asOfProblem, noHistory } = ctx
  return {
    write: false,
    handle: async (r) => {
      const type = r.oneOf('type', itemTypes)
      const status = r.string('status')
      const project = r.string('project')
      const tag = r.string('tag')
      const limit =
        r.integer('limit', { min: 1, max: settingDefaults.queries.listMaxLimit }) ??
        settingDefaults.queries.listLimit
      const offset = r.integer('offset', { min: 0 }) ?? 0
      const asOf = r.string('as_of')
      const problem = r.check()
      if (problem !== undefined) return describeError(problem)
      const badDate = asOfProblem(asOf)
      if (badDate !== undefined) return badDate
      if (asOf !== undefined) {
        if (tag !== undefined)
          return describeError({
            _tag: 'ValidationError',
            issues: [{ path: ['tag'], message: 'tag cannot be combined with as_of' }],
          })
        const past = await history()
        if (past === undefined) return noHistory()
        const graph = graphAsOf(repo, past, { asOf, now: new Date().toISOString() })
        const all = graph.nodes
          .filter(
            (n) =>
              (type === undefined || n.type === type) &&
              (project === undefined || n.parent === project) &&
              (status === undefined || n.status === status),
          )
          .sort((a, b) => a.id.localeCompare(b.id))
        return ok({
          asOf: graph.asOf,
          approximate: graph.approximate,
          total: all.length,
          offset,
          items: all.slice(offset, offset + limit),
        })
      }
      return ok(listItems(repo, { type, status, project, tag, limit, offset }))
    },
  }
}
