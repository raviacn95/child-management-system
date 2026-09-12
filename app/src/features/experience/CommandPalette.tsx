import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inputClass } from '../../components/ui'
import { useExperience } from './ExperienceProvider'
import { searchWillow, type SearchHit } from './searchIndex'

type SpeechRec = {
  lang: string
  start: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
}

function speechCtor(): (new () => SpeechRec) | undefined {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function CommandPalette() {
  const navigate = useNavigate()
  const { earn } = useExperience()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const hits = searchWillow(query)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('willow-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('willow-search', onOpen)
    }
  }, [])

  function go(hit: SearchHit) {
    earn('search')
    setOpen(false)
    setQuery('')
    navigate(hit.href)
  }

  function listen() {
    const Ctor = speechCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = document.documentElement.lang || 'en-IN'
    rec.onresult = (event) => {
      setQuery(event.results[0]?.[0]?.transcript ?? '')
      setListening(false)
    }
    rec.onend = () => setListening(false)
    setListening(true)
    rec.start()
  }

  if (!open) return null

  return (
    <div className="command-palette" data-testid="command-palette" role="dialog" aria-label="Search Willow">
      <button type="button" className="command-palette-backdrop" aria-label="Close search" onClick={() => setOpen(false)} />
      <div className="card command-palette-panel p-3">
        <div className="flex gap-2">
          <input
            autoFocus
            className={inputClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, learning packs, reports, meals…"
            aria-label="Search Willow"
            data-testid="command-query"
          />
          <button
            type="button"
            className="rounded-xl border border-line px-3 text-sm font-semibold"
            onClick={listen}
            disabled={!speechCtor()}
          >
            {listening ? 'Listening' : 'Speak'}
          </button>
        </div>
        <ul className="mt-3 max-h-72 overflow-auto">
          {hits.map((hit) => (
            <li key={`${hit.group}-${hit.id}`}>
              <button type="button" className="hub-hit" onClick={() => go(hit)}>
                <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">{hit.group}</span>
                <span className="block text-sm font-semibold">{hit.title}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 px-1 text-[11px] text-muted">Ctrl+K · local search only · Speak uses the device mic, not Alexa.</p>
      </div>
    </div>
  )
}
