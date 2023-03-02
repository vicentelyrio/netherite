import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildSchema } from 'type-graphql'
import type { GraphQLSchema } from 'graphql'

import { RecipeResolver } from './recipe/recipe-resolver'

export async function schemaBuilder(): Promise<GraphQLSchema> {
  return await buildSchema({
    resolvers: [RecipeResolver],
  })
}

export async function runServer(): Promise<void> {
  const schema = await schemaBuilder()

  // Create GraphQL server
  const server = new ApolloServer({ schema })

  // Start the server
  const { url } = await startStandaloneServer(server)
  console.log(`🚀 Server ready at ${url}`)
}

if (process.env['LOCALSERVER'] === 'true') {
  runServer()
}
