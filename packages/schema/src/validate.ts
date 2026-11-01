import { Data, Effect, Exit, Schema, SchemaIssue } from 'effect'
import { type ItemType, itemTypes } from './ids'
import type { ItemSchemas } from './items'

/** One problem with one field. `path` is empty when the problem is with the whole value. */
export interface FieldIssue {
  readonly path: ReadonlyArray<string | number>
  readonly message: string
}

/** A value did not match its schema. Carries a field-level message for every problem found. */
export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly issues: ReadonlyArray<FieldIssue>
}> {
  override get message() {
    return this.issues.map(formatFieldIssue).join('\n')
  }
}

export const formatFieldIssue = (issue: FieldIssue) =>
  issue.path.length === 0 ? issue.message : `${issue.path.join('.')}: ${issue.message}`

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1()

/** Decodes unknown input against a schema, reporting every field problem, not just the first. */
export const validate = <S extends Schema.ConstraintDecoder<unknown>>(schema: S) => {
  const decode = Schema.decodeUnknownExit(schema)
  return (input: unknown): Effect.Effect<S['Type'], ValidationError> => {
    const exit = decode(input, { errors: 'all' })
    if (Exit.isSuccess(exit)) return Effect.succeed(exit.value)
    const failure = exit.cause.reasons.find((r) => r._tag === 'Fail')
    const issues = failure
      ? formatIssues(failure.error.issue).issues.map((i) => ({
          path: (i.path ?? []).map((k) => (typeof k === 'object' ? k.key : k)) as Array<
            string | number
          >,
          message: i.message,
        }))
      : [{ path: [], message: 'Unexpected failure while validating' }]
    return Effect.fail(new ValidationError({ issues }))
  }
}

const isType = (value: unknown): value is ItemType =>
  typeof value === 'string' && (itemTypes as string[]).includes(value)

/** Validates a parsed frontmatter object, choosing the schema from its `type` field. */
export const validateItem = (schemas: ItemSchemas) => {
  const validators = Object.fromEntries(
    itemTypes.map((type) => [type, validate(schemas[type])]),
  ) as { [K in ItemType]: ReturnType<typeof validate<ItemSchemas[K]>> }

  return (input: unknown) => {
    const type =
      typeof input === 'object' && input !== null ? (input as { type?: unknown }).type : undefined
    if (!isType(type)) {
      return Effect.fail(
        new ValidationError({
          issues: [
            {
              path: ['type'],
              message: `Expected one of ${itemTypes.map((t) => `"${t}"`).join(', ')}`,
            },
          ],
        }),
      )
    }
    return validators[type](input) as Effect.Effect<
      { [K in ItemType]: ItemSchemas[K]['Type'] }[ItemType],
      ValidationError
    >
  }
}

/**
 * A synchronous check of a parsed frontmatter object. Returns every field problem, or an empty
 * list when the item is valid. Uses the `type` field to choose the schema.
 */
export const checkItem = (schemas: ItemSchemas) => {
  const validator = validateItem(schemas)
  return (input: unknown): ReadonlyArray<FieldIssue> => {
    const exit = Effect.runSyncExit(validator(input))
    if (Exit.isSuccess(exit)) return []
    const failure = exit.cause.reasons.find((r) => r._tag === 'Fail')
    return failure
      ? failure.error.issues
      : [{ path: [], message: 'Unexpected failure while validating' }]
  }
}
