import { Download, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LookPicker } from '../components/LookPicker'
import { LoginForm } from '../features/auth/LoginForm'

export function Login() {
  return (
    <div className="look-shell grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-pine p-12 text-[var(--color-pine-ink)] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-16 h-80 w-80 rounded-full bg-white/15" />
        <div className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-black/15" />
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
          {['PIN pickup', 'UIP vaccines', 'GST + UPI fees', 'Install as an app', 'Fire Stick download', 'Watch together'].map(
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
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Choose a look</p>
            <LookPicker compact />
          </div>
          <Link
            to="/get-app"
            className="mt-5 flex items-center justify-between rounded-2xl border border-pine/30 bg-pine-soft px-4 py-3 text-left hover:border-pine"
            data-testid="get-app-login-cta"
          >
            <span>
              <span className="block text-sm font-semibold text-pine">Install Willow as an app</span>
              <span className="text-xs text-muted">Android APK, Windows app, or Fire Stick — live, ready to use</span>
            </span>
            <Download className="text-pine" size={18} />
          </Link>
          <LoginForm />
        </div>
      </section>
    </div>
  )
}
