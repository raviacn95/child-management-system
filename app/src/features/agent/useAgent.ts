import { useCallback, useMemo, useRef, useState } from 'react'
import { track } from '../../lib/analytics'
import { isTvMode } from '../../lib/tv'
import { useStore } from '../../store'
import { titles } from '../movies/catalog'
import { loadFreshCache } from '../movies/fresh'
import { freshToCatalogTitles } from '../movies/freshShelf'
import { agentEndpoint } from './client'
import { matchTitle, type WatchContext } from './movieSearch'
import { PAGE_LABEL, pagePath } from './pages'
import { rosterNames } from './privacy'
import { runAgent } from './runAgent'
import type { AgentTurn } from './schema'

export type AgentOutcome = { turn: AgentTurn; path: string | null }

export function useWatchContext(): WatchContext {
  const { state } = useStore()
  return useMemo(() => {
    const mine = (state.ottAccounts ?? []).filter((a) => a.userId === state.currentUserId && a.connected)
    return {
      tv: isTvMode(),
      connectedIds: mine.map((a) => a.platformId),
      adFreeIds: mine.filter((a) => a.adTier === 'ad-free').map((a) => a.platformId),
      preferAdFree: state.preferAdFree !== false,
    }
  }, [state.ottAccounts, state.currentUserId, state.preferAdFree])
}

/** One ask at a time; a newer ask or reset drops a slower answer. */
export function useAgent() {
  const { state } = useStore()
  const role = state.users.find((u) => u.id === state.currentUserId)?.role ?? 'parent'
  const names = useMemo(() => rosterNames({ children: state.children, users: state.users }), [state.children, state.users])
  const endpoint = useMemo(() => agentEndpoint(), [])
  const [turn, setTurn] = useState<AgentTurn | null>(null)
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)

  const ask = useCallback(
    async (text: string): Promise<AgentOutcome | null> => {
      const id = ++seq.current
      setBusy(true)
      const pool = [...titles, ...freshToCatalogTitles(loadFreshCache()?.feed)]
      const raw = await runAgent(text, { find: (q, year) => matchTitle(q, year, pool), names, endpoint })
      if (id !== seq.current) return null
      const path = raw.action.type === 'navigate' ? pagePath(raw.action.page, role, isTvMode()) : null
      const next: AgentTurn =
        raw.action.type === 'navigate' && !path
          ? { say: `${PAGE_LABEL[raw.action.page]} is not open for your account.`, action: { type: 'none' }, source: raw.source }
          : raw
      setTurn(next)
      setBusy(false)
      track(`agent_${next.source}_${next.action.type}`)
      return { turn: next, path }
    },
    [names, endpoint, role],
  )

  const reset = useCallback(() => {
    seq.current += 1
    setTurn(null)
    setBusy(false)
  }, [])

  return { turn, busy, ask, reset, aiReady: Boolean(endpoint) }
}
