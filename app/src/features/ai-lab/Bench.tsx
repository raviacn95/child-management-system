import { useState } from 'react'
import { Button, inputClass } from '../../components/ui'
import type { MemoryDoc } from './corpus'
import type { TraceNode } from './debug'
import { casesFromNotes, evaluateRetrieval, recall, remember, vectorPreview, type StoredMemory } from './expose'
import { searchMemories } from './rag'

export function EngineeringBench({
  memories,
  childId,
  question,
  onQuestion,
  trace,
}: {
  memories: MemoryDoc[]
  childId: string
  question: string
  onQuestion: (value: string) => void
  trace: TraceNode[]
}) {
  const [draft, setDraft] = useState('Leo stacked a tall block city.')
  const [store, setStore] = useState<StoredMemory[]>([])
  const [recallQuery, setRecallQuery] = useState('block city')
  const hits = searchMemories(question, memories, childId, 3)
  const preview = vectorPreview(question)
  const kept = memories.filter((memory) => memory.childIds.includes(childId)).length
  const remembered = recall(store, recallQuery)
  const scored = evaluateRetrieval(memories, childId, casesFromNotes(memories, childId))

  return (
    <div className="space-y-4">
      <input className={inputClass} value={question} onChange={(event) => onQuestion(event.target.value)} />
      <section>
        <h3 className="font-semibold">Retrieval</h3>
        <ul className="mt-1 space-y-1 text-muted">
          {hits.map((hit) => (
            <li key={hit.doc.id}>
              {hit.doc.text}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="font-semibold">Ranking</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          {hits.map((hit, index) => (
            <li key={hit.doc.id}>
              rank {index + 1} · similarity {hit.score.toFixed(2)} · {hit.doc.text}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="font-semibold">Embeddings</h3>
        <p className="mt-1 text-muted">
          {preview.dim} dimensions. First values: {preview.head.join(', ')}
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Agents</h3>
        <p className="mt-1">{trace.map((node) => node.label).join(' → ')}</p>
      </section>
      <section>
        <h3 className="font-semibold">Memory</h3>
        <p className="mt-1 text-muted">{kept} notes already kept for this child.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input className={inputClass} value={draft} onChange={(event) => setDraft(event.target.value)} />
          <Button type="button" variant="soft" onClick={() => setStore((current) => remember(current, draft))}>
            Remember
          </Button>
        </div>
        <p className="mt-2 text-muted">{store.length} written this session.</p>
        <input className={`${inputClass} mt-2`} value={recallQuery} onChange={(event) => setRecallQuery(event.target.value)} />
        <ul className="mt-1 space-y-1">
          {remembered.map((item) => (
            <li key={item.id}>
              {item.text} <span className="text-muted">similarity {item.score.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="font-semibold">Evaluation</h3>
        <p className="mt-1">
          Hit@1 {Math.round(scored.hitAt1 * 100)}%. Hit@3 {Math.round(scored.hitAt3 * 100)}%.
        </p>
        <ul className="mt-1 space-y-1 text-muted">
          {scored.rows.map((row) => (
            <li key={row.question}>
              {row.pass ? 'pass' : 'miss'} · {row.question} · rank {row.rank ?? '—'} · {row.top || 'no note'}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
