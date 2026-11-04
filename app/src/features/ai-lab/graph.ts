import type { MemoryDoc } from './corpus'
import { contentTokens, textOverlaps, tokenize } from './embed'

export interface GraphEdge {
  from: string
  rel: string
  to: string
}

export function memoryEdges(memories: MemoryDoc[], childId: string, name: string): GraphEdge[] {
  const edges: GraphEdge[] = []
  const seen = new Set<string>()
  const add = (from: string, rel: string, to: string) => {
    const key = `${from}|${rel}|${to}`
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ from, rel, to })
  }
  for (const memory of memories) {
    if (!memory.childIds.includes(childId)) continue
    if (memory.kind === 'activity') add(name, 'activity', memory.text)
    if (memory.kind === 'word') add(name, 'word', memory.text)
    if (memory.kind === 'moment') add(name, 'magic moment', memory.text)
    if (memory.kind === 'play') {
      const friend = memory.text.match(/Played with ([^.]+)\./)?.[1]
      if (friend && friend !== name) add(name, 'friendship', friend)
    }
    if (memory.kind === 'conflict') add(name, 'conflict', memory.date)
    for (const skill of memory.skills) add(memory.kind === 'activity' ? memory.text : name, 'supports', skill)
  }
  return edges
}

export function skillLinks(memories: MemoryDoc[], childId: string) {
  const counts = new Map<string, number>()
  for (const memory of memories) {
    if (!memory.childIds.includes(childId)) continue
    const skills = [...new Set(memory.skills)]
    for (let i = 0; i < skills.length; i += 1) {
      for (let j = i + 1; j < skills.length; j += 1) {
        const pair = [skills[i], skills[j]].sort().join(' ↔ ')
        counts.set(pair, (counts.get(pair) ?? 0) + 1)
      }
    }
  }
  return [...counts.entries()]
    .map(([link, count]) => ({ link, count }))
    .sort((a, b) => b.count - a.count || a.link.localeCompare(b.link))
}

export interface GraphQueryResult {
  edges: GraphEdge[]
  joined: { date: string; text: string }[]
  answer: string
}

export function queryMemoryGraph(input: {
  memories: MemoryDoc[]
  childId: string
  childName: string
  query: string
  names: Map<string, string>
}): GraphQueryResult {
  const edges = memoryEdges(input.memories, input.childId, input.childName)
  const friend = [...input.names.entries()].find(
    ([id, label]) => id !== input.childId && tokenize(input.query).includes(label.toLowerCase()),
  )
  const topicTokens = contentTokens(input.query).filter((token) => token !== friend?.[1].toLowerCase())
  const mine = input.memories.filter((memory) => memory.childIds.includes(input.childId))
  const topical = topicTokens.length
    ? mine.filter((memory) => textOverlaps(topicTokens.join(' '), memory.text).length > 0)
    : []
  const friendDays = new Set(
    friend
      ? mine
          .filter((memory) => memory.text.toLowerCase().includes(friend[1].toLowerCase()) || memory.childIds.includes(friend[0]))
          .filter((memory) => memory.kind === 'play' || memory.kind === 'note' || memory.kind === 'moment' || memory.kind === 'observation')
          .map((memory) => memory.date)
      : [],
  )
  const joined = topical
    .filter((memory) => {
      if (!friend) return true
      return memory.text.toLowerCase().includes(friend[1].toLowerCase()) || friendDays.has(memory.date)
    })
    .map((memory) => ({ date: memory.date, text: memory.text }))
  const topicLabel = topicTokens[0] ?? 'this theme'
  const friendLabel = friend?.[1]
  let answer = friendLabel
    ? `${input.childName} has ${topical.length} ${topicLabel} notes and a graph link toward ${friendLabel}.`
    : `${input.childName} has ${topical.length} notes for ${topicLabel}.`
  answer += joined.length
    ? ` Joined on the same day or the same note: ${joined.map((row) => `${row.date} ${row.text}`).join('; ')}.`
    : friendLabel
      ? ` No single note joins ${topicLabel} with ${friendLabel} yet.`
      : ''
  return { edges, joined, answer }
}
