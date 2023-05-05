import React from 'react'
import ReactDOM from 'react-dom/client'
import { createElectronBusLink } from 'apollo-bus-link/electron'

import 'the-new-css-reset/css/reset.css'

import { App } from '@netherite/core'

const link = createElectronBusLink(window.electron.ipcRenderer as any);
await link.initialiseBackend({ mockedMode: false })

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App link={link} />
  </React.StrictMode>
)
