import { relation } from '../relation'
import type { ToolContext, ToolEntry } from '../server.types'

export const linkTool = (ctx: ToolContext): ToolEntry => {
  return { write: true, handle: relation(ctx, 'link') }
}
