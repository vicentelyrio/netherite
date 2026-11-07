import { relation } from '../relation'
import type { ToolContext, ToolEntry } from '../server.types'

export const unlinkTool = (ctx: ToolContext): ToolEntry => {
  return { write: true, handle: relation(ctx, 'unlink') }
}
