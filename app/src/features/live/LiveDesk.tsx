import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, PageHead, inputClass } from '../../components/ui'
import { today } from '../../data/seed'
import { childName, money } from '../../lib'
import { useStore } from '../../store'
import {
  MOODS,
  ageInYears,
  biggestBalance,
  elapsedOnSite,
  centreClock,
  formatElapsed,
  matchPickup,
  menuClashes,
  napAdvice,
  nextVaccine,
  openSeat,
  probeFood,
  roomLoad,
  supplyOutlook,
  weaveDayStory,
  type NamedChild,
} from './engine'

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

function speak(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = document.documentElement.lang || 'en-IN'
  window.speechSynthesis.speak(utterance)
}

export function LiveDesk() {
  const now = useNow()
  const { state, checkOut, clockToggle, updateChild, payInvoice, adjustInventory, updateApplication, setTodayMood, toggleNap } =
    useStore()
  const user = state.users.find((person) => person.id === state.currentUserId)
  const site = state.sites.find((item) => item.id === state.currentSiteId)
  const staffDesk = user?.role !== 'parent'
  const [food, setFood] = useState('')
  const [pin, setPin] = useState('')
  const [notice, setNotice] = useState('')
  const date = today()

  const enrolled = state.children.filter(
    (child) =>
      child.siteId === state.currentSiteId &&
      child.status === 'enrolled' &&
      (user?.role !== 'parent' || user.childIds.includes(child.id)),
  )
  const present = enrolled.filter((child) =>
    state.attendance.some((row) => row.childId === child.id && row.date === date && row.checkIn && !row.checkOut),
  )
  const rooms = state.classrooms.filter((room) => room.siteId === state.currentSiteId)
  const named: NamedChild[] = enrolled.map((child) => ({
    id: child.id,
    name: childName(child),
    allergies: child.allergies,
  }))
  const menu = state.menus.find((day) => day.date === date)
  const menuText = menu ? `${menu.breakfast} ${menu.amSnack} ${menu.lunch} ${menu.pmSnack} ${menu.allergens}` : ''
  const clashes = menuClashes(menuText, named)
  const probed = probeFood(food, named)
  const loads = roomLoad({
    rooms,
    present: present.map((child) => ({ classroomId: child.classroomId })),
    staff: state.staff,
  })
  const enrolledByRoom = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const child of state.children) {
      if (child.siteId !== state.currentSiteId || child.status !== 'enrolled') continue
      counts[child.classroomId] = (counts[child.classroomId] ?? 0) + 1
    }
    return counts
  }, [state.children, state.currentSiteId])
  const seat = openSeat({ rooms, enrolledByRoom, applications: state.applications })
  const visibleInvoices =
    user?.role === 'parent'
      ? state.invoices.filter((invoice) => invoice.childIds.some((id) => user.childIds.includes(id)))
      : state.invoices
  const bill = biggestBalance(visibleInvoices)
  const supplies = supplyOutlook(state.inventory, present.length)
  const urgent = supplies.find((item) => item.urgent) ?? supplies[0]
  const vaccines = nextVaccine(
    state.vaccinations
      .filter((row) => enrolled.some((child) => child.id === row.childId))
      .map((row) => ({
        childName: childName(enrolled.find((child) => child.id === row.childId)!),
        vaccine: row.vaccine,
        dueDate: row.dueDate,
        status: row.status,
      })),
    date,
  )
  const pickup = matchPickup(state.guardians, state.pickups, pin)
  const releasable = present.filter((child) => pickup?.childIds.includes(child.id))
  const asleepNames = present
    .filter((child) => {
      const log = state.dailyLogs.find((row) => row.childId === child.id && row.date === date)
      return log?.naps.some((nap) => nap.start && !nap.end)
    })
    .map((child) => childName(child))
  const story = weaveDayStory({
    centre: site?.name ?? 'the centre',
    present: present.map((child) => childName(child)),
    moods: present.map((child) => ({
      name: childName(child),
      mood: state.dailyLogs.find((row) => row.childId === child.id && row.date === date)?.mood ?? '',
    })),
    clashes: clashes.map((clash) => `${clash.name} · ${clash.allergy}`),
    asleep: asleepNames,
  })
  const clock = centreClock(now)
  const nowMinutes = clock.date.getHours() * 60 + clock.date.getMinutes()

  return (
    <div data-testid="live-desk">
      <PageHead
        title="Live desk"
        subtitle="Ten instruments on the centre’s own records. Every button writes through, and the clocks keep moving."
      />
      {notice ? <p className="mb-4 text-sm font-semibold text-pine">{notice}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-xl">1 · Building pulse</h2>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {present.length} on site · {clock.date.toLocaleTimeString()}
            {clock.projected ? ' · afternoon view, because the building day is closed' : ''}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {present.map((child) => {
              const row = state.attendance.find((item) => item.childId === child.id && item.date === date)
              const stay = row?.checkIn ? formatElapsed(elapsedOnSite(row.checkIn, clock.date)) : '—'
              return (
                <li key={child.id} className="flex items-center justify-between rounded-xl bg-sand px-3 py-2 text-sm">
                  <span className="font-semibold">{childName(child)}</span>
                  <span className="tabular-nums text-muted">in {row?.checkIn} · {stay}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">2 · Menu clash</h2>
          <p className="mt-1 text-sm text-muted">{menu ? `Today: ${menu.lunch}` : 'No menu posted.'}</p>
          {clashes.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {clashes.map((clash) => (
                <li key={`${clash.childId}-${clash.allergy}`}>
                  <Badge tone="rose">{clash.severity}</Badge> {clash.name} · {clash.allergy} (menu says {clash.because})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm">No allergy on file appears in today’s menu.</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">3 · Food probe</h2>
          <label className="mt-3 block text-sm">
            Ingredient or snack
            <input className={`${inputClass} mt-1`} value={food} onChange={(event) => setFood(event.target.value)} placeholder="Try milk or peanut" />
          </label>
          <ul className="mt-3 space-y-1 text-sm">
            {food.trim().length < 3 ? <li className="text-muted">Type at least 3 letters.</li> : null}
            {food.trim().length >= 3 && probed.length === 0 ? <li>Clear for every child on this desk.</li> : null}
            {probed.map((clash) => (
              <li key={`${clash.childId}-${clash.allergy}`}>
                {clash.name} · {clash.allergy} ({clash.severity})
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">4 · Pickup gate</h2>
          <label className="mt-3 block text-sm">
            4-digit PIN from the adult
            <input
              className={`${inputClass} mt-1`}
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </label>
          {staffDesk ? (
            <Button className="mt-2" variant="ghost" type="button" onClick={() => setPin('4482')}>
              Fill Priya Shah’s demo PIN
            </Button>
          ) : null}
          <p className="mt-3 text-sm">
            {pickup ? `${pickup.name} · ${pickup.relationship}` : pin.length === 4 ? 'That PIN is not on the pickup list.' : 'Waiting for four digits.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {releasable.map((child) => (
              <Button
                key={child.id}
                type="button"
                onClick={() => {
                  checkOut(child.id, pickup?.name ?? 'Authorized adult')
                  setPin('')
                  setNotice(`${childName(child)} is released.`)
                }}
              >
                Release {child.firstName}
              </Button>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">5 · Mood dial</h2>
          <ul className="mt-3 space-y-3">
            {present.map((child) => {
              const mood = state.dailyLogs.find((row) => row.childId === child.id && row.date === date)?.mood
              return (
                <li key={child.id}>
                  <p className="text-sm font-semibold">
                    {child.firstName} {mood ? <Badge tone="gold">{mood}</Badge> : null}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {MOODS.map((choice) => (
                      <Button key={choice} type="button" variant={mood === choice ? 'primary' : 'ghost'} onClick={() => setTodayMood(child.id, choice)}>
                        {choice}
                      </Button>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">6 · Nap coach</h2>
          <ul className="mt-3 space-y-3">
            {present.map((child) => {
              const log = state.dailyLogs.find((row) => row.childId === child.id && row.date === date)
              const advice = napAdvice(ageInYears(child.dob, now), log?.naps ?? [], nowMinutes)
              return (
                <li key={child.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="font-semibold">{child.firstName}</span> · {advice.detail}
                  </span>
                  <Button type="button" variant={advice.phase === 'asleep' ? 'danger' : 'primary'} onClick={() => toggleNap(child.id)}>
                    {advice.phase === 'asleep' ? 'Wake' : 'Start nap'}
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-xl">7 · Spoken day</h2>
          <p className="mt-3 text-sm">{story}</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" onClick={() => speak(story)}>
              Read aloud
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void navigator.clipboard?.writeText(story)
                setNotice('Day story copied.')
              }}
            >
              Copy
            </Button>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">8 · Living ratios</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {loads.map((room) => (
              <li key={room.id}>
                <Badge tone={room.ok ? 'pine' : 'rose'}>{room.ok ? 'In ratio' : 'Short'}</Badge> {room.name}: {room.inRoom} children / {room.staffOn} staff
                {room.needed ? ` (need ${room.needed})` : ''}
              </li>
            ))}
          </ul>
          {staffDesk && seat ? (
            <Button
              className="mt-3"
              type="button"
              onClick={() => {
                updateApplication(seat.id, 'accepted')
                setNotice(`${seat.childName} is offered a seat in ${seat.roomName}.`)
              }}
            >
              Offer {seat.childName} a {seat.roomName} seat ({seat.seats} open)
            </Button>
          ) : null}
          {staffDesk ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {state.staff
                .filter((person) => person.classroomIds.some((id) => rooms.some((room) => room.id === id)))
                .map((person) => (
                  <Button key={person.id} type="button" variant="ghost" onClick={() => clockToggle(person.id)}>
                    {person.clockedIn ? 'Clock out' : 'Clock in'} {person.name.split(' ')[0]}
                  </Button>
                ))}
            </div>
          ) : null}
          {staffDesk && present[0] ? (
            <label className="mt-3 block text-sm">
              Move {present[0].firstName} to
              <select
                className={`${inputClass} mt-1`}
                value={present[0].classroomId}
                onChange={(event) => {
                  updateChild(present[0].id, { classroomId: event.target.value })
                  setNotice(`${present[0].firstName} changed rooms.`)
                }}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl">9 · Tuition spark</h2>
          {bill ? (
            <>
              <p className="mt-3 text-sm">
                {bill.familyName} owes {money(bill.amount - bill.paid, state.countryCode)} on {bill.id}.
              </p>
              <Button
                className="mt-3"
                type="button"
                onClick={() => {
                  payInvoice(bill.id, bill.amount - bill.paid, 'upi')
                  setNotice(`${bill.id} is paid.`)
                }}
              >
                Take the balance on UPI
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm">Every visible invoice is clear.</p>
          )}
          {staffDesk && urgent ? (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="font-display text-lg">10 · Supply burn</h3>
              <p className="mt-2 text-sm">
                {urgent.name}: {urgent.qty} {urgent.unit}
                {urgent.daysLeft == null ? '' : ` · about ${urgent.daysLeft} days`}
                {urgent.urgent ? ' · reorder' : ''}
              </p>
              <Button
                className="mt-3"
                type="button"
                variant="soft"
                onClick={() => {
                  adjustInventory(urgent.id, urgent.restock)
                  setNotice(`Received ${urgent.restock} ${urgent.unit} of ${urgent.name}.`)
                }}
              >
                Receive {urgent.restock} {urgent.unit}
              </Button>
            </div>
          ) : vaccines ? (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="font-display text-lg">10 · Vaccine radar</h3>
              <p className="mt-2 text-sm">
                {vaccines.childName} · {vaccines.vaccine} · {vaccines.label}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm">No open immunizations on this desk.</p>
          )}
        </section>
      </div>
    </div>
  )
}
