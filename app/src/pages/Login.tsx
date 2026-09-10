import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, inputClass } from '../components/ui'
import { useStore } from '../store'

const ACCOUNTS = [
  { role: 'Director', email: 'director@willow.care', note: 'Full operations, all sites' },
  { role: 'Teacher', email: 'teacher@willow.care', note: 'LKG/UKG classroom, daily care' },
  { role: 'Parent', email: 'parent@willow.care', note: 'Leo & Mira — Mart COD + grow-at-home' },
]

export function Login() {
  const { login } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('director@willow.care')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState('')

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-pine p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-[#148f6a] opacity-50" />
        <div className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-[#0e4f40] opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles />
            <span className="font-display text-2xl">Willow</span>
          </div>
          <h1 className="font-display mt-16 max-w-md text-5xl leading-tight font-semibold">
            One system for the Indian childhood day.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/85">
            Playgroup–UKG operations like Pathshala / Fledgly / Zenox, plus a FirstCry-style shop with
            Cash on Delivery recommendations. GST, UPI, FSSAI tiffin, UIP vaccines, and van routes —
            switch country in Settings.
          </p>
        </div>
        <ul className="relative grid max-w-lg grid-cols-2 gap-3 text-sm">
          {['PIN pickup', 'UIP vaccines', 'GST + UPI fees', 'Willow Mart COD', 'Van routes', 'WhatsApp notices'].map(
            (item) => (
              <li key={item} className="rounded-xl bg-white/10 px-3 py-2">
                {item}
              </li>
            ),
          )}
        </ul>
      </section>
      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <p className="font-display text-3xl font-semibold">Welcome back</p>
          <p className="mt-1 text-sm text-muted">Demo password for every account is `demo`.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const id = login(email, password)
              if (!id) {
                setError('Unknown email or password.')
                return
              }
              navigate('/')
            }}
          >
            <Field label="Email">
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error ? <p className="text-sm text-rose">{error}</p> : null}
            <Button className="w-full" type="submit">
              Sign in
            </Button>
          </form>
          <div className="mt-8 space-y-2">
            {ACCOUNTS.map((a) => (
              <button
                key={a.email}
                className="card flex w-full items-center justify-between px-4 py-3 text-left hover:border-pine"
                onClick={() => {
                  setEmail(a.email)
                  setPassword('demo')
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
        </div>
      </section>
    </div>
  )
}
