import { recommend } from '../src/features/learning/recommend'
import type { RecommendationInput } from '../src/features/learning/recommend'

/** Cloudflare / Netlify-style edge entry. Deploy this file to an edge runtime when you leave GitHub Pages. */
export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return new Response('POST a recommendation input JSON body', { status: 405 })
    }
    const input = (await request.json()) as RecommendationInput
    return Response.json(recommend(input), {
      headers: { 'cache-control': 'public, s-maxage=60' },
    })
  },
}
