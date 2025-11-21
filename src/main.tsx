import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { recordWebVitals } from './utils/apm'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Start lightweight APM collection (Web Vitals)
try { recordWebVitals(); } catch {}
