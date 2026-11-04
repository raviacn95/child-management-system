import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, PageHead, inputClass } from '../../components/ui'
import { today } from '../../data/seed'
import { childName } from '../../lib'
import { useStore } from '../../store'
import {
  askRecords,
  detectFirsts,
  developmentWatch,
  energyMeter,
  familyRisk,
  friendshipMap,
  growthStory,
  highlightReel,
  monthLabel,
  readiness,
  shiftIso,
  timeMachine,
} from './engine'

const MAGIC = [
  'Shared a toy without being asked',
  'Comforted a friend',
  'Said thank you',
  'Solved a conflict with words',
]

function speak(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = document.documentElement.lang || 'en-IN'
  window.speechSynthesis.speak(utterance)
}

function localDay(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function spokenMoment(name: string, text: string) {
  const trimmed = text.trim().replace(/[.!?]+$/, '')
  const body = trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
  return `${name} ${body}.`
}

function weekdayIndex(iso: string) {
  const day = new Date(`${iso}T12:00:00`).getDay()
  return day === 0 ? 6 : day - 1
}

export function WonderDesk() {
  const { state, addMagicMoment, addPlayLink, addSpokenWord, keepFirsts, pingArrival, markPingReady, noteWonderVisit } =
    useStore()
  const user = state.users.find((person) => person.id === state.currentUserId)
  const staff = user?.role !== 'parent'
  const date = today()
  const kids = state.children.filter(
    (child) =>
      child.siteId === state.currentSiteId &&
      child.status === 'enrolled' &&
      (user?.role !== 'parent' || user.childIds.includes(child.id)),
  )
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const child = kids.find((item) => item.id === childId) ?? kids[0]
  const [playWith, setPlayWith] = useState(kids[1]?.id ?? '')
  const [word, setWord] = useState('')
  const [question, setQuestion] = useState('How much did my child eat this week?')
  const [card, setCard] = useState(0)
  const [playing, setPlaying] = useState(false)
  const book = state.wonder ?? { moments: [], plays: [], words: [], firsts: [], pings: [], visits: [] }
  const firsts = child
    ? detectFirsts({
        childId: child.id,
        logs: state.dailyLogs,
        plays: book.plays,
        moments: book.moments
          .filter((moment) => moment.childId === child.id)
          .map((moment) => ({ date: localDay(moment.at), text: moment.text })),
        known: book.firsts,
      })
    : []

  useEffect(() => {
    noteWonderVisit()
  }, [user?.id, noteWonderVisit])

  const firstKey = firsts.map((item) => item.title).join('|')
  useEffect(() => {
    if (firstKey) keepFirsts(firsts)
    // firstKey is the stable signal; firsts is read for the save payload of that same render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child?.id, firstKey, keepFirsts])

  const letter = child
    ? timeMachine({
        name: childName(child),
        today: date,
        logs: state.dailyLogs,
        words: book.words,
        childId: child.id,
      })
    : null
  const present = kids.filter((item) =>
    state.attendance.some((row) => row.childId === item.id && row.date === date && row.checkIn && !row.checkOut),
  )
  const map = friendshipMap({
    today: date,
    children: kids.map((item) => ({ id: item.id, name: item.firstName })),
    plays: book.plays.filter((play) => kids.some((item) => item.id === play.a) && kids.some((item) => item.id === play.b)),
    presentIds: present.map((item) => item.id),
  })
  const roomIds = child ? kids.filter((item) => item.classroomId === child.classroomId).map((item) => item.id) : []
  const insights = child
    ? developmentWatch({
        childId: child.id,
        name: child.firstName,
        roomChildIds: roomIds,
        today: date,
        logs: state.dailyLogs,
        observations: state.observations,
        words: book.words,
      })
    : []
  const log = state.dailyLogs.find((row) => row.childId === child?.id && row.date === date)
  const todaysMoments = book.moments.filter((moment) => moment.childId === child?.id && localDay(moment.at) === date)
  const reel = highlightReel({ log, moments: todaysMoments.map((moment) => moment.text) })
  const savedFirsts = book.firsts.filter((item) => item.childId === child?.id)
  const monthLogs = state.dailyLogs.filter((row) => row.childId === child?.id && row.date.slice(0, 7) === date.slice(0, 7))
  const monthPlays = child
    ? book.plays
        .filter((play) => play.a === child.id || play.b === child.id)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
    : []
  const monthPlay = monthPlays.find((play) => play.date.startsWith(date.slice(0, 7)))
  const friendId = child && monthPlay ? (monthPlay.a === child.id ? monthPlay.b : monthPlay.a) : ''
  const earliestWithFriend = monthPlays.find((play) => (play.a === child?.id ? play.b : play.a) === friendId)
  const story = child
    ? growthStory({
        name: child.firstName,
        monthLabel: monthLabel(date),
        logs: monthLogs,
        moments: book.moments.filter((moment) => moment.childId === child.id && localDay(moment.at).startsWith(date.slice(0, 7))).map((moment) => moment.text),
        firsts: savedFirsts.filter((item) => item.date.startsWith(date.slice(0, 7))).map((item) => item.title),
        words: book.words.filter((item) => item.childId === child.id && item.date.startsWith(date.slice(0, 7))).map((item) => item.word),
        friendName: kids.find((item) => item.id === friendId)?.firstName,
        newFriend: Boolean(earliestWithFriend && earliestWithFriend.date.startsWith(date.slice(0, 7))),
      })
    : null
  const scores = child
    ? readiness({
        logs: state.dailyLogs.filter((row) => row.childId === child.id),
        plays: book.plays.filter((play) => play.a === child.id || play.b === child.id).length,
        moments: book.moments.filter((moment) => moment.childId === child.id).length,
        words: book.words.filter((item) => item.childId === child.id).length,
        today: date,
      })
    : []
  const energy = energyMeter(present.map((item) => state.dailyLogs.find((row) => row.childId === item.id && row.date === date)?.mood ?? '').filter(Boolean))
  const answer = child
    ? askRecords({
        question,
        name: child.firstName,
        today: date,
        logs: state.dailyLogs.filter((row) => row.childId === child.id),
        plays: book.plays
          .filter((play) => play.a === child.id || play.b === child.id)
          .map((play) => ({
            date: play.date,
            other: kids.find((item) => item.id === (play.a === child.id ? play.b : play.a))?.firstName ?? 'a friend',
          })),
        moments: book.moments.filter((moment) => moment.childId === child.id).map((moment) => ({ date: localDay(moment.at), text: moment.text })),
        words: book.words.filter((item) => item.childId === child.id),
      })
    : ''

  const spoken = story?.cards[Math.min(card, (story?.cards.length ?? 1) - 1)]?.body
  useEffect(() => {
    if (!playing || !spoken) return
    speak(spoken)
  }, [playing, card, spoken])

  const risks = useMemo(() => {
    if (user?.role !== 'director') return []
    const index = weekdayIndex(date)
    return state.guardians
      .filter((guardian) => guardian.childIds.some((id) => kids.some((childItem) => childItem.id === id)))
      .map((guardian) => {
        const familyKids = kids.filter((item) => guardian.childIds.includes(item.id))
        const account = state.users.find((person) => person.email.toLowerCase() === guardian.email.toLowerCase())
        const openBalance = state.invoices
          .filter((invoice) => invoice.status !== 'paid' && invoice.childIds.some((id) => familyKids.some((item) => item.id === id)))
          .reduce((sum, invoice) => sum + (invoice.amount - invoice.paid), 0)
        const unread = state.messages.filter((message) => message.toId === account?.id && !message.read).length
        const missed = familyKids.filter((item) => item.weeklySchedule[index] && !state.attendance.some((row) => row.childId === item.id && row.date === date && row.checkIn)).length
        const visit = book.visits.filter((item) => item.userId === account?.id).sort((a, b) => b.day.localeCompare(a.day))[0]
        const daysSinceVisit = visit ? Math.round((Date.parse(date) - Date.parse(visit.day)) / 86_400_000) : null
        return { name: guardian.name, ...familyRisk({ openBalance, unreadMessages: unread, missedDays: missed, daysSinceVisit }) }
      })
  }, [book.visits, date, kids, state.attendance, state.guardians, state.invoices, state.messages, state.users, user?.role])

  if (!child || !letter || !story) return <PageHead title="Wonder" subtitle="Add a child to start the family book." />

  const current = story.cards[Math.min(card, story.cards.length - 1)]

  return (
    <div data-testid="wonder-desk">
      <PageHead
        title="Wonder"
        subtitle="Live Desk runs the daycare. Wonder captures, understands, and preserves childhood."
      />
      <label className="mb-4 block max-w-sm text-sm">
        Child
        <select className={`${inputClass} mt-1`} value={child.id} onChange={(event) => { setChildId(event.target.value); setCard(0); setPlaying(false) }}>
          {kids.map((item) => (
            <option key={item.id} value={item.id}>
              {childName(item)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase lg:col-span-2">Capture and preserve</p>
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-xl">Time machine</h2>
          <p className="mt-1 text-sm text-muted">The same date, one year ago.</p>
          {letter.found ? (
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted">New word</dt><dd className="font-semibold">{letter.word || 'None saved'}</dd></div>
              <div><dt className="text-xs text-muted">Photos taken</dt><dd className="font-semibold">{letter.photos}</dd></div>
              <div><dt className="text-xs text-muted">Favorite activity</dt><dd className="font-semibold">{letter.activity || 'None saved'}</dd></div>
            </dl>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed">{letter.text}</p>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-xl">Growth story</h2>
          <p className="mt-1 text-xs text-muted">One story from activities, meals, friendships, and teacher notes. It plays here and does not export a video file.</p>
          <div className="mt-4 rounded-2xl bg-sand px-4 py-6">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{current.heading}</p>
            <p className="mt-2 text-lg">{current.body}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" onClick={() => { setPlaying(true); setCard(0) }}>Play the story</Button>
            <Button type="button" variant="ghost" onClick={() => setCard((index) => Math.min(story.cards.length - 1, index + 1))}>Next card</Button>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">Friendship map</h2>
          <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Strong friendship</p>
          <ul className="mt-1 text-sm">{map.best.length ? map.best.map((line) => <li key={line}>{line}</li>) : <li>No pair has repeated yet.</li>}</ul>
          <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">New this week</p>
          <ul className="mt-1 text-sm">{map.fresh.length ? map.fresh.map((line) => <li key={line}>{line}</li>) : <li>No new pair this week.</li>}</ul>
          <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Needs attention</p>
          <ul className="mt-1 text-sm">
            {map.alone.length ? map.alone.map((name) => <li key={name}>{name} has not logged play interactions this week.</li>) : <li>Everyone present has a play link.</li>}
          </ul>
          {map.groups.length ? (
            <>
              <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Emerging group</p>
              <ul className="mt-1 text-sm">{map.groups.map((line) => <li key={line}>{line}</li>)}</ul>
            </>
          ) : null}
          {staff ? (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-sm">
                Played with
                <select className={`${inputClass} mt-1`} value={playWith} onChange={(event) => setPlayWith(event.target.value)}>
                  {kids.filter((item) => item.id !== child.id).map((item) => (
                    <option key={item.id} value={item.id}>{item.firstName}</option>
                  ))}
                </select>
              </label>
              <Button type="button" onClick={() => addPlayLink(child.id, playWith)}>They played today</Button>
            </div>
          ) : null}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">First-time book</h2>
          <p className="mt-1 text-sm text-muted">Saved automatically from meals, naps, art, friendships, and shared toys.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(savedFirsts.length ? savedFirsts : firsts).map((item) => (
              <li key={item.id}>
                <Badge tone="gold">{item.date.slice(5)}</Badge> {item.title}
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-xl">Magic moment feed</h2>
          <p className="mt-1 text-sm text-muted">Character, in one tap. Parents see the moment, not just attendance.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MAGIC.map((text) => (
              <Button key={text} type="button" variant="soft" onClick={() => addMagicMoment(child.id, text)}>
                {text}
              </Button>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {book.moments.filter((moment) => kids.some((item) => item.id === moment.childId)).slice(0, 6).map((moment) => (
              <li key={moment.id}>
                {spokenMoment(kids.find((item) => item.id === moment.childId)?.firstName ?? 'A child', moment.text)}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase lg:col-span-2">Understand</p>
        <section className="card p-5">
          <h2 className="font-display text-xl">Development watch</h2>
          <p className="mt-1 text-sm text-muted">This week against the week before, and against the room.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {insights.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <label className="mt-3 block text-sm">
            New word heard
            <input className={`${inputClass} mt-1`} value={word} onChange={(event) => setWord(event.target.value)} />
          </label>
          <Button className="mt-2" type="button" variant="ghost" onClick={() => { addSpokenWord(child.id, word); setWord('') }}>
            Save word
          </Button>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">Ask the records</h2>
          <label className="mt-3 block text-sm">
            Question
            <input className={`${inputClass} mt-1`} value={question} onChange={(event) => setQuestion(event.target.value)} />
          </label>
          <p className="mt-3 text-sm">{answer}</p>
          <p className="mt-2 text-xs text-muted">Meals, naps, who they play with most, magic moments, and new words. Answers stay inside {child.firstName}’s file.</p>
        </section>

        {risks.length ? (
          <section className="card p-5 lg:col-span-2">
            <h2 className="font-display text-xl">Family warmth</h2>
            <p className="mt-1 text-sm text-muted">Open invoices, unread messages, missed check-ins, and a quiet family book. A prompt to stay in touch, not a judgement.</p>
            <ul className="mt-3 space-y-3 text-sm">
              {risks.map((risk) => (
                <li key={risk.name}>
                  <span className="font-semibold">{risk.name}</span>
                  <span className="mx-2 text-muted">Warmth score</span>
                  <Badge tone={risk.score === 'high' ? 'rose' : risk.score === 'medium' ? 'gold' : 'pine'}>{risk.score}</Badge>
                  <p className="mt-1">{risk.reasons.join(' ') || 'In touch.'}</p>
                  <p>Recommendation: {risk.action}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase lg:col-span-2">The day</p>
        <section className="card p-5">
          <h2 className="font-display text-xl">Pickup radar</h2>
          <p className="mt-1 text-sm text-muted">Starts when an adult taps that they are in the parking area. There is no geofence.</p>
          <ol className="mt-3 space-y-1 text-sm">
            <li>Parent arriving</li>
            <li>Prepare backpack</li>
            <li>Collect artwork</li>
            <li>Notify teacher</li>
            <li>Ready at the door</li>
          </ol>
          <Button className="mt-3" type="button" onClick={() => pingArrival(child.id, user?.name ?? 'A parent')}>
            I’m in the parking area
          </Button>
          <ul className="mt-3 space-y-2 text-sm">
            {book.pings.filter((ping) => kids.some((item) => item.id === ping.childId)).map((ping) => {
              const who = kids.find((item) => item.id === ping.childId)
              const shots = state.dailyLogs.find((row) => row.childId === ping.childId && row.date === date)?.photos ?? 0
              return (
                <li key={ping.id}>
                  <p className="font-semibold">{ping.personName} is here for {who?.firstName}. {ping.ready ? 'Ready at the door.' : 'Prepare the backpack and tell the teacher.'}</p>
                  <p>Tell {who?.firstName}. Pack the bag.{shots ? ' Collect today’s artwork.' : ''}</p>
                  {staff && !ping.ready ? <Button className="mt-1" type="button" variant="soft" onClick={() => markPingReady(ping.id)}>Ready at the door</Button> : null}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">Classroom energy</h2>
          <p className="mt-1 text-sm text-muted">From today’s mood entries.</p>
          <p className="mt-3 text-sm">
            <Badge tone={energy.band === 'overstimulated' ? 'rose' : energy.band === 'active' ? 'gold' : 'pine'}>{energy.label}</Badge>
          </p>
          <p className="mt-2 text-sm">Suggestion: {energy.suggestion}</p>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">Readiness</h2>
          <p className="mt-1 text-sm text-muted">A developmental view, without exams or grades.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {scores.map((row) => (
              <li key={row.domain} className="flex items-center justify-between gap-3">
                <span>{row.domain}</span>
                <span className="font-semibold tabular-nums">{row.score}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">Today’s best moments</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {reel.length ? reel.map((line) => <li key={line}>★ {line}</li>) : <li>Nothing logged for today yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
