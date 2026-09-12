import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '../../components/ui'
import { ReturnBanner } from './ReturnBanner'
import {
  beginAway,
  clearAway,
  consumeToken,
  currentAway,
  issueReturnToken,
  lastScreen,
  rememberScreen,
  type AwaySession,
} from './returnSession'
import { openOfficialApp } from './watchDesk'

export type WatchSession = {
  url: string
  title: string
  platformName: string
}

type WatchContextValue = {
  session: WatchSession | null
  away: AwaySession | null
  openWatch: (session: WatchSession) => void
  closeWatch: () => void
}

const Ctx = createContext<WatchContextValue | null>(null)

export function WatchProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState<WatchSession | null>(null)
  const [away, setAway] = useState<AwaySession | null>(() => currentAway())

  useEffect(() => {
    rememberScreen(`${location.pathname}${location.search}`)
  }, [location.pathname, location.search])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && currentAway()) setAway(currentAway())
    }
    function onMessage(event: MessageEvent) {
      const token = typeof event.data === 'object' && event.data ? String(event.data.willowReturnToken ?? '') : ''
      if (!token) return
      const record = consumeToken(token)
      clearAway()
      setAway(null)
      if (record) navigate(record.screen)
    }
    function onReturned() {
      setAway(null)
      setSession(null)
    }
    window.addEventListener('visibilitychange', onVisible)
    window.addEventListener('message', onMessage)
    window.addEventListener('willow-return', onReturned)
    return () => {
      window.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('message', onMessage)
      window.removeEventListener('willow-return', onReturned)
    }
  }, [navigate])

  const openWatch = useCallback((next: WatchSession) => {
    if (!next.url) return
    setSession(next)
  }, [])

  const closeWatch = useCallback(() => setSession(null), [])

  function launchOfficial(next: WatchSession) {
    const record = issueReturnToken({
      screen: `${location.pathname}${location.search}`,
      label: next.platformName,
      title: next.title,
    })
    const started = beginAway(record, next.url)
    setAway(started)
    openOfficialApp(next.url)
  }

  const value = useMemo<WatchContextValue>(
    () => ({ session, away, openWatch, closeWatch }),
    [session, away, openWatch, closeWatch],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      {away ? (
        <ReturnBanner
          away={away}
          onReturn={() => {
            clearAway()
            setAway(null)
            setSession(null)
            navigate(away.screen || lastScreen())
          }}
          onKeep={() => undefined}
          onStop={() => {
            clearAway()
            setAway(null)
          }}
        />
      ) : null}
      {session ? (
        <WatchFrame
          session={session}
          onClose={closeWatch}
          onOfficial={() => {
            launchOfficial(session)
            closeWatch()
          }}
        />
      ) : null}
    </Ctx.Provider>
  )
}

export function useWatchDesk() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWatchDesk must be used inside WatchProvider')
  return ctx
}

export function useOpenWatch() {
  const ctx = useContext(Ctx)
  return useCallback(
    (session: WatchSession) => {
      if (ctx) {
        ctx.openWatch(session)
        return
      }
      openOfficialApp(session.url)
    },
    [ctx],
  )
}

function WatchFrame({
  session,
  onClose,
  onOfficial,
}: {
  session: WatchSession
  onClose: () => void
  onOfficial: () => void
}) {
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
        referrerPolicy="no-referrer"
        allow="fullscreen; autoplay; encrypted-media"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <p className="text-xs text-muted">
          Willow stays open. Close or device Back returns here. Official apps never receive child names, PINs, or notes.
        </p>
        <Button type="button" variant="soft" data-testid="watch-official" onClick={onOfficial}>
          Open official app
        </Button>
      </div>
    </div>
  )
}
