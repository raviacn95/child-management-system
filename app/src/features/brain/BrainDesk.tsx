import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field, PageHead, inputClass } from '../../components/ui'
import { childName } from '../../lib'
import { yearsFromDob } from '../learning/recommend'
import { useStore } from '../../store'
import { BRAIN_CARDS, BRAIN_CATEGORIES, categoryLabel, type BrainCategory } from './cards'
import { cardText, curiosityFromReads, dailyCards, geniusPath, levelForAge, nextOnPath, readLog, rememberRead, similarCards, whyChain, type ExplainLevel } from './feed'

export function BrainDesk() {
  const { state } = useStore()
  const user = state.users.find((person) => person.id === state.currentUserId)
  const kids = state.children.filter((child) =>
    user?.role === 'parent' ? user.childIds.includes(child.id) : child.siteId === state.currentSiteId && child.status === 'enrolled',
  )
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const child = kids.find((item) => item.id === childId) ?? kids[0]
  const ageLevel = child ? levelForAge(yearsFromDob(child.dob)) : 'simple'
  const [level, setLevel] = useState<ExplainLevel>(ageLevel)
  const [section, setSection] = useState<BrainCategory | 'all'>('all')
  const [opened, setOpened] = useState<string[]>(() => (child ? readLog(child.id) : []))
  const [whySteps, setWhySteps] = useState<Record<string, number>>({})
  const cards = dailyCards(BRAIN_CARDS, new Date().toISOString().slice(0, 10))
  const visible = section === 'all' ? cards : cards.filter((card) => card.category === section)
  const scores = curiosityFromReads(BRAIN_CARDS, opened)
  const path = geniusPath(BRAIN_CARDS)
  const next = nextOnPath(BRAIN_CARDS, opened)
  const last = opened.at(-1)
  const related = last ? similarCards(BRAIN_CARDS, last, 3) : []

  function openCard(id: string) {
    if (!child) return
    setOpened(rememberRead(child.id, id))
  }

  return (
    <div className="space-y-6">
      <PageHead title="Brain Feed" subtitle="Fifty short cards for today. Each one takes about ten seconds." />
      <p className="text-sm text-muted">
        <Link to="/learning" className="text-pine">
          Learning
        </Link>
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Child">
          <select
            className={inputClass}
            value={child?.id ?? ''}
            onChange={(event) => {
              const id = event.target.value
              setChildId(id)
              const nextChild = kids.find((item) => item.id === id)
              setLevel(nextChild ? levelForAge(yearsFromDob(nextChild.dob)) : 'simple')
              setOpened(readLog(id))
            }}
          >
            {kids.map((item) => (
              <option key={item.id} value={item.id}>
                {childName(item)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Explain">
          <select className={inputClass} value={level} onChange={(event) => setLevel(event.target.value as ExplainLevel)}>
            <option value="normal">Normal</option>
            <option value="simple">Simple</option>
            <option value="super">Super simple</option>
          </select>
        </Field>
      </div>
      <section className="card p-4">
        <h2 className="font-display text-xl">Curiosity score</h2>
        {scores.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {scores.map((row) => (
              <li key={row.category}>
                {categoryLabel(row.category)}: {row.score}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Open a card and the score starts learning what this child likes.</p>
        )}
      </section>
      <section className="card p-4">
        <h2 className="font-display text-xl">Daily genius path</h2>
        <p className="mt-1 text-sm text-muted">Earth, Moon, gravity, satellites, then space travel.</p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {path.map((card, index) => (
            <li key={card.id}>
              <Button type="button" variant={opened.includes(card.id) ? 'soft' : 'ghost'} onClick={() => openCard(card.id)}>
                Day {index + 1} · {card.title}
              </Button>
            </li>
          ))}
        </ol>
        {next ? <p className="mt-3 text-sm">Next: {next.title}</p> : null}
        {related.length ? (
          <p className="mt-1 text-sm text-muted">Nearby facts: {related.map((row) => row.card.title).join(', ')}</p>
        ) : null}
      </section>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={section === 'all' ? 'soft' : 'ghost'} onClick={() => setSection('all')}>
          All 50
        </Button>
        {BRAIN_CATEGORIES.map((category) => (
          <Button key={category} type="button" variant={section === category ? 'soft' : 'ghost'} onClick={() => setSection(category)}>
            {categoryLabel(category)}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((card) => {
          const steps = whySteps[card.id] ?? 0
          return (
            <article key={card.id} className="card p-4">
              <p className="text-xs tracking-wide text-muted uppercase">{categoryLabel(card.category)}</p>
              <h2 className="font-display text-xl">{card.title}</h2>
              <p className="mt-2 text-sm">{cardText(card, level)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="soft" onClick={() => openCard(card.id)}>
                  {opened.includes(card.id) ? 'Opened' : 'Open'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    openCard(card.id)
                    setWhySteps((current) => ({ ...current, [card.id]: Math.min((current[card.id] ?? 0) + 1, card.why.length) }))
                  }}
                >
                  Why?
                </Button>
              </div>
              {steps > 0 ? (
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
                  {whyChain(card, steps).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
