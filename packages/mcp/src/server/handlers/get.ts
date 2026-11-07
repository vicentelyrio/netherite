import { graphAsOf, itemDetail, lifecycles, type ScannedItem } from '@netherite/core'
import { describeError, ok } from '../../errors'
import type { ToolContext, ToolEntry } from '../server.types'

export const getTool = (ctx: ToolContext): ToolEntry => {
  const { repo, freshness, history, asOfProblem, noHistory, locate } = ctx
  return {
    write: false,
    handle: async (r) => {
      const id = r.id('id')
      const asOf = r.string('as_of')
      const problem = r.check()
      if (problem !== undefined) return describeError(problem)
      const badDate = asOfProblem(asOf)
      if (badDate !== undefined) return badDate
      const found = locate(id as string)
      if (found.error) return found.error
      const item = found.item as ScannedItem
      if (asOf !== undefined) {
        const past = await history()
        if (past === undefined) return noHistory()
        const now = new Date().toISOString()
        const graph = graphAsOf(repo, past, { asOf, now })
        const node = graph.nodes.find((n) => n.id === id)
        const life = lifecycles(past, { states: repo.workspace.config.states, now }).get(
          id as string,
        )
        const until = Date.parse(graph.asOf)
        return ok({
          id,
          asOf: graph.asOf,
          existed: node !== undefined,
          approximate: graph.approximate,
          ...(node === undefined ? {} : { state: node }),
          events: (life?.events ?? []).filter((e) => Date.parse(e.date) <= until),
        })
      }
      return ok(itemDetail(repo, item, await freshness()))
    },
  }
}
