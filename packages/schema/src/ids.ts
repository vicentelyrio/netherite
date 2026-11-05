import { Schema } from 'effect'

export const prefixes = {
  goal: 'GOAL',
  project: 'PRJ',
  task: 'TASK',
  adr: 'ADR',
  doc: 'DOC',
  context: 'CTX',
  runbook: 'RUN',
} as const

export type ItemType = keyof typeof prefixes
export type Prefix = (typeof prefixes)[ItemType]

export const itemTypes = Object.keys(prefixes) as [ItemType, ...ItemType[]]

export const defaultIdPadding = 5

const idString = (prefix: Prefix) =>
  Schema.String.check(Schema.isPattern(new RegExp(`^${prefix}-\\d+$`, 'u')))

export const GoalId = idString('GOAL').pipe(Schema.brand('GoalId'))
export const ProjectId = idString('PRJ').pipe(Schema.brand('ProjectId'))
export const TaskId = idString('TASK').pipe(Schema.brand('TaskId'))
export const AdrId = idString('ADR').pipe(Schema.brand('AdrId'))
export const DocId = idString('DOC').pipe(Schema.brand('DocId'))
export const ContextId = idString('CTX').pipe(Schema.brand('ContextId'))
export const RunbookId = idString('RUN').pipe(Schema.brand('RunbookId'))

export type GoalId = typeof GoalId.Type
export type ProjectId = typeof ProjectId.Type
export type TaskId = typeof TaskId.Type
export type AdrId = typeof AdrId.Type
export type DocId = typeof DocId.Type
export type ContextId = typeof ContextId.Type
export type RunbookId = typeof RunbookId.Type

export const ItemId = Schema.Union([GoalId, ProjectId, TaskId, AdrId, DocId, ContextId, RunbookId])
export type ItemId = typeof ItemId.Type

export const Handle = Schema.String.check(Schema.isPattern(/^@[A-Za-z0-9][A-Za-z0-9_.-]*$/u)).pipe(
  Schema.brand('Handle'),
)
export type Handle = typeof Handle.Type

const idPattern = new RegExp(`^(${Object.values(prefixes).join('|')})-(\\d+)$`, 'u')

export const formatId = (prefix: Prefix, number: number, padding = defaultIdPadding) =>
  `${prefix}-${String(number).padStart(padding, '0')}`

export const parseId = (id: string) => {
  const match = idPattern.exec(id)
  if (!match) return undefined
  const prefix = match[1] as Prefix
  const type = itemTypes.find((t) => prefixes[t] === prefix) as ItemType
  return { prefix, type, number: Number(match[2]) }
}
