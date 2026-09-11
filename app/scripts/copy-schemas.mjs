import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const src = join(root, '../src/data')
const dest = join(root, '../public/schemas')
mkdirSync(dest, { recursive: true })

const files = readdirSync(src).filter((name) => name.endsWith('.schema.json') || name === 'recommendation-schema.json')
for (const name of files) {
  cpSync(join(src, name), join(dest, name))
}
console.log(`Copied ${files.length} recommendation schemas to public/schemas`)
