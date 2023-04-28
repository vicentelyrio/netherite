import 'reflect-metadata'

import type { GraphQLSchema } from 'graphql'
import { ApolloServer, type BaseContext } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildSchema } from 'type-graphql'

import { AppSettingsResolver } from 'resolvers/AppSettings/AppSettings.resolver'
import { GoalResolver } from 'resolvers/Goal/Goal.resolver'

export { AppSettings, NavLink, Navbar } from 'resolvers/AppSettings/AppSettings.type'
export { Goal, GoalsByType } from 'resolvers/Goal/Goal.type'

/*
* Resolvers
* */
export const resolvers = [
  GoalResolver,
  AppSettingsResolver,
] as const

/*
* Build Graphql Schema
* */
export async function schemaBuilder(): Promise<GraphQLSchema> {
  return await buildSchema({
    resolvers,
  })
}

export async function BuildApolloServer() {
  const schema = await schemaBuilder()

  // Create GraphQL server
  return new ApolloServer<BaseContext>({ schema })
}

export async function runServer(): Promise<ApolloServer<BaseContext>> {
  const server = await BuildApolloServer()

  // Start the server
  const { url } = await startStandaloneServer(server)

  console.log(`🚀 Server ready at ${url}`)

  return server
}

if (process.env['STANDALONE'] === 'true') {
  runServer()
}

