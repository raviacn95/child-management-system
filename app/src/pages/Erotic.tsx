import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, PageHead } from '../components/ui'
import { MovieShelf } from '../features/movies/MovieShelf'
import { useStore } from '../store'

const GATE_KEY = 'willow-erotic-18'
const GATE_TTL_MS = 30 * 60 * 1000

function hasActiveGate() {
  const raw = sessionStorage.getItem(GATE_KEY)
  if (!raw) return false
  const at = Number(raw)
  if (!Number.isFinite(at) || Date.now() - at > GATE_TTL_MS) {
    sessionStorage.removeItem(GATE_KEY)
    return false
  }
  return true
}

export function EroticPage() {
  const { state } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)
  const [ok, setOk] = useState(hasActiveGate)

  if (!user || user.role === 'teacher') return <Navigate to="/movies" replace />

  if (!ok) {
    return (
      <div data-testid="erotic-gate">
        <PageHead
          title="Mature cinema · 18+"
          subtitle="Age-restricted mainstream films and series. Confirm you are 18+ and that no child can see this screen."
        />
        <section className="card max-w-xl p-5">
          <p className="text-sm">
            This private shelf ranks 150 mature titles across decades and languages using editorial quality, audience
            signals, regional language, diversity, and official availability discovery. Willow does not host streams or
            guarantee availability. It is not for classrooms, kids’ tablets, or the family movie shelf.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                sessionStorage.setItem(GATE_KEY, String(Date.now()))
                setOk(true)
              }}
            >
              I am 18+ — show mature cinema
            </Button>
            <Link to="/movies" className="inline-flex items-center justify-center rounded-xl border border-line px-3.5 py-2 text-sm font-semibold">
              Go back to family movies
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div data-testid="erotic-page">
      <PageHead
        title="150 mature movies & series"
        subtitle="18+ · language and decade filters · official availability discovery · no hosted streams."
      />
      <MovieShelf compact shelf="erotic" />
    </div>
  )
}
