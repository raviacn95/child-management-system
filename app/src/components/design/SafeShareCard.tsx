import { COPYRIGHT_LINE } from '../../brand'
import { FamilyMark } from './FamilyMark'

export function SafeShareCard() {
  return (
    <div className="safe-share-card" data-testid="safe-share-card">
      <FamilyMark className="h-24 w-full" />
      <p className="mt-3 font-display text-lg font-semibold">Willow™</p>
      <p className="mt-1 text-sm text-muted">Family growth OS — care, learning, and parent development.</p>
      <p className="mt-2 text-[11px] text-muted">{COPYRIGHT_LINE}</p>
    </div>
  )
}
