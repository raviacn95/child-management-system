import { useState } from 'react'
import { Badge, Button, Field, PageHead, inputClass } from '../../components/ui'
import { today } from '../../data/seed'
import { childName } from '../../lib'
import { useStore } from '../../store'
import { EngineeringBench, EvaluationBench } from './Bench'
import { TraceView } from './TraceView'
import { VectorBars } from './VectorBars'
import { buildMemories } from './corpus'
import { agentTrace, compareEmbedders, nearestNotes, retrievalDebug } from './debug'
import { expandObservation } from './enrich'
import { memoryEdges, queryMemoryGraph, skillLinks } from './graph'
import { planClassroom, simulateRoom } from './plan'
import { rankActivities, type Energy, type Weather } from './recommend'
import { answerQuestion, confidenceChain } from './rag'
import { dayStory } from './story'
import { developmentSignals, digitalTwin, predictFriendships, sentimentReport, classifySentiment } from './signals'
import { analyzeArtwork, compareArtwork, flatFill, splitFill, type ArtworkRead } from './vision'

const LABS = [
  { id: 'story', level: 'Beginner', title: 'Story generator', learns: 'Turn a log into beats, then one paragraph.' },
  { id: 'observe', level: 'Beginner', title: 'Observation expander', learns: 'A lexicon maps a short note onto classroom language.' },
  { id: 'recommend', level: 'Beginner', title: 'Activity ranker', learns: 'Each feature adds points. The sort is the model.' },
  { id: 'copilot', level: 'Intermediate', title: 'Childhood copilot', learns: 'Hash the note, search by cosine, answer only from hits.' },
  { id: 'bench', level: 'Intermediate', title: 'Engineering bench', learns: 'Retrieval, ranking, embeddings, agents, memory, and evaluation on the same notes.' },
  { id: 'retrieve', level: 'Intermediate', title: 'Retrieval debugger', learns: 'Retrieved notes, similarity scores, and the words that made a note win.' },
  { id: 'explore', level: 'Intermediate', title: 'Vector explorer', learns: 'Each note is 32 bars. The nearest notes are the closest vectors.' },
  { id: 'agent', level: 'Intermediate', title: 'Agent trace', learns: 'Each card is one decision: what the planner still needs, then the tool it calls.' },
  { id: 'eval', level: 'Expert', title: 'Evaluation bench', learns: 'Same questions for the feature hash and for a future API embedding. Only the hash is scored.' },
  { id: 'risk', level: 'Intermediate', title: 'Pattern watch', learns: 'Compare two time windows. The line is a pattern, not a diagnosis.' },
  { id: 'sentiment', level: 'Intermediate', title: 'Message tone', learns: 'A classifier labels text already in the centre.' },
  { id: 'graph', level: 'Advanced', title: 'Memory graph', learns: 'People, activities, and notes become edges you can join.' },
  { id: 'friends', level: 'Advanced', title: 'Friendship overlap', learns: 'Same room, same days, existing play links.' },
  { id: 'twin', level: 'Advanced', title: 'Activity profile', learns: 'Average the child’s activity vectors and find a near neighbour.' },
  { id: 'vision', level: 'Advanced', title: 'Artwork sampler', learns: 'Count colours and edge changes, then compare two samples.' },
  { id: 'skills', level: 'Advanced', title: 'Skill links', learns: 'Skills that share a note become a link.' },
  { id: 'timeline', level: 'Expert', title: 'Memory timeline', learns: 'Retrieval plus an ordered chain of related notes.' },
  { id: 'simulate', level: 'Expert', title: 'Room simulator', learns: 'Each child has an energy number. It changes at arrival, play, lunch, rest, and pickup.' },
  { id: 'models', level: 'Expert', title: 'Model swap', learns: 'Cost, latency, and accuracy. Only the local hash runs. The others stay uncalled.' },
] as const

type LabId = (typeof LABS)[number]['id']

async function readFile(file: File) {
  const bitmap = await createImageBitmap(file)
  const width = 48
  const height = Math.max(1, Math.round((bitmap.height / Math.max(bitmap.width, 1)) * width))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0, width, height)
  const data = ctx.getImageData(0, 0, width, height).data
  const rgb: number[] = []
  for (let i = 0; i < data.length; i += 4) rgb.push(data[i], data[i + 1], data[i + 2])
  bitmap.close()
  return analyzeArtwork(rgb, width)
}

