import { Effect, Schema } from 'effect'

export const StateCategory = Schema.Literals(['todo', 'active', 'blocked', 'done'])
export type StateCategory = typeof StateCategory.Type

export const TaskState = Schema.Struct({
  name: Schema.NonEmptyString,
  category: StateCategory,
})
export type TaskState = typeof TaskState.Type

const positiveInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1))

const defaultStates: ReadonlyArray<TaskState> = [
  { name: 'backlog', category: 'todo' },
  { name: 'doing', category: 'active' },
  { name: 'blocked', category: 'blocked' },
  { name: 'done', category: 'done' },
]

const withDefault = <S extends Schema.Constraint>(schema: S, value: S['Encoded']) =>
  Schema.withDecodingDefaultKey(Effect.succeed(value))(schema)

const fields = {
  version: Schema.Literal(1),
  content: withDefault(Schema.NonEmptyString, 'netherite'),
  id_padding: withDefault(positiveInt, 5),
  states: withDefault(Schema.NonEmptyArray(TaskState), defaultStates as never),
  freshness: withDefault(
    Schema.Struct({
      drifting: withDefault(positiveInt, 1),
      stale: withDefault(positiveInt, 10),
    }),
    {},
  ),
  context: withDefault(
    Schema.Struct({
      budget: withDefault(positiveInt, 8000),
      targets: withDefault(Schema.Array(Schema.Literals(['claude', 'agents', 'mcp'])), [
        'claude',
        'agents',
      ]),
    }),
    {},
  ),
}

/**
 * The `.netherite/config.yml` schema. Every field except `version` has a default, and
 * unknown keys are kept.
 */
export const Config = Schema.StructWithRest(Schema.Struct(fields), [
  Schema.Record(Schema.String, Schema.Unknown),
])
export type Config = typeof Config.Type
