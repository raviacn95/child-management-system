import { useState } from 'react'
import { Button, inputClass } from '../../components/ui'
import type { MemoryDoc } from './corpus'
import type { TraceNode } from './debug'
import { casesFromNotes, compareEmbedderScores, evaluateRetrieval, recall, remember, vectorPreview, type StoredMemory } from './expose'
import { searchMemories } from './rag'
import { TraceView } from './TraceView'
import { VectorBars } from './VectorBars'

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
        <p className="mt-1 text-muted">{preview.dim} dimensions for this question.</p>
        <VectorBars values={preview.values} />
      </section>
      <section>
        <h3 className="font-semibold">Agents</h3>
        <div className="mt-1">
          <TraceView nodes={trace} />
        </div>
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
      <EvaluationBench memories={memories} childId={childId} />
    </div>
  )
}

export function EvaluationBench({ memories, childId }: { memories: MemoryDoc[]; childId: string }) {
  const scored = evaluateRetrieval(memories, childId, casesFromNotes(memories, childId))
  const compared = compareEmbedderScores(scored.hitAt1, scored.hitAt3)
  return (
    <section>
      <h3 className="font-semibold">Evaluation</h3>
      <table className="mt-1 w-full text-left">
        <thead className="text-muted">
          <tr>
            <th className="py-1 pr-3 font-medium">Embedder</th>
            <th className="py-1 pr-3 font-medium">Hit@1</th>
            <th className="py-1 font-medium">Hit@3</th>
          </tr>
        </thead>
        <tbody>
          {compared.map((row) => (
            <tr key={row.id}>
              <td className="py-1 pr-3">{row.label}</td>
              <td className="py-1 pr-3">{row.hitAt1 == null ? 'not measured' : `${Math.round(row.hitAt1 * 100)}%`}</td>
              <td className="py-1">{row.hitAt3 == null ? 'not measured' : `${Math.round(row.hitAt3 * 100)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-muted">The future row uses the same questions once an API embedder replaces the hash. It is not called from this browser.</p>
      <ul className="mt-1 space-y-1 text-muted">
        {scored.rows.map((row) => (
          <li key={row.question}>
            {row.pass ? 'pass' : 'miss'} · {row.question} · rank {row.rank ?? '—'} · {row.top || 'no note'}
          </li>
        ))}
      </ul>
    </section>
  )
}
