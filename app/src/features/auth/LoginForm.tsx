import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button, Field, inputClass } from '../../components/ui'
import { useStore } from '../../store'
import { readLastEmail } from './session'
import { homePath } from '../../lib/tv'

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
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: readLastEmail() || 'director@willow.care', password: 'demo', remember: true },
  })

  return (
    <>
      <form
        className="mt-8 space-y-4"
        onSubmit={form.handleSubmit((values) => {
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
          Sign in
        </Button>
      </form>
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
