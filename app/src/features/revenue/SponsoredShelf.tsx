import { useMemo } from 'react'
import { Badge } from '../../components/ui'
import { liveSponsored } from './sponsored'

export function SponsoredShelf() {
  const slots = useMemo(() => liveSponsored(), [])
  if (!slots.length) return null

  return (
    <section className="mb-6" data-testid="sponsored-shelf" aria-label="Sponsored">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {slots.map((slot) => (
          <a
            key={slot.id}
            className="card min-w-[240px] p-4"
            href={slot.url}
            target="_blank"
            rel="sponsored noreferrer"
          >
            <Badge tone="sand">Sponsored</Badge>
            <p className="mt-2 text-xs tracking-wide text-muted uppercase">{slot.brand}</p>
            <p className="font-semibold">{slot.title}</p>
            <p className="mt-1 text-sm text-muted">{slot.blurb}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
