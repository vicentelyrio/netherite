import type { ApolloClient } from '@apollo/client'
import type { ReactElement } from 'react'

declare module '@netherite/core' {
  type ClientProps = {
    url?: string
    path?: string
    port?: number
  }

  function App(props?: ClientProps): ReactElement
  function buildClient(props?: ClientProps): ApolloClient
}

