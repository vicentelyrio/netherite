import 'reflect-metadata'

import type { GraphQLSchema } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServer, type BaseContext } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Container, ContainerInstance } from 'typedi'
import { buildSchema, buildTypeDefsAndResolversSync } from 'type-graphql'

import { AppSettingsResolver } from 'resolvers/AppSettings/AppSettings.resolver'
import { GoalResolver } from 'resolvers/Goal/Goal.resolver'

export { AppSettings, NavLink, Navbar } from 'resolvers/AppSettings/AppSettings.type'
export { Goal, GoalsByType } from 'resolvers/Goal/Goal.type'

export interface Context {
  container: ContainerInstance
}

/*
* Resolvers
* */
export const resolversList = [
  GoalResolver,
  AppSettingsResolver,
] as const

/*
* Schema
* */
export async function schemaBuilder(): Promise<{ schema: GraphQLSchema, container: typeof Container }> {
  const schema = await buildSchema({
    resolvers: resolversList,
    container: Container
  })

  return {
    schema,
    container: Container
  }
}

/*
* Schema Exec
* */
export function schemaBuilderExec() {
  const { typeDefs, resolvers } = buildTypeDefsAndResolversSync({
    resolvers: resolversList,
    container: Container,
  })

  return {
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    container: Container
  }
}

/*
* Server
* */
export async function BuildApolloServer() {
  const { schema } = await schemaBuilder()
  return new ApolloServer<BaseContext>({ schema })
}

/*
* Run Server
* */
export async function runServer(): Promise<void> {
  const server = await BuildApolloServer()

  // Start the server
  const { url } = await startStandaloneServer(server)

  console.log(`🚀 Server ready at ${url}`)
}

if (process.env['STANDALONE'] === 'true') {
  runServer()
}
