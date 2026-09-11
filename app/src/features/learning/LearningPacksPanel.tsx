import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Tv } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiGet } from '../../api/client'
import { Badge } from '../../components/ui'
import { getLearningPacks } from './learningPacks'
import { packsResponseSchema } from './schema'

export function LearningPacksPanel() {
  const { data } = useQuery({
    queryKey: ['learning-packs'],
    queryFn: async () => {
      try {
        return await apiGet('/learning-packs', packsResponseSchema)
      } catch {
        return getLearningPacks()
      }
    },
  })
  const packs = data?.packs ?? []

  return (
    <section className="card p-5" data-testid="learning-packs" aria-labelledby="learning-packs-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="learning-packs-heading" className="font-display text-xl">
          Learning packs
        </h2>
        <Link to="/learning" className="inline-flex items-center gap-1 text-sm font-semibold text-pine">
          Watch together <ArrowUpRight size={14} />
        </Link>
      </div>
      <p className="mb-3 text-xs text-muted">Age band → curated YouTube playlist. Loaded from the learningPacks API.</p>
      <ul className="space-y-3">
        {packs.map((pack) => (
          <li key={pack.id} data-testid={`pack-card-${pack.ageBand}`}>
            <Link
              to={`/learning?band=${pack.ageBand}`}
              className="block rounded-xl border border-line p-3 hover:border-pine"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">
                  {pack.label}{' '}
                  <span className="text-xs font-normal text-muted">
                    {pack.ageMin}–{pack.ageMax} yr
                  </span>
                </p>
                <Badge tone="pine">Ages {pack.ageBand}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{pack.focus.join(' · ')}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-pine">
                <Tv size={12} aria-hidden /> {pack.featuredChannelIds.map((id) => pack.channels.find((c) => c.id === id)?.name ?? id).join(', ')}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
