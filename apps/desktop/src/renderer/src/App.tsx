import { IpcRenderer } from 'electron'
import { createElectronBusLink } from 'apollo-bus-link/electron'
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  NormalizedCacheObject
} from '@apollo/client'

import 'the-new-css-reset/css/reset.css'

import { App as Core } from '@netherite/core'

const link = createElectronBusLink(window.electron.ipcRenderer as IpcRenderer)

await link.initialiseBackend({ mockedMode: false })

const buildClient = (link: ApolloLink): ApolloClient<NormalizedCacheObject> => (
  new ApolloClient({
    link,
    cache: new InMemoryCache({
      typePolicies: {
        Goal: { keyFields: ['slug'] },
        GoalType: { keyFields: ['slug'] },
        Project: { keyFields: ['slug'] },
        Task: { keyFields: ['slug'] },
        Topic: { keyFields: ['slug'] },
      }
    }),
  })
)

const client = buildClient(link)

export const App = () => (
  <ApolloProvider client={client}>
    <Core />
  </ApolloProvider>
)
