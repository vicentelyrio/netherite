import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IpcRenderer } from 'electron'
import { createElectronBusLink } from 'apollo-bus-link/electron'

import 'the-new-css-reset/css/reset.css'

import { App, buildClient } from '@netherite/core'

const link = createElectronBusLink(window.electron.ipcRenderer as IpcRenderer)
await link.initialiseBackend({ mockedMode: false })

const client = buildClient(link)

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App client={client} />
  </StrictMode>
)
