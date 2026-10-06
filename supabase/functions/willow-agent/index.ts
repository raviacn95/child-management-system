import { clientKey, handleAgent } from './handler.mts'
import { supabaseQuota } from './quota.mts'

const env = (key: string) => Deno.env.get(key)
const allow = supabaseQuota(env, fetch)

Deno.serve(async (req) =>
  handleAgent(req, { env, fetch, allow, log: (event, detail) => console.warn(event, detail ?? {}) }, await clientKey(req, env('SUPABASE_SERVICE_ROLE_KEY') ?? '')),
)
