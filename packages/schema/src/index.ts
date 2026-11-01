import { Schema } from 'effect'
import { Config } from './config'
import { makeItemSchemas } from './items'

export { Config, StateCategory, TaskState } from './config'
export * from './fields'
export * from './ids'
export { type ItemSchemas, makeItemSchemas } from './items'
export { configJsonSchema, itemJsonSchemas, knownFields } from './json-schema'
export {
  checkItem,
  type FieldIssue,
  formatFieldIssue,
  ValidationError,
  validate,
  validateItem,
} from './validate'

/** The configuration with every default applied, for workspaces without a `config.yml`. */
export const defaultConfig: Config = Schema.decodeUnknownSync(Config)({ version: 1 })

/** Item schemas for the default configuration. */
export const itemSchemas = makeItemSchemas(defaultConfig)
