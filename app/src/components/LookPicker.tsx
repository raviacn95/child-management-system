import { LOOKS, type LookId } from '../theme/looks'
import { useTheme } from '../theme/ThemeProvider'

export function LookPicker({ compact = false }: { compact?: boolean }) {
  const { look, setLook } = useTheme()

  return (
    <div
      className={compact ? 'grid grid-cols-3 gap-2' : 'grid gap-3 sm:grid-cols-3'}
      data-testid="look-picker"
    >
      {LOOKS.map((item) => {
        const active = look === item.id
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`look-${item.id}`}
            aria-pressed={active}
            onClick={() => setLook(item.id as LookId)}
            className={`look-card overflow-hidden rounded-2xl border text-left ${
              active ? 'border-pine shadow-[var(--shadow-card)]' : 'border-line'
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
          </button>
        )
      })}
    </div>
  )
}
