import { Badge, Button, PageHead, Stat } from '../components/ui'
import { packOf } from '../data/country'
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
  const pack = packOf(state.countryCode)
  const rupee = (n: number) => money(n, state.countryCode)
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const invoices =
    user.role === 'parent'
      ? state.invoices.filter((i) => i.parentId === user.id || i.familyName === 'Shah')
      : state.invoices
  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.amount - i.paid), 0)

  return (
    <div>
      <PageHead
        title="Fees & GST"
        subtitle={`${pack.name} fee heads: ${pack.feeHeads.slice(0, 5).join(', ')}. Tuition often GST-exempt; transport and shop extras attract GST. Pay by ${pack.payments
          .map((p) => p.label)
          .slice(0, 4)
          .join(', ')}.`}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Outstanding" value={rupee(outstanding)} />
        <Stat label="Collected (sample)" value={rupee(invoices.reduce((s, i) => s + i.paid, 0))} />
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
                  <span>{rupee(it.amount)}</span>
                </li>
              ))}
            </ul>
            {inv.gstAmount ? <p className="text-xs text-muted">GST component {rupee(inv.gstAmount)}</p> : null}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
              <p className="text-sm">
                {rupee(inv.paid)} paid of {rupee(inv.amount)}
                {inv.upiRef ? ` · ${inv.upiRef}` : ''}
              </p>
              {inv.status !== 'paid' ? (
                <div className="flex gap-2">
                  {pack.payments
                    .filter((p) => p.id === 'upi' || p.id === 'cash' || p.id === 'neft' || p.id === 'card')
                    .slice(0, 2)
                    .map((p) => (
                      <Button key={p.id} onClick={() => payInvoice(inv.id, inv.amount - inv.paid, p.id)}>
                        Pay {p.id.toUpperCase()}
                      </Button>
                    ))}
                </div>
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
