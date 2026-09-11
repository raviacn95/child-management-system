import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[willow] render error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <p className="font-display text-3xl font-semibold">Something went wrong</p>
        <p className="mt-2 text-sm text-muted">
          The last screen could not render. You can reload, or reset demo data from Settings after reload.
        </p>
        <pre className="card mt-4 overflow-auto p-4 text-xs">{this.state.error.message}</pre>
        <button className="mt-4 rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}
