import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'willow-theme'

interface ThemeApi {
  theme: ThemeChoice
  resolved: 'light' | 'dark'
  setTheme: (theme: ThemeChoice) => void
}

const Ctx = createContext<ThemeApi | null>(null)

function resolve(theme: ThemeChoice): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(() => {
    const saved = localStorage.getItem(KEY)
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'light'
  })

  const resolved = resolve(theme)

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
    localStorage.setItem(KEY, theme)
  }, [theme, resolved])

  const api = useMemo<ThemeApi>(
    () => ({
      theme,
      resolved,
      setTheme: (next) => setThemeState(next),
    }),
    [theme, resolved],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}
