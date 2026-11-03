import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { keepNewerFeed, newerFeed } from './keep-newer-feed.mjs'

const feed = (generatedAt, title) => ({
  schemaVersion: 1,
  generatedAt,
  year: 2026,
  source: 'test',
  titles: [{ id: 'wd-Q1', title }],
})

describe('newerFeed', () => {
  it('keeps the feed with the later generatedAt', () => {
    const older = feed('2026-10-02T10:21:42.019Z', 'Old')
    const newer = feed('2026-11-03T18:10:11.514Z', 'New')
    expect(newerFeed(newer, older)).toBe(newer)
    expect(newerFeed(older, newer)).toBe(newer)
  })

  it('keeps the destination when the candidate has no usable timestamp', () => {
    const dest = feed('2026-11-03T18:10:11.514Z', 'Kept')
    expect(newerFeed(null, dest)).toBe(dest)
    expect(newerFeed({ titles: [] }, dest)).toBe(dest)
  })
})

describe('keepNewerFeed', () => {
  it('writes the candidate over the destination only when the candidate is newer', () => {
    const dir = mkdtempSync(join(tmpdir(), 'willow-feed-'))
    const candidate = join(dir, 'live.json')
    const dest = join(dir, 'repo.json')
    writeFileSync(candidate, `${JSON.stringify(feed('2026-11-03T17:04:34.603Z', 'Live'))}\n`)
    writeFileSync(dest, `${JSON.stringify(feed('2026-10-02T10:21:42.019Z', 'Repo'))}\n`)

    expect(keepNewerFeed(candidate, dest)).toBe('candidate')
    expect(JSON.parse(readFileSync(dest, 'utf8')).titles[0].title).toBe('Live')

    writeFileSync(candidate, `${JSON.stringify(feed('2026-09-01T00:00:00.000Z', 'Stale'))}\n`)
    expect(keepNewerFeed(candidate, dest)).toBe('destination')
    expect(JSON.parse(readFileSync(dest, 'utf8')).titles[0].title).toBe('Live')
  })
})
