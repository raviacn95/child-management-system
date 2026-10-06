import { askAgent } from './client'
import { localIntent, type TitleFinder } from './localIntent'
import { privateReason } from './privacy'
import { HELP_SAY, PRIVATE_SAY, type AgentReply, type AgentTurn } from './schema'

export type AgentDeps = {
  find: TitleFinder
  names: readonly string[]
  endpoint: string
  fetcher?: typeof fetch
}

const MAX_TEXT = 200

function fallback(guess: AgentReply | null, say: string): AgentTurn {
  return guess ? { ...guess, source: 'local' } : { say, action: { type: 'none' }, source: 'offline' }
}

/** Device rules first; the AI only sees requests the device could not answer and that carry no private details. */
export async function runAgent(raw: string, deps: AgentDeps): Promise<AgentTurn> {
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT)
  const sure = localIntent(text, deps.find, true)
  if (sure) return { ...sure, source: 'local' }
  const guess = localIntent(text, deps.find, false)
  if (!deps.endpoint) return fallback(guess, HELP_SAY)
  if (privateReason(text, deps.names)) return fallback(guess, PRIVATE_SAY)
  const result = await askAgent(text, deps.endpoint, deps.fetcher)
  return result.ok ? { ...result.reply, source: 'ai' } : fallback(guess, result.say)
}
