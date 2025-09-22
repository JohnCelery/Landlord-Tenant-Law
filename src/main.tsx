import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import { PacksProvider } from './data/packs'
import './index.css'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PacksProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PacksProvider>
  </StrictMode>,
)
