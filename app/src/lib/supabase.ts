import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../env'

export const supabaseEnabled = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null