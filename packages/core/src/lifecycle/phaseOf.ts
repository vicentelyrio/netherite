import { ItemType, KnowledgeStatus, ProjectStatus, StateCategoryName } from '@netherite/schema'
import type { LifecycleOptions, Phase } from './lifecycle.types'

type PhaseRule = (value: string, states: LifecycleOptions['states']) => Phase

const phaseRules: Readonly<Record<string, PhaseRule>> = {
  [ItemType.Task]: (value, states) =>
    states.find((s) => s.name === value)?.category ?? StateCategoryName.Todo,
  [ItemType.Project]: (value) => {
    if (value === ProjectStatus.Paused) return StateCategoryName.Blocked
    return value === KnowledgeStatus.Active ? StateCategoryName.Active : StateCategoryName.Done
  },
  [ItemType.Goal]: (value) =>
    value === KnowledgeStatus.Active ? StateCategoryName.Active : StateCategoryName.Done,
}

export const phaseOf = (
  type: string | undefined,
  value: string | undefined,
  states: LifecycleOptions['states'],
): Phase | undefined => {
  if (value === undefined || type === undefined) return undefined
  return phaseRules[type]?.(value, states)
}
