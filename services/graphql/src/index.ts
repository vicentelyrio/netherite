import 'reflect-metadata'

import type { GraphQLSchema } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { Container, ContainerInstance } from 'typedi'
import { buildSchema, buildTypeDefsAndResolvers } from 'type-graphql'

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
export async function schemaBuilder(): Promise<GraphQLSchema> {
  return await buildSchema({
    resolvers: resolversList,
    container: Container
  })
}

/*
* Schema Exec
* */
export async function schemaBuilderExec(): Promise<GraphQLSchema> {
  const { typeDefs, resolvers } = await buildTypeDefsAndResolvers({
    resolvers: resolversList,
    container: Container,
  })

  return makeExecutableSchema({ typeDefs, resolvers })
}

