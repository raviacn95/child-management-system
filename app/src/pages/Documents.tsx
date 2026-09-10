import { Badge, Button, PageHead } from '../components/ui'
import { childName } from '../lib'
import { useStore } from '../store'

export function Documents() {
  const { state, approveDocument } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const docs =
    user.role === 'parent'
      ? state.documents.filter((d) => d.childId && user.childIds.includes(d.childId))
      : state.documents

  return (
    <div>
      <PageHead title="Records & documents" subtitle="Health forms, custody papers, feeding plans, with approval and expiry tracking." />
      <div className="space-y-2">
        {docs.map((d) => {
          const child = state.children.find((c) => c.id === d.childId)
          const tone = d.status === 'approved' ? 'pine' : d.status === 'expired' ? 'rose' : 'gold'
          return (
            <article key={d.id} className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold">{d.title}</p>
                <p className="text-xs text-muted">
                  {d.category}
                  {child ? ` · ${childName(child)}` : ''} · uploaded {d.uploadedAt}
                  {d.expiresAt ? ` · expires ${d.expiresAt}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={tone}>{d.status}</Badge>
                {d.status === 'pending' && user.role === 'director' ? (
                  <Button variant="soft" onClick={() => approveDocument(d.id)}>
                    Approve
                  </Button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
