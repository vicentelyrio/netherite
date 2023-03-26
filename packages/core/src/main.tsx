import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Providers } from 'providers/App.providers'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
)
