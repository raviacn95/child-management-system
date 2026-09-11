import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isStandaloneDisplay } from './detect'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallStatus = 'idle' | 'available' | 'prompting' | 'installed' | 'dismissed'

type InstallContextValue = {
  status: InstallStatus
  canInstall: boolean
  installed: boolean
  install: () => Promise<boolean>
}

const InstallContext = createContext<InstallContextValue | null>(null)

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [status, setStatus] = useState<InstallStatus>(() => (isStandaloneDisplay() ? 'installed' : 'idle'))

  useEffect(() => {
    if (isStandaloneDisplay()) return

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setStatus('available')
    }
    const onInstalled = () => {
      setDeferred(null)
      setStatus('installed')
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return false
    setStatus('prompting')
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    if (choice.outcome === 'accepted') {
      setStatus('installed')
      return true
    }
    setStatus('dismissed')
    return false
  }, [deferred])

  const value = useMemo<InstallContextValue>(
    () => ({
      status,
      canInstall: Boolean(deferred),
      installed: status === 'installed',
      install,
    }),
    [deferred, install, status],
  )

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
}

export function useInstallPrompt() {
  const ctx = useContext(InstallContext)
  if (!ctx) throw new Error('useInstallPrompt must be used inside InstallProvider')
  return ctx
}
