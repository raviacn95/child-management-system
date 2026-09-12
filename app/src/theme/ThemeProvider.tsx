import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectFireTv } from '../lib/tv'
import { LOOKS, migrateLook, nextLook, type LookId } from './looks'

export type ThemeChoice = LookId
export { LOOKS, type LookId }

const KEY = 'willow-theme'

export type SetLookOptions = { persist?: boolean }

interface ThemeApi {
  look: LookId
  committed: LookId
  theme: LookId
  resolved: 'light' | 'dark'
  setLook: (look: LookId, opts?: SetLookOptions) => void
  setTheme: (look: LookId, opts?: SetLookOptions) => void
  cycleLook: () => void
}

const Ctx = createContext<ThemeApi | null>(null)

function schemeOf(look: LookId): 'light' | 'dark' {
  return look === 'cinema' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [look, setLookState] = useState<LookId>(() => {
    try {
      return migrateLook(localStorage.getItem(KEY), detectFireTv())
    } catch {
      return 'grove'
    }
  })
  const [committed, setCommitted] = useState<LookId>(look)

  const resolved = schemeOf(look)

  useEffect(() => {
    document.documentElement.dataset.look = look
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }, [look, resolved])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, committed)
    } catch {
      /* private mode */
    }
  }, [committed])

  const setLook = useCallback((next: LookId, opts?: SetLookOptions) => {
    setLookState(next)
    if (opts?.persist !== false) setCommitted(next)
  }, [])

  const api = useMemo<ThemeApi>(
    () => ({
      look,
      committed,
      theme: look,
      resolved,
      setLook,
      setTheme: setLook,
      cycleLook: () => setLook(nextLook(committed)),
    }),
    [look, committed, resolved, setLook],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}
