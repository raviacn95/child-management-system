import { readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? join(process.cwd(), 'android/app/src/main/assets/public')

function strip(dir) {
  let removed = 0
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name)
    if (name.isDirectory()) {
      removed += strip(path)
      continue
    }
    if (name.name.endsWith('.gz') || name.name.endsWith('.br')) {
      rmSync(path)
      removed += 1
    }
  }
  return removed
}

try {
  if (!statSync(root).isDirectory()) process.exit(0)
} catch {
  process.exit(0)
}

const removed = strip(root)
console.log(`Removed ${removed} compressed web assets Android cannot package`)
