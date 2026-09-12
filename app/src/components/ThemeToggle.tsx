import { Palette } from 'lucide-react'
import { LOOKS, nextLook } from '../theme/looks'
import { useTheme } from '../theme/ThemeProvider'
import { useExperienceOptional } from '../features/experience/ExperienceProvider'

export function ThemeToggle() {
  const { committed, cycleLook } = useTheme()
  const experience = useExperienceOptional()
  const current = LOOKS.find((item) => item.id === committed) ?? LOOKS[0]
  return (
    <button
      type="button"
      className="rounded-xl border border-line bg-paper p-2 text-ink"
      onClick={() => {
        const next = nextLook(committed)
        cycleLook()
        experience?.patch({ look: next })
        experience?.earn('look')
      }}
      aria-label={`Look: ${current.name}. Switch UI look`}
      data-testid="look-cycle"
    >
      <Palette size={18} />
    </button>
  )
}
