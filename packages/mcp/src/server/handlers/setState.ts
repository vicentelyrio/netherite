import { setState } from '@netherite/core'
import { opSummary } from '../opSummary'
import type { ToolContext, ToolEntry } from '../server.types'

export const setStateTool = (ctx: ToolContext): ToolEntry => {
  const { repo, withHash, effectTool } = ctx
  return {
    write: true,
    handle: effectTool((r) => {
      const id = r.id('id')
      const state = r.string('state', { required: true })
      const by = r.id('superseded_by', false)
      const baseHash = withHash(r)
      if (id === undefined || state === undefined) return undefined
      return setState(repo, id, state, {
        ...(by ? { supersededBy: by } : {}),
        ...(baseHash ? { baseHash } : {}),
      })
    }, opSummary),
  }
}
