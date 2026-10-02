import { useState, type FormEvent } from 'react'
import { Badge, Button, Field, inputClass } from '../../components/ui'
import { addCustomApp, customAppLink, removeCustomApp, useCustomApps, type CustomAppScope } from './customApps'
import { useOpenWatch } from './WatchPane'

const SCOPES: { id: CustomAppScope; label: string }[] = [
  { id: 'all', label: 'All movies & series' },
  { id: 'erotic', label: 'Erotic shelf only' },
]
const SAMPLE_TITLE = 'Drishyam'

export function CustomAppsCard() {
  const apps = useCustomApps()
  const openWatch = useOpenWatch()
  const [name, setName] = useState('')
  const [searchUrl, setSearchUrl] = useState('')
  const [scope, setScope] = useState<CustomAppScope>('all')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const result = addCustomApp({ name, searchUrl, scope })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    setName('')
    setSearchUrl('')
    setScope('all')
  }

  return (
    <section className="card mb-6 p-5" data-testid="custom-apps">
      <h2 className="font-display text-xl">Add your own app</h2>
      <p className="mt-1 text-sm text-muted">
        Type the app name as it appears on your phone. Leave the website blank and the button opens that app. Or add a
        search link with <code>{'{q}'}</code> where the movie name was. Saved on this device only.
      </p>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <Field label="App name">
          <input className={inputClass} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Search link with {q} (optional)">
          <input
            className={inputClass}
            value={searchUrl}
            inputMode="url"
            placeholder="https://www.example.com/search?q={q}"
            onChange={(e) => setSearchUrl(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show on">
            {SCOPES.map((s) => (
              <Button
                key={s.id}
                type="button"
                data-tv-focus="1"
                variant={scope === s.id ? 'soft' : 'ghost'}
                aria-pressed={scope === s.id}
                onClick={() => setScope(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <Button type="submit" data-tv-focus="1" data-testid="custom-app-add">
            Add app
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-clay md:col-span-2">
            {error}
          </p>
        ) : null}
      </form>
      {apps.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {apps.map((app) => (
            <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3" data-testid="custom-app-row">
              <div className="min-w-0">
                <p className="font-semibold">
                  {app.name} {app.scope === 'erotic' ? <Badge tone="clay">Erotic only</Badge> : null}
                </p>
                {app.searchUrl ? <p className="truncate text-xs text-muted">{app.searchUrl}</p> : null}
                {app.androidPackage ? <p className="truncate text-xs text-muted">{app.androidPackage}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  data-tv-focus="1"
                  onClick={() => openWatch({ url: customAppLink(app, SAMPLE_TITLE), title: SAMPLE_TITLE, platformName: app.name })}
                >
                  Test
                </Button>
                <Button variant="ghost" data-tv-focus="1" aria-label={`Remove ${app.name}`} onClick={() => removeCustomApp(app.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
