import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { inputClass } from '../../components/ui'
import { AgentAnswer } from '../agent/AgentAnswer'
import { useAgent } from '../agent/useAgent'
import { useExperience } from './ExperienceProvider'
import { searchWillow, type SearchHit } from './searchIndex'

type SpeechRec = {
  lang: string
  start: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
}

const MIN_ASK = 2

function speechCtor(): (new () => SpeechRec) | undefined {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)

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

  return open ? <PalettePanel onClose={() => setOpen(false)} /> : null
}

/** Mounted only while open, so closing the palette drops the query and any answer. */
function PalettePanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { earn } = useExperience()
  const agent = useAgent()
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const hits = searchWillow(query)

  function go(hit: SearchHit) {
    earn('search')
    onClose()
    navigate(hit.href)
  }

  async function ask(text: string) {
    if (text.trim().length < MIN_ASK) return
    const outcome = await agent.ask(text)
    if (!outcome?.path) return
    onClose()
    navigate(outcome.path)
  }

  function listen() {
    const Ctor = speechCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = document.documentElement.lang || 'en-IN'
    rec.onresult = (event) => {
      const said = event.results[0]?.[0]?.transcript ?? ''
      setQuery(said)
      setListening(false)
      void ask(said)
    }
    rec.onend = () => setListening(false)
    setListening(true)
    rec.start()
  }

  return (
    <div className="command-palette" data-testid="command-palette" data-tv-modal="1" role="dialog" aria-label="Ask Willow">
      <button type="button" className="command-palette-backdrop" aria-label="Close search" onClick={onClose} />
      <div className="card command-palette-panel p-3">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            void ask(query)
          }}
        >
          <input
            autoFocus
            className={inputClass}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (agent.turn) agent.reset()
            }}
            placeholder='Ask or search: "Hindi comedy movies", "open Learning"'
            aria-label="Ask or search Willow"
            data-testid="command-query"
            data-tv-focus="1"
            maxLength={200}
          />
          <button
            type="submit"
            className="rounded-xl bg-pine px-3 text-sm font-semibold text-[var(--color-pine-ink)] disabled:opacity-60"
            data-testid="agent-ask"
            data-tv-focus="1"
            disabled={agent.busy || query.trim().length < MIN_ASK}
          >
            {agent.busy ? 'Thinking' : 'Ask'}
          </button>
          <button
            type="button"
            className="rounded-xl border border-line px-3 text-sm font-semibold"
            data-tv-focus="1"
            onClick={listen}
            disabled={!speechCtor()}
          >
            {listening ? 'Listening' : 'Speak'}
          </button>
        </form>
        {agent.turn ? (
          <AgentAnswer turn={agent.turn} onDone={onClose} />
        ) : (
          <ul className="mt-3 max-h-72 overflow-auto">
            {hits.map((hit) => (
              <li key={`${hit.group}-${hit.id}`}>
                <button type="button" className="hub-hit" data-tv-focus="1" onClick={() => go(hit)}>
                  <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">{hit.group}</span>
                  <span className="block text-sm font-semibold">{hit.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 px-1 text-[11px] text-muted">
          Ctrl+K · Ask answers simple requests on this device
          {agent.aiReady ? '. Other requests send only your words to the Willow AI helper, never names or numbers' : ''}. Speak uses the device mic, not Alexa.
        </p>
      </div>
    </div>
  )
}
