import { type CheckSelector, type CheckTarget, toggleChecks as toggleChecksEdit } from '../../edit'
import type { Repo } from '../repo'
import { mutate } from './mutate'
import type { Op, OpOptions } from './operations.types'

export const toggleChecklistItem = (
  repo: Repo,
  id: string,
  which: CheckTarget,
  checked?: boolean,
  options: OpOptions = {},
): Op =>
  mutate(repo, [
    { id, baseHash: options.baseHash, edit: (source) => toggleChecksEdit(source, which, checked) },
  ])

export const checkTargetOf = (input: {
  readonly item?: number | string | undefined
  readonly items?: ReadonlyArray<number | string> | undefined
  readonly all?: boolean | undefined
  readonly checked?: boolean | undefined
}):
  | { readonly target: CheckTarget; readonly checked: boolean | undefined }
  | { readonly problem: string } => {
  const asked = [input.item !== undefined, input.items !== undefined, input.all === true].filter(
    Boolean,
  ).length
  if (asked !== 1) {
    return { problem: 'Give exactly one of item, items or all' }
  }
  const one = (v: number | string): CheckSelector | undefined =>
    typeof v === 'number'
      ? Number.isInteger(v) && v >= 0
        ? v
        : undefined
      : v === ''
        ? undefined
        : { text: v }
  if (input.all === true) return { target: { all: true }, checked: input.checked ?? true }
  const picked =
    input.items !== undefined ? input.items.map(one) : [one(input.item as number | string)]
  if (picked.length === 0 || picked.some((p) => p === undefined)) {
    return { problem: 'Give the 0-based position or the exact text of each checklist item' }
  }
  const selectors = picked as CheckSelector[]
  return {
    target: input.items === undefined ? (selectors[0] as CheckSelector) : selectors,
    checked: input.checked,
  }
}
