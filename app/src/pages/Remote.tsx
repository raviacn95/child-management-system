import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CornerUpLeft, House, Undo2 } from 'lucide-react'
import { Field, inputClass } from '../components/ui'
import { CastLimits } from '../features/cast/CastLimits'
import { openChannel } from '../features/cast/channel'
import type { LinkedTv } from '../features/cast/pairing'
import { PhoneShell } from '../features/cast/PhoneShell'
import { offerDirect, type DirectLink } from '../features/cast/rtc'
import type { RemoteKey } from '../features/cast/schema'
import { loadDevice, useLinkedTvs } from '../features/cast/store'
import { createKeyQueue, RELAY_KEY_INTERVAL_MS } from '../features/cast/throttle'
import { RelayError } from '../features/cast/transport'

const NO_ANSWER_MS = 10_000
const PAD = 'flex h-20 items-center justify-center rounded-2xl border border-line bg-paper text-ink active:bg-pine-soft'

export function RemotePage() {
  const tvs = useLinkedTvs()
  const [tvId, setTvId] = useState('')
  const tv = tvs.find((t) => t.tvId === tvId) ?? tvs[0]
  return (
    <PhoneShell title="Phone remote" subtitle="Moves the selection in Willow on the TV." testId="remote-page">
      {tv ? (
        <>
          {tvs.length > 1 ? (
            <Field label="TV">
              <select className={inputClass} value={tv.tvId} onChange={(e) => setTvId(e.target.value)}>
                {tvs.map((t) => (
                  <option key={t.tvId} value={t.tvId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <RemotePad key={tv.tvId} tv={tv} />
        </>
      ) : (
        <p className="card p-5">
          No TV linked yet.{' '}
          <Link to="/link" className="font-semibold text-pine">
            Link to TV
          </Link>
        </p>
      )}
      <CastLimits className="mt-6" />
    </PhoneShell>
  )
}

function RemotePad({ tv }: { tv: LinkedTv }) {
  const [status, setStatus] = useState('Connecting…')
  const [direct, setDirect] = useState(false)
  const [error, setError] = useState('')
  const directRef = useRef(false)
  const pushRef = useRef<(key: RemoteKey) => void>(() => undefined)

  useEffect(() => {
    const channel = openChannel({ topic: tv.id, key: tv.key, self: loadDevice('phone'), peerId: tv.tvId })
    let link: DirectLink | null = null
    let alive = true
    channel.listen((msg) => {
      if (msg.type === 'status') setStatus(msg.focus ? `${msg.screen} › ${msg.focus}` : msg.screen)
    })
    const queue = createKeyQueue(
      (batch) => {
        channel
          .send({ type: 'key', key: batch.key, ...(batch.times > 1 ? { times: batch.times } : {}) })
          .then(() => setError(''))
          .catch((err: unknown) =>
            setError(err instanceof RelayError && err.status === 429 ? 'The free relay is busy. Wait a few seconds.' : 'Could not reach the TV.'),
          )
      },
      () => (directRef.current ? 0 : RELAY_KEY_INTERVAL_MS),
    )
    pushRef.current = queue.push
    const onLink = (up: boolean) => {
      directRef.current = up
      setDirect(up)
    }
    channel
      .ready()
      .then(async () => {
        await channel.send({ type: 'ping' })
        const next = await offerDirect(channel, onLink)
        if (alive) link = next
        else next?.close()
      })
      .catch(() => setError('Could not reach the free relay.'))
    const timer = setTimeout(() => setStatus((s) => (s === 'Connecting…' ? 'No answer. Is Willow open on the TV?' : s)), NO_ANSWER_MS)
    return () => {
      alive = false
      clearTimeout(timer)
      queue.dispose()
      link?.close()
      channel.close()
    }
  }, [tv.id, tv.key, tv.tvId])

  const press = (key: RemoteKey) => pushRef.current(key)
  return (
    <section className="card p-5" aria-label={`Remote for ${tv.name}`}>
      <p className="text-lg font-semibold" data-testid="remote-status" aria-live="polite">
        TV: {status}
      </p>
      <p className="mt-1 text-xs text-muted" data-testid="remote-link">
        {direct ? 'Direct link · instant' : 'Via free relay · presses are batched'}
      </p>
      <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-3">
        <span />
        <PadButton label="Up" onPress={() => press('up')} icon={<ArrowUp size={28} />} />
        <span />
        <PadButton label="Left" onPress={() => press('left')} icon={<ArrowLeft size={28} />} />
        <PadButton label="OK" onPress={() => press('ok')} icon={<span className="text-xl font-bold">OK</span>} />
        <PadButton label="Right" onPress={() => press('right')} icon={<ArrowRight size={28} />} />
        <span />
        <PadButton label="Down" onPress={() => press('down')} icon={<ArrowDown size={28} />} />
        <span />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm font-semibold">
        <PadButton label="Back" onPress={() => press('back')} icon={<CornerUpLeft size={22} />} text="Back" />
        <PadButton label="TV home" onPress={() => press('home')} icon={<House size={22} />} text="Home" />
        <PadButton label="Back to Willow" onPress={() => press('willow')} icon={<Undo2 size={22} />} text="Willow" />
      </div>
      {error ? (
        <p className="mt-3 text-sm text-rose" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function PadButton({ label, icon, text, onPress }: { label: string; icon: ReactNode; text?: string; onPress: () => void }) {
  return (
    <button type="button" className={`${PAD} flex-col gap-1`} aria-label={label} onClick={onPress}>
      {icon}
      {text ? <span>{text}</span> : null}
    </button>
  )
}
