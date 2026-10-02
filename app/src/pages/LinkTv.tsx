import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Field, inputClass } from '../components/ui'
import { CastLimits } from '../features/cast/CastLimits'
import { openChannel, sendOnce } from '../features/cast/channel'
import { codeChannel, type ChannelSpec } from '../features/cast/crypto'
import { PairError, parsePairingCode, phonePair, type LinkedTv } from '../features/cast/pairing'
import { PhoneShell } from '../features/cast/PhoneShell'
import { forgetTv, hasCustomName, loadDevice, saveDeviceName, saveTv, useLinkedTvs } from '../features/cast/store'

type Flow =
  | { step: 'idle' }
  | { step: 'waiting' }
  | { step: 'confirm'; sas: string; tvName: string }
  | { step: 'done'; tvName: string }
  | { step: 'error'; message: string }

const PAIR_ERRORS: Record<string, string> = {
  'no-answer': 'The TV didn’t answer. Keep “Link a phone” open on the TV and try again.',
  denied: 'The TV said no.',
  timeout: 'Nobody pressed Allow on the TV in time.',
  relay: 'Could not reach the free relay. Check the internet and try again.',
}

export function LinkTvPage() {
  const [params] = useSearchParams()
  const fromQr = useMemo(() => parsePairingCode(params.get('c')), [params])
  const tvs = useLinkedTvs()
  const [name, setName] = useState(() => (hasCustomName('phone') ? loadDevice('phone').name : ''))
  const [code, setCode] = useState('')
  const [flow, setFlow] = useState<Flow>({ step: 'idle' })
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  async function link(spec: ChannelSpec) {
    const self = saveDeviceName('phone', name)
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    const channel = openChannel({ ...spec, self })
    setFlow({ step: 'waiting' })
    try {
      const tv = await phonePair(channel, self, {
        signal: ctrl.signal,
        onSas: (sas, tvName) => setFlow({ step: 'confirm', sas, tvName }),
      })
      saveTv(tv)
      setFlow({ step: 'done', tvName: tv.name })
    } catch (err) {
      if (err instanceof PairError && err.code === 'aborted') return
      setFlow({ step: 'error', message: PAIR_ERRORS[err instanceof PairError ? err.code : 'relay'] })
    } finally {
      channel.close()
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (fromQr) return void link(fromQr)
    const digits = code.replace(/\D/g, '')
    if (digits.length !== 6) return setFlow({ step: 'error', message: 'Enter the 6-digit code shown on the TV.' })
    void link(await codeChannel(digits))
  }

  const busy = flow.step === 'waiting' || flow.step === 'confirm'
  return (
    <PhoneShell
      title="Link to TV"
      subtitle="Open Willow on the TV, go to Link phone, then scan its QR code or type its code here."
      testId="link-tv-page"
    >
      <form className="card space-y-4 p-5" onSubmit={(e) => void onSubmit(e)}>
        {fromQr ? <p className="font-semibold text-pine">TV found. Name this phone and tap Link.</p> : null}
        <Field label="This phone’s name (shown on the TV)">
          <input className={inputClass} value={name} maxLength={32} placeholder="e.g. Ravi’s phone" onChange={(e) => setName(e.target.value)} />
        </Field>
        {fromQr ? null : (
          <Field label="Code on the TV">
            <input
              className={`${inputClass} text-2xl tracking-[0.3em]`}
              value={code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              placeholder="123 456"
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
        )}
        <Button type="submit" disabled={busy} data-testid="link-tv-submit">
          Link
        </Button>
        <FlowStatus flow={flow} />
      </form>
      <LinkedTvList tvs={tvs} />
      <CastLimits className="mt-6" />
    </PhoneShell>
  )
}

function FlowStatus({ flow }: { flow: Flow }) {
  if (flow.step === 'idle') return null
  const text =
    flow.step === 'waiting'
      ? 'Contacting the TV…'
      : flow.step === 'confirm'
        ? `Check ${flow.tvName} shows this code, then press Allow on the TV:`
        : flow.step === 'done'
          ? `Linked to ${flow.tvName}. Movie cards now show Play on TV.`
          : flow.message
  return (
    <div role="status" data-testid="link-tv-status" className={flow.step === 'error' ? 'text-rose' : 'text-ink'}>
      <p className="font-semibold">{text}</p>
      {flow.step === 'confirm' ? (
        <p className="mt-2 font-display text-5xl font-semibold tracking-[0.3em]" data-testid="link-tv-sas">
          {flow.sas}
        </p>
      ) : null}
      {flow.step === 'done' ? (
        <p className="mt-2 flex gap-4 text-sm font-semibold text-pine">
          <Link to="/movies">Pick a movie</Link>
          <Link to="/remote">Open the remote</Link>
        </p>
      ) : null}
    </div>
  )
}

function LinkedTvList({ tvs }: { tvs: LinkedTv[] }) {
  if (!tvs.length) return null
  return (
    <section className="card mt-6 p-5" aria-labelledby="linked-tvs-heading">
      <h2 id="linked-tvs-heading" className="font-semibold">
        Linked TVs
      </h2>
      <ul className="mt-3 space-y-3" data-testid="linked-tvs">
        {tvs.map((tv) => (
          <TvRow key={tv.tvId} tv={tv} />
        ))}
      </ul>
    </section>
  )
}

const PING_TIMEOUT_MS = 8000

function TvRow({ tv }: { tv: LinkedTv }) {
  const [status, setStatus] = useState('Checking…')

  useEffect(() => {
    const channel = openChannel({ topic: tv.id, key: tv.key, self: loadDevice('phone'), peerId: tv.tvId })
    const timer = setTimeout(() => setStatus('No answer. Open Willow on the TV.'), PING_TIMEOUT_MS)
    channel.listen((msg) => {
      if (msg.type !== 'status') return
      clearTimeout(timer)
      setStatus(`Online · ${msg.screen}`)
    })
    channel
      .ready()
      .then(() => channel.send({ type: 'ping' }))
      .catch(() => setStatus('Could not reach the free relay.'))
    return () => {
      clearTimeout(timer)
      channel.close()
    }
  }, [tv.id, tv.key, tv.tvId])

  function forget() {
    forgetTv(tv.tvId)
    void sendOnce({ topic: tv.id, key: tv.key, self: loadDevice('phone'), peerId: tv.tvId }, { type: 'bye' })
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <span>
        <span className="font-semibold">{tv.name}</span>
        <span className="block text-xs text-muted" data-testid="linked-tv-status">
          {status}
        </span>
      </span>
      <Button variant="ghost" onClick={forget}>
        Forget this TV
      </Button>
    </li>
  )
}
