import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '../../components/ui'
import { isTvMode } from '../../lib/tv'
import { openChannel } from './watchDesk'

export type WatchSession = {
  url: string
  title: string
  platformName: string
}

type WatchContextValue = {
  session: WatchSession | null
  openWatch: (session: WatchSession) => void
  closeWatch: () => void
}

const WatchContext = createContext<WatchContextValue | null>(null)

export function WatchProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WatchSession | null>(null)
  const openWatch = useCallback((next: WatchSession) => {
    if (!next.url) return
    if (isTvMode()) {
      openChannel(next.url)
      return
    }
    setSession(next)
  }, [])
  const closeWatch = useCallback(() => setSession(null), [])
  const value = useMemo(() => ({ session, openWatch, closeWatch }), [session, openWatch, closeWatch])
  return (
    <WatchContext.Provider value={value}>
      {children}
      {session ? <WatchFrame session={session} onClose={closeWatch} /> : null}
    </WatchContext.Provider>
  )
}

export function useWatchDesk() {
  const ctx = useContext(WatchContext)
  if (!ctx) throw new Error('useWatchDesk must be used inside WatchProvider')
  return ctx
}

export function useOpenWatch() {
  const ctx = useContext(WatchContext)
  return useCallback(
    (session: WatchSession) => {
      if (ctx) {
        ctx.openWatch(session)
        return
      }
      openChannel(session.url)
    },
    [ctx],
  )
}

function WatchFrame({ session, onClose }: { session: WatchSession; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-sand" data-testid="watch-desk" role="dialog" aria-modal="true">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-paper px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{session.platformName}</p>
          <p className="truncate text-xs text-muted">{session.title}</p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose} aria-label="Close channel" data-testid="watch-close">
          <X size={16} /> Close
        </Button>
      </header>
      <iframe
        className="min-h-0 w-full flex-1 border-0 bg-paper"
        title={`${session.platformName} — ${session.title}`}
        src={session.url}
        referrerPolicy="no-referrer-when-downgrade"
        allow="fullscreen; autoplay; encrypted-media"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <p className="text-xs text-muted">One page — Close stays in Willow. If the channel is blank, continue here.</p>
        <Button
          type="button"
          variant="soft"
          onClick={() => {
            onClose()
            openChannel(session.url)
          }}
        >
          Continue on this page
        </Button>
      </div>
    </div>
  )
}
