import { supabase, supabaseEnabled } from '../../lib/supabase'

export async function signInWithSupabase(email: string, password: string) {
  if (!supabaseEnabled || !supabase) return { enabled: false, user: null, error: null }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { enabled: true, user: data.user, error }
}

export async function signUpWithSupabase(email: string, password: string, redirectTo = window.location.origin) {
  if (!supabaseEnabled || !supabase) return { enabled: false, user: null, error: null }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  })
  return { enabled: true, user: data.user, error }
}

export async function sendPasswordReset(email: string, redirectTo = window.location.origin) {
  if (!supabaseEnabled || !supabase) return { enabled: false, error: null }
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { enabled: true, error }
}

export async function signInWithOAuth(provider: 'google' | 'github', redirectTo = window.location.origin) {
  if (!supabaseEnabled || !supabase) return { enabled: false, error: null }
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
  return { enabled: true, error }
}

export async function signOutFromSupabase() {
  if (!supabaseEnabled || !supabase) return
  await supabase.auth.signOut()
}