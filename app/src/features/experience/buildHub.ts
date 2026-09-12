import { getLearningPacks } from '../learning/learningPacks'
import { recommendMovies } from '../movies/recommend'
import { catalog as parentCatalog } from '../parent-feed/plan'
import { hubRowTitle, recommendTopPicks } from '../top-picks/feed'
import { lookLead, type LookId } from '../../theme/looks'
import type { ResumeCard } from './profile'

export type HubTile = {
  id: string
  kind: 'movie' | 'learning' | 'parent' | 'care' | 'page'
  title: string
  subtitle: string
  href: string
  watchUrl?: string
}

export type HubRow = {
  id: string
  title: string
  tiles: HubTile[]
}

export function weeklyDigest(input: { present: number; enrolled: number; look: LookId; childNames: string[] }) {
  const kids = input.childNames.slice(0, 3).join(', ') || 'your children'
  return [
    `${input.present} of ${input.enrolled} children are on site today.`,
    `This week lead with ${lookLead(input.look)} for ${kids}.`,
    'Learning Tonight, Parenting Tips, and Finance Friday are ready on the Household Hub.',
  ]
}

export function buildHub(input: {
  look: LookId
  role: 'director' | 'teacher' | 'parent'
  resume: ResumeCard[]
  watchTogether: boolean
  childAgeYears?: number
}): HubRow[] {
  const movies = recommendMovies({ shelf: 'family', limit: 8, seed: 'hub-family' }).titles
  const packs = getLearningPacks().packs
  const parenting = parentCatalog.items.filter((item) => item.category === 'parenting').slice(0, 6)
  const finance = parentCatalog.items.filter((item) => item.category === 'finance').slice(0, 6)
  const health = parentCatalog.items.filter((item) => item.category === 'health').slice(0, 4)

  const continueRow: HubRow = {
    id: 'continue',
    title: 'Continue',
    tiles: input.resume.slice(0, 6).map((card) => ({
      id: card.id,
      kind: card.kind === 'page' ? 'page' : card.kind,
      title: card.title,
      subtitle: 'Pick up on this device',
      href: card.href,
    })),
  }

  const learningRow: HubRow = {
    id: 'learning',
    title: input.watchTogether ? 'Learning Tonight · Watch together' : 'Learning Tonight',
    tiles: [...packs]
      .sort((a, b) => {
        if (input.childAgeYears == null) return 0
        const target = input.childAgeYears < 5 ? '2-5' : input.childAgeYears < 8 ? '5-8' : '8-12'
        return Number(b.ageBand === target) - Number(a.ageBand === target)
      })
      .map((pack) => ({
        id: pack.id,
        kind: 'learning',
        title: pack.label,
        subtitle: `Ages ${pack.ageBand} · ${pack.channels[0]?.name ?? 'Pack'}`,
        href: `/learning?band=${pack.ageBand}`,
        watchUrl: pack.playlistUrl,
      })),
  }

  const movieRow: HubRow = {
    id: 'movies',
    title: 'Family movies',
    tiles: movies.map((movie) => ({
      id: movie.id,
      kind: 'movie',
      title: movie.title,
      subtitle: `${movie.year} · ${movie.originalLang.toUpperCase()}`,
      href: '/movies',
    })),
  }

  const topPicks = recommendTopPicks(input.look)
  const topPicksRow: HubRow = {
    id: 'top-picks',
    title: hubRowTitle(input.look),
    tiles: topPicks.map((pick) => ({
      id: pick.id,
      kind: 'movie',
      title: pick.title,
      subtitle: `${pick.rating} · ${pick.kind === 'series' ? 'Series' : 'Movie'}`,
      href: '/movies',
      watchUrl: pick.watchLinks[0]?.url,
    })),
  }

  const parentRow: HubRow = {
    id: 'parenting',
    title: 'Parenting Tips',
    tiles: parenting.map((item) => ({
      id: item.id,
      kind: 'parent',
      title: item.title,
      subtitle: `${item.durationMin} min · ${item.platform}`,
      href: '/parent-feed',
      watchUrl: item.url,
    })),
  }

  const financeRow: HubRow = {
    id: 'finance',
    title: 'Finance Friday',
    tiles: finance.map((item) => ({
      id: item.id,
      kind: 'parent',
      title: item.title,
      subtitle: `${item.durationMin} min · money`,
      href: '/parent-feed',
      watchUrl: item.url,
    })),
  }

  const careRow: HubRow = {
    id: 'care',
    title: 'Care today',
    tiles: [
      { id: 'att', kind: 'care', title: 'Attendance', subtitle: 'PIN handoff', href: '/attendance' },
      { id: 'meals', kind: 'care', title: 'Meals', subtitle: 'Tiffin + grocery', href: '/meals' },
      { id: 'health', kind: 'care', title: 'Health', subtitle: 'Vaccines & notes', href: '/health' },
      { id: 'grow', kind: 'care', title: 'Grow at home', subtitle: 'Horizons', href: '/grow' },
    ],
  }

  const reportsRow: HubRow = {
    id: 'reports',
    title: 'Director desk',
    tiles: [
      { id: 'reports', kind: 'page', title: 'Reports', subtitle: 'Enrollment & ratios', href: '/reports' },
      { id: 'staff', kind: 'page', title: 'Staff', subtitle: 'Live ratios', href: '/staff' },
      { id: 'billing', kind: 'page', title: 'Billing', subtitle: 'Tuition', href: '/billing' },
      ...health.map((item) => ({
        id: item.id,
        kind: 'parent' as const,
        title: item.title,
        subtitle: 'Parent health',
        href: '/parent-feed',
        watchUrl: item.url,
      })),
    ],
  }

  const order: HubRow[] =
    input.look === 'cinema'
      ? [continueRow, topPicksRow, movieRow, learningRow, parentRow, financeRow]
      : input.look === 'harbor' || input.look === 'pulse'
        ? [continueRow, reportsRow, parentRow, learningRow, movieRow, topPicksRow]
        : input.look === 'arcade'
          ? [continueRow, learningRow, topPicksRow, movieRow, parentRow, careRow]
          : input.look === 'atelier'
            ? [continueRow, parentRow, financeRow, careRow, learningRow, topPicksRow]
            : input.look === 'rang'
              ? [continueRow, topPicksRow, movieRow, parentRow, learningRow, financeRow]
              : [continueRow, careRow, learningRow, topPicksRow, movieRow, parentRow, financeRow]

  return order.filter((row) => row.tiles.length > 0)
}
