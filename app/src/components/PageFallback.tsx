export function PageFallback() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-line/80" />
      <div className="h-4 w-80 animate-pulse rounded-lg bg-line/60" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card h-40 animate-pulse bg-paper" />
        <div className="card h-40 animate-pulse bg-paper" />
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  )
}
