import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from '../../components/ui'
import { homePath } from '../../lib/tv'

/** /link and /remote work without signing in, so a phone that just scanned the TV code lands straight here. */
export function PhoneShell({ title, subtitle, testId, children }: { title: string; subtitle?: string; testId: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 py-6" data-testid={testId}>
      <nav className="mb-4 flex flex-wrap gap-3 text-sm font-semibold text-pine" aria-label="Play on TV">
        <Link to={homePath()}>← Willow</Link>
        <Link to="/link">Link to TV</Link>
        <Link to="/remote">Remote</Link>
      </nav>
      <PageHead title={title} subtitle={subtitle} />
      {children}
    </main>
  )
}
