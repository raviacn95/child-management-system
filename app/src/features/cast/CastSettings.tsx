import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { isTvMode } from '../../lib/tv'
import { sendOnce } from './channel'
import { CastLimits } from './CastLimits'
import { forgetTv, loadDevice, removePhone, useLinkedPhones, useLinkedTvs } from './store'

/** Settings card: linked TVs on a phone, linked phones on a TV. */
export function CastSettings() {
  const tv = isTvMode()
  const tvs = useLinkedTvs()
  const phones = useLinkedPhones()

  function forget(tvId: string) {
    const target = tvs.find((t) => t.tvId === tvId)
    forgetTv(tvId)
    if (target) void sendOnce({ topic: target.id, key: target.key, self: loadDevice('phone'), peerId: target.tvId }, { type: 'bye' })
  }

  function remove(id: string) {
    const target = phones.find((p) => p.id === id)
    removePhone(id)
    if (target) void sendOnce({ topic: target.topic, key: target.key, self: loadDevice('tv'), peerId: target.id }, { type: 'bye' })
  }

  const rows = tv
    ? phones.map((p) => ({ id: p.id, name: p.name, action: 'Remove phone', run: () => remove(p.id) }))
    : tvs.map((t) => ({ id: t.tvId, name: t.name, action: 'Forget this TV', run: () => forget(t.tvId) }))

  return (
    <section className="card mt-6 p-5" data-testid="cast-settings" aria-labelledby="cast-settings-heading">
      <h2 id="cast-settings-heading" className="font-display text-xl">
        Play on TV
      </h2>
      <p className="mt-1 text-sm text-muted">
        {tv
          ? 'Phones linked to this TV can open movies here and work as a remote.'
          : 'Pick a movie on this phone and it opens on your TV running Willow. Free, end-to-end encrypted.'}
      </p>
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{row.name}</span>
              <Button variant="ghost" data-tv-focus="1" onClick={row.run}>
                {row.action}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-pine">
        {tv ? (
          <Link to="/tv-link" data-tv-focus="1">
            Link a phone
          </Link>
        ) : (
          <>
            <Link to="/link">Link to TV</Link>
            {tvs.length ? <Link to="/remote">Phone remote</Link> : null}
          </>
        )}
      </p>
      <CastLimits className="mt-3" />
    </section>
  )
}
