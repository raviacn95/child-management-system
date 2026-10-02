import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, PageHead } from '../components/ui'
import { openChannel, sendOnce, type Channel } from '../features/cast/channel'
import { CastLimits } from '../features/cast/CastLimits'
import { codeChannel, newCodeWindow, newPairChannel } from '../features/cast/crypto'
import { pairingUrl, TV_APPROVE_WINDOW_MS, tvPairing, type PairRequest } from '../features/cast/pairing'
import { QrSvg } from '../features/cast/QrSvg'
import { loadDevice, removePhone, savePhone, useLinkedPhones } from '../features/cast/store'

/** TV screen: QR (topic + key) and a 6-digit code (ECDH over a code-derived topic), both need Allow on the TV. */
export function TvLinkPage() {
  const [device] = useState(() => loadDevice('tv'))
  const [pair] = useState(newPairChannel)
  const [codeWindow, setCodeWindow] = useState(() => newCodeWindow())
  const [requests, setRequests] = useState<PairRequest[]>([])
  const [notice, setNotice] = useState('')
  const phones = useLinkedPhones()
  const link = useMemo(() => pairingUrl(window.location.href, pair), [pair])
  const arrivedAt = useRef(new WeakMap<PairRequest, number>())
  const onRequest = useCallback((req: PairRequest) => {
    arrivedAt.current.set(req, Date.now())
    setRequests((list) => [...list.filter((r) => r.device.id !== req.device.id), req])
  }, [])

  useEffect(() => {
    const first = requests[0]
    if (!first) return
    const left = (arrivedAt.current.get(first) ?? Date.now()) + TV_APPROVE_WINDOW_MS - Date.now()
    const timer = setTimeout(() => {
      setRequests((list) => list.filter((r) => r !== first))
      setNotice(`${first.device.name} took too long. Try again on the phone.`)
    }, Math.max(0, left))
    return () => clearTimeout(timer)
  }, [requests])

  useEffect(() => {
    const channel = openChannel({ ...pair, self: device })
    const stop = tvPairing(channel, onRequest)
    return () => {
      stop()
      channel.close()
    }
  }, [pair, device, onRequest])

  useEffect(() => {
    let channel: Channel | null = null
    let stop = () => undefined as void
    let cancelled = false
    void codeChannel(codeWindow.code).then((spec) => {
      if (cancelled) return
      channel = openChannel({ ...spec, self: device })
      stop = tvPairing(channel, onRequest)
    })
    const timer = setTimeout(() => setCodeWindow(newCodeWindow()), Math.max(0, codeWindow.expiresAt - Date.now()))
    return () => {
      cancelled = true
      clearTimeout(timer)
      stop()
      channel?.close()
    }
  }, [codeWindow, device, onRequest])

  async function decide(req: PairRequest, allow: boolean) {
    setRequests((list) => list.filter((r) => r !== req))
    try {
      if (allow) {
        savePhone(await req.approve())
        setNotice(`${req.device.name} can now control this TV.`)
      } else {
        await req.deny()
        setNotice(`${req.device.name} was not allowed.`)
      }
    } catch {
      setNotice('Could not reach the free relay. Ask the phone to try again.')
    }
  }

  function remove(id: string) {
    const phone = phones.find((p) => p.id === id)
    if (!phone) return
    removePhone(id)
    void sendOnce({ topic: phone.topic, key: phone.key, self: device, peerId: phone.id }, { type: 'bye' })
  }

  const code = codeWindow.code
  return (
    <div data-testid="tv-link-page">
      <PageHead title="Link a phone" subtitle={`Pick movies on your phone and they open here on ${device.name}. The phone also works as a remote.`} />
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <figure className="card flex flex-col items-center gap-3 p-6" data-testid="tv-link-qr" data-link={link}>
          <QrSvg text={link} label="QR code to link a phone to this TV" size={300} />
          <figcaption className="text-center text-lg font-semibold">Scan with the phone camera</figcaption>
        </figure>
        <section className="card p-6" aria-labelledby="tv-code-heading">
          <h2 id="tv-code-heading" className="text-lg font-semibold">
            Can’t scan? On the phone open Willow › Link to TV and enter
          </h2>
          <p className="mt-3 font-display text-6xl font-semibold tracking-[0.2em]" data-testid="tv-link-code">
            {code.slice(0, 3)} {code.slice(3)}
          </p>
          <p className="mt-2 text-sm text-muted">The code changes every 5 minutes. Both screens then show the same 4-digit check.</p>
          {notice ? (
            <p className="mt-4 font-semibold text-pine" role="status" data-testid="tv-link-notice">
              {notice}
            </p>
          ) : null}
          <h2 className="mt-6 text-lg font-semibold">Linked phones</h2>
          {phones.length ? (
            <ul className="mt-2 space-y-2" data-testid="tv-linked-phones">
              {phones.map((phone) => (
                <li key={phone.id} className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-lg">{phone.name}</span>
                  <Button variant="ghost" data-tv-focus="1" onClick={() => remove(phone.id)}>
                    Remove phone
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">No phones yet.</p>
          )}
        </section>
      </div>
      <CastLimits className="mt-6" />
      {requests[0] ? <ApproveDialog key={requests[0].device.id} req={requests[0]} onDecide={decide} /> : null}
    </div>
  )
}

function ApproveDialog({ req, onDecide }: { req: PairRequest; onDecide: (req: PairRequest, allow: boolean) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-testid="cast-allow"]')?.focus()
  }, [])
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-6" data-tv-modal="1">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cast-approve-title"
        aria-describedby="cast-approve-check"
        className="card max-w-xl p-8 text-center"
        data-testid="cast-approve"
      >
        <h2 id="cast-approve-title" className="font-display text-3xl font-semibold">
          Allow {req.device.name} to control this TV?
        </h2>
        <p id="cast-approve-check" className="mt-4 text-lg">
          Check the phone shows{' '}
          <strong className="text-4xl tracking-[0.3em]" data-testid="cast-approve-code">
            {req.sas}
          </strong>
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button data-tv-focus="1" data-testid="cast-allow" className="px-8 text-lg" onClick={() => onDecide(req, true)}>
            Allow
          </Button>
          <Button variant="ghost" data-tv-focus="1" className="px-8 text-lg" onClick={() => onDecide(req, false)}>
            Deny
          </Button>
        </div>
      </div>
    </div>
  )
}
