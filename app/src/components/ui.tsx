import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export function Avatar({ name, hue, size = 36 }: { name: string; hue: number; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `hsl(${hue} 42% 88%)`,
        color: `hsl(${hue} 45% 28%)`,
      }}
    >
      {initials}
    </span>
  )
}

export function Badge({
  children,
  tone = 'sand',
}: {
  children: ReactNode
  tone?: 'sand' | 'pine' | 'clay' | 'sky' | 'rose' | 'gold'
}) {
  const map = {
    sand: 'bg-sand text-muted',
    pine: 'bg-pine-soft text-pine',
    clay: 'bg-clay-soft text-clay',
    sky: 'bg-sky-soft text-sky',
    rose: 'bg-rose-soft text-rose',
    gold: 'bg-gold-soft text-gold',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'soft' }) {
  const styles = {
    primary: 'bg-pine text-white hover:bg-[#175c4b]',
    ghost: 'bg-transparent text-ink hover:bg-sand border border-line',
    danger: 'bg-rose text-white hover:bg-[#9b1c3f]',
    soft: 'bg-pine-soft text-pine hover:bg-[#d3efe3]',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="font-display mt-1 text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine'

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  )
}

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}
