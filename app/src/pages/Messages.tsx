import { useState } from 'react'
import { Badge, Button, Field, PageHead, inputClass } from '../components/ui'
import { formatTime } from '../lib'
import { useStore } from '../store'

export function Messages() {
  const { state, sendMessage, markMessageRead } = useStore()
  const user = state.users.find((u) => u.id === state.currentUserId)!
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<'direct' | 'announcement'>('direct')
  const [toId, setToId] = useState(state.users.find((u) => u.id !== user.id)?.id ?? '')

  const visible = state.messages.filter((m) => {
    if (m.kind === 'announcement') return true
    return m.fromId === user.id || m.toId === user.id
  })

  return (
    <div>
      <PageHead title="Messages" subtitle="Center announcements and private threads with families and teachers." />
      <form
        className="card mb-6 grid gap-3 p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage({
            fromId: user.id,
            toId: kind === 'direct' ? toId : undefined,
            subject,
            body,
            kind,
          })
          setSubject('')
          setBody('')
        }}
      >
        <Field label="Type">
          <select
            className={inputClass}
            value={kind}
            onChange={(e) => setKind(e.target.value as 'direct' | 'announcement')}
          >
            <option value="direct">Direct</option>
            {user.role !== 'parent' ? <option value="announcement">Announcement</option> : null}
          </select>
        </Field>
        {kind === 'direct' ? (
          <Field label="To">
            <select className={inputClass} value={toId} onChange={(e) => setToId(e.target.value)}>
              {state.users
                .filter((u) => u.id !== user.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </Field>
        ) : (
          <div />
        )}
        <Field label="Subject">
          <input className={inputClass} required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Message">
          <input className={inputClass} required value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Button type="submit">Send</Button>
      </form>
      <div className="space-y-3">
        {visible.map((m) => {
          const from = state.users.find((u) => u.id === m.fromId)
          return (
            <article
              key={m.id}
              className="card cursor-pointer p-4"
              onClick={() => markMessageRead(m.id)}
            >
              <div className="flex items-center gap-2">
                <Badge tone={m.kind === 'announcement' ? 'gold' : 'sky'}>{m.kind}</Badge>
                <p className="font-semibold">{m.subject}</p>
                {!m.read ? <span className="text-clay">• new</span> : null}
              </div>
              <p className="mt-1 text-sm">{m.body}</p>
              <p className="mt-2 text-xs text-muted">
                {from?.name} · {formatTime(m.at)}
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
