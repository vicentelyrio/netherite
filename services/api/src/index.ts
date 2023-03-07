import 'reflect-metadata'
import path from 'path'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildSchema } from 'type-graphql'
import type { GraphQLSchema } from 'graphql'

import { FileResolver } from './file/file.resolver'

type ApiConfig = {
  appRoot: string
}

const defaultConfig: ApiConfig = {
  appRoot: path.resolve(__dirname, `../src/contents`)
}

export async function schemaBuilder(): Promise<GraphQLSchema> {
  return await buildSchema({
    resolvers: [FileResolver],
  })
}

export async function runServer(config: ApiConfig = defaultConfig): Promise<void> {
  const schema = await schemaBuilder()

  // Create GraphQL server
  const server = new ApolloServer<ApiConfig>({ schema })

  // Start the server
  const { url } = await startStandaloneServer(server, {
    context: async () => ({
      appRoot: config?.appRoot,
    })
  })

  console.log(`🚀 Server ready at ${url}`)
}

if (process.env['LOCALSERVER'] === 'true') {
  runServer()
}
