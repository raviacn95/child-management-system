import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="rounded-xl border border-line bg-paper p-2 text-ink"
      onClick={() => setTheme(next)}
      aria-label={next === 'dark' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
