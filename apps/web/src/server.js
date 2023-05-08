import dotenv from 'dotenv'

import express from 'express'
import ViteExpress from 'vite-express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import cors from 'cors'
import bodyParser from 'body-parser'

import { schemaBuilderExec } from '@netherite/service-graphql'

dotenv.config()

const PORT = process.env.VITE_API_PORT
const PATHNAME = process.env.VITE_API_PATHNAME
const NAMESPACE = process.env.VITE_API_NAMESPACE

const app = express()
const schema = await schemaBuilderExec()
const server = new ApolloServer({ schema })
await server.start()

app.use(
  `/${NAMESPACE}`,
  cors(),
  bodyParser.json(),
  expressMiddleware(server)
)

ViteExpress.listen(
  app,
  PORT,
  () => console.log(`🚀 Server ready at ${PATHNAME}:${PORT}`)
)
