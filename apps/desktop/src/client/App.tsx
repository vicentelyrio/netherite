import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'the-new-css-reset/css/reset.css'

import { App } from '@netherite/core'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
