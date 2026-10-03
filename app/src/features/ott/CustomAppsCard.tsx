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
  const [androidPackage, setAndroidPackage] = useState('')
  const [activity, setActivity] = useState('')
  const [scope, setScope] = useState<CustomAppScope>('all')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const result = addCustomApp({ name, searchUrl, androidPackage, activity, scope })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    setName('')
    setSearchUrl('')
    setAndroidPackage('')
    setActivity('')
    setScope('all')
  }

  return (
    <section className="card mb-6 p-5" data-testid="custom-apps">
      <h2 className="font-display text-xl">Add your own app</h2>
      <p className="mt-1 text-sm text-muted">
        Package name opens that installed app. A search link with <code>{'{q}'}</code> sends the movie title. Use an
        https:// link, or the app’s own link such as myapp://open?q={'{q}'}. Leave the link blank and the app opens on
        its home screen. Activity is optional. Saved on this device only.
      </p>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <Field label="App name">
          <input className={inputClass} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Package name (optional)">
          <input
            className={inputClass}
            value={androidPackage}
            placeholder="com.example.app"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setAndroidPackage(e.target.value)}
          />
        </Field>
        <Field label="Activity (optional)">
          <input
            className={inputClass}
            value={activity}
            placeholder="com.example.app.MainActivity"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setActivity(e.target.value)}
          />
        </Field>
        <Field label="Search link with {q} (optional)">
          <input
            className={inputClass}
            value={searchUrl}
            inputMode="url"
            placeholder="myapp://open?q={q}"
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
                {app.activity ? <p className="truncate text-xs text-muted">{app.activity}</p> : null}
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
