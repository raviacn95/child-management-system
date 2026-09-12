import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectFireTv } from '../lib/tv'
import { LOOKS, migrateLook, nextLook, type LookId } from './looks'

export type ThemeChoice = LookId
export { LOOKS, type LookId }

const KEY = 'willow-theme'

interface ThemeApi {
  look: LookId
  theme: LookId
  resolved: 'light' | 'dark'
  setLook: (look: LookId) => void
  setTheme: (look: LookId) => void
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

  const resolved = schemeOf(look)

  useEffect(() => {
    document.documentElement.dataset.look = look
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
    try {
      localStorage.setItem(KEY, look)
    } catch {
      /* private mode */
    }
  }, [look, resolved])

  const api = useMemo<ThemeApi>(
    () => ({
      look,
      theme: look,
      resolved,
      setLook: setLookState,
      setTheme: setLookState,
      cycleLook: () => setLookState((current) => nextLook(current)),
    }),
    [look, resolved],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}
