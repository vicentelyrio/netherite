import '@netherite/ui/styles.css'
import { NetheriteProvider, UiPreview } from '@netherite/ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const preview = window.location.pathname === '/dev/ui'
  return (
    <NetheriteProvider>
      {preview ? (
        <UiPreview />
      ) : (
        <p style={{ padding: 24 }}>
          Netherite. The app arrives with the shell; for now see <a href="/dev/ui">/dev/ui</a>.
        </p>
      )}
    </NetheriteProvider>
  )
}

const root = document.getElementById('root')
if (root === null) throw new Error('No #root element')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
