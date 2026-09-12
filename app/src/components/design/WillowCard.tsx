import type { ReactNode } from 'react'
import type { LookId } from '../../theme/looks'

export function WillowCard({
  title,
  subtitle,
  kicker,
  children,
  actions,
  look,
}: {
  title: string
  subtitle?: string
  kicker?: string
  children?: ReactNode
  actions?: ReactNode
  look?: LookId
}) {
  return (
    <article className="willow-card card p-5" data-testid="willow-card" data-look={look}>
      {kicker ? <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{kicker}</p> : null}
      <h2 className="font-display mt-1 text-xl font-semibold">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  )
}
