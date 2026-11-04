import type { TraceNode } from './debug'

export function TraceView({ nodes }: { nodes: TraceNode[] }) {
  return (
    <ol className="space-y-2">
      {nodes.map((node, index) => (
        <li key={`${node.label}-${index}`} className="rounded-xl border border-line px-3 py-2">
          <div className="text-xs text-muted">step {index + 1}</div>
          <div className="font-semibold">{node.label}</div>
          <div>{node.detail}</div>
        </li>
      ))}
    </ol>
  )
}
