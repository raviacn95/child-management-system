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
import { openPlan } from './openPlan'
import { currentOpenEnv, openOfficialApp } from './watchDesk'
import { parseMpvPlaybackMessage } from '../media/mpvBridge'
import { useStore } from '../../store'

export type WatchSession = {
  url: string
  title: string
  platformName: string
  mediaId?: string
  module?: string
}

type WatchContextValue = {
  session: WatchSession | null
  away: AwaySession | null
  openWatch: (session: WatchSession) => void
  openOfficialNow: (session: WatchSession) => void
  closeWatch: () => void
}

const Ctx = createContext<WatchContextValue | null>(null)

export function WatchProvider({ children }: { children: ReactNode }) {
  const { logAudit } = useStore()
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

  useEffect(() => {
    function onMpvMessage(event: MessageEvent) {
      const playback = parseMpvPlaybackMessage(event.data)
      if (!playback || !session || playback.mediaId !== mediaId(session)) return
      const position = playback.positionSec == null ? '' : ` position=${Math.round(playback.positionSec)}s`
      const duration = playback.durationSec == null ? '' : `/${Math.round(playback.durationSec)}s`
      logAudit(`media.${playback.event}`, `${mediaId(session)}${position}${duration}`)
    }
    window.addEventListener('message', onMpvMessage)
    return () => window.removeEventListener('message', onMpvMessage)
  }, [logAudit, session])

  const openWatch = useCallback((next: WatchSession) => {
    if (!next.url) return
    clearAway()
    setAway(null)
    setSession(next)
    logAudit('media.open', `${mediaId(next)} module=${next.module ?? 'unknown'} platform=${next.platformName}`)
  }, [logAudit])

  const closeWatch = useCallback(() => {
    if (session) logAudit('media.close', mediaId(session))
    setSession(null)
  }, [logAudit, session])

  const launchOfficial = useCallback((next: WatchSession) => {
    clearAway()
    const record = issueReturnToken({
      screen: `${location.pathname}${location.search}`,
      label: next.platformName,
      title: next.title,
    })
    const started = beginAway(record, next.url)
    setAway(started)
    openOfficialApp(next.url)
  }, [location.pathname, location.search])

  const openOfficialNow = useCallback(
    (next: WatchSession) => {
      if (!next.url) return
      launchOfficial(next)
    },
    [launchOfficial],
  )

  const value = useMemo<WatchContextValue>(
    () => ({ session, away, openWatch, openOfficialNow, closeWatch }),
    [session, away, openWatch, openOfficialNow, closeWatch],
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
          onKeep={() => {
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

function mediaId(session: WatchSession) {
  if (session.mediaId) return session.mediaId
  try {
    const url = new URL(session.url)
    return `${session.platformName}:${url.host}${url.pathname}`
  } catch {
    return `${session.platformName}:${session.title}`
  }
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
        if (openPlan({ url: session.url, ...currentOpenEnv() })?.mode === 'embed') ctx.openWatch(session)
        else ctx.openOfficialNow(session)
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
    <div className="watch-desk" data-testid="watch-desk" role="dialog" aria-modal="true">
      <header className="watch-desk-header">
        <div className="watch-desk-heading">
          <span className="watch-desk-live">Now playing</span>
          <p className="truncate text-sm font-semibold">{session.title}</p>
          <p className="truncate text-xs text-muted">{session.platformName}</p>
        </div>
        <Button type="button" variant="ghost" onClick={onClose} aria-label="Close channel" data-testid="watch-close">
          <X size={16} /> Close
        </Button>
      </header>
      <iframe
        className="watch-desk-frame"
        title={`${session.platformName} — ${session.title}`}
        src={session.url}
        referrerPolicy="strict-origin-when-cross-origin"
        allow="fullscreen; autoplay; encrypted-media"
      />
      <div className="watch-desk-footer">
        <p className="hidden text-xs text-muted sm:block">
          {session.platformName === 'YouTube trailer'
            ? 'Trailer starts muted for browser autoplay. Use the player controls to turn sound on.'
            : 'Your Willow records stay private while you watch.'}
        </p>
        <Button type="button" variant="soft" data-testid="watch-official" onClick={onOfficial}>
          Continue in {session.platformName}
        </Button>
      </div>
    </div>
  )
}
