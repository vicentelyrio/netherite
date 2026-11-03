import { Schema } from 'effect'
import type { Config } from './config'
import { DesignLink, Glob, IsoDate, IsoDateTime, Strings, Text } from './fields'
import {
  AdrId,
  ContextId,
  DocId,
  GoalId,
  Handle,
  ItemId,
  type ItemType,
  ProjectId,
  RunbookId,
  TaskId,
} from './ids'

const ids = <S extends Schema.Constraint>(schema: S) => Schema.Array(schema)

/** Unknown frontmatter fields are allowed and kept (ADR-00003). */
const open = <S extends Schema.Struct<Schema.Struct.Fields>>(struct: S) =>
  Schema.StructWithRest(struct, [Schema.Record(Schema.String, Schema.Unknown)])

const common = <const T extends ItemType, I extends Schema.Constraint>(type: T, id: I) => ({
  id,
  aliases: Strings,
  type: Schema.Literal(type),
  title: Text,
  tags: Schema.optionalKey(Strings),
  created: Schema.optionalKey(IsoDateTime),
  created_by: Schema.optionalKey(Handle),
})

const optional = Schema.optionalKey

const Goal = open(
  Schema.Struct({
    ...common('goal', GoalId),
    status: Schema.Literals(['active', 'achieved', 'dropped']),
    area: optional(Text),
    due: optional(IsoDate),
    horizon: optional(Text),
    owner: optional(Handle),
  }),
)

const Project = open(
  Schema.Struct({
    ...common('project', ProjectId),
    goals: Schema.NonEmptyArray(GoalId),
    status: Schema.Literals(['active', 'paused', 'done', 'archived']),
    due: optional(IsoDate),
    milestone: optional(Text),
    owner: optional(Handle),
    labels: optional(Strings),
    decisions: optional(ids(AdrId)),
    design: optional(Schema.Array(DesignLink)),
  }),
)

const Adr = open(
  Schema.Struct({
    ...common('adr', AdrId),
    status: Schema.Literals(['proposed', 'accepted', 'deprecated', 'superseded']),
    date: IsoDate,
    deciders: optional(ids(Handle)),
    project: optional(ProjectId),
    supersedes: optional(ids(AdrId)),
    superseded_by: optional(AdrId),
  }),
)

const knowledge = <const T extends 'doc' | 'runbook' | 'context', I extends Schema.Constraint>(
  type: T,
  id: I,
) => ({
  ...common(type, id),
  owner: optional(Handle),
  project: optional(ProjectId),
  explains: optional(ids(ItemId)),
  covers: optional(Schema.Array(Glob)),
  reviewed_at: optional(IsoDate),
})

const Doc = open(Schema.Struct(knowledge('doc', DocId)))
const Runbook = open(Schema.Struct(knowledge('runbook', RunbookId)))
const Context = open(
  Schema.Struct({
    ...knowledge('context', ContextId),
    include_in_context: optional(Schema.Boolean),
    targets: optional(Schema.Array(Schema.Literals(['claude', 'agents', 'mcp']))),
    priority: optional(Schema.Literals(['high', 'normal', 'low'])),
  }),
)

/** The task schema depends on the workspace's configured states. */
const makeTask = (states: Config['states']) =>
  open(
    Schema.Struct({
      ...common('task', TaskId),
      project: ProjectId,
      state: Schema.Literals(states.map((s: { name: string }) => s.name) as [string, ...string[]]),
      assignees: optional(ids(Handle)),
      labels: optional(Strings),
      decisions: optional(ids(AdrId)),
      depends_on: optional(ids(TaskId)),
      related: optional(ids(ItemId)),
      due: optional(IsoDate),
    }),
  )

/** The item schemas for one workspace configuration. */
export const makeItemSchemas = (config: Pick<Config, 'states'>) => ({
  goal: Goal,
  project: Project,
  task: makeTask(config.states),
  adr: Adr,
  doc: Doc,
  context: Context,
  runbook: Runbook,
})

export type ItemSchemas = ReturnType<typeof makeItemSchemas>
