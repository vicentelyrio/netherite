import '@netherite/ui/styles.css'
import '@/infrastructure/styles/base.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { readConfig } from '@/infrastructure/config'
import { App } from './app'

const root = document.getElementById('root')
if (root === null) throw new Error('No #root element')
createRoot(root).render(
  <StrictMode>
    <App config={readConfig()} />
  </StrictMode>,
)
