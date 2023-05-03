import React from 'react'
import ReactDOM from 'react-dom/client'

import 'the-new-css-reset/css/reset.css'

import { App } from '@netherite/core'

const AppWithLink = () => {
  return (
    <App />
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppWithLink />
  </React.StrictMode>
)
