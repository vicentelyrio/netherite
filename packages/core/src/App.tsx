import { useMemo } from 'react'
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloProvider
} from '@apollo/client'

import { ClientProps } from '@netherite/core'

const URL = 'http://127.0.0.1'
const PORT = 4000
const PATH = 'graphql'

export const buildClient = (props?: ClientProps) => {
  const { url = URL, port = PORT, path = PATH } = props || {}

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: `${url}:${port}/${path}`
    })
  })
}

function App(props?: ClientProps) {
  const client = useMemo(() => buildClient(props), [props])

  return (
    <ApolloProvider client={client}>
      <div className="App">
        olar
      </div>
    </ApolloProvider>
  )
}

export default App
