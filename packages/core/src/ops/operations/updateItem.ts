import { type ItemType, ValidationError } from '@netherite/schema'
import { Effect } from 'effect'
import { type Json, setField, unsetField } from '../../edit'
import type { Repo } from '../repo'
import { fold, mutate } from './mutate'
import type { Op, OpOptions, OpResult } from './operations.types'
import { type SectionPatch, updateSection } from './updateSection'

export interface FieldPatch {
  readonly set?: Readonly<Record<string, Json>>
  readonly unset?: ReadonlyArray<string>
}

const immutable = ['id', 'type']

const retitleHeading = (text: string, title: string) => {
  const end = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/)?.[0].length ?? 0
  const rest = text.slice(end)
  const heading = /^# .*$/m
  return heading.test(rest) ? text.slice(0, end) + rest.replace(heading, () => `# ${title}`) : text
}

export const updateFields = (
  repo: Repo,
  id: string,
  patch: FieldPatch,
  options: OpOptions = {},
): Op => {
  const touched = [...Object.keys(patch.set ?? {}), ...(patch.unset ?? [])]
  const bad = touched.filter((f) => immutable.includes(f))
  if (bad.length > 0) {
    return Effect.fail(
      new ValidationError({
        issues: bad.map((field) => ({
          path: [field],
          message:
            field === 'id'
              ? 'The ID cannot be changed; use renumber'
              : 'The type cannot be changed',
        })),
      }),
    )
  }
  return mutate(repo, [
    {
      id,
      baseHash: options.baseHash,
      edit: (source, item) => {
        const order = repo.fieldOrder[item.type as ItemType] ?? []
        const title = patch.set?.title
        const edited = fold(source, [
          ...Object.entries(patch.set ?? {}).map(
            ([name, value]) =>
              (text: string) =>
                setField(text, name, value, { order }),
          ),
          ...(patch.unset ?? []).map((name) => (text: string) => unsetField(text, name)),
        ])
        return typeof title === 'string'
          ? Effect.map(edited, (text) => retitleHeading(text, title))
          : edited
      },
    },
  ])
}

export interface ItemPatch {
  readonly set?: FieldPatch['set']
  readonly unset?: FieldPatch['unset']
  readonly section?: SectionPatch
}

export const updateItem = (repo: Repo, id: string, patch: ItemPatch, options: OpOptions = {}) =>
  Effect.gen(function* () {
    let result: OpResult | undefined
    let baseHash = options.baseHash
    const changed = new Set<string>()
    if (patch.set !== undefined || patch.unset !== undefined) {
      result = yield* updateFields(
        repo,
        id,
        {
          ...(patch.set ? { set: patch.set } : {}),
          ...(patch.unset ? { unset: patch.unset } : {}),
        },
        baseHash ? { baseHash } : {},
      )
      baseHash = result.hash
      for (const c of result.changed) changed.add(c)
    }
    if (patch.section !== undefined) {
      result = yield* updateSection(repo, id, patch.section, baseHash ? { baseHash } : {})
      for (const c of result.changed) changed.add(c)
    }
    return result === undefined
      ? undefined
      : ({ ...result, changed: [...changed], unchanged: changed.size === 0 } satisfies OpResult)
  })
