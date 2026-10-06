import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const dest = resolve(process.argv[2] || 'dist/release.json')
const id = process.env.WILLOW_RELEASE || process.env.GITHUB_SHA || 'dev'
const run = Number(process.env.WILLOW_RELEASE_RUN || process.env.GITHUB_RUN_NUMBER || 0)
const name = process.env.WILLOW_RELEASE_NAME || (id === 'dev' ? 'Local development build' : `Willow update ${run || id.slice(0, 7)}`)
const changes = process.env.WILLOW_RELEASE_CHANGES || 'General Willow improvements and fixes.'
const indexFile = resolve(dirname(dest), 'index.html')
const integrity = existsSync(indexFile)
  ? `sha256:${createHash('sha256').update(readFileSync(indexFile)).digest('hex')}`
  : undefined
const body = `${JSON.stringify(
  {
    id,
    run: Number.isFinite(run) ? run : 0,
    name: name.slice(0, 120),
    changes: changes.slice(0, 500),
    builtAt: new Date().toISOString(),
    channel: id === 'dev' ? 'local' : 'live',
    fallback: 'previous',
    ...(integrity ? { integrity } : {}),
  },
  null,
  2,
)}\n`

mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, body)
console.log(`wrote ${dest} id=${id}`)
