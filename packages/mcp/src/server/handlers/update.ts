import { updateItem } from '@netherite/core'
import { Effect } from 'effect'
import { describeError, ok } from '../../errors'
import { opSummary } from '../opSummary'
import type { ToolContext, ToolEntry } from '../server.types'

export const updateTool = (ctx: ToolContext): ToolEntry => {
  const { repo, run, cache, withHash, noteWrite } = ctx
  return {
    write: true,
    handle: async (r) => {
      const id = r.id('id')
      const set = r.object('set')
      const unset = r.strings('unset')
      const section = r.object('section')
      const baseHash = withHash(r)
      const heading = section && typeof section.heading === 'string' ? section.heading : undefined
      const content = section && typeof section.content === 'string' ? section.content : undefined
      const mode = section?.mode
      if (section !== undefined) {
        if (heading === undefined)
          r.issues.push({ path: ['section', 'heading'], message: 'Required' })
        if (content === undefined)
          r.issues.push({ path: ['section', 'content'], message: 'Required' })
        if (mode !== undefined && mode !== 'replace' && mode !== 'append' && mode !== 'create') {
          r.issues.push({
            path: ['section', 'mode'],
            message: 'Must be one of: replace, append, create',
          })
        }
      }
      if (set === undefined && unset === undefined && section === undefined) {
        r.issues.push({ path: [], message: 'Give at least one of set, unset or section' })
      }
      const problem = r.check()
      if (problem !== undefined) return describeError(problem)
      const steps = updateItem(
        repo,
        id as string,
        {
          ...(set ? { set: set as never } : {}),
          ...(unset ? { unset } : {}),
          ...(heading !== undefined && content !== undefined
            ? {
                section: {
                  heading,
                  content,
                  mode: (mode as 'replace' | 'append' | 'create' | undefined) ?? 'replace',
                },
              }
            : {}),
        },
        baseHash ? { baseHash } : {},
      ).pipe(Effect.map((result) => (result === undefined ? undefined : opSummary(result))))
      const outcome = await run(Effect.result(steps))
      if (outcome._tag === 'Failure') return describeError(outcome.failure)
      cache.invalidate()
      noteWrite(outcome.success)
      return ok(outcome.success)
    },
  }
}
