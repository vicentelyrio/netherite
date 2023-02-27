import { useMemo } from 'react'
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloProvider,
  useQuery,
  gql,
} from '@apollo/client'

import { Avatar } from '@netherite/ds-components'

const URL = 'http://127.0.0.1'
const PORT = 4000
const PATH = 'graphql'

type ClientProps = {
  url?: string
  path?: string
  port?: number
}

export const buildClient = (props?: ClientProps) => {
  const { url = URL, port = PORT, path = PATH } = props || {}

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: `${url}:${port}/${path}`
    })
  })
}

export function App(props?: ClientProps) {
  const client = useMemo(() => buildClient(props), [props])

  return (
    <ApolloProvider client={client}>
      <Content />
    </ApolloProvider>
  )
}

export default App

const GET_FILE = gql`
  query Recipes {
    recipes {
      title
      ratingsCount
    }
  }
`

const Content = () => {
  const { loading, error, data } = useQuery(GET_FILE)

  return (
    <div className="App">
      <Avatar children="Olar" />
    </div>
  )
}
