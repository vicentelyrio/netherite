import { type EdgeKind, link, RelationKind, unlink } from '@netherite/core'
import { opSummary } from './opSummary'
import type { Handler, ToolContext } from './server.types'

const linkableKinds = [
  RelationKind.BelongsTo,
  RelationKind.Implements,
  RelationKind.Explains,
  RelationKind.Supersedes,
  RelationKind.DependsOn,
  RelationKind.Related,
] as const

const operations = { link, unlink } as const

export const relation = (
  { repo, effectTool, withHash }: ToolContext,
  kind: keyof typeof operations,
): Handler =>
  effectTool((r) => {
    const from = r.id('from')
    const to = r.id('to')
    const relationKind = r.oneOf('kind', linkableKinds, true)
    const baseHash = withHash(r)
    if (from === undefined || to === undefined || relationKind === undefined) return undefined
    return operations[kind](
      repo,
      { from, to, kind: relationKind as EdgeKind },
      baseHash ? { baseHash } : {},
    )
  }, opSummary)
