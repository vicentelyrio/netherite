import type { ReactNode } from 'react'
import { ApolloClient, ApolloProvider, InMemoryCache, HttpLink } from '@apollo/client'

export const URL = 'http://127.0.0.1'
export const PORT = 4000
export const PATH = 'graphql'

export type ClientProps = {
  url?: string
  path?: string
  port?: number
}

type ProviderProps = {
  children: ReactNode
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: `${URL}:${PORT}/${PATH}`
  })
})

export const ServicesProviders = ({ children }: ProviderProps) => (
  <ApolloProvider client={client}>
    {children}
  </ApolloProvider>
)

