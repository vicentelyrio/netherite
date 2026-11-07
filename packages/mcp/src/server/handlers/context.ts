import { buildContext } from '@netherite/core'
import { describeError, ok } from '../../errors'
import type { ToolContext, ToolEntry } from '../server.types'

export const contextTool = (ctx: ToolContext): ToolEntry => {
  const { repo } = ctx
  return {
    write: false,
    handle: (r) => {
      const project = r.id('project', false)
      const problem = r.check()
      if (problem !== undefined) return describeError(problem)
      const bundle = buildContext(repo.index, {
        budget: repo.workspace.config.context.budget,
        target: 'mcp',
        ...(project ? { project } : {}),
      })
      return ok(bundle)
    },
  }
}
