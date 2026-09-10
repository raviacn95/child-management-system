import { Badge, Button, PageHead, Stat } from '../components/ui'
import { childName, money } from '../lib'
import { useStore } from '../store'

const TONE = {
  paid: 'pine',
  sent: 'sky',
  partial: 'gold',
  overdue: 'rose',
  draft: 'sand',
} as const

export function Billing() {
  const { state, payInvoice } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const invoices =
    user.role === 'parent'
      ? state.invoices.filter((i) => i.parentId === user.id || i.familyName === 'Shah')
      : state.invoices
  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.amount - i.paid), 0)

  return (
    <div>
      <PageHead title="Billing" subtitle="Tuition, subsidies, late pickup, invoices, and receipts." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Outstanding" value={money(outstanding)} />
        <Stat label="Collected (sample)" value={money(invoices.reduce((s, i) => s + i.paid, 0))} />
        <Stat label="Overdue families" value={invoices.filter((i) => i.status === 'overdue').length} />
      </div>
      <div className="space-y-3">
        {invoices.map((inv) => (
          <article key={inv.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {inv.id} · {inv.familyName}
                </p>
                <p className="text-xs text-muted">
                  Issued {inv.issuedDate} · due {inv.dueDate} ·{' '}
                  {inv.childIds
                    .map((id) => {
                      const c = state.children.find((x) => x.id === id)
                      return c ? childName(c) : id
                    })
                    .join(', ')}
                </p>
              </div>
              <Badge tone={TONE[inv.status]}>{inv.status}</Badge>
            </div>
            <ul className="mt-3 text-sm">
              {inv.items.map((it) => (
                <li key={it.desc} className="flex justify-between py-0.5">
                  <span>{it.desc}</span>
                  <span>{money(it.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <p className="text-sm">
                {money(inv.paid)} paid of {money(inv.amount)}
              </p>
              {inv.status !== 'paid' ? (
                <Button onClick={() => payInvoice(inv.id, inv.amount - inv.paid)}>Record payment</Button>
              ) : (
                <span className="text-sm text-pine">Receipt on file</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
