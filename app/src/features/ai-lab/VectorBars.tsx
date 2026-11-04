export function VectorBars({ values }: { values: number[] }) {
  const peak = Math.max(...values.map((value) => Math.abs(value)), 0.01)
  return (
    <div className="flex h-16 items-end gap-px" aria-label="Feature hash vector">
      {values.map((value, index) => (
        <div
          key={index}
          title={`${index}: ${value.toFixed(2)}`}
          className={`w-2 rounded-sm ${value < 0 ? 'bg-rose' : 'bg-pine'}`}
          style={{ height: `${Math.max(12, (Math.abs(value) / peak) * 100)}%` }}
        />
      ))}
    </div>
  )
}
