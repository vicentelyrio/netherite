import '@netherite/ui/styles.css'
import './app.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import { readConfig } from './lib/config'

const root = document.getElementById('root')
if (root === null) throw new Error('No #root element')
createRoot(root).render(
  <StrictMode>
    <App config={readConfig()} />
  </StrictMode>,
)
