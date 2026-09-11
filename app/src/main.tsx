import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { env, flagOn } from './env'
import { initI18n } from './i18n'
import { initMonitoring } from './lib/monitoring'
import { initRealtime } from './lib/realtime'
import { initVitals } from './lib/vitals'
import './index.css'

async function boot() {
  await initI18n()
  if (import.meta.env.DEV && flagOn(env.VITE_ENABLE_MSW, true)) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } })
  }
  initRealtime()
  initVitals()
  initMonitoring()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
