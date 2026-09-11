import { useState } from 'react'
import { Badge, Button, Field, inputClass, PageHead } from '../../components/ui'
import { platforms } from '../movies/catalog'
import { openStorefront } from './fireTv'
import { useStore } from '../../store'
import { isTvMode } from '../../lib/tv'

const PRIORITY = ['prime', 'netflix', 'hotstar', 'sonyliv', 'zee5', 'youtube', 'aha', 'sunnxt', 'manoramamax', 'mubi']

export function OttHub() {
  const { state, upsertOttAccount, disconnectOtt, touchOtt } = useStore()
  const userId = state.currentUserId ?? ''
  const mine = (state.ottAccounts ?? []).filter((a) => a.userId === userId)
  const [platformId, setPlatformId] = useState('prime')
  const [email, setEmail] = useState('')
  const tv = isTvMode()
  const ordered = [...platforms].sort((a, b) => {
    const ra = PRIORITY.includes(a.id) ? PRIORITY.indexOf(a.id) : 80
    const rb = PRIORITY.includes(b.id) ? PRIORITY.indexOf(b.id) : 80
    return ra - rb || a.name.localeCompare(b.name)
  })

  return (
    <div data-testid="ott-hub">
      <PageHead
        title="My OTT logins"
        subtitle="Save which streaming apps this Willow user uses. Passwords stay in Prime, Netflix, SonyLIV and the rest on your Fire Stick — Willow only remembers the account email and opens the official app."
      />
      <section className="card mb-6 p-5">
        <h2 className="font-display text-xl">Connect a channel</h2>
        <p className="mt-1 text-sm text-muted">
          One vault per Willow login. On Fire TV, Open app jumps into the storefront you already signed into on the Stick.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="OTT">
            <select className={inputClass} value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
              {ordered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Account email / ID (reminder only)">
            <input
              className={inputClass}
              value={email}
              autoComplete="username"
              placeholder="you@family.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!userId) return
                upsertOttAccount({ userId, platformId, email: email.trim(), connected: true })
                setEmail('')
              }}
            >
              Save to my vault
            </Button>
          </div>
        </div>
      </section>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {mine.length === 0 ? (
          <li className="card p-5 text-sm text-muted">No OTTs saved yet. Add Prime, Netflix, SonyLIV, Hotstar…</li>
        ) : (
          mine.map((a) => {
            const p = platforms.find((x) => x.id === a.platformId)
            return (
              <li key={a.id} className="card p-4" data-testid="ott-card">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p?.name ?? a.platformId}</h3>
                  <Badge tone="pine">Saved</Badge>
                </div>
                <p className="mt-1 text-sm">{a.email || 'Email not stored'}</p>
                <p className="mt-1 text-xs text-muted">
                  {a.lastOpenedAt ? `Last opened ${a.lastOpenedAt.slice(0, 16).replace('T', ' ')}` : 'Not opened yet'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      touchOtt(a.id)
                      openStorefront(a.platformId, p?.name, tv)
                    }}
                  >
                    Open app
                  </Button>
                  <Button variant="ghost" onClick={() => disconnectOtt(a.id)}>
                    Remove
                  </Button>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
