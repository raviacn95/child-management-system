import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { env, flagOn } from './env'
import { initI18n } from './i18n'
import { initMonitoring } from './lib/monitoring'
import { initRealtime } from './lib/realtime'
import { initVitals } from './lib/vitals'
import { markBootStart, markBootSuccess, rollbackToPreviousRelease } from './lib/releaseGuard'
import './theme/tokens.css'
import './index.css'

async function boot() {
  markBootStart()
  try {
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
    markBootSuccess()
  } catch (error) {
    console.error('[willow] boot failed', error)
    const rolled = await rollbackToPreviousRelease()
    if (!rolled) throw error
  }
}

void boot()
