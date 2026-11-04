import type { MemoryDoc } from './corpus'
import { cosine, embed } from './embed'
import type { ToolStep } from './plan'
import { answerQuestion, searchMemories } from './rag'

export interface RetrievedNote {
  id: string
  date: string
  text: string
  score: number
}

export function retrievalDebug(question: string, memories: MemoryDoc[], childId: string, name: string) {
  const grounded = answerQuestion(question, memories, childId, name)
  const retrieved = searchMemories(question, memories, childId, 4).map((hit, index) => ({
    id: hit.doc.id,
    date: hit.doc.date,
    text: hit.doc.text,
    score: Number(hit.score.toFixed(3)),
    rank: index + 1,
  }))
  return { question: question.trim(), retrieved, answer: grounded.answer, caution: grounded.caution }
}

export function nearestNotes(selectedId: string, memories: MemoryDoc[], childId: string, k = 3): RetrievedNote[] {
  const selected = memories.find((memory) => memory.id === selectedId && memory.childIds.includes(childId))
  if (!selected) return []
  return memories
    .filter((memory) => memory.childIds.includes(childId) && memory.id !== selected.id)
    .map((doc) => ({
      id: doc.id,
      date: doc.date,
      text: doc.text,
      score: Number(cosine(selected.vector, doc.vector).toFixed(3)),
    }))
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .slice(0, k)
}

export interface TraceNode {
  label: string
  detail: string
}

export function agentTrace(goal: string, plan: { steps: ToolStep[] }): TraceNode[] {
  const nodes: TraceNode[] = [{ label: 'Goal', detail: goal }]
  for (const step of plan.steps) {
    if (step.tool === 'write_schedule') {
      nodes.push({ label: 'Enough information', detail: step.reason })
      nodes.push({ label: 'Generate plan', detail: step.result })
      continue
    }
    const need = step.tool.replace('read_', '')
    nodes.push({ label: `Need ${need}`, detail: step.reason })
    nodes.push({ label: `Call ${step.tool}`, detail: step.result })
  }
  if (plan.steps.length > 0 && !plan.steps.some((step) => step.tool === 'write_schedule')) {
    nodes.push({ label: 'Enough information', detail: 'The goal did not ask for a plan, so the loop stops.' })
  }
  return nodes
}

export interface ModelRow {
  id: 'feature-hash' | 'openai' | 'gemini' | 'bge'
  label: string
  ran: boolean
  listPricePerMillion: number
  latencyMs: number | null
  accuracy: number | null
  note: string
}

const PROBE_NOTES = [
  'shared a toy with a friend',
  'built a tall block city',
  'painted a rainbow at the easel',
  'ate most of lunch',
  'bottle and a long nap',
  'signed the pickup sheet',
]

const PROBE_QUESTIONS = [
  { question: 'shared a toy', expect: 'shared a toy with a friend' },
  { question: 'block city', expect: 'built a tall block city' },
  { question: 'painted rainbow', expect: 'painted a rainbow at the easel' },
  { question: 'ate lunch', expect: 'ate most of lunch' },
]

function topNote(question: string, notes: { text: string; vector: number[] }[]) {
  const vector = embed(question)
  return notes
    .map((note) => ({ text: note.text, score: cosine(vector, note.vector) }))
    .sort((a, b) => b.score - a.score || a.text.localeCompare(b.text))[0]
}

/** List prices are published rates. Only the feature hash is executed here. */
export function compareEmbedders() {
  const started = performance.now()
  const notes = PROBE_NOTES.map((text) => ({ text, vector: embed(text) }))
  const probe = PROBE_QUESTIONS.map((row) => {
    const hit = topNote(row.question, notes)?.text ?? ''
    return { question: row.question, hit, correct: hit === row.expect }
  })
  const latencyMs = Number((performance.now() - started).toFixed(2))
  const accuracy = probe.filter((row) => row.correct).length / probe.length
  const rows: ModelRow[] = [
    {
      id: 'feature-hash',
      label: 'Feature hash',
      ran: true,
      listPricePerMillion: 0,
      latencyMs,
      accuracy,
      note: 'Ran in this browser on a four-question probe.',
    },
    {
      id: 'openai',
      label: 'OpenAI text-embedding-3-small',
      ran: false,
      listPricePerMillion: 0.02,
      latencyMs: null,
      accuracy: null,
      note: 'List price from the OpenAI pricing page. Not called.',
    },
    {
      id: 'gemini',
      label: 'Gemini Embedding 2',
      ran: false,
      listPricePerMillion: 0.2,
      latencyMs: null,
      accuracy: null,
      note: 'List price, $0.20 per million text tokens. Not called.',
    },
    {
      id: 'bge',
      label: 'BGE-M3, self-hosted',
      ran: false,
      listPricePerMillion: 0.001,
      latencyMs: null,
      accuracy: null,
      note: 'About $0.001 per million tokens on a rented GPU. Weights are not loaded here.',
    },
  ]
  return { rows, probe }
}
