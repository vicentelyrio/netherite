import { Effect, Schema } from 'effect'
import { ContextTarget } from '../enums/ContextTarget'
import { StateCategoryName } from '../enums/StateCategoryName'
import { settingDefaults } from '../settings/catalog'

export const StateCategory = Schema.Literals(Object.values(StateCategoryName))

export type StateCategory = typeof StateCategory.Type

export const TaskState = Schema.Struct({
  name: Schema.NonEmptyString,
  category: StateCategory,
})

export type TaskState = typeof TaskState.Type

const positiveInt = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1))

const withDefault = <S extends Schema.Constraint>(schema: S, value: S['Encoded']) =>
  Schema.withDecodingDefaultKey(Effect.succeed(value))(schema)

const fields = {
  version: Schema.Literal(1),
  content: withDefault(Schema.NonEmptyString, settingDefaults.content.folder),
  id_padding: withDefault(positiveInt, settingDefaults.content.idPadding),
  states: withDefault(Schema.NonEmptyArray(TaskState), settingDefaults.content.states as never),
  freshness: withDefault(
    Schema.Struct({
      drifting: withDefault(positiveInt, settingDefaults.freshness.drifting),
      stale: withDefault(positiveInt, settingDefaults.freshness.stale),
    }),
    {},
  ),
  context: withDefault(
    Schema.Struct({
      budget: withDefault(positiveInt, settingDefaults.context.budget),
      targets: withDefault(
        Schema.Array(Schema.Literals(Object.values(ContextTarget))),
        settingDefaults.context.targets as never,
      ),
    }),
    {},
  ),
}

export const Config = Schema.StructWithRest(Schema.Struct(fields), [
  Schema.Record(Schema.String, Schema.Unknown),
])

export type Config = typeof Config.Type
