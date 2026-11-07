import { markReviewed } from '@netherite/core'
import { opSummary } from '../opSummary'
import type { ToolContext, ToolEntry } from '../server.types'

export const markReviewedTool = (ctx: ToolContext): ToolEntry => {
  const { repo, withHash, effectTool } = ctx
  return {
    write: true,
    handle: effectTool((r) => {
      const id = r.id('id')
      const date = r.string('date', { pattern: /^\d{4}-\d{2}-\d{2}$/ })
      const baseHash = withHash(r)
      if (id === undefined) return undefined
      return markReviewed(repo, id, {
        ...(date ? { date } : {}),
        ...(baseHash ? { baseHash } : {}),
      })
    }, opSummary),
  }
}
