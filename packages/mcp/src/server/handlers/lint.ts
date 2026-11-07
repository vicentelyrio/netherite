import { lint, type ScannedItem, summarize } from '@netherite/core'
import { describeError, ok } from '../../errors'
import type { ToolContext, ToolEntry } from '../server.types'

export const lintTool = (ctx: ToolContext): ToolEntry => {
  const { repo, freshness, locate } = ctx
  return {
    write: false,
    handle: async (r) => {
      const id = r.id('id', false)
      const problem = r.check()
      if (problem !== undefined) return describeError(problem)
      let only: string[] | undefined
      if (id !== undefined) {
        const found = locate(id)
        if (found.error) return found.error
        only = [(found.item as ScannedItem).path]
      }
      const fresh = await freshness()
      const diagnostics = lint(repo.index, {
        config: repo.workspace.config,
        contentRoot: repo.contentRoot,
        ...(only ? { only } : {}),
        ...(fresh ? { freshness: fresh } : {}),
      })
      return ok({ summary: summarize(diagnostics), diagnostics })
    },
  }
}
