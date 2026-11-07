import { AdrStatus, ItemType } from '@netherite/schema'
import type { ScannedItem } from '../scanned-item'
import { stringList, stringOf } from './workspace-index.helpers'

const knowledgeTypes = new Set(['doc', 'adr', 'context', 'runbook'])

export const isRetired = (item: ScannedItem): boolean => {
  const data = item.parsed.frontmatter?.data
  const status =
    typeof data === 'object' && data !== null ? (data as Record<string, unknown>).status : undefined
  return status === AdrStatus.Superseded || status === AdrStatus.Deprecated
}

const isGivenToAgents = (item: ScannedItem): boolean => {
  const data = item.parsed.frontmatter?.data
  return (
    item.type === ItemType.Context &&
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).include_in_context === true
  )
}

const isAttached = (item: ScannedItem): boolean => {
  const data = item.parsed.frontmatter?.data
  if (
    (item.type !== ItemType.Doc && item.type !== ItemType.Runbook) ||
    typeof data !== 'object' ||
    data === null
  )
    return false
  const { explains, project, covers } = data as Record<string, unknown>
  return (
    stringList(explains).length > 0 || stringOf(project).length > 0 || stringList(covers).length > 0
  )
}

export const canBeOrphan = (item: ScannedItem): boolean =>
  knowledgeTypes.has(item.type ?? '') &&
  !isRetired(item) &&
  !isGivenToAgents(item) &&
  !isAttached(item)
