import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { registerServiceWorker } from './utils/sw-register'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

registerServiceWorker()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
