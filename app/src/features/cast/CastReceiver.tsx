import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOpenWatch } from '../ott/WatchPane'
import { createReceiver } from './receiver'
import { loadDevice, useLinkedPhones } from './store'

const TOAST_MS = 4500

/** Mounted by the TV strip, so the TV listens on every screen while Willow is open in TV mode. */
export default function CastReceiver() {
  const phones = useLinkedPhones()
  const navigate = useNavigate()
  const location = useLocation()
  const openWatch = useOpenWatch()
  const [toast, setToast] = useState<string | null>(null)
  const live = useRef({ navigate, openWatch, pathname: location.pathname })
  const receiver = useRef<ReturnType<typeof createReceiver> | null>(null)

  useEffect(() => {
    live.current = { navigate, openWatch, pathname: location.pathname }
  })

  useEffect(() => {
    const next = createReceiver({
      self: loadDevice('tv'),
      pathname: () => live.current.pathname,
      navigate: (to) => live.current.navigate(to),
      openWatch: (session) => live.current.openWatch(session),
      showToast: setToast,
    })
    receiver.current = next
    return () => {
      next.dispose()
      receiver.current = null
    }
  }, [])

  useEffect(() => {
    receiver.current?.sync(phones)
  }, [phones])

  useEffect(() => {
    receiver.current?.refresh()
  }, [location.pathname])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null
  return (
    <div
      role="status"
      aria-live="assertive"
      data-testid="cast-toast"
      className="fixed inset-x-0 bottom-12 z-[70] mx-auto w-fit max-w-[90vw] rounded-2xl bg-ink px-8 py-5 text-center text-2xl font-semibold text-paper shadow-2xl"
    >
      {toast}
    </div>
  )
}
