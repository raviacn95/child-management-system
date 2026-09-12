import { http, HttpResponse } from 'msw'
import { getLearningPacks, getPackByAgeBand, searchYouTubeMock } from '../features/learning/learningPacks'
import { recommend } from '../features/learning/recommend'
import { ageBandSchema, recommendationInputSchema } from '../features/learning/schema'
import { catalog } from '../features/meals/catalog'
import { planFamilyMeals } from '../features/meals/plan'
import { recognizeFoods } from '../features/meals/recognize'
import { familyDayPlanSchema, planRequestSchema, recognizeResponseSchema } from '../features/meals/schema'
import { catalog as horizonsCatalog, planHorizons } from '../features/grow/horizons'
import { horizonPlanRequestSchema, horizonPlanSchema } from '../features/grow/schema'
import { catalog as parentFeedCatalog, planParentFeed } from '../features/parent-feed/plan'
import { parentFeedPlanSchema, parentFeedRequestSchema } from '../features/parent-feed/schema'
import { recommendMovies, catalogStats } from '../features/movies/recommend'
import type { MovieKind, MovieLang } from '../features/movies/schema'
import { recommendTopPicks } from '../features/top-picks/feed'

export const handlers = [
  http.get('/api/learning-packs', () => HttpResponse.json(getLearningPacks())),
  http.get('/api/learning-packs/:band', ({ params }) => {
    const parsed = ageBandSchema.safeParse(params.band)
    if (!parsed.success) return HttpResponse.json({ error: 'Unknown age band' }, { status: 400 })
    const pack = getPackByAgeBand(parsed.data)
    if (!pack) return HttpResponse.json({ error: 'Pack not found' }, { status: 404 })
    return HttpResponse.json(pack)
  }),
  http.get('/api/youtube/search', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') ?? ''
    return HttpResponse.json(searchYouTubeMock(q))
  }),
  http.post('/api/recommendations', async ({ request }) => {
    const json = await request.json()
    const input = recommendationInputSchema.parse(json)
    return HttpResponse.json(recommend(input))
  }),
  http.get('/api/meal-planner', () => HttpResponse.json(catalog)),
  http.post('/api/meal-planner/plan', async ({ request }) => {
    const json = await request.json()
    const input = planRequestSchema.parse(json)
    return HttpResponse.json(familyDayPlanSchema.parse(planFamilyMeals(input)))
  }),
  http.post('/api/meal-planner/recognize', async ({ request }) => {
    const json = (await request.json()) as { text?: string }
    return HttpResponse.json(recognizeResponseSchema.parse(recognizeFoods(json.text ?? '')))
  }),
  http.get('/api/horizons', () => HttpResponse.json(horizonsCatalog)),
  http.post('/api/horizons/plan', async ({ request }) => {
    const json = await request.json()
    const input = horizonPlanRequestSchema.parse(json)
    return HttpResponse.json(horizonPlanSchema.parse(planHorizons(input)))
  }),
  http.get('/api/parent-feed', () => HttpResponse.json(parentFeedCatalog)),
  http.post('/api/parent-feed/plan', async ({ request }) => {
    const json = await request.json()
    const input = parentFeedRequestSchema.parse(json)
    return HttpResponse.json(parentFeedPlanSchema.parse(planParentFeed(input)))
  }),
  http.get('/api/movies/platforms', () => HttpResponse.json(catalogStats())),
  http.get('/api/movies/recommend', ({ request }) => {
    const url = new URL(request.url)
    const languages = url.searchParams.get('languages')?.split(',').filter(Boolean)
    const kind = url.searchParams.get('kind')
    const platformId = url.searchParams.get('platformId') || undefined
    const seed = url.searchParams.get('seed') || undefined
    const shelf = url.searchParams.get('shelf') === 'erotic' ? 'erotic' : 'family'
    const decadeRaw = url.searchParams.get('decade')
    const decade = decadeRaw ? Number(decadeRaw) : undefined
    return HttpResponse.json(
      recommendMovies({
        shelf,
        limit: shelf === 'erotic' ? 150 : 100,
        languages: languages?.length ? (languages as MovieLang[]) : undefined,
        kind: kind === 'movie' || kind === 'series' ? (kind as MovieKind) : undefined,
        platformId,
        decade: Number.isFinite(decade) ? decade : undefined,
        seed,
      }),
    )
  }),
  http.post('/api/movies/recommend', async ({ request }) => {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>
    return HttpResponse.json(recommendMovies(json as Parameters<typeof recommendMovies>[0]))
  }),
  http.get('/api/top-picks', ({ request }) => {
    const look = new URL(request.url).searchParams.get('look')
    return HttpResponse.json(recommendTopPicks((look as 'cinema') || 'grove'))
  }),
]
