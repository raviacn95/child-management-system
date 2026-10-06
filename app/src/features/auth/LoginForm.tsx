import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button, Field, inputClass } from '../../components/ui'
import { useStore } from '../../store'
import { readLastEmail } from './session'
import { homePath } from '../../lib/tv'
import { sendPasswordReset, signInWithOAuth, signInWithSupabase, signUpWithSupabase } from './supabaseAuth'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(3, 'Password is required'),
  remember: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const ACCOUNTS = [
  { role: 'Director', email: 'director@willow.care', note: 'Full operations, all sites' },
  { role: 'Teacher', email: 'teacher@willow.care', note: 'LKG/UKG classroom, daily care' },
  { role: 'Parent', email: 'parent@willow.care', note: 'Leo & Mira — Mart COD + grow-at-home' },
]

export function LoginForm() {
  const { login } = useStore()
  const { loginWithIdentity } = useStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: readLastEmail() || 'director@willow.care', password: 'demo', remember: true },
  })

  return (
    <>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setError('')
          setNotice('')
          if (mode === 'signup') {
            const result = await signUpWithSupabase(values.email, values.password)
            if (!result.enabled) {
              setError('Enable Supabase to create a production account.')
              return
            }
            if (result.error) {
              setError(result.error.message)
              return
            }
            setNotice('Check your email to verify your Willow account.')
            return
          }
          const remote = await signInWithSupabase(values.email, values.password)
          if (remote.enabled) {
            if (remote.error || !remote.user) {
              setError(remote.error?.message ?? 'Sign-in failed.')
              return
            }
            const id = loginWithIdentity({
              id: remote.user.id,
              email: remote.user.email ?? values.email,
              role: remote.user.user_metadata?.role,
            })
            if (!id) {
              setError('Your account is verified, but its Willow profile is not provisioned yet.')
              return
            }
            navigate(homePath())
            return
          }
          const id = login(values.email, values.password, values.remember)
          if (!id) {
            setError('Unknown email or password.')
            return
          }
          navigate(homePath())
        })}
      >
        <Field label="Email">
          <input className={inputClass} autoComplete="username" {...form.register('email')} />
        </Field>
        <Field label="Password">
          <input className={inputClass} type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        {form.formState.errors.email ? (
          <p className="text-sm text-rose">{form.formState.errors.email.message}</p>
        ) : null}
        {error ? <p className="text-sm text-rose">{error}</p> : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('remember')} />
          Keep me signed in on this TV / device
        </label>
        <Button className="w-full" type="submit">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
      {notice ? <p className="mt-3 text-sm text-pine">{notice}</p> : null}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-pine">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setNotice('')
          }}
        >
          {mode === 'signin' ? 'Create a production account' : 'Back to sign in'}
        </button>
        {mode === 'signin' ? (
          <button
            type="button"
            onClick={async () => {
              const result = await sendPasswordReset(form.getValues('email'))
              setError(result.error?.message ?? (result.enabled ? '' : 'Enable Supabase for password reset.'))
              setNotice(result.enabled && !result.error ? 'Password reset email sent.' : '')
            }}
          >
            Forgot password?
          </button>
        ) : null}
      </div>
      {mode === 'signin' ? (
        <div className="mt-3 flex gap-3 text-xs text-pine">
          <button
            type="button"
            onClick={async () => {
              const result = await signInWithOAuth('google')
              if (result.error) setError(result.error.message)
              else if (!result.enabled) setError('Enable Supabase for Google sign-in.')
            }}
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={async () => {
              const result = await signInWithOAuth('github')
              if (result.error) setError(result.error.message)
              else if (!result.enabled) setError('Enable Supabase for GitHub sign-in.')
            }}
          >
            Continue with GitHub
          </button>
        </div>
      ) : null}
      <div className="mt-8 space-y-2">
        {ACCOUNTS.map((a) => (
          <button
            key={a.email}
            type="button"
            className="card flex w-full items-center justify-between px-4 py-3 text-left hover:border-pine"
            onClick={() => {
              form.setValue('email', a.email)
              form.setValue('password', 'demo')
              setError('')
            }}
          >
            <span>
              <span className="block text-sm font-semibold">{a.role}</span>
              <span className="text-xs text-muted">{a.note}</span>
            </span>
            <span className="text-xs text-pine">{a.email}</span>
          </button>
        ))}
      </div>
    </>
  )
}
