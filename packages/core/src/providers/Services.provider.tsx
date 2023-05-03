import type { ReactElement } from 'react'

import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink,
  type ApolloLink,
  type NormalizedCacheObject
} from '@apollo/client'

export const URL = 'http://127.0.0.1'
export const PORT = 4000
export const PATH = 'graphql'

type ProviderType = {
  children: ReactElement
  link?: ApolloLink
}

const createHTTPLink = () => (
  new HttpLink({
    uri: `${URL}:${PORT}/${PATH}`
  })
)

const buildClient = (link: ApolloLink): ApolloClient<NormalizedCacheObject> => (
  new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Goal: { keyFields: ['slug'] },
        GoalType: { keyFields: ['slug'] },
        Project: { keyFields: ['slug'] },
        Task: { keyFields: ['slug'] },
        Topic: { keyFields: ['slug'] },
      }
    }),
    link
  })
)

export const ServicesProviders = ({ children, link = createHTTPLink() }: ProviderType) => (
  <ApolloProvider client={buildClient(link)}>
    {children}
  </ApolloProvider>
)

