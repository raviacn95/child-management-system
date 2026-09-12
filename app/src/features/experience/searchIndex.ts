import { getLearningPacks, listChannels } from '../learning/learningPacks'
import { titles } from '../movies/catalog'
import { catalog as parentCatalog } from '../parent-feed/plan'
import { recommendTopPicks } from '../top-picks/feed'

export type SearchHit = {
  id: string
  title: string
  group: 'Movies' | 'Learning' | 'Parents' | 'Pages'
  href: string
}

const PAGES: SearchHit[] = [
  { id: 'p-hub', title: 'Household Hub', group: 'Pages', href: '/hub' },
  { id: 'p-home', title: 'Home dashboard', group: 'Pages', href: '/' },
  { id: 'p-movies', title: 'Movies', group: 'Pages', href: '/movies' },
  { id: 'p-learning', title: 'Learning packs', group: 'Pages', href: '/learning' },
  { id: 'p-parent', title: 'Parent growth hub', group: 'Pages', href: '/parent-feed' },
  { id: 'p-meals', title: 'Meals & grocery', group: 'Pages', href: '/meals' },
  { id: 'p-reports', title: 'Reports', group: 'Pages', href: '/reports' },
  { id: 'p-settings', title: 'Settings', group: 'Pages', href: '/settings' },
]

export function searchWillow(query: string, limit = 12): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return PAGES.slice(0, 6)
  const hits: SearchHit[] = [
    ...PAGES,
    ...recommendTopPicks().map((pick) => ({
      id: pick.id,
      title: pick.title,
      group: 'Movies' as const,
      href: '/movies',
    })),
    ...titles.slice(0, 80).map((movie) => ({
      id: movie.id,
      title: movie.title,
      group: 'Movies' as const,
      href: '/movies',
    })),
    ...getLearningPacks().packs.map((pack) => ({
      id: pack.id,
      title: pack.label,
      group: 'Learning' as const,
      href: `/learning?band=${pack.ageBand}`,
    })),
    ...listChannels().map((channel) => ({
      id: channel.id,
      title: channel.name,
      group: 'Learning' as const,
      href: '/learning',
    })),
    ...parentCatalog.items.map((item) => ({
      id: item.id,
      title: item.title,
      group: 'Parents' as const,
      href: '/parent-feed',
    })),
  ]
  return hits.filter((hit) => hit.title.toLowerCase().includes(q)).slice(0, limit)
}
