import type { ToolContext, ToolEntry } from '../server.types'
import { contextTool } from './context'
import { createTool } from './create'
import { deleteTool } from './delete'
import { getTool } from './get'
import { linkTool } from './link'
import { lintTool } from './lint'
import { listTool } from './list'
import { markReviewedTool } from './markReviewed'
import { searchTool } from './search'
import { setStateTool } from './setState'
import { toggleCheckTool } from './toggleCheck'
import { unlinkTool } from './unlink'
import { updateTool } from './update'

export const toolHandlers = (ctx: ToolContext): Readonly<Record<string, ToolEntry>> => ({
  search: searchTool(ctx),
  get: getTool(ctx),
  list: listTool(ctx),
  create: createTool(ctx),
  update: updateTool(ctx),
  set_state: setStateTool(ctx),
  toggle_check: toggleCheckTool(ctx),
  link: linkTool(ctx),
  unlink: unlinkTool(ctx),
  delete: deleteTool(ctx),
  mark_reviewed: markReviewedTool(ctx),
  lint: lintTool(ctx),
  context: contextTool(ctx),
})
