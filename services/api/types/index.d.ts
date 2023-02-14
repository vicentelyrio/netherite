import type { GraphQLSchema } from 'graphql'

declare module '@netherite/api' {
  type SchemaBuilderReturnType = Promise<GraphQLSchema>
  function schemaBuilder(): SchemaBuilderReturnType

  type RunServerReturnType = Promise<void>
  function runServer(): RunServerReturnType
}

