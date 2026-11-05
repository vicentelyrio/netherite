import { Schema } from 'effect'
import { type ItemType, itemTypes } from './ids'
import type { ItemSchemas } from './items'

/** JSON Schema (draft 2020-12) for each item type, for editors, MCP tool inputs and skills. */
export const itemJsonSchemas = (schemas: ItemSchemas) =>
  Object.fromEntries(
    itemTypes.map((type) => [type, Schema.toJsonSchemaDocument(schemas[type]).schema]),
  ) as Record<ItemType, ReturnType<typeof Schema.toJsonSchemaDocument>['schema']>

/** JSON Schema for the workspace config file. */
export const configJsonSchema = (config: Schema.Constraint) =>
  Schema.toJsonSchemaDocument(config).schema

/** The field names each item type defines. Any other frontmatter key is an unknown field. */
export const knownFields = (schemas: ItemSchemas) =>
  Object.fromEntries(
    itemTypes.map((type) => {
      const schema = Schema.toJsonSchemaDocument(schemas[type]).schema as {
        properties?: Record<string, unknown>
      }
      return [type, Object.keys(schema.properties ?? {})]
    }),
  ) as unknown as Record<ItemType, ReadonlyArray<string>>
