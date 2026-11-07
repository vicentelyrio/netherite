import { createItem, type ItemType, itemTypes } from '@netherite/core'
import { opSummary } from '../opSummary'
import type { ToolContext, ToolEntry } from '../server.types'

export const createTool = (ctx: ToolContext): ToolEntry => {
  const { repo, effectTool, options } = ctx
  return {
    write: true,
    handle: effectTool((r) => {
      const type = r.oneOf('type', itemTypes, true)
      const title = r.string('title', { required: true })
      const explicit = r.id('id', false)
      const fields = r.object('fields')
      const body = r.string('body')
      const createdBy = r.string('created_by') ?? options.createdBy
      if (type === undefined || title === undefined) return undefined
      return createItem(repo, {
        type: type as ItemType,
        title,
        ...(explicit === undefined ? {} : { id: explicit }),
        ...(fields === undefined ? {} : { fields: fields as never }),
        ...(body === undefined ? {} : { body }),
        ...(createdBy === undefined ? {} : { createdBy }),
      })
    }, opSummary),
  }
}
