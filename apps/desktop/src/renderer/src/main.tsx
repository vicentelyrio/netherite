import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import 'the-new-css-reset/css/reset.css'

import { App } from '@netherite/core'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
