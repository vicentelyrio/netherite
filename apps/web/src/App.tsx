import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink,
  type NormalizedCacheObject
} from '@apollo/client'

import 'the-new-css-reset/css/reset.css'

import { App as Core } from '@netherite/core'

const PATHNAME = import.meta.env['VITE_API_PATHNAME']
const PORT = import.meta.env['VITE_API_PORT']
const NAMESPACE = import.meta.env['VITE_API_NAMESPACE']

const createHTTPLink = () => (
  new HttpLink({
    uri: `${PATHNAME}:${PORT}/${NAMESPACE}`
  })
)

const buildClient = (): ApolloClient<NormalizedCacheObject> => (
  new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache({
      typePolicies: {
        Goal: { keyFields: ['slug'] },
        GoalType: { keyFields: ['slug'] },
        Project: { keyFields: ['slug'] },
        Task: { keyFields: ['slug'] },
        Topic: { keyFields: ['slug'] },
      }
    }),
    link: createHTTPLink()
  })
)

const client = buildClient()

export const App = () => (
  <ApolloProvider client={client}>
    <Core />
  </ApolloProvider>
)
