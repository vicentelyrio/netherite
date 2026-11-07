import { deleteItem } from '@netherite/core'
import type { ToolContext, ToolEntry } from '../server.types'

export const deleteTool = (ctx: ToolContext): ToolEntry => {
  const { repo, withHash, effectTool } = ctx
  return {
    write: true,
    handle: effectTool(
      (r) => {
        const id = r.id('id')
        const force = r.boolean('force')
        const baseHash = withHash(r)
        if (id === undefined) return undefined
        return deleteItem(repo, id, {
          ...(force ? { force } : {}),
          ...(baseHash ? { baseHash } : {}),
        })
      },
      (d) => ({ deleted: d.id, path: d.path }),
    ),
  }
}
