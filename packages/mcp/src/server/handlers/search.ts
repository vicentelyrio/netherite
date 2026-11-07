import { searchItems, settingDefaults } from '@netherite/core'
import { describeError, ok } from '../../errors'
import type { ToolContext, ToolEntry } from '../server.types'

export const searchTool = (ctx: ToolContext): ToolEntry => {
  const { repo } = ctx
  return {
    write: false,
    handle: (r) => {
      const query = r.string('query', { required: true })
      const types = r.strings('types')
      const status = r.string('status')
      const project = r.string('project')
      const tag = r.string('tag')
      const limit =
        r.integer('limit', { min: 1, max: settingDefaults.queries.searchMaxLimit }) ??
        settingDefaults.queries.searchLimit
      const problem = r.check()
      if (problem !== undefined) return describeError(problem)
      return ok(searchItems(repo, query as string, { types, status, project, tag, limit }))
    },
  }
}
