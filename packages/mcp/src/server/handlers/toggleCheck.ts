import { checkTargetOf, toggleChecklistItem } from '@netherite/core'
import { opSummary } from '../opSummary'
import type { ToolContext, ToolEntry } from '../server.types'

export const toggleCheckTool = (ctx: ToolContext): ToolEntry => {
  const { repo, withHash, effectTool } = ctx
  return {
    write: true,
    handle: effectTool(
      (r) => {
        const id = r.id('id')
        const raw = r.raw('item')
        const rawItems = r.raw('items')
        const baseHash = withHash(r)
        const ask = checkTargetOf({
          ...(raw === undefined ? {} : { item: raw as number | string }),
          ...(rawItems === undefined ? {} : { items: rawItems as ReadonlyArray<number | string> }),
          ...(r.boolean('all') === undefined ? {} : { all: r.boolean('all') as boolean }),
          ...(r.boolean('checked') === undefined
            ? {}
            : { checked: r.boolean('checked') as boolean }),
        })
        if ('problem' in ask) {
          r.issues.push({ path: ['item'], message: ask.problem })
          return undefined
        }
        if (id === undefined) return undefined
        return toggleChecklistItem(repo, id, ask.target, ask.checked, baseHash ? { baseHash } : {})
      },
      (r) => ({
        ...opSummary(r),
        checklist: (repo.index.get(r.path)?.parsed.checklist ?? []).map((c, i) => ({
          index: i,
          text: c.text,
          checked: c.checked,
        })),
      }),
    ),
  }
}
