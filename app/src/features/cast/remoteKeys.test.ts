import { afterEach, describe, expect, it, vi } from 'vitest'
import { remoteAction, runRemoteKey } from './remoteKeys'
import { focusLabel, screenName, tvStatus } from './screenStatus'

function grid() {
  document.body.innerHTML = `
    <nav data-testid="tv-strip"><a data-tv-focus="1" id="home" href="#/hub">Home</a></nav>
    <main><button data-tv-focus="1" id="a" aria-label="Open Drishyam 3">A</button><button data-tv-focus="1" id="b">B</button></main>`
  const boxes: Record<string, [number, number]> = { home: [0, 0], a: [0, 100], b: [200, 100] }
  for (const [id, [x, y]] of Object.entries(boxes)) {
    const el = document.getElementById(id) as HTMLElement
    el.getBoundingClientRect = () => ({ left: x, top: y, width: 100, height: 40, right: x + 100, bottom: y + 40, x, y, toJSON: () => ({}) })
    el.scrollIntoView = () => undefined
  }
}

const deps = () => ({ navigate: vi.fn(), back: vi.fn(), returnToWillow: vi.fn() })

afterEach(() => {
  document.body.innerHTML = ''
})

describe('remote keys', () => {
  it('maps each phone button to a TV action', () => {
    expect(remoteAction('up')).toEqual({ kind: 'move', dir: 'up' })
    expect(remoteAction('right')).toEqual({ kind: 'move', dir: 'right' })
    expect(remoteAction('ok')).toEqual({ kind: 'ok' })
    expect(remoteAction('back')).toEqual({ kind: 'back' })
    expect(remoteAction('home')).toEqual({ kind: 'home' })
    expect(remoteAction('willow')).toEqual({ kind: 'willow' })
  })

  it('moves spatial focus, repeating batched presses', () => {
    grid()
    document.getElementById('home')?.focus()
    runRemoteKey('down', 1, deps())
    expect(document.activeElement?.id).toBe('a')
    runRemoteKey('right', 2, deps())
    expect(document.activeElement?.id).toBe('b')
  })

  it('OK clicks the focused item; Back, Home and Back to Willow use the app routes', () => {
    grid()
    const b = document.getElementById('b') as HTMLElement
    const click = vi.fn()
    b.addEventListener('click', click)
    b.focus()
    const d = deps()
    runRemoteKey('ok', 1, d)
    expect(click).toHaveBeenCalledTimes(1)
    runRemoteKey('back', 1, d)
    runRemoteKey('home', 1, d)
    runRemoteKey('willow', 1, d)
    expect(d.back).toHaveBeenCalled()
    expect(d.navigate).toHaveBeenCalledWith('/hub')
    expect(d.returnToWillow).toHaveBeenCalled()
  })
})

describe('TV status for the phone', () => {
  it('names the screen and the focused movie on content screens', () => {
    grid()
    expect(screenName('/movies')).toBe('Movies')
    expect(screenName('/children')).toBe('Willow')
    expect(focusLabel('/movies', document.getElementById('a'))).toBe('Drishyam 3')
    expect(tvStatus('/movies', document.getElementById('a'))).toEqual({ type: 'status', screen: 'Movies', focus: 'Drishyam 3' })
  })

  it('never sends focus labels from household screens, except the TV strip', () => {
    grid()
    expect(focusLabel('/children', document.getElementById('a'))).toBeUndefined()
    expect(focusLabel('/hub', document.getElementById('b'))).toBeUndefined()
    expect(focusLabel('/hub', document.getElementById('home'))).toBe('Home')
  })
})
