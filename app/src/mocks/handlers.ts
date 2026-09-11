import { http, HttpResponse } from 'msw'
import { getLearningPacks, getPackByAgeBand, searchYouTubeMock } from '../features/learning/learningPacks'
import { recommend } from '../features/learning/recommend'
import { ageBandSchema, recommendationInputSchema } from '../features/learning/schema'

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
]
