import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isPreviousRelease, rollbackToPreviousRelease } from '../lib/releaseGuard'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  rollingBack: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, rollingBack: false }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[willow] render error', error, info.componentStack)
    if (!isPreviousRelease()) {
      this.setState({ rollingBack: true })
      void rollbackToPreviousRelease().then((ok) => {
        if (!ok) this.setState({ rollingBack: false })
      })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <p className="font-display text-3xl font-semibold">
          {this.state.rollingBack ? 'Restoring the last stable app…' : 'Something went wrong'}
        </p>
        <p className="mt-2 text-sm text-muted">
          {this.state.rollingBack
            ? 'A crash was detected. Willow is switching to the previous live release so you can keep working.'
            : 'The last screen could not render. You can reload, or reset demo data from Settings after reload.'}
        </p>
        <pre className="card mt-4 overflow-auto p-4 text-xs">{this.state.error.message}</pre>
        <button className="mt-4 rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}
