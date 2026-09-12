import { Palette } from 'lucide-react'
import { LOOKS } from '../theme/looks'
import { useTheme } from '../theme/ThemeProvider'

export function ThemeToggle() {
  const { look, cycleLook } = useTheme()
  const current = LOOKS.find((item) => item.id === look) ?? LOOKS[0]
  return (
    <button
      type="button"
      className="rounded-xl border border-line bg-paper p-2 text-ink"
      onClick={cycleLook}
      aria-label={`Look: ${current.name}. Switch UI look`}
      data-testid="look-cycle"
    >
      <Palette size={18} />
    </button>
  )
}
