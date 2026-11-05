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

export const defaultConfig: Config = Schema.decodeUnknownSync(Config)({ version: 1 })

export const itemSchemas = makeItemSchemas(defaultConfig)
