import { moveTvFocus, type SteerDir } from '../../lib/tvSteer'
import type { RemoteKey } from './schema'

export type RemoteAction = { kind: 'move'; dir: SteerDir } | { kind: 'ok' } | { kind: 'back' } | { kind: 'home' } | { kind: 'willow' }

export type RemoteDeps = {
  navigate: (to: string) => void
  back: () => void
  returnToWillow: () => void
}

export function remoteAction(key: RemoteKey): RemoteAction {
  if (key === 'up' || key === 'down' || key === 'left' || key === 'right') return { kind: 'move', dir: key }
  return { kind: key }
}

/** An open TV dialog (e.g. the pairing prompt) keeps D-pad focus inside it. */
export function tvFocusRoot(): ParentNode {
  return document.querySelector('[data-tv-modal]') ?? document
}

export function runRemoteKey(key: RemoteKey, times: number, deps: RemoteDeps) {
  const action = remoteAction(key)
  switch (action.kind) {
    case 'move':
      for (let i = 0; i < Math.max(1, Math.min(times, 9)); i++) moveTvFocus(action.dir, tvFocusRoot())
      return
    case 'ok': {
      const active = document.activeElement
      if (active instanceof HTMLElement && active.matches('[data-tv-focus]')) active.click()
      else moveTvFocus('down', tvFocusRoot())
      return
    }
    case 'back':
      deps.back()
      return
    case 'home':
      deps.navigate('/hub')
      return
    case 'willow':
      deps.returnToWillow()
  }
}
