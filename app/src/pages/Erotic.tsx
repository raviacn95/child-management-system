import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, PageHead } from '../components/ui'
import { MovieShelf } from '../features/movies/MovieShelf'
import { useStore } from '../store'

const GATE_KEY = 'willow-erotic-18'

export function EroticPage() {
  const { state } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)
  const [ok, setOk] = useState(() => sessionStorage.getItem(GATE_KEY) === '1')

  if (!user || user.role === 'teacher') return <Navigate to="/movies" replace />

  if (!ok) {
    return (
      <div data-testid="erotic-gate">
        <PageHead
          title="18+ erotic shelf"
          subtitle="Adult cinema and series only. Confirm you are 18+ and that no child can see this screen."
        />
        <section className="card max-w-xl p-5">
          <p className="text-sm">
            This shelf ranks 150 adult titles (all decades and languages) by critic, audience, YouTube, Instagram, and
            erotic heat. Links open official storefronts. It is not for classrooms, kids’ tablets, or the family movie
            shelf.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                sessionStorage.setItem(GATE_KEY, '1')
                setOk(true)
              }}
            >
              I am 18+ — show 150 titles
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
        title="150 erotic movies & series"
        subtitle="18+ · every decade · Malayalam, Hindi, Tamil, Telugu, Korean, French and more · Prime, Netflix, MUBI, ALTT, Google Movies and 50+ official channels."
      />
      <MovieShelf compact shelf="erotic" />
    </div>
  )
}