export function StudioDesk() {
  const { state } = useStore()
  const user = state.users.find((person) => person.id === state.currentUserId)
  const staff = user?.role !== 'parent'
  const kids = state.children.filter(
    (child) =>
      child.siteId === state.currentSiteId &&
      child.status === 'enrolled' &&
      (user?.role !== 'parent' || user.childIds.includes(child.id)),
  )
  const [childId, setChildId] = useState(kids[0]?.id ?? '')
  const child = kids.find((item) => item.id === childId) ?? kids[0]
  const [lab, setLab] = useState<LabId>('story')
  const [note, setNote] = useState('Played with blocks.')
  const [question, setQuestion] = useState('When did he first start sharing toys?')
  const [graphQuery, setGraphQuery] = useState('Show all block memories involving Ava')
  const [mood, setMood] = useState('happy')
  const [energy, setEnergy] = useState<Energy>('high')
  const [weather, setWeather] = useState<Weather>('rainy')
  const [age, setAge] = useState(4)
  const [prompt, setPrompt] = useState('Plan tomorrow for an energetic classroom.')
  const [noteId, setNoteId] = useState('')
  const [sample, setSample] = useState('Thank you, that was a wonderful morning.')
  const [roomSize, setRoomSize] = useState(20)
  const [teachers, setTeachers] = useState(4)
  const [absent, setAbsent] = useState(2)
  const [earlier, setEarlier] = useState<ArtworkRead | null>(null)
  const [later, setLater] = useState<ArtworkRead | null>(null)

  const memories = buildMemories({
    children: state.children,
    logs: state.dailyLogs,
    observations: state.observations,
    wonder: state.wonder,
    incidents: state.incidents,
    attendance: state.attendance,
  })
  const names = new Map(state.children.map((item) => [item.id, item.firstName]))
  const active = LABS.find((item) => item.id === lab) ?? LABS[0]

  const latest = child
    ? state.dailyLogs.filter((row) => row.childId === child.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    : undefined
  const story = child
    ? dayStory({
        name: child.firstName,
        lines: [
          ...(latest?.activities ?? []),
          ...(latest?.meals.map((meal) => meal.type) ?? []),
          ...(latest?.notes ? [latest.notes] : []),
          ...state.wonder.moments.filter((moment) => moment.childId === child.id).map((moment) => moment.text),
        ],
      })
    : null

  const ranked = rankActivities({ age, mood, energy, weather })
  const copilot = child ? answerQuestion(question, memories, child.id, child.firstName) : null
  const timeline = child ? confidenceChain(memories, child.id, child.firstName) : null
  const expanded = expandObservation(note)
  const graph = child
    ? queryMemoryGraph({ memories, childId: child.id, childName: child.firstName, query: graphQuery, names })
    : null
  const edges = child ? memoryEdges(memories, child.id, child.firstName).slice(0, 8) : []
  const links = child ? skillLinks(memories, child.id).slice(0, 6) : []
  const twin = child ? digitalTwin(memories, child) : null
  const friendships = predictFriendships({
    children: kids,
    attendance: state.attendance,
    plays: state.wonder.plays,
  })
  const present = kids.filter((item) =>
    state.attendance.some((row) => row.childId === item.id && row.date === today() && row.checkIn && !row.checkOut),
  )
  const plan = planClassroom({
    prompt,
    present: present.length || kids.length,
    moods: state.dailyLogs.map((row) => row.mood).filter(Boolean).slice(0, 6),
    napMinutes: state.dailyLogs.flatMap((row) =>
      row.naps.map((nap) => {
        const [sh, sm] = nap.start.split(':').map(Number)
        const [eh, em] = nap.end.split(':').map(Number)
        return eh * 60 + em - (sh * 60 + sm)
      }),
    ),
    weather,
    teachers: Math.max(state.staff.filter((person) => person.status === 'active').length, 1),
  })
  const room = simulateRoom({ children: roomSize, teachers, absentStaff: absent, weather })
  const trace = agentTrace(prompt, plan)
  const retrieved = child ? retrievalDebug(question, memories, child.id, child.firstName) : null
  const childNotes = child
    ? memories
        .filter((memory) => memory.childIds.includes(child.id))
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
        .slice(0, 8)
    : []
  const selectedNote =
    childNotes.find((memory) => memory.id === noteId) ??
    childNotes
      .map((memory) => ({ memory, top: child ? (nearestNotes(memory.id, memories, child.id, 1)[0]?.score ?? 0) : 0 }))
      .sort((a, b) => b.top - a.top || b.memory.date.localeCompare(a.memory.date))[0]?.memory
  const neighbours = selectedNote && child ? nearestNotes(selectedNote.id, memories, child.id, 3) : []
  const bake = compareEmbedders()
  const watch = developmentSignals({
    today: today(),
    observations: state.observations
      .filter((row) => !child || row.childId === child.id)
      .map((row) => ({ domain: row.domain, date: row.date })),
    playDates: state.wonder.plays.filter((play) => !child || play.a === child.id || play.b === child.id).map((play) => play.date),
  })
  const tone = sentimentReport(
    state.messages.filter((message) => {
      const author = state.users.find((person) => person.id === message.fromId)
      return author?.role === 'parent' || message.kind === 'direct'
    }),
  )
  const sampleLabel = classifySentiment(sample)
  const compared = earlier && later ? compareArtwork(earlier, later) : null

  function loadDemoArt() {
    setEarlier(analyzeArtwork(flatFill([245, 245, 245], 8, 4), 8))
    setLater(analyzeArtwork(splitFill([200, 40, 40], [40, 80, 200], 8, 4), 8))
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="AI Studio"
        subtitle="These labs run in the browser on notes you already keep. Vectors are feature hashes, so the pipeline matches a vector search without sending a child’s notes out."
      />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Child">
          <select className={inputClass} value={child?.id ?? ''} onChange={(event) => setChildId(event.target.value)}>
            {kids.map((item) => (
              <option key={item.id} value={item.id}>
                {childName(item)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lab">
          <select className={inputClass} value={lab} onChange={(event) => setLab(event.target.value as LabId)}>
            {LABS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.level} · {item.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="pine">{active.level}</Badge>
          <h2 className="font-display text-xl text-ink">{active.title}</h2>
        </div>
        <p className="mt-2 text-sm text-muted">{active.learns}</p>
        <div className="mt-4 space-y-3 text-sm text-ink">
          {lab === 'story' && story ? (
            <>
              <p>{story.text}</p>
              <ul className="list-disc pl-5 text-muted">
                {story.beats.map((beat) => (
                  <li key={beat}>{beat}</li>
                ))}
              </ul>
            </>
          ) : null}
          {lab === 'observe' ? (
            <>
              <textarea className={inputClass} rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
              <p>{expanded.text}</p>
              <p className="text-muted">{expanded.caution}</p>
            </>
          ) : null}
          {lab === 'recommend' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Age">
                  <input className={inputClass} type="number" min={1} max={12} value={age} onChange={(event) => setAge(Number(event.target.value))} />
                </Field>
                <Field label="Mood">
                  <select className={inputClass} value={mood} onChange={(event) => setMood(event.target.value)}>
                    {['happy', 'curious', 'calm', 'focused', 'tired'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Energy">
                  <select className={inputClass} value={energy} onChange={(event) => setEnergy(event.target.value as Energy)}>
                    {(['low', 'medium', 'high'] as const).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Weather">
                  <select className={inputClass} value={weather} onChange={(event) => setWeather(event.target.value as Weather)}>
                    <option value="rainy">rainy</option>
                    <option value="sunny">sunny</option>
                  </select>
                </Field>
              </div>
              <ol className="list-decimal space-y-2 pl-5">
                {ranked.slice(0, 3).map((row) => (
                  <li key={row.activity.id}>
                    {row.activity.title}{' '}
                    <span className="text-muted">
                      score {row.score} · {row.reasons.join(', ')}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
          {lab === 'copilot' && copilot ? (
            <>
              <input className={inputClass} value={question} onChange={(event) => setQuestion(event.target.value)} />
              <p>{copilot.answer}</p>
              <Citations rows={copilot.citations} />
              <p className="text-muted">{copilot.caution}</p>
            </>
          ) : null}
          {lab === 'bench' && child ? (
            <EngineeringBench memories={memories} childId={child.id} question={question} onQuestion={setQuestion} trace={trace} />
          ) : null}
          {lab === 'retrieve' && retrieved ? (
            <>
              <input className={inputClass} value={question} onChange={(event) => setQuestion(event.target.value)} />
              <ol className="space-y-2">
                <li>
                  <span className="font-semibold">Question.</span> {retrieved.question}
                </li>
                <li>
                  <span className="font-semibold">Retrieved notes.</span>
                  <ul className="mt-1 space-y-1 text-muted">
                    {retrieved.retrieved.map((row) => (
                      <li key={row.id}>
                        rank {row.rank} · {row.date} · {row.text} · similarity {row.score.toFixed(2)}
                        <div>{row.why}</div>
                      </li>
                    ))}
                  </ul>
                </li>
                <li>
                  <span className="font-semibold">Final answer.</span> {retrieved.answer}
                </li>
              </ol>
              <p className="text-muted">{retrieved.caution}</p>
            </>
          ) : null}
          {lab === 'explore' && selectedNote ? (
            <>
              <div className="flex flex-wrap gap-2">
                {childNotes.map((memory) => (
                  <Button
                    key={memory.id}
                    type="button"
                    variant={memory.id === selectedNote.id ? 'soft' : 'ghost'}
                    onClick={() => setNoteId(memory.id)}
                  >
                    {memory.text}
                  </Button>
                ))}
              </div>
              <VectorBars values={selectedNote.vector} />
              <p className="text-muted">32 dimensions. Green is a positive vote. Rose is a negative vote.</p>
              <p>
                <span className="font-semibold">Nearest notes.</span>
              </p>
              <ul className="space-y-1">
                {neighbours.map((row) => (
                  <li key={row.id}>
                    {row.text} <span className="text-muted">similarity {row.score.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {lab === 'agent' ? (
            <>
              <input className={inputClass} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
              <TraceView nodes={trace} />
              <ol className="list-decimal pl-5">
                {plan.schedule.map((block) => (
                  <li key={block}>{block}</li>
                ))}
              </ol>
              <p className="text-muted">{plan.caution}</p>
            </>
          ) : null}
          {lab === 'risk' ? (
            <>
              {watch.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="text-muted">{watch.caution}</p>
            </>
          ) : null}
          {lab === 'sentiment' ? (
            staff ? (
              <>
                <input className={inputClass} value={sample} onChange={(event) => setSample(event.target.value)} />
                <p>This sentence: {sampleLabel}</p>
                <p>Inbox overall: {tone.overall}</p>
                <ul className="space-y-1 text-muted">
                  {tone.rows.slice(0, 4).map((row) => (
                    <li key={`${row.at}-${row.excerpt}`}>
                      {row.label} · {row.excerpt}
                    </li>
                  ))}
                </ul>
                <p className="text-muted">{tone.caution}</p>
              </>
            ) : (
              <p>Message tone stays with the centre team.</p>
            )
          ) : null}
          {lab === 'graph' && graph ? (
            <>
              <input className={inputClass} value={graphQuery} onChange={(event) => setGraphQuery(event.target.value)} />
              <p>{graph.answer}</p>
              <ul className="space-y-1 text-muted">
                {edges.map((edge) => (
                  <li key={`${edge.rel}-${edge.to}`}>
                    {edge.from} → {edge.rel} → {edge.to}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {lab === 'friends' ? (
            <>
              <ul className="space-y-1">
                {friendships.rows.slice(0, 6).map((row) => (
                  <li key={row.pair}>
                    {row.pair} · {row.status} · score {row.score}
                  </li>
                ))}
              </ul>
              <p className="text-muted">{friendships.caution}</p>
            </>
          ) : null}
          {lab === 'twin' && twin ? (
            <>
              <p>{twin.prediction}</p>
              {twin.because ? <p>{twin.because}</p> : null}
              <p className="text-muted">{twin.caution}</p>
            </>
          ) : null}
          {lab === 'vision' ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="soft" onClick={loadDemoArt}>
                  Compare two samples
                </Button>
                <label className="btn inline-flex cursor-pointer items-center rounded-xl border border-line px-3.5 py-2 text-sm font-semibold">
                  Earlier picture
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void readFile(file).then((read) => read && setEarlier(read))
                    }}
                  />
                </label>
                <label className="btn inline-flex cursor-pointer items-center rounded-xl border border-line px-3.5 py-2 text-sm font-semibold">
                  Later picture
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void readFile(file).then((read) => read && setLater(read))
                    }}
                  />
                </label>
              </div>
              {earlier ? <p>Earlier colours: {earlier.colors.join(', ')}. Edge changes: {earlier.complexity}.</p> : null}
              {later ? <p>Later colours: {later.colors.join(', ')}. Edge changes: {later.complexity}.</p> : null}
              {compared ? (
                <p>
                  {compared.note} Delta {compared.complexityDelta}.
                  {compared.addedColors.length ? ` New colours: ${compared.addedColors.join(', ')}.` : ''}
                </p>
              ) : null}
            </>
          ) : null}
          {lab === 'skills' ? (
            <ul className="space-y-1">
              {links.length ? (
                links.map((row) => (
                  <li key={row.link}>
                    {row.link} · {row.count}
                  </li>
                ))
              ) : (
                <li>No shared skills in the notes yet.</li>
              )}
            </ul>
          ) : null}
          {lab === 'timeline' && timeline ? (
            <>
              <p>{timeline.answer}</p>
              <Citations rows={timeline.citations} />
              <p className="text-muted">{timeline.caution}</p>
            </>
          ) : null}
          {lab === 'simulate' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Children">
                  <input className={inputClass} type="number" min={0} value={roomSize} onChange={(event) => setRoomSize(Number(event.target.value))} />
                </Field>
                <Field label="Teachers">
                  <input className={inputClass} type="number" min={0} value={teachers} onChange={(event) => setTeachers(Number(event.target.value))} />
                </Field>
                <Field label="Absent staff">
                  <input className={inputClass} type="number" min={0} value={absent} onChange={(event) => setAbsent(Number(event.target.value))} />
                </Field>
                <Field label="Weather">
                  <select className={inputClass} value={weather} onChange={(event) => setWeather(event.target.value as Weather)}>
                    <option value="rainy">rainy</option>
                    <option value="sunny">sunny</option>
                  </select>
                </Field>
              </div>
              <p>{room.energy}. Ratio {room.ratio ?? '—'}:1. {room.peak}</p>
              <ol className="list-decimal pl-5">
                {room.ticks.map((tick) => (
                  <li key={tick.block}>
                    {tick.block}: {tick.note}
                  </li>
                ))}
              </ol>
              <ul className="list-disc pl-5">
                {room.bottlenecks.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="text-muted">{room.caution}</p>
            </>
          ) : null}
          {lab === 'eval' && child ? <EvaluationBench memories={memories} childId={child.id} /> : null}
          {lab === 'models' ? (
            <>
              <table className="w-full text-left">
                <thead className="text-muted">
                  <tr>
                    <th className="py-1 pr-3 font-medium">Model</th>
                    <th className="py-1 pr-3 font-medium">Cost / 1M tokens</th>
                    <th className="py-1 pr-3 font-medium">Latency</th>
                    <th className="py-1 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {bake.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-1 pr-3">{row.label}</td>
                      <td className="py-1 pr-3">{price(row.listPricePerMillion)}</td>
                      <td className="py-1 pr-3">{row.latencyMs == null ? 'not measured' : `${row.latencyMs} ms`}</td>
                      <td className="py-1">{row.accuracy == null ? 'not measured' : `${Math.round(row.accuracy * 100)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="space-y-1 text-muted">
                {bake.rows.map((row) => (
                  <li key={row.id}>{row.note}</li>
                ))}
              </ul>
              <ul className="space-y-1">
                {bake.probe.map((row) => (
                  <li key={row.question}>
                    {row.question} → {row.hit}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function price(amount: number) {
  if (amount === 0) return '$0'
  if (amount < 0.01) return `$${amount}`
  return `$${amount.toFixed(2)}`
}

function Citations({ rows }: { rows: { id: string; date: string; text: string }[] }) {
  if (!rows.length) return null
  return (
    <ul className="space-y-1 text-muted">
      {rows.map((row) => (
        <li key={row.id}>
          {row.date} · {row.text}
        </li>
      ))}
    </ul>
  )
}
