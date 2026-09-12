import { LOOKS, type LookId } from '../theme/looks'
import { useTheme } from '../theme/ThemeProvider'
import { useExperienceOptional } from '../features/experience/ExperienceProvider'

export function LookPicker({ compact = false }: { compact?: boolean }) {
  const { look, committed, setLook } = useTheme()
  const experience = useExperienceOptional()

  return (
    <div
      className={compact ? 'grid grid-cols-2 gap-2 sm:grid-cols-4' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'}
      data-testid="look-picker"
      onMouseLeave={() => setLook(committed, { persist: false })}
    >
      {LOOKS.map((item) => {
        const active = committed === item.id
        const previewing = look === item.id
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`look-${item.id}`}
            aria-pressed={active}
            onMouseEnter={() => setLook(item.id, { persist: false })}
            onFocus={() => setLook(item.id, { persist: false })}
            onClick={() => {
              setLook(item.id as LookId, { persist: true })
              experience?.patch({ look: item.id })
              experience?.earn('look')
            }}
            className={`look-card overflow-hidden rounded-2xl border text-left ${
              previewing ? 'border-pine shadow-[var(--shadow-card)]' : 'border-line'
            } ${compact ? 'p-2' : 'p-3'}`}
          >
            <span className="flex h-12 overflow-hidden rounded-xl" aria-hidden>
              {item.swatches.map((color) => (
                <span key={color} className="flex-1" style={{ background: color }} />
              ))}
            </span>
            <span className={`mt-2 block font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{item.name}</span>
            {compact ? null : (
              <>
                <span className="mt-1 block text-xs leading-relaxed text-muted">{item.tagline}</span>
                <span className="mt-2 inline-flex rounded-full bg-pine-soft px-2 py-0.5 text-[10px] font-semibold text-pine">
                  {item.bestFor}
                </span>
              </>
            )}
            {previewing && !active ? (
              <span className="mt-2 block text-[10px] font-semibold tracking-wide text-pine uppercase">Preview</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
