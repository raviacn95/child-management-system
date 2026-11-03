#!/usr/bin/env node
// Copies candidate over destination when candidate.generatedAt is later.
// A site deploy uses this so an older committed movies-fresh.json cannot replace the live list.
import { readFileSync, writeFileSync } from 'node:fs'

export function readFeed(path) {
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'))
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

function stamp(feed) {
  const time = Date.parse(feed?.generatedAt ?? '')
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY
}

/** Returns the feed that should be kept. A missing or undated candidate loses to the destination. */
export function newerFeed(candidate, destination) {
  if (!destination) return candidate
  if (!candidate) return destination
  return stamp(candidate) > stamp(destination) ? candidate : destination
}

/**
 * Writes the candidate onto the destination when it is newer.
 * Returns "candidate", "destination", or "missing" when neither file is a feed.
 */
export function keepNewerFeed(candidatePath, destinationPath) {
  const candidate = readFeed(candidatePath)
  const destination = readFeed(destinationPath)
  const chosen = newerFeed(candidate, destination)
  if (!chosen) return 'missing'
  if (chosen === candidate) {
    writeFileSync(destinationPath, `${JSON.stringify(candidate, null, 2)}\n`)
    return 'candidate'
  }
  return 'destination'
}

function main() {
  const [candidatePath, destinationPath] = process.argv.slice(2)
  if (!candidatePath || !destinationPath) {
    console.error('usage: keep-newer-feed.mjs <candidate> <destination>')
    process.exit(2)
  }
  const kept = keepNewerFeed(candidatePath, destinationPath)
  const feed = readFeed(destinationPath)
  console.log(`kept ${kept}${feed?.generatedAt ? ` (${feed.generatedAt})` : ''}`)
  if (kept === 'missing') process.exit(1)
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/keep-newer-feed.mjs')) {
  main()
}
