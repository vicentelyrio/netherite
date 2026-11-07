import { Schema } from 'effect'
import { type ItemType, itemTypes } from '../ids'
import type { ItemSchemas } from '../items'

export const itemJsonSchemas = (schemas: ItemSchemas) =>
  Object.fromEntries(
    itemTypes.map((type) => [type, Schema.toJsonSchemaDocument(schemas[type]).schema]),
  ) as Record<ItemType, ReturnType<typeof Schema.toJsonSchemaDocument>['schema']>

export const configJsonSchema = (config: Schema.Constraint) =>
  Schema.toJsonSchemaDocument(config).schema

export const knownFields = (schemas: ItemSchemas) =>
  Object.fromEntries(
    itemTypes.map((type) => {
      const schema = Schema.toJsonSchemaDocument(schemas[type]).schema as {
        properties?: Record<string, unknown>
      }
      return [type, Object.keys(schema.properties ?? {})]
    }),
  ) as unknown as Record<ItemType, ReadonlyArray<string>>
