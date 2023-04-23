import 'reflect-metadata'

import type { GraphQLSchema } from 'graphql'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Container, ContainerInstance } from 'typedi'
import { buildSchema, type ResolverData } from 'type-graphql'

import { AppSettingsResolver } from 'resolvers/AppSettings/AppSettings.resolver'
import { GoalResolver } from 'resolvers/Goal/Goal.resolver'

export { AppSettings, NavLink, Navbar } from 'resolvers/AppSettings/AppSettings.type'
export { Goal, GoalsByType } from 'resolvers/Goal/Goal.type'

export type ApiConfig = {
  appRoot: string
}

/* TODO: review config and implementation of default root folder */
const buildDefaultConfig = (): ApiConfig => ({
  appRoot: '' //path.resolve(__dirname, `../data/contents`)
})

export interface Context {
  appRoot: string
  container: ContainerInstance
}

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
    container: ({ context }: ResolverData<Context>) => context.container,
  })
}

export async function runServer(
  config: ApiConfig = buildDefaultConfig()
): Promise<ApolloServer<ApiConfig>> {
  const schema = await schemaBuilder()

  // Create GraphQL server
  const server = new ApolloServer<ApiConfig>({ schema })

  // Start the server
  const { url } = await startStandaloneServer(server, {
    context: async (): Promise<Context> => {
      const { appRoot } = config
      const container = Container.of(appRoot)
      const context = { appRoot, container }

      container.set('context', context)
      return context
    }
  })

  console.log(`🚀 Server ready at ${url}`)

  return server
}

if (process.env['STANDALONE'] === 'true') {
  runServer()
}

