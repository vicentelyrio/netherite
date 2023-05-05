import type { ReactElement } from 'react'

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  type NormalizedCacheObject,
} from '@apollo/client'

export const URL = 'http://127.0.0.1'
export const PORT = 4000
export const PATH = 'graphql'

type ProviderType = {
  children: ReactElement
  link?: ApolloLink
  client?: ApolloClient<NormalizedCacheObject>
}

const logLink = new ApolloLink((operation, forward) => {
  console.time(operation.operationName)
  return forward(operation).map(result => {
    console.timeEnd(operation.operationName)
    return result
  })
})

const createHTTPLink = () => (
  new HttpLink({
    uri: `${URL}:${PORT}/${PATH}`
  })
)

export const buildClient = (link: ApolloLink): ApolloClient<NormalizedCacheObject> => (
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
    link: from([logLink, link])
  })
)

export const ServicesProviders = ({
  children,
  link = createHTTPLink(),
  client
}: ProviderType) => {
  return (
    <ApolloProvider client={client ?? buildClient(link)}>
      {children}
    </ApolloProvider>
  )
}

