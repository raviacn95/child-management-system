import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createKeyQueue, type KeyBatch } from './throttle'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('remote key queue', () => {
  it('sends the first press at once and batches repeats within the relay interval', () => {
    const sent: KeyBatch[] = []
    const queue = createKeyQueue((batch) => sent.push(batch), () => 700)
    queue.push('right')
    expect(sent).toEqual([{ key: 'right', times: 1 }])
    queue.push('right')
    queue.push('right')
    queue.push('down')
    expect(sent).toHaveLength(1)
    vi.advanceTimersByTime(700)
    expect(sent).toEqual([
      { key: 'right', times: 1 },
      { key: 'right', times: 2 },
    ])
    vi.advanceTimersByTime(700)
    expect(sent.at(-1)).toEqual({ key: 'down', times: 1 })
  })

  it('never merges OK or Back presses', () => {
    const sent: KeyBatch[] = []
    const queue = createKeyQueue((batch) => sent.push(batch), () => 500)
    queue.push('up')
    queue.push('ok')
    queue.push('ok')
    vi.advanceTimersByTime(1000)
    expect(sent).toEqual([
      { key: 'up', times: 1 },
      { key: 'ok', times: 1 },
      { key: 'ok', times: 1 },
    ])
  })

  it('sends immediately when the direct link is up', () => {
    const sent: KeyBatch[] = []
    const queue = createKeyQueue((batch) => sent.push(batch), () => 0)
    for (const key of ['up', 'up', 'left'] as const) queue.push(key)
    expect(sent).toHaveLength(3)
  })

  it('caps the backlog and stops on dispose', () => {
    const sent: KeyBatch[] = []
    const queue = createKeyQueue((batch) => sent.push(batch), () => 1000)
    queue.push('up')
    for (let i = 0; i < 30; i++) queue.push(i % 2 ? 'ok' : 'back')
    queue.dispose()
    vi.advanceTimersByTime(60_000)
    expect(sent).toHaveLength(1)
  })
})
