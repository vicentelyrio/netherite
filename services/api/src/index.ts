import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildSchema } from 'type-graphql'

import { RecipeResolver } from './recipe/recipe-resolver'

async function bootstrap() {
  const schema = await buildSchema({
    resolvers: [RecipeResolver],
  })

  // Create GraphQL server
  const server = new ApolloServer({ schema })

  // Start the server
  const { url } = await startStandaloneServer(server)
  console.log(`🚀 Server ready at ${url}`)
}

bootstrap()
